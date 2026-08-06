@echo off
color 0A
title LMS Backend Server

echo ============================================================
echo           LMS PLATFORM - BACKEND SERVER
echo ============================================================
echo.

echo Checking Python installation...
python --version > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.9+
    pause
    exit /b 1
)

echo Checking virtual environment...
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo [SUCCESS] Virtual environment created
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing/Updating dependencies...
pip install -r requirements.txt

echo.
echo ============================================================
echo Starting FastAPI Server...
echo ============================================================
echo.
echo Server will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo ============================================================
echo.

python run.py

pause