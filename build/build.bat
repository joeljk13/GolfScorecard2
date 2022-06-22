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

rem Define the key output directories.
set OUTPUT_DIR_ROOT=!CD!\..\out.build

set OUTPUT_DIR_DIAG=%OUTPUT_DIR_ROOT%\diag
set OUTPUT_DIR_DIAG_JS=%OUTPUT_DIR_DIAG%\js
set OUTPUT_DIR_DIAG_JSLINT=%OUTPUT_DIR_DIAG%\jslint
set OUTPUT_DIR_DIAG_DOC=%OUTPUT_DIR_DIAG%\doc
set OUTPUT_DIR_DIAG_GRAPHS=%OUTPUT_DIR_DIAG_DOC%\graphs
set OUTPUT_DIR_DIAG_LIB=%OUTPUT_DIR_DIAG%\lib

set OUTPUT_DIR_DIST=%OUTPUT_DIR_ROOT%\dist
set OUTPUT_DIR_DIST_JS=%OUTPUT_DIR_DIST%\js
set OUTPUT_DIR_DIST_API=%OUTPUT_DIR_DIST%\api
set OUTPUT_DIR_DIST_CSS=%OUTPUT_DIR_DIST%\css
set OUTPUT_DIR_DIST_DATA=%OUTPUT_DIR_DIST%\data
set OUTPUT_DIR_DIST_LIB=%OUTPUT_DIR_DIST%\lib

set OUTPUT_DIR_DOC=%OUTPUT_DIR_ROOT%\doc
set OUTPUT_DIR_DOC_JS=%OUTPUT_DIR_DOC%\js
set OUTPUT_DIR_DOC_GRAPHS=%OUTPUT_DIR_DOC_JS%\graphs


echo.
echo Preparing the GolfScorecard2 output area ...
if exist "!OUTPUT_DIR_ROOT!" (
    echo   Deleting all output files in "!OUTPUT_DIR_ROOT!"
    rmdir /s /q "!OUTPUT_DIR_ROOT!"
) else (
    echo   Creating top-level output directory "!OUTPUT_DIR_ROOT!"
    mkdir "!OUTPUT_DIR_ROOT!"
)
if not exist "!OUTPUT_DIR_DIAG!" (
    echo   Creating diagnostics/temporary directory "!OUTPUT_DIR_DIAG!"
    mkdir "!OUTPUT_DIR_DIAG!"
)


echo.
echo Processing the GolfScorecard2 files for publishing ...

rem First do a lint check on the JavaScript files to make sure they are clean.
if not exist "!OUTPUT_DIR_DIAG_JSLINT!" (
    echo   Creating diagnostics/temporary directory "!OUTPUT_DIR_DIAG_JSLINT!"
    mkdir "!OUTPUT_DIR_DIAG_JSLINT!"
)
pushd "..\src\js"
echo.
echo ===== Running JSHint on the JavaScript files to make sure they are clean ...
rem JSHint was installed using:  npm install jshint -g
for %%x in ( *.js ) do (
    echo   Checking "%%x"
    call jshint.cmd "%%x" > "!OUTPUT_DIR_DIAG_JSLINT!\%%x.jshint-output.txt"
    if exist "!OUTPUT_DIR_DIAG_JSLINT!\%%x.jshint-output.txt" (
	    type "!OUTPUT_DIR_DIAG_JSLINT!\%%x.jshint-output.txt"
    )
)
echo ===== Done
popd


rem Then process the JavaScript files by minimizing them.
pushd "..\src\js"
echo.
echo ===== Running UglifyJS on the JavaScript files to make sure they are minimized ...
rem OLD: UglifyJS was installed using:  npm install uglify-es -g
rem NEW: UglifyJS was installed using:  npm install uglify-js -g

