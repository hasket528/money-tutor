# serve.ps1 - zero-install local static web server (built-in Windows PowerShell, no admin needed).
# Serves THIS folder over http://localhost so the service worker / PWA install / microphone
# permission all work (localhost is a "secure context", same as https).
# Launched by start.bat. Close the window (or press Ctrl+C) to stop; the port is released with
# the process, so nothing stays bound afterwards.
#
# ENGINE (2026-08-02): System.Net.HttpListener + a small RunspacePool, not a hand-rolled
# TcpListener loop. Three concrete problems that had, compared against GitHub Pages:
#   1) One blocking Accept-and-handle loop meant a browser's ~6 parallel connections per origin
#      queued behind each other instead of being served at the same time.
#   2) Every response forced Connection: close, so each of those 6 connections paid a fresh TCP
#      handshake per file instead of reusing one via HTTP/1.1 keep-alive.
#   3) Cache-Control: no-cache with no validator meant "no-cache" behaved like "no-store" - every
#      repeat load of an unchanged audio/image file was a full re-read + re-send.
# Fix: HttpListener gives native keep-alive; each request now runs in a pooled runspace (PS 5.1
# has no `ForEach-Object -Parallel`, hence RunspacePool) so requests are handled concurrently;
# static files now send Last-Modified and honour If-Modified-Since with a 304. Cache-Control
# stays "no-cache" (always revalidate) on purpose - files here can change on disk anytime during
# development, so cheap revalidation is the safe choice, not a long max-age that risks serving a
# stale file. HttpListener on "http://localhost:PORT/" specifically does NOT need admin rights or
# a `netsh http add urlacl` reservation - that is only required for wildcard prefixes
# (http://+:PORT/) or non-loopback hostnames; verified non-admin on PS 5.1 before relying on it.
#   -NoBrowser  : do not auto-open the browser (used for testing)
#   -Port N     : PREFERRED port. Taken by another program -> falls back to the next free
#                 candidate in $PORT_CANDIDATES. Taken by another copy of THIS script ->
#                 reuses it instead of starting a second one (see -StrictPort).
#   -StrictPort : never fall back and never ask; stop if the preferred port is not free.
#   -AnyPort    : fall back silently without asking (tests / throwaway sessions).
#                 DEFAULT BEHAVIOUR IS NEITHER: if the port is taken by something else the
#                 script explains the consequence and asks, because a different port is a
#                 different origin and localStorage / IndexedDB are per-origin - the roster and
#                 the learning history simply would not be there. Nothing is deleted, but it
#                 looks exactly like data loss, so the user has to make that call knowingly.
#   -Browser X  : auto (default) = Edge, then Chrome, then whatever Windows uses;
#                 edge | chrome = only that one, falling back to the system default;
#                 default = always hand the URL to Windows.
#   -Root DIR   : serve DIR instead of this folder (used by the launcher .bat in the project
#                 root to serve the whole project, so index.html / the 24 units / adventure
#                 are reachable too). Pass it without a trailing backslash ("%~dp0." in a .bat).
#   -OpenPath P : which page to open in the browser (default "/"). Lets dialogue\start.bat
#                 serve the whole project yet still land on /dialogue/ - one origin for
#                 everything, because localStorage and IndexedDB are per-origin and the
#                 roster / learning history must be shared, not split across ports.
param(
  [int]$Port = 0,
  [switch]$NoBrowser,
  [string]$Root = '',
  [switch]$StrictPort,
  [switch]$AnyPort,
  [ValidateSet('auto', 'edge', 'chrome', 'default')][string]$Browser = 'auto',
  [string]$OpenPath = '/'
)
if (-not $OpenPath.StartsWith('/')) { $OpenPath = '/' + $OpenPath }

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
  Write-Host "找不到要服務的資料夾：$root"
  if (-not $NoBrowser) { Read-Host "按 Enter 結束" }
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

