import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

csv_file = 'solar_data.csv'

if not os.path.exists(csv_file):
    print(f"❌ Error: {csv_file} not found!")
    exit()

print(f"📂 Loading Real-World Physics Data from {csv_file}...")
df = pd.read_csv(csv_file)

# Data Augmentation: Create 1000 variations based on the real physics rows
# This teaches the AI that "Night is always 0" and "Noon is peak"
print("🔄 Augmenting data for robust training...")
augmented_data = []

for _ in range(20): 
    temp_df = df.copy()
    # Add noise to temp/humidity but KEEP HOUR INT (Hour doesn't have decimals)
    temp_df['temperature'] += np.random.normal(0, 0.5, len(df))
    temp_df['energy_output'] += np.random.normal(0, 0.5, len(df))
    
    # Ensure energy never drops below 0 (Physics rule)
    temp_df['energy_output'] = temp_df['energy_output'].clip(lower=0)
    
    # CRITICAL: If energy was 0 in original data (Night), keep it 0!
    temp_df.loc[df['energy_output'] == 0, 'energy_output'] = 0

    augmented_data.append(temp_df)

final_df = pd.concat(augmented_data)

# Train with 'hour' included
print("🧠 Training AI with Time-Aware Logic...")
X = final_df[['temperature', 'humidity', 'cloud_cover', 'hour']] # <--- Added 'hour'
y = final_df['energy_output']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

joblib.dump(model, 'solar_model.pkl')
print(f"✅ Time-Aware AI Trained on {len(final_df)} samples.")
print(f"📊 Accuracy: {model.score(X_test, y_test) * 100:.2f}%")