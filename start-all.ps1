# =============================================================
#  BizTrack + LMS  -  One-Click Local Stack Launcher
#
#  Starts the whole stack together - nothing runs "separately":
#    BizTrack backend   :8000   (uv / FastAPI)
#    LMS backend        :8001   (FastAPI + MySQL)
#    BizTrack frontend  :3000   (Next.js)
#    LMS frontend       :3001   (Next.js, served at localhost:3000/lms)
#
#  The LMS app is reached at http://localhost:3000/lms (same origin as
#  BizTrack, proxied by the BizTrack frontend).
# =============================================================

$ErrorActionPreference = 'Stop'

$root    = $PSScriptRoot
$slogan  = @"

  ============================================================
     BIZTRACK + LMS  -  ALL-IN-ONE STACK
  ============================================================
     BizTrack backend   -> http://localhost:8000/docs
     LMS backend        -> http://localhost:8001/docs
     BizTrack frontend  -> http://localhost:3000
     LMS                -> http://localhost:3000/lms
  ============================================================
"@

Write-Host $slogan -ForegroundColor Cyan

# ---------------------------------------------------------------
# Ports owned by this stack
# ---------------------------------------------------------------
$stackPorts = @(
    @{ Port = 8000; Name = 'BizTrack backend'  },
    @{ Port = 8001; Name = 'LMS backend'       },
    @{ Port = 3000; Name = 'BizTrack frontend' },
    @{ Port = 3001; Name = 'LMS frontend'      }
)

# ---------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------
function Get-Listeners([int]$Port) {
    $pids = @()
    netstat -ano 2>$null | ForEach-Object {
        if ($_ -match "^\s*TCP\s+\S+:$Port\s+\S+\s+LISTENING\s+(\d+)$") {
            $pids += [int]$Matches[1]
        }
    }
    $pids | Select-Object -Unique
}

