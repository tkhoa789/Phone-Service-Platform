import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// ============================================================================
// K6 LOAD TEST BENCHMARK: QUẦY POS (POINT OF SALE)
// Mục tiêu: Mô phỏng tải thực nghiệm 320 RPS (Requests Per Second)
// Đảm bảo tính khoa học, chuẩn hóa và tái hiện thực nghiệm theo báo cáo kiến trúc
// ============================================================================

// Các chỉ số đo lường tùy biến (Custom Metrics)
const checkoutDuration = new Trend('pos_checkout_duration', true);
const catalogDuration = new Trend('pos_catalog_duration', true);
const ordersCreated = new Counter('pos_orders_created_total');
const idempotentHits = new Counter('pos_idempotent_cached_hits_total');
const errorRate = new Rate('pos_error_rate');

// Cấu hình tham số môi trường
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const USERNAME = __ENV.POS_USER || 'admin';
const PASSWORD = __ENV.POS_PASSWORD || 'Admin@123';
const TARGET_RPS = parseInt(__ENV.TARGET_RPS || '320', 10);

export const options = {
  scenarios: {
    // Kịch bản kiểm thử tải đạt chuẩn công nghiệp: Ramping Arrival Rate
    pos_workload: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 150,
      maxVUs: 600,
      stages: [
        { duration: '30s', target: 150 },        // Khởi động & tăng dần lên 150 RPS
        { duration: '30s', target: TARGET_RPS },  // Đạt ngưỡng mục tiêu 320 RPS
        { duration: '2m',  target: TARGET_RPS },  // Duy trì ổn định ở 320 RPS
        { duration: '30s', target: 50 },          // Hạ tải dần
        { duration: '10s', target: 0 },           // Kết thúc kịch bản
      ],
    },
  },
  thresholds: {
    // Chuẩn hiệu năng: 95% request hoàn tất dưới 300ms, 99% dưới 600ms
    http_req_duration: ['p(95)<300', 'p(99)<600'],
    pos_checkout_duration: ['p(95)<400', 'p(99)<800'],
    pos_error_rate: ['rate<0.01'], // Tỷ lệ lỗi dưới 1%
  },
};

// Hàm tiện ích sinh UUID v4 tuân thủ RFC 4122
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================================
// SETUP: Xác thực lấy Access Token và nạp danh mục thử nghiệm
// ============================================================================
export function setup() {
  const loginUrl = `${BASE_URL}/api/Auth/login`;
  const loginPayload = JSON.stringify({
    username: USERNAME,
    password: PASSWORD,
  });

  const headers = { 'Content-Type': 'application/json' };
  const loginRes = http.post(loginUrl, loginPayload, { headers });

  let token = '';
  if (loginRes.status === 200) {
    try {
      const body = JSON.parse(loginRes.body);
      token = body.data?.accessToken || body.accessToken || '';
    } catch (e) {
      console.warn('Lỗi parse phản hồi đăng nhập:', e);
    }
  }

  // Khởi tạo các ID mặc định dự phòng nếu chưa có DB seed
  return {
    token: token,
    customerId: __ENV.TEST_CUSTOMER_ID || '00000000-0000-0000-0000-000000000001',
    variantId: __ENV.TEST_VARIANT_ID || 'f7903b43-a0ed-46a0-94d6-0c1952e5ce1f',
  };
}

// ============================================================================
// VU LOGIC: Thực thi phiên giao dịch POS mô phỏng thực tế
// ============================================================================
export default function (data) {
  const authHeaders = {
    'Content-Type': 'application/json',
    ...(data.token ? { Authorization: `Bearer ${data.token}` } : {}),
  };

  // 1. POS Tra cứu danh mục sản phẩm / Biến thể (Catalog Query)
  const catalogStart = Date.now();
  const catalogRes = http.get(`${BASE_URL}/api/Product?page=1&pageSize=20`, {
    headers: authHeaders,
    tags: { name: 'GetProducts' },
  });
  catalogDuration.add(Date.now() - catalogStart);

  check(catalogRes, {
    'Catalog status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  // 2. POS Tạo đơn hàng bán lẻ với Idempotency-Key
  const idempotencyKey = generateUUID();
  const checkoutPayload = JSON.stringify({
    customerId: data.customerId,
    voucherCode: null,
    items: [
      {
        productVariantId: data.variantId,
        imei: null,
        quantity: 1,
      },
    ],
  });

  const orderHeaders = {
    ...authHeaders,
    'Idempotency-Key': idempotencyKey,
  };

  const checkoutStart = Date.now();
  const orderRes = http.post(`${BASE_URL}/api/SalesOrder`, checkoutPayload, {
    headers: orderHeaders,
    tags: { name: 'CreateSalesOrder' },
  });
  checkoutDuration.add(Date.now() - checkoutStart);

  const orderSuccess = check(orderRes, {
    'SalesOrder status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  if (orderSuccess) {
    ordersCreated.add(1);

    // 3. Mô phỏng Retry gửi cùng Idempotency-Key (Kiểm tra tầng Two-Tier Cache Fallback)
    // Xác nhận tính năng bảo vệ Distributed Idempotency tại mức tải 320 RPS
    const retryRes = http.post(`${BASE_URL}/api/SalesOrder`, checkoutPayload, {
      headers: orderHeaders,
      tags: { name: 'IdempotencyRetry' },
    });

    const isCachedHit = check(retryRes, {
      'Idempotent retry status is 200': (r) => r.status === 200,
      'Retry matches original order': (r) => r.body === orderRes.body,
    });

    if (isCachedHit) {
      idempotentHits.add(1);
    } else {
      errorRate.add(1);
    }
  } else {
    errorRate.add(1);
  }

  // Tạm dừng ngẫu nhiên ngắn giữa các hành vi người dùng (human think time)
  sleep(0.05);
}

// ============================================================================
// TEARDOWN: Tổng kết số liệu kiểm thử tải
// ============================================================================
export function teardown(data) {
  console.log('--- Hoàn tất kiểm thử tải quầy POS (Mục tiêu 320 RPS) ---');
}
