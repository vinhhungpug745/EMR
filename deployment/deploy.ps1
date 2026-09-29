[CmdletBinding()]
param(
    [string]$SourceRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$DeployRoot = 'D:\hung\apps\emr',
    [string]$BackendServiceName = 'EMRBackend',
    [string]$CaddyExecutable = 'C:\caddy\caddy.exe',
    [string]$NpmCommand = 'npm.cmd',
    [string]$PublicHealthUrl = 'https://emr-care.site/api/health/'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step {
    param([Parameter(Mandatory)][string]$Message)

    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory)][string]$FilePath,
        [Parameter(Mandatory)][string[]]$ArgumentList,
        [Parameter(Mandatory)][string]$FailureMessage
    )

    & $FilePath @ArgumentList
    if ($LASTEXITCODE -ne 0) {
        throw "$FailureMessage (exit code $LASTEXITCODE)."
    }
}

function Invoke-RobocopyMirror {
    param(
        [Parameter(Mandatory)][string]$Source,
        [Parameter(Mandatory)][string]$Destination,
        [string[]]$ExcludedDirectories = @(),
        [string[]]$ExcludedFiles = @()
    )

    New-Item -ItemType Directory -Path $Destination -Force | Out-Null

    $arguments = @(
        $Source,
        $Destination,
        '/MIR',
        '/R:2',
        '/W:2',
        '/NFL',
        '/NDL',
        '/NJH',
        '/NJS',
        '/NP'
    )

    if ($ExcludedDirectories.Count -gt 0) {
        $arguments += '/XD'
        $arguments += $ExcludedDirectories
    }

    if ($ExcludedFiles.Count -gt 0) {
        $arguments += '/XF'
        $arguments += $ExcludedFiles
    }

    & robocopy.exe @arguments
    $robocopyExitCode = $LASTEXITCODE

    # Robocopy exit codes 0-7 are successful states. Codes 8+ are failures.
    if ($robocopyExitCode -ge 8) {
        throw "Robocopy failed while copying '$Source' to '$Destination' (exit code $robocopyExitCode)."
    }
}

function Wait-ForHealthEndpoint {
    param(
        [Parameter(Mandatory)][string]$Url,
        [int]$MaximumAttempts = 12,
        [int]$DelaySeconds = 5
    )

    for ($attempt = 1; $attempt -le $MaximumAttempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 15
            $payload = $response.Content | ConvertFrom-Json

            if ($response.StatusCode -eq 200 -and $payload.status -eq 'ok') {
                Write-Host "Health check passed: $Url" -ForegroundColor Green
                return
            }
        }
        catch {
            Write-Warning "Health check attempt $attempt/$MaximumAttempts failed for ${Url}: $($_.Exception.Message)"
        }

        if ($attempt -lt $MaximumAttempts) {
            Start-Sleep -Seconds $DelaySeconds
        }
    }

    throw "Health check failed after $MaximumAttempts attempts: $Url"
}

$SourceRoot = [System.IO.Path]::GetFullPath($SourceRoot)
$DeployRoot = [System.IO.Path]::GetFullPath($DeployRoot)

$sourceBackend = Join-Path $SourceRoot 'backend'
$sourceFrontend = Join-Path $SourceRoot 'frontend'
$sourceFrontendBuild = Join-Path $sourceFrontend 'dist'
$sourceCaddyfile = Join-Path $SourceRoot 'deployment\Caddyfile'

$targetBackend = Join-Path $DeployRoot 'backend'
$targetFrontend = Join-Path $DeployRoot 'frontend'
$targetCaddyfile = Join-Path $DeployRoot 'Caddyfile'
$targetEnvironmentFile = Join-Path $targetBackend '.env'
$sharedEnvironmentFile = Join-Path $DeployRoot 'shared\backend.env'
$productionPython = Join-Path $DeployRoot 'venv\Scripts\python.exe'

Write-Step 'Validating deployment prerequisites'

foreach ($requiredPath in @(
    $sourceBackend,
    $sourceFrontend,
    $sourceCaddyfile,
    $productionPython,
    $CaddyExecutable
)) {
    if (-not (Test-Path -LiteralPath $requiredPath)) {
        throw "Required path does not exist: $requiredPath"
    }
}

