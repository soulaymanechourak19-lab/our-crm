import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
import joblib
import os

class LeadScorer:
    def __init__(self):
        self.model_path = 'data/lead_scorer_model.pkl'
        self.numeric_features = ['age', 'recency', 'frequency', 'monetary', 'engagement_rate']
        self.categorical_features = ['gender', 'segment']
        
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), self.numeric_features),
                ('cat', OneHotEncoder(handle_unknown='ignore'), self.categorical_features)
            ])
            
        self.pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('regressor', GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=3, random_state=42))
        ])

    def train_model(self, data):
        df = pd.DataFrame(data)
        
        # We will train the model to predict the "loyalty_score" as a proxy for Lead Conversion / Customer Value Potential
        y = df['loyalty_score']
        X = df[self.numeric_features + self.categorical_features]
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        self.pipeline.fit(X_train, y_train)
        
        y_pred = self.pipeline.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        joblib.dump(self.pipeline, self.model_path)
        
        return {
            "mae": round(mae, 4),
            "r2_score": round(r2, 4)
        }

    def predict(self, features):
        if not os.path.exists(self.model_path):
             raise Exception("Model not trained yet.")
        pipeline = joblib.load(self.model_path)
        df = pd.DataFrame([features])
        score = pipeline.predict(df)[0]
        
        # Normalize score between 0 and 100 for display
        score_normalized = max(0, min(100, (score / 1000) * 100)) # Assuming max loyalty score is around 1000
        
        return {
            "lead_score": round(score_normalized, 2),
            "raw_predicted_value": round(score, 2)
        }
