@echo off
rem Publishes the Golf Scorecard 2 stuff to CJ3.org from this machine.
rem Copies up both the production files and the development files as a backup.

rem Enable command-line extensions and delayed variable expansion.
rem This causes the script to be called again, and then exit immediately.
if not x%1 == xokay (
    cmd /v:on /e:on /s /c "call %0 okay %*"
    exit /b
)
shift

rem Main script.
setlocal

rem Use WinSCP to copy/update the files in the production and development areas.
rem This will prompt the user for the appropriate password on CJ3.org.
winscp.com /script=".\winscp_publish_script.txt"

rem Pause so the user can review the output.
if not "x%1" == "xnopause" pause 

endlocal
exit /b
