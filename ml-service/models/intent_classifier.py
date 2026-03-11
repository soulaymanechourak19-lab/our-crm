"""
Intent Classifier — TF-IDF + LogisticRegression
================================================
Classifies user messages into CRM intents with confidence scoring.
Supports model versioning and entity extraction.
"""
import os
import re
import json
import shutil
import joblib
import numpy as np
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import Pipeline
from typing import Dict, Any, Optional, List

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "saved_models")
MODEL_PATH = os.path.join(MODEL_DIR, "intent_classifier.pkl")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
TRAINING_DATA_PATH = os.path.join(DATA_DIR, "chatbot_training_data.json")
MAX_VERSIONS = 3

_pipeline: Optional[Pipeline] = None
_intent_labels: Optional[List[str]] = None


def load_model() -> bool:
    """Load the saved model from disk."""
    global _pipeline, _intent_labels
    if os.path.exists(MODEL_PATH):
        try:
            data = joblib.load(MODEL_PATH)
            _pipeline = data['pipeline']
            _intent_labels = data['intent_labels']
            print(f"✅ Intent classifier loaded ({len(_intent_labels)} intents)")
            return True
        except Exception as e:
            print(f"⚠️ Failed to load intent classifier: {e}")
    return False


def train(training_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Train the intent classifier.

    Args:
        training_data: List of {"intent": str, "examples": List[str]}

    Returns:
        Dictionary with training metrics
    """
    global _pipeline, _intent_labels
    os.makedirs(MODEL_DIR, exist_ok=True)

    # Prepare training data
    texts = []
    labels = []
    for item in training_data:
        intent = item['intent']
        for example in item['examples']:
            texts.append(example.lower().strip())
            labels.append(intent)

    if len(texts) < 10:
        return {"error": "Need at least 10 training examples", "status": "failed"}

    _intent_labels = sorted(list(set(labels)))

    # Build pipeline: TF-IDF → LogisticRegression
    _pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            analyzer='char_wb',       # Character n-grams (handles typos better)
            ngram_range=(2, 5),       # 2-5 character grams
            max_features=10000,
            sublinear_tf=True,
            min_df=1,
        )),
        ('clf', LogisticRegression(
            max_iter=1000,
            C=5.0,
            class_weight='balanced',  # Handle imbalanced intents
            solver='lbfgs',
            multi_class='multinomial',
        )),
    ])

    _pipeline.fit(texts, labels)

    # Cross-validation score
    cv_scores = cross_val_score(_pipeline, texts, labels, cv=min(5, len(_intent_labels)), scoring='accuracy')

    # Version the model (keep last N versions)
    _version_model()

    # Save the new model
    joblib.dump({
        'pipeline': _pipeline,
        'intent_labels': _intent_labels,
        'trained_at': datetime.now().isoformat(),
        'num_examples': len(texts),
        'num_intents': len(_intent_labels),
    }, MODEL_PATH)

    return {
        "status": "success",
        "num_intents": len(_intent_labels),
        "num_examples": len(texts),
        "intents": _intent_labels,
        "cv_accuracy": round(float(np.mean(cv_scores)), 4),
        "cv_std": round(float(np.std(cv_scores)), 4),
        "trained_at": datetime.now().isoformat(),
    }


def predict(text: str) -> Dict[str, Any]:
    """
    Classify a message into an intent.

    Returns:
        {intent, confidence, all_scores, entities}
    """
    global _pipeline, _intent_labels
    if _pipeline is None:
        if not load_model():
            return {
                "intent": "unknown",
                "confidence": 0.0,
                "error": "Model not trained yet. Run /train/chatbot first."
            }

    clean_text = text.lower().strip()

    # Get prediction probabilities
    probs = _pipeline.predict_proba([clean_text])[0]
    top_idx = np.argmax(probs)
    top_intent = _pipeline.classes_[top_idx]
    top_confidence = float(probs[top_idx])

    # Get top 3 predictions
    sorted_indices = np.argsort(probs)[::-1][:3]
    top_predictions = [
        {"intent": _pipeline.classes_[i], "confidence": round(float(probs[i]), 4)}
        for i in sorted_indices
    ]

    # Extract entities from the text
    entities = _extract_entities(clean_text, top_intent)

    return {
        "intent": top_intent,
        "confidence": round(top_confidence, 4),
        "top_predictions": top_predictions,
        "entities": entities,
    }


def _extract_entities(text: str, intent: str) -> Dict[str, Any]:
    """
    Extract entities (names, numbers) from the text based on the predicted intent.
    """
    entities = {}

    # Extract numbers (for "top 5", "top 10", etc.)
    num_match = re.search(r'\b(\d+)\b', text)
    if num_match:
        entities['number'] = int(num_match.group(1))

    # Extract entity names for lookup intents
    if intent in ('find_customer', 'find_lead', 'find_product', 'list_category_products'):
        name = _extract_name(text, intent)
        if name:
            entities['name'] = name

    return entities


def _extract_name(text: str, intent: str) -> Optional[str]:
    """Extract the entity name from the text using pattern matching."""

    # Patterns that indicate "what comes after is the name"
    patterns = [
        r'(?:named|called|name|nom|nommé|appelé)\s+(.+)',
        r'(?:customer|client|lead|prospect|product|produit)\s+(.+)',
        r'(?:about|for|on|info|details?|détails?)\s+(?:customer|client|lead|product|produit)?\s*(.+)',
        r'(?:find|search|look up|cherche|trouve)\s+(?:customer|client|lead|product|produit)?\s*(.+)',
        r'(?:email|phone|tier|points|loyalty|description|price|stock)\s+(?:of|for|about|de|du)?\s*(?:customer|client|lead|product|produit)?\s*(.+)',
        r'(?:do (?:i|we) have)\s+(?:a|any)?\s*(?:customer|client|lead|product|produit)?\s*(?:named|called)?\s*(.+)',
        r'(?:who is|tell me about|show me|show)\s+(?:customer|client|lead|product|produit)?\s*(.+)',
        r'(?:is)\s+(.+?)\s+(?:in our|a customer|a client|a lead|a product)',
        r'(?:list|show)\s+(.+?)\s+(?:products|produits|items)',
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            # Clean up stop words
            stop = {'the', 'a', 'an', 'my', 'our', 'any', 'some', 'please', 'products', 'produits'}
            name = ' '.join(w for w in name.split() if w.lower() not in stop)
            if len(name) >= 1:
                return name

    # Last resort: strip all known keywords and return what's left
    stop_words = {
        'do', 'i', 'we', 'have', 'any', 'customer', 'client', 'lead', 'prospect',
        'product', 'produit', 'named', 'called', 'name', 'find', 'search', 'show',
        'tell', 'me', 'about', 'the', 'a', 'an', 'is', 'there', 'what', 'who',
        'email', 'phone', 'tier', 'points', 'loyalty', 'of', 'for', 'on',
        'description', 'price', 'stock', 'details', 'info', 'look', 'up',
        'list', 'all', 'get', 'give', 'our', 'my', 'how', 'many', 'much',
    }
    words = text.split()
    remaining = [w for w in words if w.lower() not in stop_words and len(w) >= 2]
    if remaining:
        return ' '.join(remaining)

    return None


def _version_model():
    """Keep the last N model versions for rollback."""
    if os.path.exists(MODEL_PATH):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(MODEL_DIR, f"intent_classifier_{timestamp}.pkl")
        shutil.copy2(MODEL_PATH, backup_path)

        # Clean up old versions
        versions = sorted([
            f for f in os.listdir(MODEL_DIR)
            if f.startswith("intent_classifier_") and f.endswith(".pkl")
        ])
        while len(versions) > MAX_VERSIONS:
            old = versions.pop(0)
            os.remove(os.path.join(MODEL_DIR, old))


def get_model_info() -> Dict[str, Any]:
    """Get info about the current model."""
    if not os.path.exists(MODEL_PATH):
        return {"status": "not_trained", "message": "No model trained yet."}

    try:
        data = joblib.load(MODEL_PATH)
        versions = sorted([
            f for f in os.listdir(MODEL_DIR)
            if f.startswith("intent_classifier_") and f.endswith(".pkl")
        ])
        return {
            "status": "trained",
            "trained_at": data.get('trained_at'),
            "num_intents": data.get('num_intents'),
            "num_examples": data.get('num_examples'),
            "intents": data.get('intent_labels', []),
            "versions_available": len(versions),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def rollback() -> Dict[str, Any]:
    """Rollback to the previous model version."""
    versions = sorted([
        f for f in os.listdir(MODEL_DIR)
        if f.startswith("intent_classifier_") and f.endswith(".pkl")
    ])
    if not versions:
        return {"status": "failed", "message": "No previous versions available."}

    latest_backup = versions[-1]
    backup_path = os.path.join(MODEL_DIR, latest_backup)
    shutil.copy2(backup_path, MODEL_PATH)
    os.remove(backup_path)

    # Reload the model
    load_model()

    return {"status": "success", "message": f"Rolled back to {latest_backup}", "loaded": True}
