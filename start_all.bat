@echo off
echo ===================================================
echo   Starting WisePay Enterprise Engine (Backend & Frontend)
echo ===================================================

echo Starting Backend API (FastAPI on http://localhost:8000)...
start "WisePay Backend API" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Frontend (Next.js on http://localhost:3000)...
start "WisePay Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:3000...
start http://localhost:3000

echo ===================================================
echo   WisePay is running! 
echo   - Frontend: http://localhost:3000
echo   - Backend API Docs: http://localhost:8000/docs
echo ===================================================
