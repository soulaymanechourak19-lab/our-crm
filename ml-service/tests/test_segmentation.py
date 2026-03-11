"""Tests for Customer Segmentation Model."""
import pytest
import pandas as pd
from models import segmentation
from utils.preprocessing import generate_synthetic_customers, generate_synthetic_interactions
from utils.rfm import compute_rfm


@pytest.fixture
def rfm_data():
    customers = generate_synthetic_customers(200)
    interactions = generate_synthetic_interactions(customers)
    return compute_rfm(customers, interactions)


def test_train_returns_metrics(rfm_data):
    result = segmentation.train(rfm_data)
    assert "silhouette_score" in result
    assert "n_clusters" in result
    assert "distribution" in result


def test_silhouette_threshold(rfm_data):
    result = segmentation.train(rfm_data)
    assert result["silhouette_score"] >= 0.30, f"Silhouette {result['silhouette_score']} below 0.30"


def test_predict_returns_segment(rfm_data):
    segmentation.train(rfm_data)
    result = segmentation.predict(recency=10, frequency=5, monetary=50.0, loyalty_score=80)
    assert "cluster_id" in result
    assert "segment" in result
    assert isinstance(result["segment"], str)


def test_predict_batch(rfm_data):
    segmentation.train(rfm_data)
    batch = rfm_data.head(5)
    results = segmentation.predict_batch(batch)
    assert len(results) == 5
    for r in results:
        assert "customer_id" in r
        assert "segment" in r
