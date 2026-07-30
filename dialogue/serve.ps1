# serve.ps1 - zero-install local static web server (built-in Windows PowerShell, no admin needed).
# Serves THIS folder over http://localhost so the service worker / PWA install / microphone
# permission all work (localhost is a "secure context", same as https).
# Launched by start.bat. Close the window (or press Ctrl+C) to stop; the port is released with
# the process, so nothing stays bound afterwards.
#   -NoBrowser  : do not auto-open the browser (used for testing)
#   -Port N     : PREFERRED port. Taken by another program -> falls back to the next free
#                 candidate in $PORT_CANDIDATES. Taken by another copy of THIS script ->
#                 reuses it instead of starting a second one (see -StrictPort).
#   -StrictPort : never fall back; stop if the preferred port is not free.
#   -Browser X  : auto (default) = Edge, then Chrome, then whatever Windows uses;
#                 edge | chrome = only that one, falling back to the system default;
#                 default = always hand the URL to Windows.
#   -Root DIR   : serve DIR instead of this folder (used by the launcher .bat in the project
#                 root to serve the whole project, so index.html / the 24 units / adventure
#                 are reachable too). Pass it without a trailing backslash ("%~dp0." in a .bat).
param(
  [int]$Port = 0,
  [switch]$NoBrowser,
  [string]$Root = '',
  [switch]$StrictPort,
  [ValidateSet('auto', 'edge', 'chrome', 'default')][string]$Browser = 'auto'
)

# Tried in order. What matters most is that the FIRST one is almost never already taken: a
# stable port means a stable origin, and the browser only remembers the microphone permission
# per origin. Hence 478xx rather than 8000 - the 8000/8080/9000 range is what every dev tool
# grabs (8090 was already in use on the machine this was written on). 478xx is also safely
# below the Windows dynamic/ephemeral range, which starts at 49152 and would collide at random.
# The well-known ports stay at the end purely as a last resort.
$PORT_CANDIDATES = @(47800, 47801, 47802, 47803, 8000, 8080, 8888, 8123, 9000)

$ErrorActionPreference = 'Stop'
$root = if ($Root) { [System.IO.Path]::GetFullPath($Root) } else { $PSScriptRoot }
if (-not (Test-Path -LiteralPath $root -PathType Container)) {
  Write-Host "Root folder not found: $root"
  if (-not $NoBrowser) { Read-Host "Press Enter to exit" }
  exit 1
}
# Normalise to a trailing separator so the path-traversal check below cannot be fooled by a
# sibling folder that merely shares the prefix (e.g. root money_tutor vs money_tutor_deploy).
$rootFull = [System.IO.Path]::GetFullPath($root).TrimEnd('\') + '\'

# A port that is already taken may well be OUR OWN server from an earlier double-click.
# Ask it: GET /__mt_probe answers "money-tutor-serve <root>" (handled in the request loop below).
# Reusing it keeps the origin, and therefore the granted microphone permission, unchanged.
# Spoken over a raw socket on purpose: Invoke-WebRequest on PowerShell 5.1 honours the system
# proxy settings and times out on localhost when a proxy/PAC is configured (measured here).
$PROBE_SIG = 'money-tutor-serve'
function Get-MtServerRoot([int]$p) {
  $c = $null
  try {
    $c = [System.Net.Sockets.TcpClient]::new()
    $iar = $c.BeginConnect([System.Net.IPAddress]::Loopback, $p, $null, $null)
    if (-not $iar.AsyncWaitHandle.WaitOne(700)) { return $null }   # not accepting -> not us
    $c.EndConnect($iar)
    $c.ReceiveTimeout = 1500; $c.SendTimeout = 1500
    $ns  = $c.GetStream()
    $req = [System.Text.Encoding]::ASCII.GetBytes(
      "GET /__mt_probe HTTP/1.1`r`nHost: localhost`r`nConnection: close`r`n`r`n")
    $ns.Write($req, 0, $req.Length); $ns.Flush()
    $all = [System.IO.StreamReader]::new($ns, [System.Text.Encoding]::UTF8).ReadToEnd()
    $i = $all.IndexOf($PROBE_SIG)                                  # signature only ever in the body
    if ($i -ge 0) { return $all.Substring($i + $PROBE_SIG.Length).Trim() }
  } catch {
    # anything else on that port (or no HTTP at all) -> treat as "not ours"
  } finally {
    if ($c) { $c.Close() }
  }
  return $null
}

# -- Which browser to open ------------------------------------------------------------------
# Edge is preferred on purpose: its speech engine ships Microsoft Yating, the Chinese voice
# the whole project asks for first, so the pre-recorded audio and the live TTS fallback sound
# like the same person. Chrome is the runner-up; otherwise Windows decides.
function Get-BrowserPath([string]$exe) {
  foreach ($hive in 'HKLM:', 'HKCU:') {
    try {
      $v = (Get-ItemProperty "$hive\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\$exe.exe").'(default)'
      if ($v -and (Test-Path -LiteralPath $v -PathType Leaf)) { return $v }
    } catch { }
  }
  $guesses = switch ($exe) {
    'msedge' { @("$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
                 "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe") }
    'chrome' { @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
                 "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
                 "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe") }
    default  { @() }
  }
  foreach ($g in $guesses) { if ($g -and (Test-Path -LiteralPath $g -PathType Leaf)) { return $g } }
  return $null
}
function Open-Browser([string]$u) {
  $order = switch ($Browser) {
    'edge'    { @('msedge') }
    'chrome'  { @('chrome') }
    'default' { @() }
    default   { @('msedge', 'chrome') }
  }
  foreach ($exe in $order) {
    $path = Get-BrowserPath $exe
    if ($path) {
      try { Start-Process -FilePath $path -ArgumentList $u; return (Split-Path $path -Leaf) } catch { }
    }
  }
  try { Start-Process $u; return 'system default browser' } catch { return 'nothing (open the URL yourself)' }
}

