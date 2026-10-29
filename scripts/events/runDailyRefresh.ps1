param([switch]$Check)
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$env:Path = "$env:USERPROFILE/AppData/Local/mise/shims;$env:USERPROFILE/.local/bin;" + [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
$env:TZ = 'Europe/Madrid'
$state = Join-Path $env:LOCALAPPDATA 'sortides/refresh'
New-Item -ItemType Directory -Force -Path $state | Out-Null
$stamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
$prefix = if ($Check) { "check-$stamp" } else { $stamp }
$log = Join-Path $state "$prefix.log"
$summary = Join-Path $state "$prefix-summary.txt"
try {
    Set-Location -LiteralPath $repo
    $codex = (Get-Command codex.exe -ErrorAction Stop).Source
    $promptFile = if ($Check) { 'scripts/events/checkRunner.prompt.md' } else { 'scripts/events/dailyRefresh.prompt.md' }
    $prompt = Get-Content -LiteralPath (Join-Path $repo $promptFile) -Raw
    "Started $(Get-Date -Format o); prompt=$promptFile" | Set-Content -LiteralPath $log
    $prompt | & $codex --search -a never exec --sandbox danger-full-access --ephemeral --color never -C $repo -o $summary - *>> $log
    $code = $LASTEXITCODE
    if ($code -eq 0 -and $Check -and (-not (Test-Path -LiteralPath $summary) -or (Get-Content -LiteralPath $summary -Raw).Trim() -ne 'SORTIDES_RUNNER_OK')) { $code = 1 }
    "Finished $(Get-Date -Format o); exit=$code" | Add-Content -LiteralPath $log
    @{ finishedAt = (Get-Date -Format o); exitCode = $code; check = [bool]$Check; log = $log; summary = $summary } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $state 'latest.json')
    exit $code
} catch {
    $_ | Out-String | Add-Content -LiteralPath $log
    @{ finishedAt = (Get-Date -Format o); exitCode = 1; check = [bool]$Check; log = $log; summary = $summary } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $state 'latest.json')
    exit 1
}
