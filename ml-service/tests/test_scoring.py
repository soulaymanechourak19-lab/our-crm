"""Tests for Lead Scoring Model."""
import pytest
import pandas as pd
from models import scoring
from utils.preprocessing import generate_synthetic_leads
from utils.rfm import compute_lead_features


@pytest.fixture
def lead_data():
    leads = generate_synthetic_leads(150)
    return compute_lead_features(leads)


def test_train_returns_metrics(lead_data):
    result = scoring.train(lead_data)
    assert "r2" in result
    assert "mae" in result
    assert result["samples_total"] == 150


def test_r2_threshold(lead_data):
    result = scoring.train(lead_data)
    assert result["r2"] > 0.50, f"R² {result['r2']} below 0.50"


def test_mae_threshold(lead_data):
    result = scoring.train(lead_data)
    assert result["mae"] < 20, f"MAE {result['mae']} above 20"


def test_predict_returns_score(lead_data):
    scoring.train(lead_data)
    result = scoring.predict(time_since_creation=10, status_encoded=2, has_phone=1, has_email=1, company_name_length=15)
    assert "score" in result
    assert "priority" in result
    assert 0 <= result["score"] <= 100
    assert result["priority"] in ["cold", "warm", "hot"]


def test_predict_batch(lead_data):
    scoring.train(lead_data)
    batch = lead_data.head(5)
    results = scoring.predict_batch(batch)
    assert len(results) == 5
    for r in results:
        assert "lead_id" in r
        assert "score" in r
