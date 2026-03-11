"""
Customer Segmentation using K-Means clustering.
Groups customers into meaningful segments based on RFM features.
"""
import os
import numpy as np
import pandas as pd
import joblib
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from typing import Dict, Any, Optional, List

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "saved_models")
MODEL_PATH = os.path.join(MODEL_DIR, "segmentation_model.pkl")

_model: Optional[KMeans] = None
_scaler: Optional[StandardScaler] = None
_cluster_names: dict = {}

FEATURE_COLS = ['recency', 'frequency', 'monetary', 'loyalty_score']


def _auto_name_clusters(centroids: np.ndarray, feature_names: list) -> dict:
    """Assign names to clusters based on centroid characteristics."""
    names = {}
    for i, centroid in enumerate(centroids):
        rec_idx = feature_names.index('recency') if 'recency' in feature_names else 0
        freq_idx = feature_names.index('frequency') if 'frequency' in feature_names else 1
        mon_idx = feature_names.index('monetary') if 'monetary' in feature_names else 2

        rec, freq, mon = centroid[rec_idx], centroid[freq_idx], centroid[mon_idx]

        if rec < 0 and freq > 0 and mon > 0:
            names[i] = "Champions"
        elif rec < 0 and freq > 0:
            names[i] = "Loyal Customers"
        elif rec > 0 and freq < 0:
            names[i] = "At Risk"
        elif rec > 1 and freq < -0.5:
            names[i] = "Lost"
        elif freq < 0 and mon > 0:
            names[i] = "Big Spenders (Dormant)"
        else:
            names[i] = f"Segment {i + 1}"

    # Ensure unique names
    seen = set()
    for k, v in names.items():
        if v in seen:
            names[k] = f"{v} ({k})"
        seen.add(names[k])

    return names


def _find_optimal_k(X_scaled: np.ndarray, k_range: range = range(2, 8)) -> int:
    """Find optimal K using silhouette score."""
    best_k, best_score = 3, -1
    for k in k_range:
        if k >= len(X_scaled):
            break
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(X_scaled)
        if len(set(labels)) > 1:
            score = silhouette_score(X_scaled, labels)
            if score > best_score:
                best_score = score
                best_k = k
    return best_k


def train(rfm_df: pd.DataFrame, k: int = None) -> Dict[str, Any]:
    """
    Train segmentation model.

    Args:
        rfm_df: DataFrame with RFM features
        k: Number of clusters (auto-detected if None)

    Returns:
        Training metrics
    """
    global _model, _scaler, _cluster_names
    os.makedirs(MODEL_DIR, exist_ok=True)

    df = rfm_df.copy()
    available_cols = [c for c in FEATURE_COLS if c in df.columns]
    X = df[available_cols].values.astype(float)

    _scaler = StandardScaler()
    X_scaled = _scaler.fit_transform(X)

    if k is None:
        k = _find_optimal_k(X_scaled)

    _model = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = _model.fit_predict(X_scaled)

    sil_score = silhouette_score(X_scaled, labels) if len(set(labels)) > 1 else 0.0
    _cluster_names = _auto_name_clusters(_model.cluster_centers_, available_cols)

    # Save
    joblib.dump({
        'model': _model,
        'scaler': _scaler,
        'cluster_names': _cluster_names,
        'feature_cols': available_cols,
    }, MODEL_PATH)

    # Segment distribution
    distribution = {}
    for lbl in range(k):
        count = int((labels == lbl).sum())
        distribution[_cluster_names.get(lbl, f"Segment {lbl}")] = count

    return {
        "silhouette_score": round(sil_score, 4),
        "n_clusters": k,
        "distribution": distribution,
        "samples_total": len(df),
    }


def load_model() -> bool:
    """Load the saved model."""
    global _model, _scaler, _cluster_names
    if os.path.exists(MODEL_PATH):
        data = joblib.load(MODEL_PATH)
        _model = data['model']
        _scaler = data['scaler']
        _cluster_names = data['cluster_names']
        return True
    return False


def predict(recency: int, frequency: int, monetary: float, loyalty_score: int = 0) -> Dict[str, Any]:
    """Predict segment for a single customer."""
    global _model, _scaler, _cluster_names
    if _model is None:
        if not load_model():
            return {"error": "Model not trained yet.", "segment": "unknown", "cluster_id": -1}

    features = np.array([[recency, frequency, monetary, loyalty_score]])
    features_scaled = _scaler.transform(features)
    cluster_id = int(_model.predict(features_scaled)[0])

    return {
        "cluster_id": cluster_id,
        "segment": _cluster_names.get(cluster_id, f"Segment {cluster_id}"),
        "features": {
            "recency": recency,
            "frequency": frequency,
            "monetary": monetary,
            "loyalty_score": loyalty_score,
        }
    }


def predict_batch(rfm_df: pd.DataFrame) -> List[Dict]:
    """Segment all customers."""
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
