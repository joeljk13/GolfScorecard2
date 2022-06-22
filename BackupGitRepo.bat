@echo off

echo Creating git bundle as the backup file ...
git bundle create GolfScorecard2.git_bundle --all

echo.
echo Verifying the git bundle ...
git bundle verify GolfScorecard2.git_bundle
