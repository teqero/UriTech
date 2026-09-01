import requests, json, sys, time

base = "http://localhost:4000/api/v1"

def test():
    # 1. Login
    r = requests.post(f"{base}/auth/login", json={
        "email": "joao@uritech.com",
        "password": "demo123"
    })
    print("LOGIN:", r.status_code, r.text[:200])
    if r.status_code != 200:
        return
    token = r.json().get("token")
    if not token:
        print("No token in response")
        return
    
    # 2. KYC Status
    r2 = requests.get(f"{base}/kyc/status", headers={"Authorization": f"Bearer {token}"})
    print("KYC STATUS:", r2.status_code, r2.text[:300])
    
    # 3. KYC Limits
    r3 = requests.get(f"{base}/kyc/limits", headers={"Authorization": f"Bearer {token}"})
    print("KYC LIMITS:", r3.status_code, r3.text[:300])
    
    # 4. Wallet
    r4 = requests.get(f"{base}/wallet", headers={"Authorization": f"Bearer {token}"})
    print("WALLET:", r4.status_code, r4.text[:300])

if __name__ == "__main__":
    time.sleep(2)  # wait for server
    test()
