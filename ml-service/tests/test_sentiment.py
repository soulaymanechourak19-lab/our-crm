"""Tests for Sentiment Analysis Model."""
import pytest
from models import sentiment


def test_analyze_positive():
    result = sentiment.analyze("This product is amazing! I love it so much!")
    assert result["sentiment"] in ["positive", "neutral"]
    assert "stars" in result
    assert "confidence" in result


def test_analyze_negative():
    result = sentiment.analyze("Terrible experience. The worst product ever.")
    assert result["sentiment"] in ["negative", "neutral"]
    assert result["stars"] <= 3


def test_analyze_empty():
    result = sentiment.analyze("")
    assert result["sentiment"] == "neutral"


def test_analyze_batch():
    texts = [
        "Great service, highly recommend!",
        "Not good at all, very disappointed.",
        "It was okay, nothing special.",
    ]
    results = sentiment.analyze_batch(texts)
    assert len(results) == 3
    for r in results:
        assert "sentiment" in r
        assert "stars" in r


def test_multilingual():
    result = sentiment.analyze("C'est un excellent produit, je suis très satisfait!")
    assert "sentiment" in result
    assert result["stars"] >= 1