if exist "!OUTPUT_DIR_DIST_JS!" (
    echo   Deleting all output JavaScript files in "!OUTPUT_DIR_DIST_JS!"
    del /s /q /f "!OUTPUT_DIR_DIST_JS!\*.*"
) else (
    echo   Creating JavaScript output distribution directory "!OUTPUT_DIR_DIST_JS!"
    mkdir "!OUTPUT_DIR_DIST_JS!"
)

if exist "!OUTPUT_DIR_DIAG_JS!" (
    echo   Deleting all diagnostic/temporary JavaScript files in "!OUTPUT_DIR_DIAG_JS!"
    del /s /q /f "!OUTPUT_DIR_DIAG_JS!\*.*"
) else (
    echo   Creating JavaScript output diagnostics directory "!OUTPUT_DIR_DIAG_JS!"
    mkdir "!OUTPUT_DIR_DIAG_JS!"
)

for %%x in ( *.js ) do (
    echo   Minimizing "%%x"
    rem Remove lines that being with "/*DEV*/" as they are for development only.
    rem Note: Removed option in latest version of uglifyjs:  --ecma 8
    grep -v -e "^\s*/[*]DEV[*]/" "%%x" | call uglifyjs.cmd > "!OUTPUT_DIR_DIAG_JS!\%%x"
    rem Generate the combined file for the entire client-side application.
    type "!OUTPUT_DIR_DIAG_JS!\%%x" >> "!OUTPUT_DIR_DIST_JS!\gsc2app.js"
)

echo ===== Done
popd
call calc_sri_hash.bat "!OUTPUT_DIR_DIST_JS!\gsc2app.js" > "!OUTPUT_DIR_DIAG_JS!\sri_hashes.txt"
gawk "{print $1}" "!OUTPUT_DIR_DIAG_JS!\sri_hashes.txt" | python -c "import sys; print('s/SRIHASH_GSC2APP_JS/'+sys.stdin.readline().strip()+'/g')" > "!OUTPUT_DIR_DIAG_JS!\sri_hashes_sed.txt"


rem Then process the HTML files.
echo.
echo ===== Processing HTML files and its associated support files ...
pushd "..\src"
echo   Transforming "main.html"
if exist "..\build\scripts\SimpleMinimizer.py" (
    type main.html | sed -f "..\build\sri_hashes_sed.txt" | python "..\build\scripts\SimpleMinimizer.py" --hlike --undev > "!OUTPUT_DIR_DIST!\main.html"
) else (
    type "!OUTPUT_DIR_DIAG!\main.html" | sed -f "..\build\sri_hashes_sed.txt" > "!OUTPUT_DIR_DIST!\main.html"
)
rem Copy the special files needed by the web site.
xcopy /d ".htaccess" "!OUTPUT_DIR_DIST!"
xcopy /d "favicon.ico" "!OUTPUT_DIR_DIST!"
xcopy /d "robots.txt" "!OUTPUT_DIR_DIST!"

