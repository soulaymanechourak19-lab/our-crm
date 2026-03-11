"""
RFM (Recency, Frequency, Monetary) calculation utilities.
Computes RFM metrics from raw transaction/interaction data.
"""
import pandas as pd
import numpy as np
from datetime import datetime


def compute_rfm(customers_df: pd.DataFrame, interactions_df: pd.DataFrame,
                reference_date: datetime = None) -> pd.DataFrame:
    """
    Compute RFM features for each customer.

    Args:
        customers_df: DataFrame with columns [id, name, email, loyalty_score, created_at]
        interactions_df: DataFrame with columns [id, customer_id, type, date]
        reference_date: Date to compute recency against (defaults to now)

    Returns:
        DataFrame with columns [customer_id, recency, frequency, monetary, loyalty_score]
    """
    if reference_date is None:
        reference_date = datetime.now()

    if interactions_df.empty:
        rfm = customers_df[['id']].copy()
        rfm.rename(columns={'id': 'customer_id'}, inplace=True)
        rfm['recency'] = 999
        rfm['frequency'] = 0
        rfm['monetary'] = 0.0
        rfm['loyalty_score'] = customers_df['loyalty_score'].values if 'loyalty_score' in customers_df.columns else 0
        return rfm

    interactions_df['date'] = pd.to_datetime(interactions_df['date'])

    # Recency: days since last interaction
    recency = interactions_df.groupby('customer_id')['date'].max().reset_index()
    recency['recency'] = (pd.Timestamp(reference_date) - recency['date']).dt.days
    recency.drop(columns=['date'], inplace=True)

    # Frequency: total number of interactions
    frequency = interactions_df.groupby('customer_id').size().reset_index(name='frequency')

    # Monetary: use loyalty_score as a proxy (no transactions table)
    monetary = customers_df[['id', 'loyalty_score']].copy()
    monetary.rename(columns={'id': 'customer_id', 'loyalty_score': 'monetary'}, inplace=True)
    monetary['monetary'] = monetary['monetary'].astype(float)

    # Merge
    rfm = customers_df[['id']].copy()
    rfm.rename(columns={'id': 'customer_id'}, inplace=True)
    rfm = rfm.merge(recency, on='customer_id', how='left')
    rfm = rfm.merge(frequency, on='customer_id', how='left')
    rfm = rfm.merge(monetary, on='customer_id', how='left')

    rfm['recency'] = rfm['recency'].fillna(999).astype(int)
    rfm['frequency'] = rfm['frequency'].fillna(0).astype(int)
    rfm['monetary'] = rfm['monetary'].fillna(0.0)
    rfm['loyalty_score'] = customers_df['loyalty_score'].values if 'loyalty_score' in customers_df.columns else 0

    return rfm


def compute_lead_features(leads_df: pd.DataFrame, interactions_df: pd.DataFrame = None,
                          reference_date: datetime = None) -> pd.DataFrame:
    """
    Compute features for lead scoring.

    Args:
        leads_df: DataFrame with columns [id, status, created_at, ...]
        interactions_df: optional interactions linked to leads
        reference_date: Date to compute time features against

    Returns:
        DataFrame with lead features
    """
    if reference_date is None:
        reference_date = datetime.now()

    features = leads_df[['id', 'status']].copy()
    features.rename(columns={'id': 'lead_id'}, inplace=True)

    leads_df['created_at'] = pd.to_datetime(leads_df['created_at'])
    features['time_since_creation'] = (pd.Timestamp(reference_date) - leads_df['created_at']).dt.days

    # Encode status
    status_map = {'new': 0, 'contacted': 1, 'qualified': 2, 'converted': 3}
    features['status_encoded'] = features['status'].map(status_map).fillna(0).astype(int)

    # Has phone / email
    features['has_phone'] = leads_df['phone'].notna().astype(int)
    features['has_email'] = leads_df['email'].notna().astype(int)

    # Company name length as a proxy for data quality
    features['company_name_length'] = leads_df['company_name'].str.len().fillna(0).astype(int)

    return features
