@echo off
color 0A
title LMS Backend Server (Quick)

echo ============================================================
echo           LMS PLATFORM - BACKEND SERVER (QUICK)
echo ============================================================
echo.

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Starting FastAPI Server...
echo Server: http://localhost:8000
echo Docs: http://localhost:8000/docs
echo ============================================================
echo.

python run.py

pause