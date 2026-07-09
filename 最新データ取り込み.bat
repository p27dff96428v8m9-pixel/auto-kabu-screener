@echo off
chcp 65001 >nul
cd /d %~dp0
echo GitHubから最新データを取り込みます...
echo.
echo （ローカル単独運転などでローカル側のデータが書き換わっている場合は
echo 　GitHub側を正として上書きします。コードの変更は影響を受けません）
git checkout -- docs/fund-flow-ai-system/data/ 2>nul
git pull origin main
echo.
echo 完了。ローカルの観測スペース(http://127.0.0.1:8790/)を開いている場合は
echo ブラウザで再読み込み(F5)してください。
echo.
pause
