@echo off
color 0A
title LMS Frontend Server

echo ============================================================
echo           LMS PLATFORM - FRONTEND SERVER
echo ============================================================
echo.

echo Checking Node.js installation...
node --version > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

echo Checking npm installation...
npm --version > nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found.
    pause
    exit /b 1
)

echo.
echo Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo [SUCCESS] Dependencies installed
)

echo.
echo ============================================================
echo Starting Next.js Development Server...
echo ============================================================
echo.
echo Server will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ============================================================
echo.

call npm run dev

pause