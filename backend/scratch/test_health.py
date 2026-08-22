import requests
try:
    res = requests.get("http://127.0.0.1:8020/health")
    print(res.json())
except Exception as e:
    print(e)
