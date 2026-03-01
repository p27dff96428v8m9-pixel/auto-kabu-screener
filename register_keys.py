import os
import requests
import base64
from nacl import encoding, public

# GitHubリポジトリの設定
TOKEN = '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'
REPO_NAME = 'auto-kabu-screener'
GITHUB_API = 'https://api.github.com'
HEADERS = {
    'Authorization': f'token {TOKEN}',
    'Accept': 'application/vnd.github.v3+json'
}
username = 'p27dff96428v8m9-pixel'

def encrypt(public_key: str, secret_value: str) -> str:
    """公開鍵を使ってシークレットを暗号化する"""
    pk = public.PublicKey(public_key.encode("utf-8"), encoding.Base64Encoder())
    sealed_box = public.SealedBox(pk)
    encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
    return base64.b64encode(encrypted).decode("utf-8")

def upload_secret(secret_name: str, secret_value: str, key_id: str, public_key: str):
    print(f"[{secret_name}] を安全に暗号化して送信しています...")
    encrypted_val = encrypt(public_key, secret_value)
    url = f'{GITHUB_API}/repos/{username}/{REPO_NAME}/actions/secrets/{secret_name}'
    payload = {
        'encrypted_value': encrypted_val,
        'key_id': key_id
    }
    r = requests.put(url, headers=HEADERS, json=payload)
    if r.status_code in [201, 204]:
        print(f"✅ {secret_name} の登録完了！")
    else:
        print(f"❌ {secret_name} の登録失敗: {r.status_code} {r.text}")

def main():
    print("="*60)
    print("🤖 全自動X(Twitter) 錬金術マシン 初期設定ツール")
    print("="*60)
    print("取得した5つの鍵（キー）を順番に入力してEnterを押してください。")
    print("※入力した文字は見えなくても、ちゃんとパソコンは記憶しています！\n")
    
    tw_api_key = input("1. Xの【API Key】を貼り付けてEnter: ").strip()
    tw_api_secret = input("2. Xの【API Key Secret】を貼り付けてEnter: ").strip()
    tw_access_token = input("3. Xの【Access Token】を貼り付けてEnter: ").strip()
    tw_access_secret = input("4. Xの【Access Token Secret】を貼り付けてEnter: ").strip()
    print("-" * 30)
    gemini_key = input("5. 次にGeminiの【API Key】を貼り付けてEnter: ").strip()
    
    if not all([tw_api_key, tw_api_secret, tw_access_token, tw_access_secret, gemini_key]):
        print("\n⚠️ 鍵がすべて入力されていません。もう一度最初からやり直してください。")
        return

    print("\n--- GitHub のセキュリティシステムに接続中 ---")
    try:
        key_url = f'{GITHUB_API}/repos/{username}/{REPO_NAME}/actions/secrets/public-key'
        r = requests.get(key_url, headers=HEADERS)
        r.raise_for_status()
        key_info = r.json()
        public_key = key_info['key']
        key_id = key_info['key_id']
        
        upload_secret('TWITTER_API_KEY', tw_api_key, key_id, public_key)
        upload_secret('TWITTER_API_SECRET', tw_api_secret, key_id, public_key)
        upload_secret('TWITTER_ACCESS_TOKEN', tw_access_token, key_id, public_key)
        upload_secret('TWITTER_ACCESS_SECRET', tw_access_secret, key_id, public_key)
        upload_secret('GEMINI_API_KEY', gemini_key, key_id, public_key)
        
        print("\n🎉 すべての鍵がクラウド（GitHub）の強力な金庫に格納されました！")
        print("これでX（Twitter）の自動化とAI自動投稿の準備は完了です。AIにお声がけください！")
        
    except Exception as e:
        print(f"\n⚠️ エラーが発生しました: {e}")

if __name__ == "__main__":
    main()
