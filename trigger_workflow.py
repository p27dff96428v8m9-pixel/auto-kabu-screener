import requests

TOKEN = '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'
REPO_NAME = 'auto-kabu-screener'
GITHUB_API = 'https://api.github.com'
HEADERS = {
    'Authorization': f'token {TOKEN}',
    'Accept': 'application/vnd.github.v3+json'
}

username = 'p27dff96428v8m9-pixel'

# Trigger workflow
dispatch_url = f'{GITHUB_API}/repos/{username}/{REPO_NAME}/actions/workflows/daily_screener.yml/dispatches'
payload = {
    'ref': 'main'
}
r = requests.post(dispatch_url, headers=HEADERS, json=payload)
if r.status_code == 204:
    print('✅ 手動トリガー成功！')
else:
    print(f'❌ エラー: {r.status_code} {r.text}')
