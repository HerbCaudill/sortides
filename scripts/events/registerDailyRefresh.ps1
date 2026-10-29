param([switch]$Check)
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$runner = Join-Path $PSScriptRoot 'runDailyRefresh.ps1'
$arguments = "-NoProfile -NonInteractive -WindowStyle Hidden -File `"$runner`""
if ($Check) { $arguments += ' -Check' }
$action = New-ScheduledTaskAction -Execute (Get-Command pwsh.exe).Source -Argument $arguments -WorkingDirectory $repo
$trigger = New-ScheduledTaskTrigger -Daily -At '08:00'
$principal = New-ScheduledTaskPrincipal -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType S4U -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName 'Sortides daily refresh' -Description 'Headless Codex: daily music, original-version films and exhibitions; logs in LocalAppData/sortides/refresh.' -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Get-ScheduledTaskInfo -TaskName 'Sortides daily refresh'
