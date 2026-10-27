@echo off
rem Shopping-practice launcher. Serves over http://localhost so the microphone, the service
rem worker and PWA install all work (file:// is not a secure origin, so none of them do).
rem
rem IMPORTANT - one port for everything, on purpose. localStorage and IndexedDB are scoped per
rem ORIGIN, and localhost:47800 vs localhost:47810 are different origins. Serving this folder
rem on its own port would give the dialogue module a SECOND, separate copy of the student
rem roster and the learning history, so teacher.html would no longer match the 24 units.
rem Therefore: if the full project is present, serve the project root on the shared port 47800
rem and merely open /dialogue/. Only a stand-alone copy of this folder serves itself.
rem
rem NOTE: keep this file ASCII-only. cmd reads .bat as cp950, and multi-byte characters in a
rem rem-line can swallow the line break, turning the rest of the comment into commands.
rem
rem Close the window to stop the server; the port is released with it.
title Shopping Practice - Local Server
echo Starting local server (no install needed)...
if exist "%~dp0..\index.html" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Root "%~dp0.." -OpenPath "/dialogue/"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
)
echo.
echo Server stopped.
pause
