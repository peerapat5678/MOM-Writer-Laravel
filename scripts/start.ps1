#!/usr/bin/env pwsh
# ---------------------------------------------------------------------------
# One-command local setup + start (Windows / PowerShell).
#   .\scripts\start.ps1
# Checks Docker, creates .env, auto-picks a free port, builds and starts.
#   .\scripts\start.ps1 -Project my-app
# ---------------------------------------------------------------------------
param([string]$Project)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

function Info($m) { Write-Host $m -ForegroundColor Cyan }
function Ok($m)   { Write-Host $m -ForegroundColor Green }
function Warn($m) { Write-Host $m -ForegroundColor Yellow }

try {
    docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Host "Docker is not running. Start Docker Desktop and re-run." -ForegroundColor Red
    exit 1
}

$firstRun = -not (Test-Path .env)
if ($firstRun) {
    Copy-Item .env.example .env
    Ok "Created .env from .env.example"
}

function Get-EnvValue([string]$key) {
    $line = Select-String -Path .env -Pattern "^$key=" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($line) { return ($line.Line -replace "^$key=", '').Trim() }
    return $null
}
function Set-EnvValue([string]$key, [string]$value) {
    $path = (Resolve-Path .env).Path
    $text = [System.IO.File]::ReadAllText($path)
    $pattern = "(?m)^$key=.*$"
    if ($text -match $pattern) { $text = [regex]::Replace($text, $pattern, "$key=$value") }
    else { $text = $text.TrimEnd("`r", "`n") + "`n$key=$value`n" }
    $text = $text -replace "`r`n", "`n"
    [System.IO.File]::WriteAllText($path, $text, (New-Object System.Text.UTF8Encoding($false)))
}

# Project name (URL sub-path): -Project wins; otherwise ask on first run.
if ($Project) {
    Set-EnvValue 'APP_PROJECT' $Project
} elseif ($firstRun) {
    $cur = Get-EnvValue 'APP_PROJECT'
    $ans = Read-Host "Project name / URL sub-path [$cur]"
    if ($ans) { Set-EnvValue 'APP_PROJECT' $ans }
}

$project = Get-EnvValue 'APP_PROJECT'; if (-not $project) { $project = 'app' }

function Test-PortFree([int]$p) {
    return -not (Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue)
}
function Test-PortUsableByUs([int]$p, [string]$service) {
    if (Test-PortFree $p) { return $true }
    $ports = docker ps --filter "name=${project}_${service}" --format "{{.Ports}}" 2>$null
    return ($ports -and ($ports -match ":$p->"))
}
function Resolve-Port([string]$key, [int]$fallback, [string]$service) {
    $raw = Get-EnvValue $key
    $port = if ([string]::IsNullOrWhiteSpace($raw)) { $fallback } else { [int]$raw }
    if (Test-PortUsableByUs $port $service) { return $port }
    $orig = $port; $c = $port + 1
    while ($c -lt ($orig + 100) -and -not (Test-PortFree $c)) { $c++ }
    if (-not (Test-PortFree $c)) { Write-Host "No free port for $key near $orig" -ForegroundColor Red; exit 1 }
    Set-EnvValue $key $c
    Warn "port $orig ($key) is busy -> using $c"
    return $c
}

$nginxPort = Resolve-Port 'NGINX_PORT' 8080 'nginx'
Resolve-Port 'VITE_PORT' 5173 'node' | Out-Null

Info "Building and starting containers ..."
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { Write-Host "docker compose up failed; see: docker compose logs -f app" -ForegroundColor Red; exit 1 }

Write-Host ""
Ok "Ready:"
Write-Host "  http://localhost:$nginxPort/$project/"
Write-Host "First run installs dependencies inside the container; if you get 502, wait ~1 min and refresh." -ForegroundColor DarkGray