rem Windows command to retrieve the lib/js file list:
rem     grep -e "!-- *REL.*src=.lib/js/" main.html | sed "s/^.*src *= *.lib/lib/" | sed "s/. .*$//" | sed "s/\\//\\\\/g"
rem Linux command to retrieve the lib/js file list (more accurate than Windows):
rem      grep -e '!-- *REL.*src="lib/js/' main.html | sed 's/^.*src="lib/lib/' | sed 's/" .*$//'
if not exist "!OUTPUT_DIR_DIAG_LIB!" (
    echo   Creating lib diagnostic directory "!OUTPUT_DIR_DIAG_LIB!"
    mkdir "!OUTPUT_DIR_DIAG_LIB!"
)
if not exist "!OUTPUT_DIR_DIST_LIB!" (
    echo   Creating lib output directory "!OUTPUT_DIR_DIST_LIB!"
    mkdir "!OUTPUT_DIR_DIST_LIB!"
)
echo   Determining lib files
grep -e "!-- *REL.*src=.lib/js/" main.html > "!OUTPUT_DIR_DIAG_LIB!\liblist_01.txt"
sed "s/^.*src *= *.lib/lib/" "!OUTPUT_DIR_DIAG_LIB!\liblist_01.txt" > "!OUTPUT_DIR_DIAG_LIB!\liblist_02.txt"
sed "s/. .*$//" "!OUTPUT_DIR_DIAG_LIB!\liblist_02.txt" > "!OUTPUT_DIR_DIAG_LIB!\liblist_03.txt"
sed "s/\\//\\\\/g" "!OUTPUT_DIR_DIAG_LIB!\liblist_03.txt" | tee "!OUTPUT_DIR_DIAG_LIB!\liblist.txt"
for /f "usebackq delims=" %%x in (`type "!OUTPUT_DIR_DIAG_LIB!\liblist.txt"`) do (
    for /f "usebackq delims=" %%y in (`dirname "%%x"`) do (
        if not exist "!OUTPUT_DIR_DIST!\%%y" (
            echo   Creating directory "!OUTPUT_DIR_DIST!\%%y"
            mkdir "!OUTPUT_DIR_DIST!\%%y"
        )
        rem The F in the stdin pipe is to provide the response that the destination is a file and not a directory.
        echo   Copying lib file "%%x"
        echo F | xcopy /D /Y "%%x" "!OUTPUT_DIR_DIST!\%%x"
    )
)

if not exist "!OUTPUT_DIR_DIST_DATA!" (
    echo   Creating data input/output directory "!OUTPUT_DIR_DIST_DATA!"
    mkdir "!OUTPUT_DIR_DIST_DATA!"
)
if not exist "!OUTPUT_DIR_DIST_DATA!\courses" (
    echo   Creating courses input directory "!OUTPUT_DIR_DIST_DATA!\courses"
    mkdir "!OUTPUT_DIR_DIST_DATA!\courses"
)
if not exist "!OUTPUT_DIR_DIST_DATA!\scorecards" (
    echo   Creating scorecards output directory "!OUTPUT_DIR_DIST_DATA!\scorecards"
    mkdir "!OUTPUT_DIR_DIST_DATA!\scorecards"
)
echo   Copying course information
xcopy /D /Y "data\courses\*.*" "!OUTPUT_DIR_DIST_DATA!\courses"

echo ===== Done
popd


rem Then process the CSS files by minimizing them.
pushd "..\src\css"
echo.
echo ===== Running UglifyCSS on the JavaScript files to make sure they are minimized ...
rem UglifyCSS was installed using:  npm install uglifycss -g
if exist "!OUTPUT_DIR_DIST_CSS!" (
    echo   Deleting all output CSS files in "!OUTPUT_DIR_DIST_CSS!"
    del /s /q /f "!OUTPUT_DIR_DIST_CSS!\*.*"
) else (
    echo   Creating CSS output directory "!OUTPUT_DIR_DIST_CSS!"
    mkdir "!OUTPUT_DIR_DIST_CSS!"
)
for %%x in ( *.css ) do (
    echo   Minimizing "%%x"
    call uglifycss.cmd "%%x" > "!OUTPUT_DIR_DIST_CSS!\%%x"
)
echo ===== Done
popd


rem Then process the API files by minimizing them.
pushd "..\src\api"
echo.
echo ===== Running a minimizer on the PHP files to make sure they are minimized ...
if exist "!OUTPUT_DIR_DIST_API!" (
    echo   Deleting all output API files in "!OUTPUT_DIR_DIST_API!"
    del /s /q /f "!OUTPUT_DIR_DIST_API!\*.*"
) else (
    echo   Creating API output directory "!OUTPUT_DIR_DIST_API!"
    mkdir "!OUTPUT_DIR_DIST_API!"
)
for %%x in ( gsc2*.php ) do (
    echo   Minimizing "%%x"
    if exist "..\..\build\scripts\SimpleMinimizer.py" (
        python "..\..\build\scripts\SimpleMinimizer.py" --clike --undev "%%x" > "!OUTPUT_DIR_DIST_API!\%%x"
    ) else (
        rem Do a simple copy operation for now.
        copy "%%x" "!OUTPUT_DIR_DIST_API!\%%x"
    )
)
echo ===== Done
popd


