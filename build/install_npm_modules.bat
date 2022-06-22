@echo off
rem Usage:  install_npm_modules.bat
rem Installs the NodeJS modules that the GolfScorecard2 build process needs.

setlocal

echo.
echo Installing JSHint
npm install -g jshint

echo.
echo Installing UglifyJS
npm install -g uglify-js

echo.
echo Installing UglifyCSS
npm install -g uglifycss

echo.
echo Installing JSDoc
npm install -g jsdoc

echo.
echo Installing TypeScript
npm install -g typescript

endlocal

echo.
echo Done