# Who is holding a port, in words a teacher can act on ("close Foo and try again").
function Get-PortOwner([int]$p) {
  try {
    $ownerPid = (Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction Stop |
                 Select-Object -First 1).OwningProcess
    if ($ownerPid -eq 4) {
      # PID 4 is the "System" process. Windows attributes EVERY http.sys-backed listener to it
      # (that now includes another copy of this very script, since it also runs on HttpListener)
      # - never the real app. Naming "System" would be actively misleading, since nothing should
      # ever be told to close it, so say what it actually is instead of a process nobody can act on.
      return 'Windows 的 HTTP 服務（http.sys，例如另一個本機伺服器）'
    }
    $proc = Get-Process -Id $ownerPid -ErrorAction Stop
    return "$($proc.ProcessName)（PID $ownerPid）"
  } catch { return $null }
}

# Try to bind $p. Returns the listener, 'reuse' when our own server for the SAME folder is
# already there, or $null when the port belongs to something else.
function Try-Bind([int]$p) {
  try {
    $l = New-Object System.Net.HttpListener
    $l.Prefixes.Add("http://localhost:$p/")
    $l.Start()
    return $l
  } catch {
    $mtRoot = Get-MtServerRoot $p
    # Only reuse a server serving the SAME folder. The whole-site launcher and a stand-alone
    # dialogue copy are different websites, so one must never hijack the other's port.
    if ($mtRoot -and $mtRoot.TrimEnd('\') -eq $rootFull.TrimEnd('\')) { return 'reuse' }
    if ($mtRoot) {
      Write-Host "  通訊埠 $p 上的伺服器服務的是別的資料夾（$mtRoot）。" -ForegroundColor DarkGray
    }
    return $null
  }
}

function Use-ExistingServer([int]$p) {
  Write-Host ""
  Write-Host "  已經有一個「金錢小達人」伺服器在通訊埠 $p 執行中。" -ForegroundColor Yellow
  Write-Host "  資料夾：$rootFull" -ForegroundColor DarkGray
  Write-Host "  不再另外啟動，直接開啟原本那一個（同一個位置，資料與麥克風權限都不變）。"
  Write-Host "  這個視窗可以關掉；提供服務的是「另一個」視窗。"
  Write-Host ""
  # -NoBrowser also means "unattended" (tests): no prompt, so the script cannot hang.
  if (-not $NoBrowser) {
    Write-Host "  開啟於：$(Open-Browser "http://localhost:$p$OpenPath")" -ForegroundColor DarkGray
    Read-Host "按 Enter 關閉這個視窗"
  }
  exit 0
}

# Bind to the "localhost" prefix -> no admin / no URL ACL needed (see ENGINE note up top).
$prefer = if ($Port -gt 0) { $Port } else { $PORT_CANDIDATES[0] }
$listener = $null
$taken    = @()

$r = Try-Bind $prefer
if ($r -eq 'reuse') { Use-ExistingServer $prefer }
if ($r) { $listener = $r; $Port = $prefer } else { $taken += $prefer }

# Changing port means changing origin, which hides the existing localStorage / IndexedDB data.
# Never do that behind the user's back: explain it and let them decide.
if (-not $listener) {
  $owner = Get-PortOwner $prefer
  Write-Host ""
  Write-Host "  通訊埠 $prefer 已被其他程式占用$(if ($owner) { "：$owner" } else { '。' })" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "  換用其他通訊埠會怎樣：瀏覽器把資料綁在「網址＋通訊埠」上，換了埠就等於" -ForegroundColor Yellow
  Write-Host "  換到另一個位置，原本的學生名冊與學習紀錄在那裡讀不到（資料沒有被刪除，" -ForegroundColor Yellow
  Write-Host "  改回 $prefer 就會回來）。" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "  建議：先關掉占用 $prefer 的那個程式，再重新啟動本程式。"
  Write-Host ""
  if ($StrictPort) {
    Write-Host "  （-StrictPort：不改用其他通訊埠，就此結束。）"
    exit 1
  }
  if (-not $AnyPort) {
    if ($NoBrowser) { Write-Host "  （非互動模式：不自動改埠，就此結束。要改埠請加 -AnyPort。）"; exit 1 }
    $ans = Read-Host "  仍要改用其他通訊埠嗎？(輸入 Y 改用／直接按 Enter 結束)"
    if ($ans -notmatch '^[Yy]') { Write-Host "  已結束，沒有啟動伺服器。"; exit 1 }
  }
  foreach ($p in ($PORT_CANDIDATES | Where-Object { $_ -ne $prefer })) {
    $r = Try-Bind $p
    if ($r -eq 'reuse') { Use-ExistingServer $p }
    if ($r) { $listener = $r; $Port = $p; break }
    $taken += $p
  }
}
if (-not $listener) {
  Write-Host "  找不到可用的通訊埠（試過 $($taken -join ', ')）。請關掉其他伺服器後再試。"
  if (-not $NoBrowser) { Read-Host "  按 Enter 結束" }
  exit 1
}
if ($taken.Count -gt 0) {
  Write-Host ""
  Write-Host "  改用通訊埠 $Port（$($taken -join ', ') 無法使用）。" -ForegroundColor Yellow
  Write-Host "  這是另一個位置：麥克風要再同意一次，而且看不到通訊埠 $prefer 上原有的" -ForegroundColor Yellow
  Write-Host "  學生名冊與學習紀錄（資料仍在，改回 $prefer 就會回來）。" -ForegroundColor Yellow
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

$url = "http://localhost:$Port$OpenPath"
Write-Host ""
Write-Host "  金錢小達人 - 本機伺服器執行中" -ForegroundColor Green
Write-Host "  網址：  $url" -ForegroundColor Cyan
Write-Host "  資料夾：$rootFull" -ForegroundColor DarkGray
if (-not $NoBrowser) {
  $opened = Open-Browser $url
  Write-Host "  開啟於：$opened" -ForegroundColor DarkGray
}
Write-Host "  要停止：關掉這個視窗（或按 Ctrl+C），通訊埠會一起釋放。"
Write-Host ""

# Requests run in a small pool of PowerShell runspaces (see ENGINE note up top) so this loop
# only ever does the fast part - accept the next connection - while file reads/writes for
# earlier connections happen at the same time on the pool. $active tracks in-flight handles so
# they get disposed once done instead of leaking a runspace per request over a school day.
$pool = [runspacefactory]::CreateRunspacePool(2, 16)
$pool.Open()
$active = New-Object System.Collections.ArrayList

function Reap-Completed($list) {
  for ($i = $list.Count - 1; $i -ge 0; $i--) {
    if ($list[$i].Handle.IsCompleted) {
      try { $list[$i].Ps.EndInvoke($list[$i].Handle) } catch { }
      $list[$i].Ps.Dispose()
      $list.RemoveAt($i)
    }
  }
}

# One request, run inside a pooled runspace. Same routing as before (probe / path-traversal
# guard / directory index / 404) in the same single-write-at-the-end shape, plus Last-Modified
# so a repeat load of an unchanged file costs a 304 instead of a full re-read (see ENGINE note).
$handleRequest = {
  param($context, $root, $rootFull, $mime, $PROBE_SIG)
  $req = $context.Request; $res = $context.Response
  try {
    $method = $req.HttpMethod
    $path = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
    if ($path -eq '') { $path = '/' }
    # Directory index for EVERY folder, not just the root: /dialogue/ must serve
    # /dialogue/index.html the way GitHub Pages does, or every folder link 404s.
    if ($path.EndsWith('/')) { $path += 'index.html' }

    $rel  = ($path.TrimStart('/')) -replace '/', '\'
    $file = [System.IO.Path]::GetFullPath((Join-Path $root $rel))
    $lastModHeader = $null

    if ($path -eq '/__mt_probe') {                               # "is this one of ours?" (see Get-MtServerRoot)
      $status=200; $ctype='text/plain; charset=utf-8'
      $body=[System.Text.Encoding]::UTF8.GetBytes("$PROBE_SIG $rootFull")
    } elseif (-not $file.StartsWith($rootFull)) {                # block path traversal
      $status=403; $ctype='text/plain'; $body=[System.Text.Encoding]::UTF8.GetBytes('403')
    } elseif (Test-Path -LiteralPath $file -PathType Leaf) {
      $lastWriteUtc = [System.IO.File]::GetLastWriteTimeUtc($file)
      $lastModHeader = $lastWriteUtc.ToString('R')
      $ims = $req.Headers['If-Modified-Since']
      $notModified = $false
      if ($ims) {
        $imsDate = [datetime]::MinValue
        $ok = [datetime]::TryParse($ims, [Globalization.CultureInfo]::InvariantCulture,
              ([Globalization.DateTimeStyles]::AssumeUniversal -bor [Globalization.DateTimeStyles]::AdjustToUniversal), [ref]$imsDate)
        # HTTP dates are second-resolution but a file's own timestamp is not, hence the 1s slack.
        if ($ok -and $lastWriteUtc -le $imsDate.AddSeconds(1)) { $notModified = $true }
      }
      if ($notModified) {
        $status=304; $ctype='text/plain'; $body=[byte[]]@()
      } else {
        $status=200; $body=[System.IO.File]::ReadAllBytes($file)
        $ext=[System.IO.Path]::GetExtension($file).ToLower()
        $ctype= if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      }
    } elseif (Test-Path -LiteralPath $file -PathType Container) {
      # /dialogue -> /dialogue/  so relative links inside the page resolve, same as Pages does
      $status=301; $ctype='text/plain; charset=utf-8'
      $body=[System.Text.Encoding]::UTF8.GetBytes("301 -> $path/")
    } else {
      $status=404; $ctype='text/plain; charset=utf-8'; $body=[System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
    }

    $res.StatusCode = $status
    $res.ContentType = $ctype
    $res.Headers['Cache-Control'] = 'no-cache'
    if ($lastModHeader) { $res.Headers['Last-Modified'] = $lastModHeader }
    if ($status -eq 301) { $res.Headers['Location'] = "$path/" }
    $res.ContentLength64 = $body.Length
    if ($method -ne 'HEAD' -and $body.Length -gt 0) { $res.OutputStream.Write($body, 0, $body.Length) }
    $res.OutputStream.Close()
  } catch {
    # one bad request must not kill the server
    try { $res.StatusCode = 500; $res.OutputStream.Close() } catch { }
  }
}

# Closing the window kills the process and Windows reclaims the listening socket immediately
# (a listener never sits in TIME_WAIT), so the port is free for the next run either way. The
# try/finally below is for the graceful exits: Ctrl+C, or an unexpected error in the loop.
try {
while ($true) {
  $iar = $listener.BeginGetContext($null, $null)
  # Poll instead of one indefinite blocking call, so finished runspaces get reaped (and Ctrl+C
  # gets noticed) every 200ms instead of only in between requests.
  while (-not $iar.AsyncWaitHandle.WaitOne(200)) { Reap-Completed $active }
  $context = $listener.EndGetContext($iar)
  Reap-Completed $active
  $ps = [powershell]::Create()
  $ps.RunspacePool = $pool
  [void]$ps.AddScript($handleRequest).AddArgument($context).AddArgument($root).AddArgument($rootFull).AddArgument($mime).AddArgument($PROBE_SIG)
  [void]$active.Add(@{ Ps = $ps; Handle = $ps.BeginInvoke() })
}
} finally {
  if ($listener) { $listener.Stop(); $listener.Close() }
  foreach ($a in $active) { try { $a.Ps.Stop() } catch { }; try { $a.Ps.Dispose() } catch { } }
  $pool.Close(); $pool.Dispose()
  Write-Host "伺服器已停止，通訊埠 $Port 已釋放。" -ForegroundColor DarkGray
}
