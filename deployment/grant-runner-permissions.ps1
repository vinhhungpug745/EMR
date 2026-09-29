[CmdletBinding()]
param(
    [string]$DeployRoot = 'D:\hung\apps\emr',
    [string]$BackendServiceName = 'EMRBackend'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$currentIdentity = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$currentPrincipal = [System.Security.Principal.WindowsPrincipal]::new($currentIdentity)
$administratorRole = [System.Security.Principal.WindowsBuiltInRole]::Administrator

if (-not $currentPrincipal.IsInRole($administratorRole)) {
    throw 'Run this script from PowerShell opened with Run as administrator.'
}

if (-not (Test-Path -LiteralPath $DeployRoot)) {
    throw "Production directory does not exist: $DeployRoot"
}

if ($null -eq (Get-Service -Name $BackendServiceName -ErrorAction SilentlyContinue)) {
    throw "Windows service does not exist: $BackendServiceName"
}

Write-Host "Granting NETWORK SERVICE modify access to $DeployRoot ..." -ForegroundColor Cyan
& icacls.exe $DeployRoot /grant '*S-1-5-20:(OI)(CI)M' /T /C
if ($LASTEXITCODE -ne 0) {
    throw "icacls failed with exit code $LASTEXITCODE."
}

Write-Host "Granting NETWORK SERVICE permission to query, start and stop $BackendServiceName ..." -ForegroundColor Cyan

$serviceSddlOutput = & sc.exe sdshow $BackendServiceName
if ($LASTEXITCODE -ne 0) {
    throw "Unable to read the security descriptor for $BackendServiceName."
}

$serviceSddl = $serviceSddlOutput |
    Where-Object { $_ -match '^(O:|G:|D:|S:)' } |
    Select-Object -Last 1

if ([string]::IsNullOrWhiteSpace($serviceSddl)) {
    throw "Windows did not return a valid security descriptor for $BackendServiceName."
}

$networkServiceSid = [System.Security.Principal.SecurityIdentifier]::new('S-1-5-20')
$serviceAccessMask = 0x000200BC
$securityDescriptor = [System.Security.AccessControl.RawSecurityDescriptor]::new(
    $serviceSddl.Trim()
)

$permissionAlreadyPresent = $false
foreach ($ace in $securityDescriptor.DiscretionaryAcl) {
    if (
        $ace -is [System.Security.AccessControl.CommonAce] -and
        $ace.AceQualifier -eq [System.Security.AccessControl.AceQualifier]::AccessAllowed -and
        $ace.SecurityIdentifier -eq $networkServiceSid -and
        ($ace.AccessMask -band $serviceAccessMask) -eq $serviceAccessMask
    ) {
        $permissionAlreadyPresent = $true
        break
    }
}

if (-not $permissionAlreadyPresent) {
    $networkServiceAce = [System.Security.AccessControl.CommonAce]::new(
        [System.Security.AccessControl.AceFlags]::None,
        [System.Security.AccessControl.AceQualifier]::AccessAllowed,
        $serviceAccessMask,
        $networkServiceSid,
        $false,
        $null
    )

    $securityDescriptor.DiscretionaryAcl.InsertAce(
        $securityDescriptor.DiscretionaryAcl.Count,
        $networkServiceAce
    )

    $updatedSddl = $securityDescriptor.GetSddlForm(
        [System.Security.AccessControl.AccessControlSections]::All
    )

    & sc.exe sdset $BackendServiceName $updatedSddl
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to update the security descriptor for $BackendServiceName."
    }
}

Write-Host 'Runner permissions configured successfully.' -ForegroundColor Green

