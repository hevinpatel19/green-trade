import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

# 1. Load the data
if not os.path.exists('market_data.csv'):
    print("❌ Error: market_data.csv not found.")
    exit()

print("wm Loading market_data.csv...")
df = pd.read_csv('market_data.csv')

# 2. Separate Inputs (Features) and Output (Target)
# We use Hour, Clouds, and Temp to predict the Index
feature_cols = ['hour', 'cloud_cover', 'temperature']
X = df[feature_cols]
y = df['market_index']

# 3. Train the AI
print("🧠 Training Market AI...")
# RandomForest is great for this because it handles non-linear patterns (like "Evening Peak") well
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

# 4. Save the Model
joblib.dump(model, 'market_model.pkl')
print("✅ SUCCESS: Model saved as 'market_model.pkl'")
print("📊 AI is ready to predict market prices!")