@echo off
rem Usage:  calc_lib_js_sri_hashes.bat > ..\tmp\lib_js_sri_hashes.txt
rem Computes the SHA-384 hashes for Subresource Integrity checking for the JavaScript files in .\src\lib.

C:\Local\cygwin64\bin\find.exe ../src/lib -type f -iname "*.js" | C:\Local\cygwin64\bin\xargs.exe -I {} cmd /c "call calc_sri_hash.bat {} | C:\Local\cygwin64\bin\sed s=../src/==g"
