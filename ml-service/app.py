from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

# Feature names for sklearn model (to avoid warnings)
FEATURE_NAMES = ['temperature', 'humidity', 'cloud_cover', 'hour']

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Load Model
try:
    model = joblib.load('solar_model.pkl')
    print("✅ AI Strategic Advisor Loaded")
except Exception as e:
    print(f"❌ Model Error: {e}")
    model = None

@app.route('/predict-energy', methods=['POST', 'OPTIONS'])
def predict_energy():
    if request.method == "OPTIONS":
        return jsonify({'status': 'ok'}), 200

    if not model:
        return jsonify({'error': 'Model not loaded'}), 500

    data = request.json
    try:
        base_temp = float(data.get('temperature'))
        humidity = float(data.get('humidity'))
        clouds = float(data.get('cloud_cover'))
        
        total_24h_energy = 0
        hourly_forecast = [] 
        
        # 🔄 GENERATE 24-HOUR FORECAST
        for h in range(24):
            # 1. Simulate Daily Temp Cycle
            sim_temp = base_temp - 5 if (h < 6 or h > 18) else base_temp
            
            # 2. Predict Energy Baseline (use DataFrame with feature names)
            input_data = pd.DataFrame([[sim_temp, humidity, clouds, h]], columns=FEATURE_NAMES)
            pred_energy = max(0, model.predict(input_data)[0])
            
            # --- ☁️ THE FIX: AFTERNOON CLOUD PENALTY ☁️ ---
            # Real Physics: Clouds block low-angle sun (4 PM+) much harder than noon sun.
            # If clouds > 50%, energy at 16:00+ drops drastically.
            if clouds > 50 and h >= 15:
                pred_energy = pred_energy * 0.5  # 50% penalty for cloudy afternoons
            
            if clouds > 80 and h >= 16:
                pred_energy = pred_energy * 0.2  # 80% penalty for heavy clouds

            # 3. Dynamic Pricing Logic
            # Noon (11-14): Supply High -> Price Low (0.9x)
            # Evening (16-19): Demand High -> Price High (1.5x)
            hourly_multiplier = 1.0
            
            if 11 <= h <= 14: 
                hourly_multiplier = 0.90 
            elif 16 <= h <= 19: 
                # If it's cloudy, scarcity makes price go even higher
                if clouds > 50:
                    hourly_multiplier = 1.7 # Super High Demand
                else:
                    hourly_multiplier = 1.3 # Normal High Demand
            
            # Add small random fluctuation so it doesn't look robotic
            hourly_multiplier += np.random.uniform(-0.05, 0.05)

            # 4. Calculate Revenue for this hour
            revenue = pred_energy * hourly_multiplier

            hourly_forecast.append({
                "hour": h,
                "energy": pred_energy,
                "price_multiplier": round(hourly_multiplier, 2),
                "potential_revenue": revenue
            })

            total_24h_energy += pred_energy

        # 5. FIND THE GOLDEN HOUR
        # Now, if it's cloudy:
        # 16:00 Energy is tiny (due to penalty). 
        # Even with 1.7x price, the revenue will be low.
        # Winner -> Noon (12:00)
        
        # If it's sunny:
        # 16:00 Energy is good. 
        # 1.3x price makes it valuable.
        # Winner -> Evening (16:00 or 17:00)
        
        best_hour_data = max(hourly_forecast, key=lambda x: x['potential_revenue'])
        
        # 6. MARKET STATUS
        capacity = 500
        efficiency = (total_24h_energy / capacity) * 100
        
        current_multiplier = 1.0
        status = "Balanced Market"
        
        if efficiency < 20:
            current_multiplier = 1.8 + np.random.uniform(0, 0.2)
            status = "Critical Shortage ☁️"
        elif efficiency < 50:
            current_multiplier = 1.3 + np.random.uniform(0, 0.1)
            status = "High Demand"
        elif efficiency > 80:
            current_multiplier = 0.8 + np.random.uniform(-0.05, 0.05)
            status = "Surplus Supply ☀️"

        return jsonify({
            'predicted_energy': round(total_24h_energy, 2),
            'price_multiplier': round(current_multiplier, 2),
            'market_status': status,
            'advisor': {
                'best_hour': best_hour_data['hour'],
                'max_multiplier': best_hour_data['price_multiplier'],
                'message': f"Recommendation: Sell at {best_hour_data['hour']}:00 (Rate: {best_hour_data['price_multiplier']}x)"
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ✅ NEW: Forecast-based prediction with sunrise/sunset clamp
# ✅ UPDATED: Now handles global timezones & calculates maximum revenue
# ✅ UPDATED: Now handles User Consumption & Calculates Net Excess
# ✅ UPDATED: Now handles User Consumption & Calculates Net Excess
@app.route('/predict-energy-forecast', methods=['POST', 'OPTIONS'])
def predict_energy_forecast():
    if request.method == "OPTIONS":
        return jsonify({'status': 'ok'}), 200

    if not model:
        return jsonify({'error': 'Model not loaded'}), 500

    data = request.json
    
    forecast_points = data.get('forecast')
    sunrise = data.get('sunrise')
    sunset = data.get('sunset')
    timezone_offset = data.get('timezone_offset', 0) 
    
    # ✅ NEW: Get user's expected consumption for next 24 hours
    # Accepts expected_consumption_24h with fallback to consumption for compatibility
    expected_consumption_24h = data.get('expected_consumption_24h')
    if expected_consumption_24h is None:
        expected_consumption_24h = data.get('consumption', 0)
    user_consumption = float(expected_consumption_24h) if expected_consumption_24h else 0
    
    if not forecast_points:
        return jsonify({'error': 'Missing forecast array'}), 400
    
    try:
        sunrise_hour = datetime.utcfromtimestamp(sunrise + timezone_offset).hour
        sunset_hour = datetime.utcfromtimestamp(sunset + timezone_offset).hour
        
        total_generated = 0
        hourly_results = []
        
        for point in forecast_points:
            temp = float(point.get('temp', 20))
            humidity = float(point.get('humidity', 50))
            clouds = float(point.get('clouds', 0))
            forecast_time = point.get('dt') 
            
            if forecast_time is None: continue
            
            forecast_hour = datetime.utcfromtimestamp(forecast_time + timezone_offset).hour
            is_daylight = sunrise_hour <= forecast_hour < sunset_hour
            
            if not is_daylight:
                pred_energy = 0
            else:
                input_data = pd.DataFrame([[temp, humidity, clouds, forecast_hour]], columns=FEATURE_NAMES)
                pred_energy = max(0, model.predict(input_data)[0])
                
                if clouds > 50 and forecast_hour >= 15: pred_energy *= 0.5
                if clouds > 80 and forecast_hour >= 16: pred_energy *= 0.2
            
            interval_energy = pred_energy * 3
            total_generated += interval_energy
            
            hour_multiplier = 1.0
            if 11 <= forecast_hour <= 14:
                hour_multiplier = 0.90 
            elif 16 <= forecast_hour <= 19:
                hour_multiplier = 1.7 if clouds > 50 else 1.3 
            
            potential_revenue = interval_energy * hour_multiplier

            hourly_results.append({
                'hour': forecast_hour,
                'energy': round(interval_energy, 2),
                'multiplier': round(hour_multiplier, 2),
                'revenue': potential_revenue, 
                'is_daylight': is_daylight
            })
                
        # ✅ NEW: Calculate Net Energy (Generated - Consumed)
        net_energy = total_generated - user_consumption
        
        # Grid Market Status
        efficiency = (total_generated / 500) * 100
        current_multiplier = 1.0
        status = "Balanced Market"
        
        if efficiency < 20:
            current_multiplier = 1.8 + np.random.uniform(0, 0.2)
            status = "Critical Shortage ☁️"
        elif efficiency < 50:
            current_multiplier = 1.3 + np.random.uniform(0, 0.1)
            status = "High Demand"
        elif efficiency > 80:
            current_multiplier = 0.8 + np.random.uniform(-0.05, 0.05)
            status = "Surplus Supply ☀️"
        
        # ✅ NEW: Smart Strategy Logic based on Net Energy
        daylight_hours = [h for h in hourly_results if h['is_daylight'] and h['energy'] > 0]
        
        if net_energy <= 0:
            # User doesn't have enough energy for themselves
            best_hour = -1
            best_multiplier = 0
            advice_msg = f"DEFICIT: You will generate {round(total_generated, 1)} kWh but consume {user_consumption} kWh. You need to BUY {abs(round(net_energy, 1))} kWh from the grid. Do not sell today."
            recommend_sell = False
        else:
            # User has excess energy to sell. Find most profitable hour.
            if daylight_hours:
                best_hour_data = max(daylight_hours, key=lambda x: x['revenue'])
                best_hour = best_hour_data['hour']
                best_multiplier = best_hour_data['multiplier']
            else:
                best_hour = 12
                best_multiplier = 1.0
            
            advice_msg = f"SURPLUS: You have {round(net_energy, 1)} kWh of excess energy. Sell it at {best_hour}:00 to get the maximum market rate ({best_multiplier}x)."
            recommend_sell = True
        
        return jsonify({
            'total_generated': round(total_generated, 2),
            'user_consumption': user_consumption,
            'net_energy': round(net_energy, 2),
            'price_multiplier': round(current_multiplier, 2),
            'market_status': status,
            'advisor': {
                'recommend_sell': recommend_sell,
                'recommended_sell_kwh': round(net_energy, 2) if recommend_sell else 0,
                'best_hour': best_hour,
                'max_multiplier': best_multiplier if recommend_sell else 0,
                'message': advice_msg
            }
        })
        
    except Exception as e:
        print(f"❌ Forecast Prediction Error: {e}")
        return jsonify({'error': str(e)}), 400
    
    
@app.route('/market-forecast', methods=['POST'])
def market_forecast():
    try:
        data = request.json
        clouds = float(data.get('cloud_cover'))
        
        # --- 1. CALCULATE SUPPLY (Weather Dependent) ---
        # 0 Clouds = 100 Supply (Max)
        # 100 Clouds = 10 Supply (Min)
        supply_score = max(10, 100 - clouds) 
        
        # --- 2. CALCULATE DEMAND (Time Dependent) ---
        current_hour = datetime.now().hour
        demand_score = 50 # Default neutral
        
        if 7 <= current_hour < 11:
            # Morning Rush
            demand_score = np.random.uniform(70, 90)
            phase = "Morning Peak 🌅"
        elif 11 <= current_hour < 17:
            # Work Hours (Low home usage)
            demand_score = np.random.uniform(40, 60)
            phase = "Afternoon Lull 📉"
        elif 17 <= current_hour < 22:
            # Evening Peak (Highest Demand)
            demand_score = np.random.uniform(85, 100)
            phase = "Evening Surge 🏠"
        else:
            # Night
            demand_score = np.random.uniform(20, 40)
            phase = "Night Quiet 🌙"
            
        # --- 3. THE LIVE PRICE FORMULA ---
        # Multiplier = Demand / Supply
        # Example: High Demand (90) / Low Supply (30) = 3.0x Price (Expensive!)
        # Example: Low Demand (40) / High Supply (90) = 0.44x Price (Cheap!)
        
        live_multiplier = demand_score / supply_score
        
        # Clamp multiplier to realistic limits (0.5x to 3.0x)
        live_multiplier = max(0.5, min(3.0, live_multiplier))
        
        # Base Price Calculation
        base_price = 10.0
        fair_price = base_price * live_multiplier
        
        # --- 4. GENERATE MARKET ADVICE ---
        trend = "STABLE"
        advice = "Market is balanced."
        
        if live_multiplier > 1.5:
            trend = "HIGH DEMAND 📈"
            advice = f"Demand ({int(demand_score)}) is outstripping Supply ({int(supply_score)}). Sellers Market!"
        elif live_multiplier < 0.8:
            trend = "OVERSUPPLY 📉"
            advice = f"Supply ({int(supply_score)}) is high but Demand ({int(demand_score)}) is low. Buyers Market!"
        else:
            trend = "BALANCED ⚖️"
            advice = "Supply and Demand are perfectly matched."

        return jsonify({
            'fair_price': round(fair_price, 2),
            'trend': trend,
            'advice': advice,
            'supply_score': int(supply_score),
            'demand_score': int(demand_score),
            'live_multiplier': round(live_multiplier, 2),
            'condition': phase
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    print("🚀 AI Server running on port 5001")
    app.run(port=5001, debug=True)