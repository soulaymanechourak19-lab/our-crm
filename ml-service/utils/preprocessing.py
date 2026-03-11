"""
Data preprocessing utilities for the ML microservice.
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from typing import Tuple, Optional
import joblib
import os

SCALER_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "saved_models")


def scale_features(df: pd.DataFrame, columns: list, scaler_name: str = "default",
                   fit: bool = True) -> Tuple[pd.DataFrame, StandardScaler]:
    """Scale numeric features using StandardScaler."""
    scaler_path = os.path.join(SCALER_DIR, f"scaler_{scaler_name}.pkl")
    os.makedirs(SCALER_DIR, exist_ok=True)

    if fit:
        scaler = StandardScaler()
        df[columns] = scaler.fit_transform(df[columns])
        joblib.dump(scaler, scaler_path)
    else:
        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
            df[columns] = scaler.transform(df[columns])
        else:
            scaler = StandardScaler()
            df[columns] = scaler.fit_transform(df[columns])
            joblib.dump(scaler, scaler_path)

    return df, scaler


def encode_categorical(series: pd.Series, encoder_name: str = "default",
                       fit: bool = True) -> Tuple[pd.Series, LabelEncoder]:
    """Encode categorical features."""
    encoder_path = os.path.join(SCALER_DIR, f"encoder_{encoder_name}.pkl")
    os.makedirs(SCALER_DIR, exist_ok=True)

    if fit:
        encoder = LabelEncoder()
        encoded = encoder.fit_transform(series.fillna("unknown"))
        joblib.dump(encoder, encoder_path)
    else:
        if os.path.exists(encoder_path):
            encoder = joblib.load(encoder_path)
            encoded = encoder.transform(series.fillna("unknown"))
        else:
            encoder = LabelEncoder()
            encoded = encoder.fit_transform(series.fillna("unknown"))
            joblib.dump(encoder, encoder_path)

    return pd.Series(encoded, index=series.index), encoder


def generate_synthetic_customers(n: int = 200) -> pd.DataFrame:
    """Generate synthetic customer data for training when real data is sparse."""
    np.random.seed(42)
    return pd.DataFrame({
        'id': range(1, n + 1),
        'name': [f'Customer_{i}' for i in range(1, n + 1)],
        'email': [f'customer{i}@example.com' for i in range(1, n + 1)],
        'phone': [f'+1-555-{str(i).zfill(4)}' if np.random.rand() > 0.2 else None for i in range(1, n + 1)],
        'loyalty_score': np.random.randint(0, 100, n),
        'created_at': pd.date_range(end='2026-03-09', periods=n, freq='D'),
    })


def generate_synthetic_interactions(customers_df: pd.DataFrame, avg_per_customer: int = 5) -> pd.DataFrame:
    """Generate synthetic interaction data for training."""
    np.random.seed(42)
    rows = []
    idx = 1
    for _, cust in customers_df.iterrows():
        n_interactions = max(0, int(np.random.normal(avg_per_customer, 3)))
        for _ in range(n_interactions):
            rows.append({
                'id': idx,
                'customer_id': cust['id'],
                'type': np.random.choice(['call', 'email', 'meeting']),
                'notes': f'Interaction note {idx}',
                'date': pd.Timestamp('2025-01-01') + pd.Timedelta(days=np.random.randint(0, 400)),
            })
            idx += 1
    return pd.DataFrame(rows)


def generate_synthetic_leads(n: int = 150) -> pd.DataFrame:
    """Generate synthetic lead data for training."""
    np.random.seed(42)
    statuses = ['new', 'contacted', 'qualified', 'converted']
    return pd.DataFrame({
        'id': range(1, n + 1),
        'company_name': [f'Company_{i}' for i in range(1, n + 1)],
        'contact_name': [f'Contact_{i}' for i in range(1, n + 1)],
        'email': [f'lead{i}@example.com' for i in range(1, n + 1)],
        'phone': [f'+1-555-{str(i).zfill(4)}' if np.random.rand() > 0.3 else None for i in range(1, n + 1)],
        'status': np.random.choice(statuses, n, p=[0.3, 0.3, 0.25, 0.15]),
        'created_by': np.random.randint(1, 4, n),
        'created_at': pd.date_range(end='2026-03-09', periods=n, freq='D'),
    })


def generate_synthetic_products(n: int = 30) -> pd.DataFrame:
    """Generate synthetic product data."""
    np.random.seed(42)
    categories = ['Electronics', 'Software', 'Services', 'Consulting', 'Hardware']
    return pd.DataFrame({
        'id': range(1, n + 1),
        'name': [f'Product_{i}' for i in range(1, n + 1)],
        'description': [f'Description for product {i}' for i in range(1, n + 1)],
        'price': np.round(np.random.uniform(10, 500, n), 2),
        'stock': np.random.randint(0, 200, n),
        'category': np.random.choice(categories, n),
    })


def generate_synthetic_purchases(customers_df: pd.DataFrame, products_df: pd.DataFrame,
                                 avg_per_customer: int = 3) -> pd.DataFrame:
    """Generate synthetic purchase data for recommendation engine."""
    np.random.seed(42)
    rows = []
    for _, cust in customers_df.iterrows():
        n_purchases = max(1, int(np.random.normal(avg_per_customer, 2)))
        bought_products = np.random.choice(products_df['id'].values, min(n_purchases, len(products_df)), replace=False)
        for pid in bought_products:
            rows.append({
                'customer_id': cust['id'],
                'product_id': pid,
                'rating': np.random.randint(1, 6),
                'quantity': np.random.randint(1, 5),
            })
    return pd.DataFrame(rows)
