@echo off
echo =======================================================
echo     KHOI DONG MOI TRUONG DEV - PHONE SERVICE PLATFORM
echo =======================================================

echo.
echo [1/4] Kiem tra va khoi dong Docker Containers (Redis, Qdrant)...
docker start redis qdrant
IF %ERRORLEVEL% NEQ 0 (
    echo [CANH BAO] Docker chua duoc bat hoac container khong ton tai! Hay mo Docker Desktop truoc.
) ELSE (
    echo =^> Thanh cong!
)

echo.
echo [2/4] Warm-up AI Model (Qwen2.5:7b)...
curl -s -X POST http://localhost:11434/api/generate -H "Content-Type: application/json" -d "{\"model\": \"qwen2.5:7b\", \"prompt\": \"Xin chao\", \"stream\": false}" > nul
echo =^> AI Model da san sang!

echo.
echo [3/4] Khoi dong Backend (PSP.API) o cua so moi...
start cmd /k "cd src\backend && title Backend API && dotnet run --project PSP.API"

echo.
echo [4/4] Khoi dong Frontend o cua so moi...
start cmd /k "cd src\frontend && title Frontend React && npm run dev"

echo.
echo =======================================================
echo TAT CA DA DUOC KHOI DONG!
echo - Frontend: http://localhost:5173
echo - Backend: http://localhost:5000 / http://localhost:5000/swagger
echo =======================================================
pause
