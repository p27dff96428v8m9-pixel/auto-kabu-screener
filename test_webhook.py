import requests

url = "https://script.google.com/macros/s/AKfycbzhXxMimj7bAG4z3UwYBKdhVfgiMFB4ktOhN2t4Dv110TH47sBTWgHi2mzgqjFddZXt/exec"

payload = {
    "action": "add_new",
    "code": "7203",
    "current_price": 3800.5,
    "ai_text": "テストAIテキスト",
    "ai_color": "green",
    "buy": 3500,
    "tp": 4000,
    "sl": 3200
}

try:
    print("Testing Webhook...")
    res = requests.post(url, json=payload, allow_redirects=True)
    print(f"Status Code: {res.status_code}")
    print(f"Response Text (first 500 chars): {res.text[:500]}")
except Exception as e:
    print(f"Error: {e}")
