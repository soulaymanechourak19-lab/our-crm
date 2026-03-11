import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

class ChurnPredictor:
    def __init__(self):
        self.model_path = 'data/churn_model.pkl'
        
        # We process numerical and categorical features differently
        self.numeric_features = ['age', 'recency', 'frequency', 'monetary', 'engagement_rate', 'loyalty_score']
        self.categorical_features = ['gender', 'segment']
        
        # Create a preprocessing pipeline
        numeric_transformer = StandardScaler()
        categorical_transformer = OneHotEncoder(handle_unknown='ignore')
        
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, self.numeric_features),
                ('cat', categorical_transformer, self.categorical_features)
            ])
            
        self.pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
        ])

    def train_model(self, data):
        df = pd.DataFrame(data)
        
        # Target variable
        y = df['churned']
        X = df[self.numeric_features + self.categorical_features]
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.pipeline.fit(X_train, y_train)
        
        y_pred = self.pipeline.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        
        joblib.dump(self.pipeline, self.model_path)
        
        return {
            "accuracy": round(acc, 4),
            "report": classification_report(y_test, y_pred, output_dict=True)
        }

    def predict(self, features):
        if not os.path.exists(self.model_path):
            raise Exception("Model not trained yet.")
            
        pipeline = joblib.load(self.model_path)
        df = pd.DataFrame([features])
        
        # Predict probability of churn (class 1)
        prob = pipeline.predict_proba(df)[0][1]
        
        return {
            "churn_risk_score": round(prob * 100, 2), # Percentage 0-100
            "churn_risk_label": "High" if prob > 0.7 else ("Medium" if prob > 0.3 else "Low")
        }
