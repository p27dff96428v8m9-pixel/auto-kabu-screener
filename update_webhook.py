import json
import os
import requests
import base64
from nacl import encoding, public

# 新しいWebhook URL
NEW_URL = "https://script.google.com/macros/s/AKfycbx4FuIn5u3F90rElGwIGvhb2CAfLMrZsL-I7fDwsCpE2BICVz5Owb6ZCj75DM0-kyR9/exec"

# 1. ローカルの config.json を更新する
config_path = r"c:\Users\p27df\.gemini\kabukazidou\config.json"
if os.path.exists(config_path):
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        config["webhook_url"] = NEW_URL
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=4, ensure_ascii=False)
        print("✅ ローカルの設定ファイル (config.json) を更新しました。")
    except Exception as e:
        print(f"⚠️ config.jsonの更新中にエラー: {e}")
else:
    # ファイルがない場合は新規作成
    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump({"webhook_url": NEW_URL}, f, indent=4, ensure_ascii=False)
        print("✅ ローカルの設定ファイル (config.json) を作成しました。")
    except Exception as e:
        pass

# 2. GitHub Actionsの開発裏側システム (Secrets) のURLを上書きする
TOKEN = os.environ.get('GITHUB_TOKEN')
REPO_NAME = 'auto-kabu-screener'
GITHUB_API = 'https://api.github.com'
HEADERS = {
    'Authorization': f'token {TOKEN}',
    'Accept': 'application/vnd.github.v3+json'
}
username = 'p27dff96428v8m9-pixel'
secret_name = 'WEBHOOK_URL'

try:
    print("GitHubのセキュリティ鍵を取得中...")
    key_url = f'{GITHUB_API}/repos/{username}/{REPO_NAME}/actions/secrets/public-key'
    r = requests.get(key_url, headers=HEADERS)
    r.raise_for_status()
    key_info = r.json()
    public_key = key_info['key']
    key_id = key_info['key_id']

    # 暗号化
    pk = public.PublicKey(public_key.encode("utf-8"), encoding.Base64Encoder())
    sealed_box = public.SealedBox(pk)
    encrypted = sealed_box.encrypt(NEW_URL.encode("utf-8"))
    encrypted_value = base64.b64encode(encrypted).decode("utf-8")

    # APIへ送信してSecretを上書き
    secret_url = f'{GITHUB_API}/repos/{username}/{REPO_NAME}/actions/secrets/{secret_name}'
    payload = {
        'encrypted_value': encrypted_value,
        'key_id': key_id
    }
    r = requests.put(secret_url, headers=HEADERS, json=payload)
    if r.status_code in [201, 204]:
        print('✅ GitHubの裏側システムのWebhook URLを完全に新しいものに更新しました！')
    else:
        print('❌ GitHub Secretの更新に失敗:', r.json())
except Exception as e:
    print(f"⚠️ GitHub更新エラー: {e}")

