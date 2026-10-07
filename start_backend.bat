@echo off
echo ===================================================
echo   Starting WisePay Backend API (FastAPI)
echo ===================================================
cd /d %~dp0backend
python -m uvicorn main:app --reload --port 8000
pause
