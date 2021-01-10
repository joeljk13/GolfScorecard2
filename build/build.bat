@echo off
rem Build script to transform the development versions of the files into the production versions
rem that are suitable for publishing.

rem Enable command-line extensions and delayed variable expansion.
rem This causes the script to be called again, and then exit immediately.
if not x%1 == xokay (
    cmd /v:on /e:on /s /c "call %0 okay %*"
    exit /b
)
shift


setlocal

echo.
echo Processing the GolfScorecard2 files for publishing ...

rem First do a lint check on the JavaScript files to make sure they are clean
pushd "..\src\js_dev"
echo.
echo ===== Running JSHint on the JavaScript files to make sure they are clean ...
rem JSHint was installed using:  npm install jshint -g
for %%x in ( *.js ) do (
    echo   Checking "%%x"
    call jshint.cmd "%%x"
)
echo ===== Done
popd


rem Then process the JavaScript files by minimizing them.
pushd "..\src\js_dev"
echo.
echo ===== Running UglifyJS on the JavaScript files to make sure they are minimized ...
rem UglifyJS was installed using:  npm install uglify-es -g
if exist "..\js" (
    del /s /q /f "..\js\*.*"
) else (
    echo   Creating JavaScript output directory
    mkdir "..\js"
)
for %%x in ( *.js ) do (
    echo   Minimizing "%%x"
    rem Remove lines that being with "/*DEV*/" as they are for development only.
    grep -v -e "^\s*/[*]DEV[*]/" "%%x" | call uglifyjs.cmd --ecma 8 > "..\js\%%x"
    rem Generate the combined file for the entire client-side application.
    type "..\js\%%x" >> "..\js\gsc2app.js"
)
echo ===== Done
popd
call calc_sri_hash.bat "..\src\js\gsc2app.js" > sri_hashes.txt
gawk "{print $1}" sri_hashes.txt | python -c "import sys; print('s/SRIHASH_GSC2APP_JS/'+sys.stdin.readline().strip()+'/g')" > sri_hashes_sed.txt


rem Then process the HTML files
echo.
echo ===== Processing HTML files ...
pushd "..\src"
echo   Transforming "main_dev.html" into "main.html"
if exist "..\build\scripts\SimpleMinimizer.py" (
    type main_dev.html | sed -f "..\build\sri_hashes_sed.txt" | python "..\build\scripts\SimpleMinimizer.py" --hlike --undev > main.html
) else (
    type main_dev.html | sed -f "..\build\sri_hashes_sed.txt" > main.html
)
echo ===== Done
popd


rem Then process the CSS files by minimizing them.
pushd ..\src\css_dev
echo.
echo ===== Running UglifyCSS on the JavaScript files to make sure they are minimized ...
rem UglifyCSS was installed using:  npm install uglifycss -g
if exist "..\css" (
    del /s /q /f "..\css\*.*"
) else (
    echo   Creating CSS output directory
    mkdir "..\css"
)
for %%x in ( *.css ) do (
    echo   Minimizing "%%x"
    call uglifycss.cmd "%%x" > "..\css\%%x"
)
echo ===== Done
popd


rem Then process the API files by minimizing them.
pushd ..\src\api_dev
echo.
echo ===== Running a minimizer on the PHP files to make sure they are minimized ...
if exist "..\api" (
    del /s /q /f "..\api\*.*"
) else (
    echo   Creating API output directory
    mkdir "..\api"
)
for %%x in ( gsc2*.php ) do (
    echo   Minimizing "%%x"
    if exist "..\..\build\scripts\SimpleMinimizer.py" (
        python "..\..\build\scripts\SimpleMinimizer.py" --clike --undev "%%x" > "..\api\%%x"
    ) else (
        rem Do a simple copy operation for now.
        copy "%%x" "..\api\%%x"
    )
)
echo ===== Done
popd


rem Create the program documentation.
echo.
echo ===== Clearing out old documentation files ...
rem First prepare the output directory.
if exist "..\doc\jsdoc_out" (
    rem The output directory exists, so clear it out.
    echo   Deleting old documentation files
    del /s /q /f "..\doc\jsdoc_out\*.*"
) else (
    rem The output directory doesn't exist, so create it.
    echo   Creating documentation output directory
    mkdir "..\doc\jsdoc_out"
)
echo ===== Done

echo.
echo ===== Generating graphs ...
if not exist "..\doc\jsdoc_out\graphs" (
    rem The output graphs directory does not exist, so create it.
    echo   Creating graph output directory
    mkdir "..\doc\jsdoc_out\graphs"
)
if exist "scripts\GraphMaker.py" (
    python "scripts\GraphMaker.py" --verbose --outputpath "..\doc\jsdoc_out\graphs\gsc2app" "..\src\js_dev\*.js"
	rem Then run the GraphViz dot program to actually create the graph output files.
	for %%x in ("..\doc\jsdoc_out\graphs\gsc2app*_graphviz.txt") do (
		rem Strip off the "_graphviz.txt" part in preparation to replace it with the appropriate file extension.
		for /f "tokens=*" %%i in ('echo %%x ^| sed "s/_graphviz.txt\s*$//g"') do set BASEPATH=%%i
		echo   Running GraphViz dot program for PNG output on %%x
		dot -Tpng %%x > !BASEPATH!.png
		echo     PNG graph output file !BASEPATH!.png created
		echo   Running GraphViz dot program for PDF output on %%x
		dot -Tpdf %%x > !BASEPATH!.pdf
		echo     PDF graph output file !BASEPATH!.pdf created
	)
)
echo ===== Done

echo.
echo ===== Running JSDoc on the JavaScript files to create their documentation ...
rem Build up a list of JavaScript files to process.
pushd "..\src\js_dev"
echo   Building JavaScript source file list
set FILELIST=
for %%x in ( *.js ) do (
    set FILELIST=!FILELIST! "%%x"
)
rem Now create the documentation for these JavaScript files.
rem JSDoc was installed using:  npm install jsdoc -g
echo   Generating documentation files
call jsdoc.cmd -d "..\..\doc\jsdoc_out" !FILELIST!
echo ===== Done
popd


echo.
echo All done

echo.
if not x%1 == xnopause pause

endlocal
exit /b
