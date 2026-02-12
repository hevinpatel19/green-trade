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

print(f"📂 Loading Data from {csv_file}...")
df = pd.read_csv(csv_file)

# --- 1. NORMALIZE THE TARGET VARIABLE ---
# We assume the max value in your CSV (~100) represents a 100kW system.
# We divide by 100 to teach the AI "Production per 1 kW of installed capacity".
# Example: 
#   Old: 98.1 kWh (for big system) 
#   New: 0.981 kWh (for 1 kW system)
df['energy_output'] = df['energy_output'] / 100.0

# Data Augmentation (Same as before to ensure robust physics)
print("🔄 Augmenting data for robust training...")
augmented_data = []
for _ in range(20): 
    temp_df = df.copy()
    temp_df['temperature'] += np.random.normal(0, 0.5, len(df))
    # We add noise to the normalized output
    temp_df['energy_output'] += np.random.normal(0, 0.005, len(df)) 
    temp_df['energy_output'] = temp_df['energy_output'].clip(lower=0)
    
    # Keep Night as 0
    temp_df.loc[df['energy_output'] == 0, 'energy_output'] = 0
    augmented_data.append(temp_df)

final_df = pd.concat(augmented_data)

print("🧠 Training AI on Normalized Data (kWh per 1kW)...")
X = final_df[['temperature', 'humidity', 'cloud_cover', 'hour']]
y = final_df['energy_output']

# Train Model
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

joblib.dump(model, 'solar_model.pkl')
print("✅ Solar Model Saved! (Predicts output for 1kW system)")