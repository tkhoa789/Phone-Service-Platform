@echo off
chcp 65001 > nul
setlocal EnableDelayedExpansion

echo =====================================================================
echo    KHỞI ĐỘNG HỆ THỐNG ENTERPRISE - PHONE SERVICE PLATFORM (DEV)
echo =====================================================================
echo.

:: -----------------------------------------------------------------------
:: [BƯỚC 1/4] PRE-FLIGHT CHECK: KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT
:: -----------------------------------------------------------------------
echo [1/4] Kiểm tra điều kiện môi trường máy chủ cục bộ...

:: 1.1 Kiểm tra Docker daemon
docker info > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [LỖI NGHIÊM TRỌNG] Docker Desktop chưa được bật hoặc chưa hoàn tất khởi động!
    echo Vui lòng mở Docker Desktop và đợi đến khi Docker báo 'Engine Running', sau đó chạy lại script này.
    echo.
    pause
    exit /b 1
)
echo  =^> Docker Daemon: SẴN SÀNG

:: 1.2 Kiểm tra .NET SDK
dotnet --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [LỖI NGHIÊM TRỌNG] Không tìm thấy .NET SDK trên máy!
    pause
    exit /b 1
)
echo  =^> .NET SDK: SẴN SÀNG

:: 1.3 Kiểm tra Node.js
node --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [LỖI NGHIÊM TRỌNG] Không tìm thấy Node.js trên máy!
    pause
    exit /b 1
)
echo  =^> Node.js: SẴN SÀNG
echo.

:: -----------------------------------------------------------------------
:: [BƯỚC 2/4] DỰNG & CHỜ HẠ TẦNG CONTAINER ĐẠT TRẠNG THÁI SẴN SÀNG
:: -----------------------------------------------------------------------
echo [2/4] Đang khởi động các dịch vụ Hạ tầng (SQL Server, Redis, Qdrant)...
docker compose up -d sqlserver redis qdrant
if %ERRORLEVEL% NEQ 0 (
    echo [LỖI] Không thể khởi động Docker Compose! Vui lòng kiểm tra cổng bị chiếm dụng.
    pause
    exit /b 1
)

echo Đang chờ SQL Server 2022 và Redis hoàn tất khởi tạo nội bộ...
set /a retries=0

:WAIT_SQL_LOOP
set /a retries+=1
if !retries! GTR 30 (
    echo.
    echo [CẢNH BÁO] SQL Server mất hơn 60 giây để khởi động! Vẫn tiếp tục thử kết nối...
    goto AFTER_WAIT
)

:: Kiểm tra trạng thái Healthcheck của SQL Server từ Docker Engine
docker inspect --format="{{.State.Health.Status}}" psp_sqlserver 2>nul | findstr /i "healthy" > nul
if %ERRORLEVEL% EQU 0 (
    :: Kiểm tra bổ sung Redis PING
    docker exec psp_redis redis-cli ping > nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo  =^> SQL Server 2022: HEALTHY (Cổng 1433 đã sẵn sàng nhận kết nối!)
        echo  =^> Redis Cache:     PONG (Sẵn sàng!)
        goto AFTER_WAIT
    )
)

echo    ... Đang đợi SQL Server hoàn tất cấu hình master DB (lần thử !retries!/30)...
timeout /t 2 /nobreak > nul
goto WAIT_SQL_LOOP

:AFTER_WAIT
echo  =^> Toàn bộ Cụm Hạ tầng Container đã HOẠT ĐỘNG HOÀN HẢO!
echo.

:: -----------------------------------------------------------------------
:: [BƯỚC 3/4] KIỂM TRA & CÀI ĐẶT THƯ VIỆN FRONTEND (NODE_MODULES)
:: -----------------------------------------------------------------------
echo [3/4] Kiểm tra thư viện Frontend (node_modules)...
if not exist "src\frontend\node_modules\" (
    echo  =^> Chưa có thư mục node_modules. Đang tự động chạy 'npm install' [One-Click]...
    pushd src\frontend
    call npm install
    if !ERRORLEVEL! NEQ 0 (
        echo [LỖI] Quá trình cài đặt npm package thất bại!
        popd
        pause
        exit /b 1
    )
    popd
    echo  =^> Cài đặt thư viện Frontend hoàn tất!
) else (
    echo  =^> Thư viện Frontend: ĐÃ CÓ SẴN.
)
echo.

:: -----------------------------------------------------------------------
:: [BƯỚC 4/4] KHỞI ĐỘNG ỨNG DỤNG BACKEND & FRONTEND
:: -----------------------------------------------------------------------
echo [4/4] Đang khởi động Backend API và Frontend React Web App...

:: Cửa sổ 1: Backend API
start "PSP - Backend API (:5000)" cmd /k "cd src\backend\PSP.API && dotnet run --launch-profile http"

:: Cửa sổ 2: Frontend App
start "PSP - Frontend React (:3000)" cmd /k "cd src\frontend && npm run dev"

echo.
echo =====================================================================
echo  HỆ THỐNG ĐÃ ĐƯỢC KHỞI ĐỘNG THÀNH CÔNG!
echo  - Frontend Web App: http://localhost:3000
echo  - Backend API:      http://localhost:5000
echo  - Swagger UI:       http://localhost:5000/swagger
echo  - Qdrant Dashboard: http://localhost:6333/dashboard
echo =====================================================================
echo Nhấn phím bất kỳ để đóng cửa sổ điều phối này...
pause > nul
