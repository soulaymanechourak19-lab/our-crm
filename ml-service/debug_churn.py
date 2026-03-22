import joblib
import pandas as pd
import os

model_path = 'data/churn_model.pkl'

if not os.path.exists(model_path):
    print(f"Error: Model file not found at {model_path}")
    exit(1)

pipeline = joblib.load(model_path)

# Test cases
test_cases = [
    {
        "name": "High Risk (Inactive)",
        "features": {
            "age": 50,
            "recency": 150,
            "frequency": 1,
            "monetary": 10.0,
            "engagement_rate": 0.05,
            "loyalty_score": 5,
            "gender": "M",
            "segment": "Occasionnel"
        }
    },
    {
        "name": "Low Risk (Recent & Active)",
        "features": {
            "age": 30,
            "recency": 5,
            "frequency": 20,
            "monetary": 500.0,
            "engagement_rate": 0.9,
            "loyalty_score": 80,
            "gender": "F",
            "segment": "VIP"
        }
    }
]

for case in test_cases:
    df = pd.DataFrame([case['features']])
    probs = pipeline.predict_proba(df)[0]
    classes = pipeline.classes_
    print(f"--- {case['name']} ---")
    print(f"Features: {case['features']}")
    print(f"Classes: {classes}")
    print(f"Probabilities: {probs}")
    if len(probs) > 1:
        print(f"Churn Prob: {probs[1] * 100:.2f}%")
    else:
        prob = 1.0 if classes[0] == 1 else 0.0
        print(f"Churn Prob (Single-Class Fallback): {prob * 100:.2f}%")
    print()
