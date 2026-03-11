"""
Lead Scoring Model using Gradient Boosting.
Scores leads 0-100 based on conversion probability.
"""
import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error
from typing import Dict, Any, Optional

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "saved_models")
MODEL_PATH = os.path.join(MODEL_DIR, "scoring_model.pkl")

_model: Optional[GradientBoostingRegressor] = None


def _create_target(leads_df: pd.DataFrame) -> pd.Series:
    """Create a 0-100 score target based on lead status and features."""
    status_scores = {'new': 15, 'contacted': 40, 'qualified': 70, 'converted': 95}
    base_score = leads_df['status'].map(status_scores).fillna(10)

    # Add noise for regression target
    noise = np.random.normal(0, 8, len(base_score))
    score = base_score + noise

    # Add bonuses
    if 'has_phone' in leads_df.columns:
        score += leads_df['has_phone'] * 5
    if 'company_name_length' in leads_df.columns:
        score += (leads_df['company_name_length'] > 5).astype(int) * 5

    return np.clip(score, 0, 100).round(1)


def train(lead_features_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Train the lead scoring model.

    Args:
        lead_features_df: DataFrame from compute_lead_features()

    Returns:
        Dictionary with training metrics
    """
    global _model
    os.makedirs(MODEL_DIR, exist_ok=True)

    df = lead_features_df.copy()
    df['target_score'] = _create_target(df)

    feature_cols = ['time_since_creation', 'status_encoded', 'has_phone', 'has_email', 'company_name_length']
    available_cols = [c for c in feature_cols if c in df.columns]

    X = df[available_cols].values
    y = df['target_score'].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    _model = GradientBoostingRegressor(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
    )
    _model.fit(X_train, y_train)

    y_pred = _model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)

    # Save model with feature column names
    joblib.dump({'model': _model, 'feature_cols': available_cols}, MODEL_PATH)

    return {
        "r2": round(r2, 4),
        "mae": round(mae, 4),
        "samples_total": len(df),
        "feature_columns": available_cols,
    }


def load_model() -> bool:
    """Load the saved model."""
    global _model
    if os.path.exists(MODEL_PATH):
        data = joblib.load(MODEL_PATH)
        _model = data['model']
        return True
    return False


def predict(time_since_creation: int, status_encoded: int, has_phone: int = 1,
            has_email: int = 1, company_name_length: int = 10) -> Dict[str, Any]:
    """
    Score a single lead.

    Returns:
        Dictionary with score (0-100) and priority level
    """
    global _model
    if _model is None:
        if not load_model():
            return {"error": "Model not trained yet. Run /train/scoring first.", "score": 50, "priority": "unknown"}

    features = np.array([[time_since_creation, status_encoded, has_phone, has_email, company_name_length]])
    score = float(np.clip(_model.predict(features)[0], 0, 100))

    if score >= 70:
        priority = "hot"
    elif score >= 40:
        priority = "warm"
    else:
        priority = "cold"

    return {
        "score": round(score, 1),
        "priority": priority,
        "features": {
            "time_since_creation": time_since_creation,
            "status_encoded": status_encoded,
            "has_phone": has_phone,
            "has_email": has_email,
            "company_name_length": company_name_length,
        }
    }


def predict_batch(lead_features_df: pd.DataFrame) -> list:
    """Score multiple leads."""
    results = []
    for _, row in lead_features_df.iterrows():
        result = predict(
            time_since_creation=int(row.get('time_since_creation', 0)),
            status_encoded=int(row.get('status_encoded', 0)),
            has_phone=int(row.get('has_phone', 1)),
            has_email=int(row.get('has_email', 1)),
            company_name_length=int(row.get('company_name_length', 10)),
        )
        result['lead_id'] = int(row.get('lead_id', 0))
        results.append(result)
    return results