function Test-Command([string]$Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Out-Banner([string]$Text, [string]$Color = 'Green') {
    Write-Host "  $Text" -ForegroundColor $Color
}

# ---------------------------------------------------------------
# 1. Pre-flight checks
# ---------------------------------------------------------------
Write-Host ""
Write-Host "Step 1/4 - Checking prerequisites..." -ForegroundColor Yellow

$missing = @()
if (-not (Test-Command 'uv'))      { $missing += 'uv (astral) - required for BizTrack backend' }
if (-not (Test-Command 'node'))    { $missing += 'node' }
if (-not (Test-Command 'npm'))     { $missing += 'npm' }
if (-not (Test-Path "$root\backend\.venv\Scripts\python.exe") -and
     -not (Test-Path "$root\backend\venv\Scripts\python.exe")) { $missing += 'BizTrack backend venv (run: uv sync)' }
if (-not (Test-Path "$root\lms-platform\backend\venv\Scripts\python.exe")) { $missing += 'LMS backend venv (missing at lms-platform\backend\venv)' }

if ($missing.Count -gt 0) {
    Write-Host "  Missing prerequisites:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    Write-Host "  Fix these first, then re-run start-all.bat." -ForegroundColor Red
    exit 1
}

foreach ($p in $stackPorts) {
    if (-not (Get-Listeners $p.Port)) {
        Out-Banner "OK - $($p.Name) port $($p.Port) is free"
    } else {
        Out-Banner "WARN - port $($p.Port) is already in use (will be restarted)" 'Yellow'
    }
}

# External databases. The LMS backend needs MySQL, the BizTrack backend needs
# PostgreSQL. MySQL is auto-started if it is not already running (best effort);
# PostgreSQL is expected to run as a system service.
if (-not (Get-Listeners 3306)) {
    $mysqld = @(
        'E:\xampp\mysql\bin\mysqld.exe',
        'C:\xampp\mysql\bin\mysqld.exe',
        "$env:ProgramFiles\MySQL\MySQL Server 8.0\bin\mysqld.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1

    if ($mysqld) {
        Write-Host "  MySQL is not running - starting it via $mysqld ..." -ForegroundColor Yellow
        Start-Process $mysqld -WindowStyle Hidden
        $mysqlDeadline = (Get-Date).AddSeconds(30)
        while ((Get-Date) -lt $mysqlDeadline -and -not (Get-Listeners 3306)) {
            Start-Sleep -Seconds 1
        }
        if (Get-Listeners 3306) {
            Out-Banner "OK - MySQL is now running on :3306"
        } else {
            Out-Banner "WARN - MySQL did not come up on :3306 yet" 'Yellow'
        }
    } else {
        Out-Banner "WARN - MySQL :3306 not detected and no mysqld found - LMS backend needs MySQL" 'Yellow'
    }
} else {
    Out-Banner "OK - MySQL is running on :3306"
}
if (-not (Get-Listeners 5432)) { Out-Banner "WARN - PostgreSQL :5432 not detected - BizTrack backend needs PostgreSQL running" 'Yellow' }

# ---------------------------------------------------------------
# 2. Stop anything already bound to our ports (safe to re-run)
# ---------------------------------------------------------------
Write-Host ""
Write-Host "Step 2/4 - Stopping old instances of this stack..." -ForegroundColor Yellow
foreach ($p in $stackPorts) {
    foreach ($pidToKill in (Get-Listeners $p.Port)) {
        try {
            Stop-Process -Id $pidToKill -Force -ErrorAction Stop
            Out-Banner "Stopped PID $pidToKill (port $($p.Port), $($p.Name))"
        } catch {
            Out-Banner "Could not stop PID $pidToKill on port $($p.Port) - may need admin rights" 'Yellow'
        }
    }
}
Start-Sleep -Seconds 2

# ---------------------------------------------------------------
# 3. Launch every service in its own window
# ---------------------------------------------------------------
Write-Host ""
Write-Host "Step 3/4 - Launching all services..." -ForegroundColor Yellow

function Start-StackProcess([string]$Title, [string]$WorkDir, [string]$Command) {
    Write-Host "  Launching $Title ..." -ForegroundColor Green
    Start-Process powershell -ArgumentList @(
        '-NoExit',
        '-Command',
        "Set-Location -LiteralPath '$WorkDir'; $Command"
    ) -WindowStyle Normal
}

Start-StackProcess 'BizTrack backend' "$root\backend" "uv run fastapi run --host 0.0.0.0 --port 8000 --workers 2 --proxy-headers --forwarded-allow-ips '*'"
Start-StackProcess 'LMS backend'      "$root\lms-platform\backend" ".\venv\Scripts\python.exe run.py"
Start-StackProcess 'BizTrack frontend' "$root\frontend" "npm run dev"
Start-StackProcess 'LMS frontend'     "$root\lms-platform\frontend" "npm run dev"

# ---------------------------------------------------------------
# 4. Wait for readiness, then open the browser
# ---------------------------------------------------------------
Write-Host ""
Write-Host "Step 4/4 - Waiting for services to come up..." -ForegroundColor Yellow

$deadline   = (Get-Date).AddSeconds(180)
$frontendUp = $false

while ((Get-Date) -lt $deadline) {
    $up = @()
    foreach ($need in @(3000, 3001, 8001)) {
        if (Get-Listeners $need) { $up += $need }
    }
    if (3000 -in $up -and 3001 -in $up -and 8001 -in $up) {
        $frontendUp = $true
        break
    }
    Start-Sleep -Seconds 2
}

if ($frontendUp) {
    Write-Host ""
    Write-Host "  All services are up!" -ForegroundColor Green
    Write-Host "  Opening http://localhost:3000/lms ..." -ForegroundColor Green
    Start-Process 'http://localhost:3000/lms'
} else {
    Write-Host ""
    Write-Host "  Timed out waiting for services. Check the individual windows." -ForegroundColor Red
    Write-Host "  BizTrack backend  -> http://localhost:8000/docs" -ForegroundColor Yellow
    Write-Host "  LMS backend       -> http://localhost:8001/docs" -ForegroundColor Yellow
    Write-Host "  BizTrack frontend -> http://localhost:3000" -ForegroundColor Yellow
    Write-Host "  LMS               -> http://localhost:3000/lms" -ForegroundColor Yellow
}