rem Create the program documentation.
echo.
echo ===== Clearing out old documentation files ...
rem First prepare the output directory.
if exist "!OUTPUT_DIR_DOC!" (
    rem The output directory exists, so clear it out.
    echo   Deleting old documentation files in "!OUTPUT_DIR_DOC!"
    del /s /q /f "!OUTPUT_DIR_DOC!\*.*"
) else (
    rem The output directory doesn't exist, so create it.
    echo   Creating documentation output directory "!OUTPUT_DIR_DOC!"
    mkdir "!OUTPUT_DIR_DOC!"
)
if exist "!OUTPUT_DIR_DIAG_DOC!" (
    rem The output directory exists, so clear it out.
    echo   Deleting old documentation diagnostic/temporary files in "!OUTPUT_DIR_DIAG_DOC!"
    del /s /q /f "!OUTPUT_DIR_DIAG_DOC!\*.*"
) else (
    rem The output directory doesn't exist, so create it.
    echo   Creating documentation diagnostic/temporary directory "!OUTPUT_DIR_DIAG_DOC!"
    mkdir "!OUTPUT_DIR_DIAG_DOC!"
)
echo ===== Done

echo.
echo ===== Generating graphs ...
if not exist "!OUTPUT_DIR_DOC_GRAPHS!" (
    rem The output graphs directory does not exist, so create it.
    echo   Creating graph output directory
    mkdir "!OUTPUT_DIR_DOC_GRAPHS!"
)
if not exist "!OUTPUT_DIR_DIAG_GRAPHS!" (
    rem The diagnostic/temporary graphs directory does not exist, so create it.
    echo   Creating graph output directory
    mkdir "!OUTPUT_DIR_DIAG_GRAPHS!"
)
if exist "scripts\GraphMaker.py" (
    python "scripts\GraphMaker.py" --verbose --outputpath "!OUTPUT_DIR_DIAG_GRAPHS!\gsc2app" "..\src\js\*.js"
	rem Then run the GraphViz dot program to actually create the graph output files.
    pushd "!OUTPUT_DIR_DIAG_GRAPHS!"
	for %%x in ("gsc2app*_graphviz.txt") do (
		rem Strip off the "_graphviz.txt" part in preparation to replace it with the appropriate file extension.
		for /f "tokens=*" %%i in ('echo %%x ^| sed "s/_graphviz.txt\s*$//g"') do set BASEPATH=%%i
		echo   Running GraphViz dot program for PNG output on %%x
		dot -Tpng %%x > "!OUTPUT_DIR_DOC_GRAPHS!\!BASEPATH!.png"
		echo     PNG graph output file "!OUTPUT_DIR_DOC_GRAPHS!\!BASEPATH!.png" created
		echo   Running GraphViz dot program for PDF output on %%x
		dot -Tpdf %%x > "!OUTPUT_DIR_DOC_GRAPHS!\!BASEPATH!.pdf"
		echo     PDF graph output file "!OUTPUT_DIR_DOC_GRAPHS!\!BASEPATH!.pdf" created
	)
    popd
)
echo ===== Done


echo.
echo ===== Running JSDoc on the JavaScript files to create their documentation ...
rem Build up a list of JavaScript files to process.
pushd "..\src\js"
echo   Building JavaScript source file list
set FILELIST=
for %%x in ( *.js ) do (
    set FILELIST=!FILELIST! "%%x"
)
rem Now create the documentation for these JavaScript files.
rem JSDoc was installed using:  npm install jsdoc -g
echo   Generating documentation files
call jsdoc.cmd -d "!OUTPUT_DIR_DOC_JS!" !FILELIST!
echo ===== Done
popd


:done
echo.
echo All done

echo.
if not x%1 == xnopause pause

endlocal
exit /b
