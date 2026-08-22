import requests
import json

url = "http://127.0.0.1:8020/api/v1/verify"

# 1. Test query: "hi" (low evidence expected)
print("=== TESTING CLAIM: 'hi' ===")
try:
    res = requests.post(url, data={"claim": "hi"})
    if res.status_code == 200:
        data = res.json()
        print(f"Assessment: {data['assessment']['display_label']}")
        print(f"Confidence: {data['assessment']['confidence_percent']}%")
        print(f"ECS Score:  {data['assessment']['ecs']}/100")
        print(f"Explanation: {data['explanation']}")
    else:
        print(f"Error: {res.status_code} - {res.text}")
except Exception as e:
    print(f"Request failed: {e}")

# 2. Test query: "Narendra Modi is the current Prime Minister of India" (high evidence expected)
print("\n=== TESTING CLAIM: 'Narendra Modi is the current Prime Minister of India' ===")
try:
    res = requests.post(url, data={"claim": "Narendra Modi is the current Prime Minister of India"})
    if res.status_code == 200:
        data = res.json()
        print(f"Assessment: {data['assessment']['display_label']}")
        print(f"Confidence: {data['assessment']['confidence_percent']}%")
        print(f"ECS Score:  {data['assessment']['ecs']}/100")
        print(f"Explanation: {data['explanation']}")
    else:
        print(f"Error: {res.status_code} - {res.text}")
except Exception as e:
    print(f"Request failed: {e}")