$backendService = Get-Service -Name $BackendServiceName -ErrorAction SilentlyContinue
if ($null -eq $backendService) {
    throw "Windows service '$BackendServiceName' is not installed. Install it before enabling automated deployment."
}

New-Item -ItemType Directory -Path $DeployRoot -Force | Out-Null
New-Item -ItemType Directory -Path $targetBackend -Force | Out-Null

if (-not (Test-Path -LiteralPath $targetEnvironmentFile)) {
    if (Test-Path -LiteralPath $sharedEnvironmentFile) {
        Copy-Item -LiteralPath $sharedEnvironmentFile -Destination $targetEnvironmentFile
        Write-Host 'Initialized backend/.env from shared/backend.env.'
    }
    else {
        throw "Production environment file is missing: $targetEnvironmentFile"
    }
}

Write-Step 'Building the React production bundle'
$previousLocation = Get-Location
try {
    Set-Location $sourceFrontend
    Invoke-CheckedCommand -FilePath $NpmCommand -ArgumentList @('ci') -FailureMessage 'npm ci failed'
    Invoke-CheckedCommand -FilePath $NpmCommand -ArgumentList @('run', 'build') -FailureMessage 'Frontend build failed'
}
finally {
    Set-Location $previousLocation
}

if (-not (Test-Path -LiteralPath (Join-Path $sourceFrontendBuild 'index.html'))) {
    throw "Frontend build did not create '$sourceFrontendBuild\index.html'."
}

Write-Step 'Synchronizing backend source while preserving production data'
Invoke-RobocopyMirror `
    -Source $sourceBackend `
    -Destination $targetBackend `
    -ExcludedDirectories @(
        '.venv',
        'venv',
        '__pycache__',
        'media',
        'staticfiles'
    ) `
    -ExcludedFiles @(
        '.env',
        'db.sqlite3',
        '*.pyc'
    )

Write-Step 'Publishing the React bundle'
Invoke-RobocopyMirror -Source $sourceFrontendBuild -Destination $targetFrontend

Write-Step 'Publishing and validating the Caddy configuration'
Copy-Item -LiteralPath $sourceCaddyfile -Destination $targetCaddyfile -Force
Invoke-CheckedCommand `
    -FilePath $CaddyExecutable `
    -ArgumentList @('validate', '--config', $targetCaddyfile) `
    -FailureMessage 'Caddy configuration validation failed'

Write-Step 'Installing backend dependencies'
Invoke-CheckedCommand `
    -FilePath $productionPython `
    -ArgumentList @('-m', 'pip', 'install', '--disable-pip-version-check', '-r', (Join-Path $targetBackend 'requirements.txt')) `
    -FailureMessage 'Backend dependency installation failed'

Write-Step 'Running Django checks and database migrations'
$previousLocation = Get-Location
try {
    Set-Location $targetBackend
    Invoke-CheckedCommand -FilePath $productionPython -ArgumentList @('manage.py', 'check', '--deploy') -FailureMessage 'Django deployment checks failed'
    Invoke-CheckedCommand -FilePath $productionPython -ArgumentList @('manage.py', 'migrate', '--noinput') -FailureMessage 'Database migration failed'
    Invoke-CheckedCommand -FilePath $productionPython -ArgumentList @('manage.py', 'collectstatic', '--noinput') -FailureMessage 'Static file collection failed'
}
finally {
    Set-Location $previousLocation
}

Write-Step "Restarting $BackendServiceName"
Restart-Service -Name $BackendServiceName -Force
$backendService.WaitForStatus('Running', [TimeSpan]::FromSeconds(30))

Write-Step 'Reloading Caddy'
Invoke-CheckedCommand `
    -FilePath $CaddyExecutable `
    -ArgumentList @('reload', '--config', $targetCaddyfile) `
    -FailureMessage 'Caddy reload failed'

Write-Step 'Verifying the deployed application'
Wait-ForHealthEndpoint -Url 'http://127.0.0.1:8001/health/'
Wait-ForHealthEndpoint -Url 'http://127.0.0.1:8080/api/health/'
Wait-ForHealthEndpoint -Url $PublicHealthUrl

Write-Host "`nDeployment completed successfully." -ForegroundColor Green
