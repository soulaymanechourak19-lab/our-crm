"""Tests for Product Recommender Model."""
import pytest
import pandas as pd
from models import recommender
from utils.preprocessing import (
    generate_synthetic_customers, generate_synthetic_products,
    generate_synthetic_purchases
)


@pytest.fixture
def purchase_data():
    customers = generate_synthetic_customers(50)
    products = generate_synthetic_products(20)
    return generate_synthetic_purchases(customers, products)


def test_train_returns_metrics(purchase_data):
    result = recommender.train(purchase_data, epochs=5)
    assert "final_loss" in result
    assert "precision_at_5" in result
    assert "n_users" in result
    assert "n_items" in result


def test_recommend_returns_products(purchase_data):
    recommender.train(purchase_data, epochs=5)
    result = recommender.recommend(customer_id=1, top_k=5)
    assert "recommendations" in result
    assert len(result["recommendations"]) <= 5
    for rec in result["recommendations"]:
        assert "product_id" in rec
        assert "score" in rec


def test_recommend_unknown_customer(purchase_data):
    recommender.train(purchase_data, epochs=5)
    result = recommender.recommend(customer_id=99999, top_k=3)
    assert "recommendations" in result
    assert "note" in result  # cold start note