# Bind to 127.0.0.1 (loopback) via a raw TCP socket -> no admin / no URL ACL needed.
$prefer     = if ($Port -gt 0) { $Port } else { $PORT_CANDIDATES[0] }
$candidates = if ($StrictPort) { @($prefer) }
              else { @(@($prefer) + $PORT_CANDIDATES | Select-Object -Unique) }
$listener = $null
$taken    = @()
foreach ($p in $candidates) {
  try {
    $l = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $p)
    $l.Start(); $listener = $l; $Port = $p; break
  } catch {
    $mtRoot = Get-MtServerRoot $p
    # Only reuse a server that serves the SAME folder. The whole-site launcher and
    # dialogue\start.bat are different websites, so one must never hijack the other's port.
    if ($mtRoot -and $mtRoot.TrimEnd('\') -ne $rootFull.TrimEnd('\')) {
      Write-Host "  Port $p serves a different folder ($mtRoot) -> trying the next one." -ForegroundColor DarkGray
      $mtRoot = $null
    }
    if ($mtRoot) {
      Write-Host ""
      Write-Host "  A Money Tutor server is ALREADY running on port $p" -ForegroundColor Yellow
      Write-Host "  Dir:  $mtRoot" -ForegroundColor DarkGray
      Write-Host "  Opening the browser at that one instead of starting a second server."
      Write-Host "  (Same port = same origin = microphone permission stays granted.)"
      Write-Host "  This window can be closed; the OTHER window is the one serving."
      Write-Host ""
      # -NoBrowser also means "unattended" (tests): no prompt, so the script cannot hang.
      if (-not $NoBrowser) {
        Write-Host "  Opened in: $(Open-Browser "http://localhost:$p/")" -ForegroundColor DarkGray
        Read-Host "Press Enter to close this window"
      }
      exit 0
    }
    $taken += $p        # not the server we want -> try the next candidate
  }
}
if (-not $listener) {
  Write-Host "No free port (tried $($candidates -join ', ')). Close other servers and retry."
  if (-not $NoBrowser) { Read-Host "Press Enter to exit" }
  exit 1
}
if ($taken.Count -gt 0) {
  Write-Host ""
  Write-Host "  Port $($taken -join ', ') not available -> using $Port instead." -ForegroundColor Yellow
  Write-Host "  Note: a different port is a different origin, so the browser will ask for" -ForegroundColor Yellow
  Write-Host "  microphone permission once more on this port." -ForegroundColor Yellow
}


