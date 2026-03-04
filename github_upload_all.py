import os
import requests
import base64
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

TOKEN = os.environ.get('GITHUB_TOKEN')
REPO_NAME = 'auto-kabu-screener'
GITHUB_API = 'https://api.github.com'
HEADERS = {
    'Authorization': f'token {TOKEN}',
    'Accept': 'application/vnd.github.v3+json'
}
username = 'p27dff96428v8m9-pixel'

files_to_upload = [
    'app.py', 'auto_trader.py', 'fx_dashboard.py', 'requirements.txt',
    'price_action_analyzer.py', 'register_keys.py', 'trigger_workflow.py',
    'update_webhook.py', 'start_dashboard.bat', 'test_webhook.py',
    'check_sheets.py', 'github_upload_all.py'
]

for file_path in files_to_upload:
    if not os.path.exists(file_path):
        print(f"Skipping: {file_path} not found.")
        continue

    with open(file_path, 'rb') as f:
        content = f.read()
    
    encoded_content = base64.b64encode(content).decode('utf-8')
    file_url = f'{GITHUB_API}/repos/{username}/{REPO_NAME}/contents/{file_path}'
    r = requests.get(file_url, headers=HEADERS)
    
    payload = {
        'message': f'Full backup updates for {file_path}',
        'content': encoded_content
    }
    
    if r.status_code == 200:
        payload['sha'] = r.json()['sha']
        
    r = requests.put(file_url, headers=HEADERS, json=payload)
    if r.status_code in [200, 201]:
        print(f'Successfully uploaded to Cloud: {file_path}')
    else:
        print(f'Failed to upload ({file_path}):', r.json())
