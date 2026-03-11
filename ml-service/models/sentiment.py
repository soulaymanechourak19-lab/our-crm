"""
Sentiment Analysis using BERT multilingual.
Uses nlptown/bert-base-multilingual-uncased-sentiment for 1-5 star classification.
"""
import os
import numpy as np
from typing import Dict, Any, Optional, List
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification

MODEL_NAME = "nlptown/bert-base-multilingual-uncased-sentiment"

_pipeline = None


def _get_pipeline():
    """Lazy-load the sentiment pipeline."""
    global _pipeline
    if _pipeline is None:
        _pipeline = pipeline(
            "sentiment-analysis",
            model=MODEL_NAME,
            tokenizer=MODEL_NAME,
            truncation=True,
            max_length=512,
        )
    return _pipeline


def _map_stars_to_sentiment(label: str, score: float) -> Dict[str, Any]:
    """Map BERT 1-5 star output to negative/neutral/positive."""
    # Label format: "1 star", "2 stars", ..., "5 stars"
    stars = int(label.split()[0])

    if stars <= 2:
        sentiment = "negative"
    elif stars == 3:
        sentiment = "neutral"
    else:
        sentiment = "positive"

    return {
        "sentiment": sentiment,
        "stars": stars,
        "confidence": round(float(score), 4),
    }


def analyze(text: str) -> Dict[str, Any]:
    """
    Analyze sentiment of a single text.

    Args:
        text: Input text (supports multiple languages)

    Returns:
        Dictionary with sentiment, stars, and confidence
    """
    if not text or not text.strip():
        return {"sentiment": "neutral", "stars": 3, "confidence": 0.0, "text": ""}

    pipe = _get_pipeline()
    result = pipe(text[:512])[0]

    analysis = _map_stars_to_sentiment(result['label'], result['score'])
    analysis['text'] = text[:200]  # Truncate for response
    return analysis


def analyze_batch(texts: List[str]) -> List[Dict[str, Any]]:
    """
    Analyze sentiment of multiple texts.

    Args:
        texts: List of input texts

    Returns:
        List of sentiment analysis results
    """
    if not texts:
        return []

    pipe = _get_pipeline()
    truncated = [t[:512] if t else "" for t in texts]
    results = pipe(truncated)

    analyses = []
    for text, result in zip(texts, results):
        if not text:
            analyses.append({"sentiment": "neutral", "stars": 3, "confidence": 0.0, "text": ""})
            continue
        analysis = _map_stars_to_sentiment(result['label'], result['score'])
        analysis['text'] = text[:200]
        analyses.append(analysis)

    return analyses


def get_metrics(texts: List[str], true_sentiments: List[str]) -> Dict[str, Any]:
    """
    Calculate F1-macro for sentiment analysis evaluation.

    Args:
        texts: Input texts
        true_sentiments: True sentiment labels (negative/neutral/positive)

    Returns:
        Evaluation metrics
    """
    from sklearn.metrics import f1_score, classification_report

    predictions = analyze_batch(texts)
    pred_labels = [p['sentiment'] for p in predictions]

    labels = ['negative', 'neutral', 'positive']
    f1_macro = f1_score(true_sentiments, pred_labels, labels=labels, average='macro', zero_division=0)
    report = classification_report(true_sentiments, pred_labels, labels=labels, output_dict=True, zero_division=0)

    return {
        "f1_macro": round(f1_macro, 4),
        "report": report,
        "n_samples": len(texts),
    }
