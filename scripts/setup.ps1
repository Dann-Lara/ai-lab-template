# AI Lab Template - Setup Script for Windows (PowerShell)
# Run with: powershell -ExecutionPolicy Bypass -File scripts/setup.ps1

$ErrorActionPreference = "Stop"

# Colors helpers
function Write-Header($msg) { Write-Host "`n$msg" -ForegroundColor Cyan }
function Write-Success($msg) { Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Warning($msg) { Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Write-Fail($msg)    { Write-Host "  ❌ $msg" -ForegroundColor Red }
function Write-Step($msg)    { Write-Host "`n$msg" -ForegroundColor Yellow }

Clear-Host
Write-Host "╔═══════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║      🚀 AI Lab Template Setup         ║" -ForegroundColor Blue
Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Blue

# ── 1. CHECK REQUIREMENTS ────────────────────────────────────────
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
        $dockerAvailable = $true
        Write-Success "Docker found and running"
    } catch {
        Write-Warning "Docker found but not running. Start Docker Desktop and re-run setup."
    }
} else {
    Write-Warning "Docker not found. You can still run frontend/backend manually, but DB won't start."
    Write-Warning "Install Docker Desktop from https://www.docker.com/products/docker-desktop"
}

# ── 2. INSTALL DEPENDENCIES ──────────────────────────────────────
Write-Step "📦 Installing dependencies..."
npm install
if ($LASTEXITCODE -ne 0) { Write-Fail "npm install failed"; exit 1 }
Write-Success "Dependencies installed"

# ── 3. HUSKY GIT HOOKS ───────────────────────────────────────────
Write-Step "🐕 Setting up Git hooks (Husky)..."
# Only setup husky if .git folder exists
if (Test-Path ".git") {
    npx husky install
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Husky configured"
    } else {
        Write-Warning "Husky setup skipped (not a git repo yet). Run 'git init' first, then 'npx husky install'"
    }
} else {
    Write-Warning "No .git folder found. Run 'git init' then 'npx husky install' manually."
}

# ── 4. COPY .ENV FILES ───────────────────────────────────────────
Write-Step "⚙️  Setting up environment files..."
$envExamples = Get-ChildItem -Path "." -Filter ".env.example" -Recurse |
    Where-Object { $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\.next\*" }

foreach ($example in $envExamples) {
    $envFile = $example.FullName -replace "\.example$", ""
    if (-not (Test-Path $envFile)) {
        Copy-Item $example.FullName $envFile
        Write-Success "Created: $($example.FullName -replace [regex]::Escape((Get-Location).Path + '\'), '')"
    } else {
        Write-Warning "Already exists (skipped): $($envFile -replace [regex]::Escape((Get-Location).Path + '\'), '')"
    }
}

# ── 5. CHECK OPENAI KEY ──────────────────────────────────────────
$backendEnv = "apps\backend\.env"
if (Test-Path $backendEnv) {
    $content = Get-Content $backendEnv -Raw
    if ($content -match "sk-your-api-key-here") {
        Write-Host "`n⚠️  ACTION REQUIRED: Set your OPENAI_API_KEY in apps\backend\.env" -ForegroundColor Magenta
    }
}

# ── 6. DOCKER SERVICES ───────────────────────────────────────────
if ($dockerAvailable) {
    Write-Step "🐳 Starting Docker services (postgres + redis)..."
    docker compose up -d postgres redis
    if ($LASTEXITCODE -ne 0) {
        # Fallback to docker-compose v1
        docker-compose up -d postgres redis
    }

    # Wait for PostgreSQL
    Write-Step "⏳ Waiting for PostgreSQL to be ready..."
    $retries = 30
    $ready = $false
    while ($retries -gt 0 -and -not $ready) {
        try {
            $result = docker compose exec -T postgres pg_isready -U admin 2>&1
            if ($LASTEXITCODE -eq 0) { $ready = $true }
        } catch {}
        if (-not $ready) {
            Write-Host "  Waiting... ($retries retries left)" -ForegroundColor Gray
            Start-Sleep -Seconds 2
            $retries--
        }
    }
    if (-not $ready) {
        Write-Fail "PostgreSQL did not become ready in time"
        exit 1
    }
    Write-Success "PostgreSQL is ready"

    # Run migrations
    Write-Step "🗄️  Running database migrations..."
    npm run db:migrate
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Migration failed — you may need to run 'npm run db:migrate' manually after setting DATABASE_URL"
    } else {
        Write-Success "Migrations complete"
    }

    # Start n8n
    Write-Step "🔄 Starting n8n..."
    docker compose up -d n8n
    Write-Success "n8n started at http://localhost:5678"

} else {
    Write-Host "`n⚠️  Skipping Docker steps. Start Docker Desktop and run:" -ForegroundColor Yellow
    Write-Host "    docker compose up -d" -ForegroundColor Cyan
    Write-Host "    npm run db:migrate" -ForegroundColor Cyan
}

# ── 7. DONE ──────────────────────────────────────────────────────
Write-Host "`n╔═══════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║       ✅ Setup Complete!               ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Run " -NoNewline; Write-Host "npm run dev" -ForegroundColor Cyan -NoNewline; Write-Host " to start all development servers"
Write-Host ""
Write-Host "  Frontend:  " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend:   " -NoNewline; Write-Host "http://localhost:3001" -ForegroundColor Cyan
Write-Host "  API Docs:  " -NoNewline; Write-Host "http://localhost:3001/api/docs" -ForegroundColor Cyan
Write-Host "  n8n:       " -NoNewline; Write-Host "http://localhost:5678" -ForegroundColor Cyan -NoNewline
Write-Host "  (admin / admin123)"
Write-Host ""
