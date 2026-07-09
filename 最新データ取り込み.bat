@echo off
chcp 65001 >nul
cd /d %~dp0
echo GitHubから最新データを取り込みます...
echo.
git pull origin main
echo.
echo 完了。ローカルの観測スペース(http://127.0.0.1:8790/)を開いている場合は
echo ブラウザで再読み込み(F5)してください。
echo.
pause
