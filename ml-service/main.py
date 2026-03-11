"""
OurCRM ML Microservice — FastAPI Application
=============================================
Provides AI/ML endpoints for:
  - Chatbot intent classification
  - Churn prediction (Random Forest)
  - Lead/Customer scoring (Gradient Boosting)
  - Customer segmentation (K-Means)
"""
import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any

# Import existing module-level intent classifier
from models import intent_classifier

# Import new ML model classes
from models.churn_predictor import ChurnPredictor
from models.lead_scorer import LeadScorer
from models.customer_segmentation import CustomerSegmentation
from models import recommender
from models import sentiment

app = FastAPI(
    title="CRM AI Service",
    description="Advanced Machine Learning microservice for the CRM.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML Model instances
churn_predictor = ChurnPredictor()
lead_scorer = LeadScorer()
customer_segmentation = CustomerSegmentation()

LARAVEL_API = "http://backend:80/api"


# ─── Startup ─────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    """Load pre-trained models at startup."""
    intent_classifier.load_model()
    recommender.load_model()
    # sentiment model (BERT) is lazy-loaded on first request
    print("✅ ML Service started with Advanced Models.")

# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "ml-service-v2",
        "models_ready": {
            "intent": os.path.exists(intent_classifier.MODEL_PATH),
            "churn": os.path.exists(churn_predictor.model_path),
            "scoring": os.path.exists(lead_scorer.model_path),
            "segmentation": os.path.exists(customer_segmentation.model_path),
            "recommender": os.path.exists(recommender.MODEL_PATH),
            "sentiment": "pre-trained (BERT)"
        }
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  CHATBOT INTENT CLASSIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

class ChatMessage(BaseModel):
    message: str

class ChatbotTrainRequest(BaseModel):
    training_data: list

@app.post("/train/intent")
async def train_intent(data: list):
    """Train the chatbot intent classifier with labeled examples."""
    try:
        metrics = intent_classifier.train(data)
        return {"status": "success", "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train/chatbot")
async def train_chatbot(payload: ChatbotTrainRequest):
    """Train the chatbot intent classifier — called by Laravel ChatbotTrainingController."""
    try:
        training_data = payload.training_data
        if not training_data:
            raise HTTPException(status_code=400, detail="No training data provided")
        metrics = intent_classifier.train(training_data)
        return metrics
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chatbot/model-info")
async def chatbot_model_info():
    """Return current chatbot model info — called by Laravel ChatbotTrainingController."""
    return intent_classifier.get_model_info()

@app.post("/chatbot/rollback")
async def chatbot_rollback():
    """Rollback chatbot model to previous version — called by Laravel ChatbotTrainingController."""
    return intent_classifier.rollback()

@app.post("/predict/intent")
async def predict_intent_route(payload: ChatMessage):
    """Classify a user message into a CRM intent."""
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Empty message")
    result = intent_classifier.predict(payload.message)
    return result


# ═══════════════════════════════════════════════════════════════════════════════
#  CHURN PREDICTION (Random Forest)
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/train/churn")
async def train_churn():
    """Fetch engineered features from Laravel and train the Churn model."""
    try:
        res = requests.get(f"{LARAVEL_API}/ml/export-features?limit=5000", timeout=30)
        data = res.json().get("data", [])
        if not data:
            return {"error": "No data found from Laravel API"}
        metrics = churn_predictor.train_model(data)
        return {"status": "success", "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/churn")
async def predict_churn(features: Dict[str, Any]):
    """Predict churn risk for a customer profile."""
    try:
        return churn_predictor.predict(features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
#  LEAD / CUSTOMER SCORING (Gradient Boosting)
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/train/scoring")
async def train_scoring():
    """Fetch data from Laravel and train the Lead Scoring model."""
    try:
        res = requests.get(f"{LARAVEL_API}/ml/export-features?limit=5000", timeout=30)
        data = res.json().get("data", [])
        if not data:
            return {"error": "No data found from Laravel API"}
        metrics = lead_scorer.train_model(data)
        return {"status": "success", "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/scoring")
async def predict_scoring(features: Dict[str, Any]):
    """Score a lead / customer on a 0-100 scale."""
    try:
        return lead_scorer.predict(features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
#  CUSTOMER SEGMENTATION (K-Means Clustering)
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/train/segmentation")
async def train_segmentation():
    """Fetch data from Laravel and train the K-Means Segmentation model."""
    try:
        res = requests.get(f"{LARAVEL_API}/ml/export-features?limit=5000", timeout=30)
        data = res.json().get("data", [])
        if not data:
            return {"error": "No data found from Laravel API"}
        metrics = customer_segmentation.train_model(data)
        return {"status": "success", "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/segmentation")
async def predict_segmentation(features: Dict[str, Any]):
    """Predict which K-Means cluster a customer belongs to."""
    try:
        return customer_segmentation.predict(features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
#  PHASE 4: DEEP LEARNING & NLP
# ═══════════════════════════════════════════════════════════════════════════════

# --- Product Recommender System (PyTorch NCF) ---
@app.post("/train/recommender")
async def train_recommender():
    """Fetch transaction data from Laravel and train the Collaborative Filtering model."""
    try:
        res = requests.get(f"{LARAVEL_API}/ml/export-transactions?limit=10000", timeout=30)
        data = res.json().get("data", [])
        if not data:
            return {"error": "No transaction data found from Laravel API"}
        
        import pandas as pd
        df = pd.DataFrame(data)
        metrics = recommender.train(df, epochs=10)
        return {"status": "success", "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RecommenderRequest(BaseModel):
    customer_id: int
    top_k: int = 5

@app.post("/predict/recommender")
async def predict_recommender(req: RecommenderRequest):
    """Get the top-K product recommendations for a customer."""
    try:
        return recommender.recommend(req.customer_id, req.top_k)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Sentiment Analysis (HuggingFace BERT) ---
class SentimentRequest(BaseModel):
    text: str

@app.post("/predict/sentiment")
async def predict_sentiment(req: SentimentRequest):
    """Analyze the sentiment of a given text (feedback, chat, etc.)."""
    try:
        return sentiment.analyze(req.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
#  TRAIN ALL MODELS (Orchestrator)
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/train/all")
async def train_all():
    """Train all ML models sequentially and return aggregated results."""
    results = {}

    # 1. Fetch shared feature data from Laravel
    feature_data = []
    try:
        res = requests.get(f"{LARAVEL_API}/ml/export-features?limit=5000", timeout=30)
        feature_data = res.json().get("data", [])
    except Exception as e:
        results["feature_fetch"] = {"status": "error", "detail": str(e)}

    # 2. Train Churn Predictor
    try:
        if feature_data:
            metrics = churn_predictor.train_model(feature_data)
            results["churn"] = {"status": "success", "metrics": metrics}
        else:
            results["churn"] = {"status": "skipped", "reason": "No feature data available"}
    except Exception as e:
        results["churn"] = {"status": "error", "detail": str(e)}

    # 3. Train Lead Scorer
    try:
        if feature_data:
            metrics = lead_scorer.train_model(feature_data)
            results["scoring"] = {"status": "success", "metrics": metrics}
        else:
            results["scoring"] = {"status": "skipped", "reason": "No feature data available"}
    except Exception as e:
        results["scoring"] = {"status": "error", "detail": str(e)}

    # 4. Train Customer Segmentation
    try:
        if feature_data:
            metrics = customer_segmentation.train_model(feature_data)
            results["segmentation"] = {"status": "success", "metrics": metrics}
        else:
            results["segmentation"] = {"status": "skipped", "reason": "No feature data available"}
    except Exception as e:
        results["segmentation"] = {"status": "error", "detail": str(e)}

    # 5. Train Recommender (uses separate transaction data)
    try:
        import pandas as pd
        res = requests.get(f"{LARAVEL_API}/ml/export-transactions?limit=10000", timeout=30)
        tx_data = res.json().get("data", [])
        if tx_data:
            df = pd.DataFrame(tx_data)
            metrics = recommender.train(df, epochs=10)
            results["recommender"] = {"status": "success", "metrics": metrics}
        else:
            results["recommender"] = {"status": "skipped", "reason": "No transaction data available"}
    except Exception as e:
        results["recommender"] = {"status": "error", "detail": str(e)}

    # Determine overall status
    statuses = [v.get("status") for v in results.values()]
    if all(s == "success" for s in statuses):
        overall = "success"
    elif any(s == "success" for s in statuses):
        overall = "partial"
    else:
        overall = "failed"

    return {"status": overall, "models": results}
