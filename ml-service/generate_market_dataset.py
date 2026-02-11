import pandas as pd
import numpy as np

# CONFIGURATION
SAMPLES = 10000

print(f"🏭 Generaring {SAMPLES} hours of grid market data...")

data = []

for _ in range(SAMPLES):
    # 1. Randomized Inputs (Simulating a year of weather)
    hour = np.random.randint(0, 24)
    clouds = np.random.randint(0, 101) # 0% to 100%
    temp = np.random.randint(20, 42)   # 20°C to 42°C (India typical)
    
    # --- 2. CALCULATE REALISTIC DEMAND (The "Human Factor") ---
    # Base load varies by time of day
    if 0 <= hour < 6:
        base_demand = 30  # Night (Sleeping)
    elif 6 <= hour < 10:
        base_demand = 75  # Morning Rush (Geysers, Office prep)
    elif 10 <= hour < 17:
        base_demand = 60  # Work hours (Offices on, Homes off)
    elif 17 <= hour < 22:
        base_demand = 95  # Evening Peak (TV, Lights, Cooking)
    else:
        base_demand = 50  # Late night cooling
        
    # Temperature Penalty: For every degree above 30°C, demand grows (AC Usage)
    ac_load = max(0, (temp - 30) * 1.5)
    total_demand = base_demand + ac_load + np.random.normal(0, 3) # Add slight noise

    # --- 3. CALCULATE REALISTIC SUPPLY (The "Grid Factor") ---
    # Base Grid Supply (Coal/Nuclear) is constant-ish
    grid_base_supply = 50 
    
    # Solar Supply (Only during day, affected by clouds)
    if 6 < hour < 18:
        # Solar follows a bell curve peaking at noon (12)
        # Simple parabolic curve: 1 - ((hour - 12)/6)^2
        sun_angle = max(0, 1 - abs((hour - 12) / 6)) 
        solar_potential = 100 * sun_angle 
        
        # Clouds block solar
        actual_solar = solar_potential * (1 - (clouds / 100))
    else:
        actual_solar = 0

    total_supply = grid_base_supply + actual_solar

    # --- 4. THE MARKET INDEX (Economics) ---
    # Formula: Price goes UP when Demand > Supply
    # We add 1.0 as a baseline so it doesn't crash
    raw_ratio = total_demand / total_supply
    
    # Normalize to a user-friendly multiplier (0.5x to 2.5x)
    # If Ratio is 2.0 (Demand is double Supply), Price is High.
    # If Ratio is 0.5 (Supply is double Demand), Price is Low.
    
    market_index = raw_ratio
    
    # Clamp extreme values for safety
    market_index = max(0.5, min(3.0, market_index))
    
    # Add a tiny bit of market fluctuation (stock market jitter)
    market_index += np.random.uniform(-0.05, 0.05)

    data.append([hour, clouds, temp, round(total_demand,1), round(total_supply,1), round(market_index, 2)])

# Save to CSV
columns = ['hour', 'cloud_cover', 'temperature', 'grid_demand', 'grid_supply', 'market_index']
df = pd.DataFrame(data, columns=columns)
df.to_csv('market_data.csv', index=False)

print("✅ market_data.csv created!")
print(df.head())