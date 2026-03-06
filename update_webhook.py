import json
import os
import requests
import base64
from nacl import encoding, public

# New Webhook URL
NEW_URL = "https://script.google.com/macros/s/AKfycbxYpuh4YDjbK9LhK1lIU5qPXPlHeEtqgp6cYVFmcz-L2qQ5uMiciZnwOFfBT_5ioFWB/exec"

# 1. Update local config.json
config_path = r"c:\Users\p27df\.gemini\kabukazidou\config.json"
try:
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump({"webhook_url": NEW_URL}, f, indent=4, ensure_ascii=False)
    print("Success: local config.json updated.")
except Exception as e:
    print(f"Error updating config.json: {e}")

# 2. Update GitHub Secret
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
    print("Fetching GitHub public key...")
    key_url = f'{GITHUB_API}/repos/{username}/{REPO_NAME}/actions/secrets/public-key'
    r = requests.get(key_url, headers=HEADERS)
    r.raise_for_status()
    key_info = r.json()
    public_key = key_info['key']
    key_id = key_info['key_id']

    print("Encrypting secret...")
    pk = public.PublicKey(public_key.encode("utf-8"), encoding.Base64Encoder())
    sealed_box = public.SealedBox(pk)
    encrypted = sealed_box.encrypt(NEW_URL.encode("utf-8"))
    encrypted_value = base64.b64encode(encrypted).decode("utf-8")

    print("Uploading secret to GitHub...")
    secret_url = f'{GITHUB_API}/repos/{username}/{REPO_NAME}/actions/secrets/{secret_name}'
    payload = {
        'encrypted_value': encrypted_value,
        'key_id': key_id
    }
    r = requests.put(secret_url, headers=HEADERS, json=payload)
    if r.status_code in [201, 204]:
        print('Success: GitHub Secret updated.')
    else:
        print(f'Failed to update GitHub Secret: {r.status_code} {r.text}')
except Exception as e:
    print(f"GitHub Error: {e}")
