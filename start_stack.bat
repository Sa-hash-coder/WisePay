@echo off
echo ===================================================
echo   WisePay - Automated Stack Launcher (Hackathon)
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/4] Starting PostgreSQL Docker container...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [WARN] Docker compose failed or Docker is not running.
    echo [INFO] Falling back to local SQLite database mode...
    powershell -Command "(Get-Content .env) -replace 'postgresql\+psycopg2://.*', 'sqlite:///./wisepay.db' | Set-Content .env"
)

echo.
echo [2/4] Applying database migrations and seeding demo data...
cd backend
python -m alembic upgrade head
python scripts\seed_demo_data.py --count 100 --reset

echo.
echo [3/4] Launching FastAPI Backend Server on port 8000...
start "WisePay Backend" cmd /k "python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo [4/4] Launching Next.js Frontend Server on port 3000...
cd ..\frontend
start "WisePay Frontend" cmd /k "npm run dev"

echo.
echo ===================================================
echo   WisePay Stack is Running!
echo   Frontend App:   http://localhost:3000
echo   API Docs:       http://localhost:8000/docs
echo   Health Probe:   http://localhost:8000/health
echo ===================================================
pause
