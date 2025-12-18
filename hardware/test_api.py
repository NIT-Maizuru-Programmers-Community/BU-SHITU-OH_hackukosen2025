import requests
import json

# 設定
API_ENDPOINT = "https://hacku2025.vercel.app"
API_KEY = "YOUR_API_KEY_HERE" # ユーザーに入力してもらう

def test_api():
    url = f"{API_ENDPOINT}/api/auth/register-card"
    
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        # Browser-like User-Agent
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    payload = {
        "nfcCardId": "test_card_id_123"
    }
    
    print(f"--- Request ---")
    print(f"URL: {url}")
    print(f"Headers: {headers}")
    print(f"Payload: {json.dumps(payload)}")
    print("-" * 20)

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        print(f"--- Response ---")
        print(f"Status Code: {response.status_code}")
        print(f"URL: {response.url}")
        print(f"History: {response.history}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        print(f"Body (Head): {response.text[:500]}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
