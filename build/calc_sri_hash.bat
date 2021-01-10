@echo off
rem Script to compute the SRI integrity hash for a JavaScript file.
rem Usage:  call calc_sri_hash.bat filename.js

rem Enable command-line extensions and delayed variable expansion.
rem This causes the script to be called again, and then exit immediately.
if not x%1 == xokay (
    cmd /v:on /e:on /s /c "call %0 okay %*"
    exit /b
)
shift


setlocal

if x%1 == x (
    echo Usage: call calc_src_hash.bat filename.js
    goto end
)
if not exist %1 (
    echo Error: Cannot open file %1
    goto end
)

set HASHALG=sha384

openssl dgst -%HASHALG% -binary %1 | openssl base64 -A | python -c "import sys; print('%HASHALG%'+'-'+sys.stdin.readline().strip()+'\t'+r'%1')"

:end
endlocal
exit /b
