# AI Lab Template - Setup Script for Windows (PowerShell)
# Run with: powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
# Encoding: ASCII-safe (no Unicode/emoji to avoid parse errors)

$ErrorActionPreference = "Stop"

function Write-Success($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg)    { Write-Host "  [!!] $msg" -ForegroundColor Yellow }
function Write-Fail($msg)    { Write-Host "  [ERROR] $msg" -ForegroundColor Red }
function Write-Step($msg)    { Write-Host "" ; Write-Host ">> $msg" -ForegroundColor Yellow }

Clear-Host
Write-Host "========================================" -ForegroundColor Blue
Write-Host "     AI Lab Template - Setup            " -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

# -- 1. CHECK REQUIREMENTS ----------------------------------------
Write-Step "Checking requirements..."

# Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Fail "Node.js not found. Install from https://nodejs.org (v20+)"
    exit 1
}
$nodeVersion = (node -v) -replace 'v', '' -split '\.' | Select-Object -First 1
if ([int]$nodeVersion -lt 20) {
    Write-Fail "Node.js v20+ required. Current: $(node -v)"
    exit 1
}
Write-Success "Node.js $(node -v)"

# npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Fail "npm not found."
    exit 1
}
Write-Success "npm $(npm -v)"

# Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Fail "Git not found. Install from https://git-scm.com"
    exit 1
}
Write-Success "Git $(git --version)"

# Docker
$dockerAvailable = $false
if (Get-Command docker -ErrorAction SilentlyContinue) {
    try {
        $null = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerAvailable = $true
            Write-Success "Docker found and running"
        } else {
            Write-Warn "Docker found but not running. Start Docker Desktop and re-run setup."
        }
    } catch {
        Write-Warn "Docker found but not running. Start Docker Desktop and re-run setup."
    }
} else {
    Write-Warn "Docker not found. Install Docker Desktop from https://www.docker.com/products/docker-desktop"
    Write-Warn "You can still run frontend/backend manually without Docker."
}

# -- 2. INSTALL DEPENDENCIES --------------------------------------
Write-Step "Installing npm dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Fail "npm install failed"
    exit 1
}
Write-Success "Dependencies installed"

# -- 3. HUSKY GIT HOOKS -------------------------------------------
Write-Step "Setting up Git hooks (Husky)..."
if (Test-Path ".git") {
    npx husky install 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Husky configured"
    } else {
        Write-Warn "Husky setup failed. Run 'npx husky install' manually after 'git init'."
    }
} else {
    Write-Warn "No .git folder found. Run 'git init' then 'npx husky install' manually."
}

# -- 4. COPY .ENV FILES -------------------------------------------
Write-Step "Setting up environment files..."
$rootPath = (Get-Location).Path
$envExamples = Get-ChildItem -Path "." -Filter ".env.example" -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\.next\*" }

foreach ($example in $envExamples) {
    $envFile = $example.FullName -replace "\.example$", ""
    $relPath  = $example.FullName.Replace($rootPath + "\", "")
    if (-not (Test-Path $envFile)) {
        Copy-Item $example.FullName $envFile
        Write-Success "Created: $relPath"
    } else {
        Write-Warn "Already exists, skipped: $relPath"
    }
}

# -- 5. CHECK OPENAI KEY ------------------------------------------
$backendEnv = "apps\backend\.env"
if (Test-Path $backendEnv) {
    $content = Get-Content $backendEnv -Raw
    if ($content -match "sk-your-api-key-here") {
        Write-Host ""
        Write-Host "  [ACTION REQUIRED] Set your OPENAI_API_KEY in apps\backend\.env" -ForegroundColor Magenta
    }
}

# -- 6. DOCKER SERVICES -------------------------------------------
if ($dockerAvailable) {
    Write-Step "Starting Docker services (postgres + redis)..."

    # Try docker compose v2 first, fall back to v1
    docker compose up -d postgres redis 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "docker compose v2 failed, trying docker-compose v1..."
        docker-compose up -d postgres redis
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Could not start Docker services. Check docker-compose.yml."
            exit 1
        }
    }
    Write-Success "postgres and redis containers started"

    # Wait for PostgreSQL
    Write-Step "Waiting for PostgreSQL to be ready..."
    $retries = 30
    $ready = $false
    while ($retries -gt 0 -and -not $ready) {
        $pgCheck = docker compose exec -T postgres pg_isready -U admin 2>&1
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
        } else {
            Write-Host "  Waiting... ($retries retries left)" -ForegroundColor Gray
            Start-Sleep -Seconds 2
            $retries--
        }
    }

    if (-not $ready) {
        Write-Fail "PostgreSQL did not become ready in time. Check logs: docker compose logs postgres"
        exit 1
    }
    Write-Success "PostgreSQL is ready"

    # Run migrations
    Write-Step "Running database migrations..."
    npm run db:migrate
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Migration failed. Run 'npm run db:migrate' manually after checking DATABASE_URL in apps\backend\.env"
    } else {
        Write-Success "Migrations complete"
    }

    # Start n8n
    Write-Step "Starting n8n..."
    docker compose up -d n8n 2>&1
    Write-Success "n8n started at http://localhost:5678 (admin / admin123)"

} else {
    Write-Host ""
    Write-Host "  Skipping Docker steps. Once Docker Desktop is running, execute:" -ForegroundColor Yellow
    Write-Host "    docker compose up -d" -ForegroundColor Cyan
    Write-Host "    npm run db:migrate" -ForegroundColor Cyan
}

# -- 7. DONE ------------------------------------------------------
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "     Setup Complete!                    " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Run " -NoNewline
Write-Host "npm run dev" -ForegroundColor Cyan -NoNewline
Write-Host " to start all development servers"
Write-Host ""
Write-Host "  Frontend : " -NoNewline ; Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend  : " -NoNewline ; Write-Host "http://localhost:3001" -ForegroundColor Cyan
Write-Host "  API Docs : " -NoNewline ; Write-Host "http://localhost:3001/api/docs" -ForegroundColor Cyan
Write-Host "  n8n      : " -NoNewline ; Write-Host "http://localhost:5678" -ForegroundColor Cyan -NoNewline
Write-Host "  (admin / admin123)"
Write-Host ""
