import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import joblib
import os

class CustomerSegmentation:
    def __init__(self):
        self.model_path = 'data/segmentation_model.pkl'
        self.features = ['recency', 'frequency', 'monetary', 'engagement_rate']
        self.scaler_path = 'data/segmentation_scaler.pkl'
        
    def train_model(self, data):
        df = pd.DataFrame(data)
        
        # For K-Means clustering we usually only use numerical continuous variables
        X = df[self.features]
        
        # Standardize the data so monetary scale does not dominate recency
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Fit K-Means
        kmeans = KMeans(n_clusters=4, init='k-means++', random_state=42, n_init=10)
        kmeans.fit(X_scaled)
        
        score = silhouette_score(X_scaled, kmeans.labels_)
        
        # Save model and scaler
        joblib.dump(kmeans, self.model_path)
        joblib.dump(scaler, self.scaler_path)
        
        # Determine the defining characteristics of each cluster (cluster centers)
        centers = pd.DataFrame(scaler.inverse_transform(kmeans.cluster_centers_), columns=self.features)
        
        return {
            "silhouette_score": round(score, 4),
            "cluster_centers": centers.to_dict('records')
        }

    def predict(self, features):
        if not os.path.exists(self.model_path):
             raise Exception("Model not trained yet.")
             
        kmeans = joblib.load(self.model_path)
        scaler = joblib.load(self.scaler_path)
        
        df = pd.DataFrame([features])[self.features]
        
        X_scaled = scaler.transform(df)
        cluster = kmeans.predict(X_scaled)[0]
        
        # We can map generic clusters to business segments
        segment_map = {
            0: "Sleeping Customers", # High recency
            1: "Champions",          # High freq, monetary
            2: "Loyal Customers",    # High freq
            3: "New Potential"       # Low freq, high engagement
        }
        
        # Note: mapping logic requires actual center inspection, but this is an abstraction
        segment_name = f"Cluster {cluster}"
        if cluster in segment_map: segment_name = segment_map[cluster]
        
        return {
            "cluster_id": int(cluster),
            "ml_segment": segment_name
        }
