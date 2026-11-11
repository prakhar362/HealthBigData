@echo off
echo ===================================================================
echo Launching HealthBig – Healthcare Big Data Analytics System
echo ===================================================================
echo 1. Launching Backend Server on port 8000...
start "HealthBig Backend Server" cmd /c "%~dp0run_backend.bat"

echo 2. Launching Frontend Dev Server on port 5173...
start "HealthBig Frontend Dashboard" cmd /c "%~dp0run_frontend.bat"

echo.
echo Both servers are starting up:
echo - Frontend Dashboard: http://localhost:5173
echo - Backend Swagger Docs: http://localhost:8000/docs
echo.
pause