$mime = @{
  '.html'='text/html; charset=utf-8';        '.htm'='text/html; charset=utf-8'
  '.js'='text/javascript; charset=utf-8';    '.mjs'='text/javascript; charset=utf-8'
  '.css'='text/css; charset=utf-8';          '.json'='application/json; charset=utf-8'
  '.csv'='text/csv; charset=utf-8';          '.txt'='text/plain; charset=utf-8'
  '.svg'='image/svg+xml';   '.png'='image/png';   '.jpg'='image/jpeg';  '.jpeg'='image/jpeg'
  '.gif'='image/gif';       '.webp'='image/webp'; '.ico'='image/x-icon'
  '.wav'='audio/wav';       '.mp3'='audio/mpeg';  '.ogg'='audio/ogg'
  '.woff'='font/woff';      '.woff2'='font/woff2';'.webmanifest'='application/manifest+json'
}

$url = "http://localhost:$Port/"
Write-Host ""
Write-Host "  Money Tutor - local server running" -ForegroundColor Green
Write-Host "  URL:  $url" -ForegroundColor Cyan
Write-Host "  Dir:  $rootFull" -ForegroundColor DarkGray
if (-not $NoBrowser) {
  $opened = Open-Browser $url
  Write-Host "  Opened in: $opened" -ForegroundColor DarkGray
}
Write-Host "  To STOP: close this window (or press Ctrl+C). The port is freed with it."
Write-Host ""

# Read one line (up to LF) from the network stream as ASCII; strips CR.
function Read-Line($stream) {
  $bytes = New-Object System.Collections.Generic.List[byte]
  while ($true) {
    $b = $stream.ReadByte()
    if ($b -lt 0 -or $b -eq 10) { break }
    if ($b -ne 13) { [void]$bytes.Add([byte]$b) }
  }
  [System.Text.Encoding]::ASCII.GetString($bytes.ToArray())
}

# Closing the window kills the process and Windows reclaims the listening socket immediately
# (a listener never sits in TIME_WAIT), so the port is free for the next run either way. The
# try/finally below is for the graceful exits: Ctrl+C, or an unexpected error in the loop.
try {
while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $client.ReceiveTimeout = 5000
    $ns = $client.GetStream()
    $reqLine = Read-Line $ns
    if (-not $reqLine) { continue }
    while ((Read-Line $ns) -ne '') { }   # drain the remaining request headers

    $parts  = $reqLine -split ' '
    $method = $parts[0]
    $target = if ($parts.Count -ge 2) { $parts[1] } else { '/' }
    $path   = [System.Uri]::UnescapeDataString(($target -split '\?')[0])
    if ($path -eq '/' -or $path -eq '') { $path = '/index.html' }

    $rel  = ($path.TrimStart('/')) -replace '/', '\'
    $file = [System.IO.Path]::GetFullPath((Join-Path $root $rel))

    if ($path -eq '/__mt_probe') {                               # "is this one of ours?" (see above)
      $status='200 OK'; $ctype='text/plain; charset=utf-8'
      $body=[System.Text.Encoding]::UTF8.GetBytes("$PROBE_SIG $rootFull")
    } elseif (-not $file.StartsWith($rootFull)) {                # block path traversal
      $status='403 Forbidden'; $ctype='text/plain'; $body=[System.Text.Encoding]::UTF8.GetBytes('403')
    } elseif (Test-Path -LiteralPath $file -PathType Leaf) {
      $status='200 OK'; $body=[System.IO.File]::ReadAllBytes($file)
      $ext=[System.IO.Path]::GetExtension($file).ToLower()
      $ctype= if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
    } else {
      $status='404 Not Found'; $ctype='text/plain; charset=utf-8'; $body=[System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
    }

    $head = "HTTP/1.1 $status`r`nContent-Type: $ctype`r`nContent-Length: $($body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
    $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
    $ns.Write($hb, 0, $hb.Length)
    if ($method -ne 'HEAD' -and $body.Length -gt 0) { $ns.Write($body, 0, $body.Length) }
    $ns.Flush()
  } catch {
    # one bad request must not kill the server
  } finally {
    if ($client) { $client.Close() }
  }
}
} finally {
  if ($listener) { $listener.Stop() }
  Write-Host "Server stopped; port $Port released." -ForegroundColor DarkGray
}
