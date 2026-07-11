@echo off
call npm run clean
call npm run build
echo.
@copy favicon.svg dist
@copy LICENSE dist
@copy README.md dist
@copy .gitignore dist
echo.
@pause
