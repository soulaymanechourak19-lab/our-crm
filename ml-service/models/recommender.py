"""
Product Recommendation using Neural Collaborative Filtering (PyTorch).
Embedding-based model for users and items trained on purchase history.
"""
import os
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from typing import Dict, Any, Optional, List

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "saved_models")
MODEL_PATH = os.path.join(MODEL_DIR, "recommender_model.pt")
MAPPINGS_PATH = os.path.join(MODEL_DIR, "recommender_mappings.pt")

EMBEDDING_DIM = 32


class NCFModel(nn.Module):
    """Neural Collaborative Filtering model."""

    def __init__(self, n_users: int, n_items: int, embedding_dim: int = EMBEDDING_DIM):
        super().__init__()
        self.user_embedding = nn.Embedding(n_users, embedding_dim)
        self.item_embedding = nn.Embedding(n_items, embedding_dim)

        self.fc = nn.Sequential(
            nn.Linear(embedding_dim * 2, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(32, 1),
        )

        self._init_weights()

    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.xavier_uniform_(m.weight)
                if m.bias is not None:
                    nn.init.zeros_(m.bias)

    def forward(self, user_ids, item_ids):
        user_emb = self.user_embedding(user_ids)
        item_emb = self.item_embedding(item_ids)
        x = torch.cat([user_emb, item_emb], dim=1)
        return self.fc(x).squeeze()


_model: Optional[NCFModel] = None
_user_map: dict = {}
_item_map: dict = {}
_reverse_item_map: dict = {}
_n_users: int = 0
_n_items: int = 0


def train(purchases_df: pd.DataFrame, epochs: int = 20, lr: float = 0.001) -> Dict[str, Any]:
    """
    Train the recommendation model on purchase data.

    Args:
        purchases_df: DataFrame with [customer_id, product_id, rating]
        epochs: Training epochs
        lr: Learning rate

    Returns:
        Training metrics
    """
    global _model, _user_map, _item_map, _reverse_item_map, _n_users, _n_items
    os.makedirs(MODEL_DIR, exist_ok=True)

    df = purchases_df.copy()

    # Create ID mappings
    unique_users = sorted(df['customer_id'].unique())
    unique_items = sorted(df['product_id'].unique())
    _user_map = {uid: idx for idx, uid in enumerate(unique_users)}
    _item_map = {iid: idx for idx, iid in enumerate(unique_items)}
    _reverse_item_map = {idx: iid for iid, idx in _item_map.items()}
    _n_users = len(unique_users)
    _n_items = len(unique_items)

    df['user_idx'] = df['customer_id'].map(_user_map)
    df['item_idx'] = df['product_id'].map(_item_map)

    # Normalize ratings to 0-1
    df['rating_norm'] = df['rating'] / 5.0

    # Create tensors
    user_tensor = torch.LongTensor(df['user_idx'].values)
    item_tensor = torch.LongTensor(df['item_idx'].values)
    rating_tensor = torch.FloatTensor(df['rating_norm'].values)

    dataset = TensorDataset(user_tensor, item_tensor, rating_tensor)
    dataloader = DataLoader(dataset, batch_size=64, shuffle=True)

    _model = NCFModel(_n_users, _n_items, EMBEDDING_DIM)
    optimizer = optim.Adam(_model.parameters(), lr=lr)
    criterion = nn.MSELoss()

    losses = []
    _model.train()
    for epoch in range(epochs):
        epoch_loss = 0
        for batch_users, batch_items, batch_ratings in dataloader:
            optimizer.zero_grad()
            predictions = _model(batch_users, batch_items)
            loss = criterion(predictions, batch_ratings)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
        losses.append(epoch_loss / len(dataloader))

    # Calculate Precision@5
    _model.eval()
    precision_scores = []
    with torch.no_grad():
        for user_idx in range(_n_users):
            actual_items = set(df[df['user_idx'] == user_idx]['item_idx'].values)
            if len(actual_items) < 2:
                continue

            scores = []
            for item_idx in range(_n_items):
                u = torch.LongTensor([user_idx])
                i = torch.LongTensor([item_idx])
                score = _model(u, i).item()
                scores.append((item_idx, score))

            scores.sort(key=lambda x: x[1], reverse=True)
            top5 = [s[0] for s in scores[:5]]
            hits = len(set(top5) & actual_items)
            precision_scores.append(hits / 5)

    precision_at_5 = np.mean(precision_scores) if precision_scores else 0.0

    # Save model and mappings
    torch.save(_model.state_dict(), MODEL_PATH)
    torch.save({
        'user_map': _user_map,
        'item_map': _item_map,
        'reverse_item_map': _reverse_item_map,
        'n_users': _n_users,
        'n_items': _n_items,
    }, MAPPINGS_PATH)

    return {
        "final_loss": round(losses[-1], 4) if losses else 0,
        "precision_at_5": round(precision_at_5, 4),
        "n_users": _n_users,
        "n_items": _n_items,
        "n_interactions": len(df),
        "epochs": epochs,
    }


def load_model() -> bool:
    """Load the saved model."""
    global _model, _user_map, _item_map, _reverse_item_map, _n_users, _n_items
    if os.path.exists(MODEL_PATH) and os.path.exists(MAPPINGS_PATH):
        mappings = torch.load(MAPPINGS_PATH, weights_only=False)
        _user_map = mappings['user_map']
        _item_map = mappings['item_map']
        _reverse_item_map = mappings['reverse_item_map']
        _n_users = mappings['n_users']
        _n_items = mappings['n_items']

        _model = NCFModel(_n_users, _n_items, EMBEDDING_DIM)
        _model.load_state_dict(torch.load(MODEL_PATH, weights_only=True))
        _model.eval()
        return True
    return False


def recommend(customer_id: int, top_k: int = 5) -> Dict[str, Any]:
    """
    Get product recommendations for a customer.

    Args:
        customer_id: The real customer ID
        top_k: Number of recommendations

    Returns:
        Dictionary with recommended product IDs and scores
    """
    global _model, _user_map, _item_map, _reverse_item_map, _n_items
    if _model is None:
        if not load_model():
            return {"error": "Model not trained yet.", "recommendations": []}

    if customer_id not in _user_map:
        # Return popular items for unknown users
        return {
            "customer_id": customer_id,
            "recommendations": [
                {"product_id": _reverse_item_map.get(i, i), "score": 0.5}
                for i in range(min(top_k, _n_items))
            ],
            "note": "Cold start - returning popular items"
        }

    user_idx = _user_map[customer_id]

    _model.eval()
    scores = []
    with torch.no_grad():
        for item_idx in range(_n_items):
            u = torch.LongTensor([user_idx])
            i = torch.LongTensor([item_idx])
            score = _model(u, i).item()
            scores.append((item_idx, score))

    scores.sort(key=lambda x: x[1], reverse=True)
    top_items = scores[:top_k]

    recommendations = [
        {
            "product_id": int(_reverse_item_map.get(idx, idx)),
            "score": round(float(score), 4),
        }
        for idx, score in top_items
    ]

    return {
        "customer_id": customer_id,
        "recommendations": recommendations,
    }
