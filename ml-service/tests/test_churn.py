"""Tests for Churn Prediction Model."""
import pytest
import pandas as pd
import numpy as np
from models import churn
from utils.preprocessing import generate_synthetic_customers, generate_synthetic_interactions
from utils.rfm import compute_rfm


@pytest.fixture
def rfm_data():
    customers = generate_synthetic_customers(200)
    interactions = generate_synthetic_interactions(customers)
    return compute_rfm(customers, interactions)


def test_train_returns_metrics(rfm_data):
    result = churn.train(rfm_data)
    assert "roc_auc" in result
    assert "precision" in result
    assert "recall" in result
    assert "f1" in result
    assert result["samples_total"] == 200


def test_roc_auc_threshold(rfm_data):
    result = churn.train(rfm_data)
    assert result["roc_auc"] >= 0.70, f"ROC-AUC {result['roc_auc']} below 0.70"


def test_predict_returns_probability(rfm_data):
    churn.train(rfm_data)
    result = churn.predict(recency=10, frequency=5, monetary=50.0, loyalty_score=80)
    assert "probability" in result
    assert "risk_level" in result
    assert 0 <= result["probability"] <= 1
    assert result["risk_level"] in ["low", "medium", "high"]


def test_predict_high_risk():
    result = churn.predict(recency=200, frequency=0, monetary=0.0, loyalty_score=0)
    assert result["risk_level"] in ["medium", "high"]


def test_predict_batch(rfm_data):
    churn.train(rfm_data)
    batch = rfm_data.head(5)
    results = churn.predict_batch(batch)
    assert len(results) == 5
    for r in results:
        assert "customer_id" in r
        assert "probability" in r
