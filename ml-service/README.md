# OurCRM ML Microservice

AI/ML microservice for OurCRM providing churn prediction, lead scoring, customer segmentation, product recommendations, and sentiment analysis.

## Architecture

```
ml-service/
├── Dockerfile                  # Container definition
├── requirements.txt            # Python dependencies
├── main.py                     # FastAPI application (all endpoints)
├── models/
│   ├── churn.py               # XGBoost churn prediction
│   ├── scoring.py             # Gradient Boosting lead scoring
│   ├── segmentation.py        # K-Means customer segmentation
│   ├── recommender.py         # Neural Collaborative Filtering (PyTorch)
│   └── sentiment.py           # BERT multilingual sentiment analysis
├── utils/
│   ├── rfm.py                 # RFM feature computation
│   └── preprocessing.py       # Data preprocessing & synthetic data generation
└── tests/
    ├── test_churn.py
    ├── test_scoring.py
    ├── test_segmentation.py
    ├── test_recommender.py
    └── test_sentiment.py
```

## Quick Start

### 1. Start with Docker Compose (recommended)

From the project root:

```bash
docker-compose up -d
```

The ML service will be available at: **http://localhost:8001**

### 2. Train All Models

```bash
# Via API
curl -X POST http://localhost:8001/train/all

# Via Laravel Artisan
docker-compose exec backend php artisan ml:train
```

### 3. Export Real Data for Training

```bash
docker-compose exec backend php artisan ml:export-data
```

This exports customers, interactions, leads, and products as CSV files to `backend/storage/app/ml/`, which is shared with the ML service via Docker volume.

## API Endpoints

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check & model status |
| GET | `/docs` | Swagger documentation |

### Training
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/train/all` | Train all models |
| POST | `/train/churn` | Train churn model only |
| POST | `/train/scoring` | Train lead scoring model only |
| POST | `/train/segmentation` | Train segmentation model only |
| POST | `/train/recommender` | Train recommender model only |

### Predictions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict/churn` | Single customer churn prediction |
| POST | `/predict/churn/batch` | Batch churn prediction |
| POST | `/score/lead` | Single lead scoring |
| POST | `/score/lead/batch` | Batch lead scoring |
| POST | `/segment/customer` | Single customer segmentation |
| POST | `/segment/all` | Batch segmentation |
| GET | `/recommend/{customer_id}` | Product recommendations |
| POST | `/analyze/sentiment` | Single text sentiment |
| POST | `/analyze/sentiment/batch` | Batch sentiment analysis |

## ML Models

### A. Churn Prediction (XGBoost)
- **Features**: recency, frequency, monetary, loyalty_score
- **Label**: churn if recency > 90 days AND frequency < 3
- **Target**: ROC-AUC >= 0.80
- **Output**: probability + risk level (low/medium/high)

### B. Lead Scoring (Gradient Boosting)
- **Features**: time_since_creation, status_encoded, has_phone, has_email, company_name_length
- **Target**: R² > 0.70, MAE < 15
- **Output**: score (0-100) + priority (cold/warm/hot)

### C. Customer Segmentation (K-Means)
- **Features**: recency, frequency, monetary, loyalty_score
- **Optimal K**: Auto-detected via silhouette score
- **Target**: Silhouette >= 0.45
- **Output**: segment name + cluster_id

### D. Product Recommender (Neural CF / PyTorch)
- **Architecture**: User + Item embeddings → MLP → rating prediction
- **Target**: Precision@5 >= 0.30
- **Output**: Top-K product recommendations with scores

### E. Sentiment Analysis (BERT multilingual)
- **Model**: nlptown/bert-base-multilingual-uncased-sentiment
- **Target**: F1-macro >= 0.75
- **Output**: sentiment (positive/neutral/negative) + 1-5 stars + confidence

## Integration

### Laravel (Backend)
- `app/Services/AIService.php` — HTTP client for all ML endpoints
- `app/Console/Commands/ExportMLData.php` — Export data for training
- `app/Console/Commands/TrainMLModels.php` — Trigger training via Artisan

### React (Frontend)
- `src/services/mlApi.ts` — TypeScript API client with full type definitions
- `src/components/ml/ChurnRiskBadge.tsx` — Churn risk visual badge
- `src/components/ml/LeadScoreBar.tsx` — Lead score progress bar
- `src/components/ml/RecommendationList.tsx` — Recommendations display
- `src/components/ml/SentimentDisplay.tsx` — Sentiment analysis display

## Running Tests

```bash
# Inside the ml-service container
docker-compose exec ml-service pytest tests/ -v

# Or locally
cd ml-service
pip install -r requirements.txt
pytest tests/ -v
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATA_DIR` | `/app/data` | Directory for CSV data files |
| `ML_SERVICE_URL` | `http://ml-service:8001` | Backend → ML service URL |
| `REACT_APP_ML_URL` | `http://localhost:8001` | Frontend → ML service URL |
