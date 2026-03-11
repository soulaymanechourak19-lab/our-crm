import sys

file_path = "c:/Users/Hany/our-crm/ml-service/main.py"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False

for line in lines:
    if "from models import churn, scoring, segmentation, recommender, sentiment, intent_classifier" in line:
        new_lines.append("from models.churn_predictor import ChurnPredictor\n")
        new_lines.append("from models.lead_scorer import LeadScorer\n")
        new_lines.append("from models.customer_segmentation import CustomerSegmentation\n")
        new_lines.append("from models.intent_classifier import IntentClassifier\n")
        new_lines.append("import requests\n")
        
        new_lines.append("\nchurn_predictor = ChurnPredictor()\n")
        new_lines.append("lead_scorer = LeadScorer()\n")
        new_lines.append("customer_segmentation = CustomerSegmentation()\n")
        new_lines.append("intent_classifier = IntentClassifier()\n")
    elif "app.on_event(\"startup\")" in line:
        skip = True
        new_lines.append(line)
    elif skip and "def startup():" in line:
        new_lines.append(line)
        new_lines.append("    intent_classifier.load_model()\n")
        new_lines.append("    print('✅ ML Service started.')\n")
    elif skip and "def health():" in line:
        new_lines.append(line)
        new_lines.append("    return {'status': 'healthy'}\n")
    elif skip and "# ═══════════════════════════════════════════════════════════════════════════════" in line:
        skip = False
        new_lines.append(line)
    elif not skip:
        new_lines.append(line)

# Let's replace the training and prediction endpoints entirely
# Actually, the file is too long. Better to just append the endpoints at the bottom
# But we need to make sure we don't have overlapping route names.

# We will just rewrite the whole file for simplicity as it's just FastAPI routes.
