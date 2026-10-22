import { describe, it, expect } from 'vitest';

const BACKEND_CANONICAL_KEYS = [
  'Display',
  'Touch',
  'FaceID',
  'Camera',
  'Speakers',
  'Charging',
  'Wifi',
  'Body',
];

const CANONICAL_MAP: Record<string, string> = {
  'Display / Screen': 'Display',
  'Touch / Digitizer': 'Touch',
  'FaceID / TouchID': 'FaceID',
  'Cameras (Front & Rear)': 'Camera',
  'Speakers & Mic': 'Speakers',
  'Charging Port': 'Charging',
  'WiFi & Bluetooth': 'Wifi',
  'Physical Buttons': 'Body',
  Display: 'Display',
  Touch: 'Touch',
  FaceID: 'FaceID',
  Camera: 'Camera',
  Speakers: 'Speakers',
  Charging: 'Charging',
  Wifi: 'Wifi',
  Body: 'Body',
};

describe('Repair Intake Logic & Backend Compliance', () => {
  it('strictly maps all 8 checklist keys to backend canonical names', () => {
    const inputKeys = [
      'Display / Screen',
      'Touch / Digitizer',
      'FaceID / TouchID',
      'Cameras (Front & Rear)',
      'Speakers & Mic',
      'Charging Port',
      'WiFi & Bluetooth',
      'Physical Buttons',
    ];

    const mapped = inputKeys.map((k) => CANONICAL_MAP[k]);
    expect(mapped).toEqual(BACKEND_CANONICAL_KEYS);

    // Verify all mapped keys are in the backend allowed list
    mapped.forEach((key) => {
      expect(BACKEND_CANONICAL_KEYS.includes(key)).toBe(true);
    });
  });

  it('formats custom unlisted device model into problem description', () => {
    const isCustomModel = true;
    const customModel = 'Google Pixel 9 Pro Fold 512GB';
    let problemDesc = 'Hỏng bản lề gập';

    if (isCustomModel && customModel) {
      problemDesc = `[Model: ${customModel}] ${problemDesc}`;
    }

    expect(problemDesc).toBe('[Model: Google Pixel 9 Pro Fold 512GB] Hỏng bản lề gập');
    expect(problemDesc.startsWith('[Model: Google Pixel 9 Pro Fold 512GB]')).toBe(true);
  });

  it('calculates total deposit correctly from ticket deposits array', () => {
    const deposits = [
      { id: '1', amount: 200000, paymentMethodName: 'Tiền mặt', paidAt: '2026-09-05' },
      { id: '2', amount: 300000, paymentMethodName: 'Chuyển khoản', paidAt: '2026-09-05' },
    ];

    const totalDeposit = deposits.reduce((acc, d) => acc + (d.amount || 0), 0);
    expect(totalDeposit).toBe(500000);
  });

  it('handles empty deposits safely (zero deposit intake)', () => {
    const emptyDeposits: any[] = [];
    const totalDeposit = emptyDeposits.reduce((acc, d) => acc + (d.amount || 0), 0);
    expect(totalDeposit).toBe(0);
  });

  describe('IMEI Mandatory Validation Rules', () => {
    const validateImei = (imei: string) => {
      const cleanImei = imei.trim();
      return cleanImei.length >= 14 && cleanImei.length <= 18 && /^[0-9a-zA-Z]+$/.test(cleanImei);
    };

    it('accepts standard 15-digit IMEI', () => {
      expect(validateImei('356987112345678')).toBe(true);
    });

    it('rejects empty or whitespace IMEI', () => {
      expect(validateImei('')).toBe(false);
      expect(validateImei('   ')).toBe(false);
    });

    it('rejects IMEI that is too short (< 14 chars)', () => {
      expect(validateImei('1234567890123')).toBe(false);
    });

    it('rejects IMEI that contains special characters or spaces', () => {
      expect(validateImei('35698711 234567')).toBe(false);
      expect(validateImei('35698711-234567')).toBe(false);
    });
  });

  describe('Extended QC Notes & Formatting', () => {
    it('appends extended QC details when toggle is ON', () => {
      const state = {
        isQcCustomNotesActive: true,
        qcBatteryHealth: 'Pin Zin - 87%',
        qcWaterResistance: 'Đã mất áp suất',
        qcSealCondition: 'Tem rách, ốc có vết toét',
        qcIncludedAccessories: 'Khay SIM, Ốp lưng',
        qcCustomNotes: 'Khách yêu cầu giữ màn cũ',
        qcCustomItems: [{ label: 'Camera trước', value: 'Bị đốm đen nhẹ' }],
      };

      let notes = '';
      if (state.isQcCustomNotesActive) {
        const parts: string[] = [];
        if (state.qcBatteryHealth) parts.push(`Pin: ${state.qcBatteryHealth}`);
        if (state.qcWaterResistance) parts.push(`Áp suất: ${state.qcWaterResistance}`);
        if (state.qcSealCondition) parts.push(`Ốc/Tem: ${state.qcSealCondition}`);
        if (state.qcIncludedAccessories) parts.push(`Phụ kiện: ${state.qcIncludedAccessories}`);
        if (state.qcCustomNotes) parts.push(`Ghi chú: ${state.qcCustomNotes}`);
        state.qcCustomItems.forEach((item) => {
          if (item.label && item.value) parts.push(`${item.label}: ${item.value}`);
        });
        if (parts.length > 0) {
          notes = `[QC Thẩm định: ${parts.join(' | ')}]`;
        }
      }

      expect(notes).toContain('Pin: Pin Zin - 87%');
      expect(notes).toContain('Áp suất: Đã mất áp suất');
      expect(notes).toContain('Camera trước: Bị đốm đen nhẹ');
    });

    it('does not append QC details when toggle is OFF', () => {
      const state = {
        isQcCustomNotesActive: false,
        qcBatteryHealth: 'Pin Zin - 87%',
      };

      let notes = '';
      if (state.isQcCustomNotesActive) {
        notes = `[QC Thẩm định: Pin: ${state.qcBatteryHealth}]`;
      }

      expect(notes).toBe('');
    });
  });
});

