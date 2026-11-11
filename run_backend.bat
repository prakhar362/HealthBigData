@echo off
echo ===================================================
echo Starting HealthBig FastAPI Backend Server...
echo ===================================================
cd /d "%~dp0"
if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

cd healthbig\backend
"%~dp0%PYTHON_EXE%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause

