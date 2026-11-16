$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $repoRoot '.runtime'
New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null

function Test-LocalPort([int]$Port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try { $client.Connect('127.0.0.1', $Port); return $true }
    catch { return $false }
    finally { $client.Dispose() }
}

function Wait-LocalPort([int]$Port) {
    $deadline = (Get-Date).AddSeconds(30)
    while ((Get-Date) -lt $deadline) {
        if (Test-LocalPort $Port) { return }
        Start-Sleep -Milliseconds 200
    }
    throw "Port $Port did not become ready. See .runtime/*.log."
}

$envPath = Join-Path $repoRoot 'server/.env'
if (-not (Test-Path -LiteralPath $envPath)) {
    throw 'Create server/.env from server/.env.example before starting.'
}
$uriLine = Get-Content -LiteralPath $envPath | Where-Object { $_ -match '^MONGODB_URI=' } | Select-Object -First 1
if (-not $uriLine) { throw 'server/.env must define MONGODB_URI.' }
$uriValue = $uriLine.Substring('MONGODB_URI='.Length).Trim().Trim('"').Trim("'")
$started = @()

if ($uriValue -match '^mongodb://(127\.0\.0\.1|localhost)(:27017)?/' -and -not (Test-LocalPort 27017)) {
    $localMongo = Join-Path $runtimeRoot 'tools/mongod.exe'
    $mongoCommand = Get-Command mongod -ErrorAction SilentlyContinue
    $mongoExe = if (Test-Path -LiteralPath $localMongo) { $localMongo } elseif ($mongoCommand) { $mongoCommand.Source } else { $null }
    if (-not $mongoExe) { throw 'Start your local MongoDB service or install mongod in PATH.' }
    $dbPath = Join-Path $runtimeRoot 'mongodb'
    New-Item -ItemType Directory -Path $dbPath -Force | Out-Null
    $mongoProcess = Start-Process -FilePath $mongoExe -ArgumentList @('--dbpath', ('"' + $dbPath + '"'),
        '--bind_ip', '127.0.0.1', '--port', '27017', '--logpath', ('"' + (Join-Path $runtimeRoot 'mongodb.log') + '"'), '--logappend') -WindowStyle Hidden -PassThru
    $started += @{ service = 'mongodb'; pid = $mongoProcess.Id }
    Wait-LocalPort 27017
}

$nodeExe = (Get-Command node.exe).Source
if (-not (Test-LocalPort 3000)) {
    $apiProcess = Start-Process -FilePath $nodeExe -ArgumentList @('index.js') -WorkingDirectory (Join-Path $repoRoot 'server') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeRoot 'server.out.log') -RedirectStandardError (Join-Path $runtimeRoot 'server.err.log')
    $started += @{ service = 'api'; pid = $apiProcess.Id }
    Wait-LocalPort 3000
}
if (-not (Test-LocalPort 5173)) {
    $webProcess = Start-Process -FilePath $nodeExe -ArgumentList @('node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort') -WorkingDirectory (Join-Path $repoRoot 'client') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeRoot 'client.out.log') -RedirectStandardError (Join-Path $runtimeRoot 'client.err.log')
    $started += @{ service = 'frontend'; pid = $webProcess.Id }
    Wait-LocalPort 5173
}

if ($started.Count -gt 0) {
    $started | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtimeRoot 'started-services.json') -Encoding utf8
}
Write-Output 'Frontend: http://127.0.0.1:5173'
Write-Output 'API:      http://127.0.0.1:3000'
Write-Output 'Logs:     .runtime/'
