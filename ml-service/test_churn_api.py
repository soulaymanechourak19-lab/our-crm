import requests
import json

url = "http://localhost:8001/predict/churn"
payload = {
    "age": 30,
    "recency": 100,
    "frequency": 1,
    "monetary": 100,
    "engagement_rate": 0.1,
    "loyalty_score": 10,
    "gender": "M",
    "segment": "Standard"
}

response = requests.post(url, json=payload)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
