@echo off
echo ===================================================
echo Starting HealthBig FastAPI Backend Server...
echo ===================================================
cd /d "%~dp0"
if exist "%~dp0.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
) else if exist "%~dp0healthbig\backend\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0healthbig\backend\.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

cd /d "%~dp0healthbig\backend"
"%PYTHON_EXE%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
