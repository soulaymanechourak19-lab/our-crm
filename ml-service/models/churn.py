"""
Churn Prediction Model using XGBoost.
Predicts whether a customer is likely to churn based on RFM + engagement features.
"""
import os
import numpy as np
import pandas as pd
import joblib
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report
from typing import Dict, Any, Optional

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "saved_models")
MODEL_PATH = os.path.join(MODEL_DIR, "churn_model.pkl")

# Global model instance
_model: Optional[XGBClassifier] = None


def _label_churn(row: pd.Series) -> int:
    """Label a customer as churned if recency > 90 days AND frequency < 3."""
    return 1 if (row['recency'] > 90 and row['frequency'] < 3) else 0


def train(rfm_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Train the churn prediction model.

    Args:
        rfm_df: DataFrame with columns [customer_id, recency, frequency, monetary, loyalty_score]

    Returns:
        Dictionary with training metrics
    """
    global _model
    os.makedirs(MODEL_DIR, exist_ok=True)

    df = rfm_df.copy()

    # Create churn label
    df['churn'] = df.apply(_label_churn, axis=1)

    feature_cols = ['recency', 'frequency', 'monetary', 'loyalty_score']
    X = df[feature_cols].values
    y = df['churn'].values

    # Handle imbalanced classes
    churn_ratio = y.sum() / len(y) if len(y) > 0 else 0.5
    scale_pos_weight = (1 - churn_ratio) / max(churn_ratio, 0.01)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    _model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        scale_pos_weight=scale_pos_weight,
        use_label_encoder=False,
        eval_metric='logloss',
        random_state=42,
    )
    _model.fit(X_train, y_train)

    # Evaluation
    y_pred_proba = _model.predict_proba(X_test)[:, 1]
    try:
        roc_auc = roc_auc_score(y_test, y_pred_proba)
    except ValueError:
        roc_auc = 0.5  # Only one class present

    report = classification_report(y_test, (y_pred_proba > 0.5).astype(int), output_dict=True, zero_division=0)

    # Save model
    joblib.dump(_model, MODEL_PATH)

    return {
        "roc_auc": round(roc_auc, 4),
        "precision": round(report.get("1", {}).get("precision", 0), 4),
        "recall": round(report.get("1", {}).get("recall", 0), 4),
        "f1": round(report.get("1", {}).get("f1-score", 0), 4),
        "samples_total": len(df),
        "churn_rate": round(churn_ratio, 4),
    }


def load_model() -> bool:
    """Load the saved model. Returns True if successful."""
    global _model
    if os.path.exists(MODEL_PATH):
        _model = joblib.load(MODEL_PATH)
        return True
    return False


def predict(recency: int, frequency: int, monetary: float, loyalty_score: int = 0) -> Dict[str, Any]:
    """
    Predict churn probability for a single customer.

    Returns:
        Dictionary with probability and risk level
    """
    global _model
    if _model is None:
        if not load_model():
            return {"error": "Model not trained yet. Run /train/churn first.", "probability": 0.5, "risk_level": "unknown"}

    features = np.array([[recency, frequency, monetary, loyalty_score]])
    proba = _model.predict_proba(features)[0][1]

    if proba >= 0.7:
        risk_level = "high"
    elif proba >= 0.4:
        risk_level = "medium"
    else:
        risk_level = "low"

    return {
        "probability": round(float(proba), 4),
        "risk_level": risk_level,
        "features": {
            "recency": recency,
            "frequency": frequency,
            "monetary": monetary,
            "loyalty_score": loyalty_score,
        }
    }


def predict_batch(rfm_df: pd.DataFrame) -> list:
    """Predict churn for multiple customers."""
    results = []
    for _, row in rfm_df.iterrows():
        result = predict(
            recency=int(row.get('recency', 0)),
            frequency=int(row.get('frequency', 0)),
            monetary=float(row.get('monetary', 0)),
            loyalty_score=int(row.get('loyalty_score', 0)),
        )
        result['customer_id'] = int(row.get('customer_id', 0))
        results.append(result)
    return results
