from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

# Feature names for sklearn model (to avoid warnings)
SOLAR_FEATURES = ['temperature', 'humidity', 'cloud_cover', 'hour']
MARKET_FEATURES = ['hour', 'cloud_cover', 'temperature']

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# --- LOAD MODELS ---
try:
    solar_model = joblib.load('solar_model.pkl')
    print("✅ Solar Energy Model Loaded")
except Exception as e:
    print(f"❌ Solar Model Error: {e}")
    solar_model = None

try:
    market_model = joblib.load('market_model.pkl')
    print("✅ Market AI Analyst Loaded")
except Exception as e:
    print(f"❌ Market Model Error: {e} (Did you run train_market_model.py?)")
    market_model = None


@app.route('/predict-energy', methods=['POST', 'OPTIONS'])
def predict_energy():
    if request.method == "OPTIONS":
        return jsonify({'status': 'ok'}), 200

    if not solar_model:
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
            
            # 2. Predict Energy Baseline
            input_data = pd.DataFrame([[sim_temp, humidity, clouds, h]], columns=SOLAR_FEATURES)
            pred_energy = max(0, solar_model.predict(input_data)[0])
            
            # --- ☁️ AFTERNOON CLOUD PENALTY ☁️ ---
            if clouds > 50 and h >= 15:
                pred_energy = pred_energy * 0.5 
            if clouds > 80 and h >= 16:
                pred_energy = pred_energy * 0.2 

            # 3. Dynamic Pricing Logic (Simple heuristic for this specific route)
            hourly_multiplier = 1.0
            if 11 <= h <= 14: hourly_multiplier = 0.90 
            elif 16 <= h <= 19: hourly_multiplier = 1.5

            # 4. Calculate Revenue for this hour
            revenue = pred_energy * hourly_multiplier

            hourly_forecast.append({
                "hour": h,
                "energy": pred_energy,
                "price_multiplier": round(hourly_multiplier, 2),
                "potential_revenue": revenue
            })

            total_24h_energy += pred_energy

        best_hour_data = max(hourly_forecast, key=lambda x: x['potential_revenue'])
        
        # MARKET STATUS (Simple efficiency check)
        capacity = 500
        efficiency = (total_24h_energy / capacity) * 100
        status = "Balanced Market"
        current_multiplier = 1.0
        
        if efficiency < 20:
            status = "Critical Shortage ☁️"
            current_multiplier = 1.8
        elif efficiency > 80:
            status = "Surplus Supply ☀️"
            current_multiplier = 0.8

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


@app.route('/predict-energy-forecast', methods=['POST', 'OPTIONS'])
def predict_energy_forecast():
    if request.method == "OPTIONS":
        return jsonify({'status': 'ok'}), 200

    if not solar_model:
        return jsonify({'error': 'Solar Model not loaded'}), 500

    data = request.json
    forecast_points = data.get('forecast')
    sunrise = data.get('sunrise')
    sunset = data.get('sunset')
    timezone_offset = data.get('timezone_offset', 0) 
    
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
                input_data = pd.DataFrame([[temp, humidity, clouds, forecast_hour]], columns=SOLAR_FEATURES)
                pred_energy = max(0, solar_model.predict(input_data)[0])
                
                if clouds > 50 and forecast_hour >= 15: pred_energy *= 0.5
                if clouds > 80 and forecast_hour >= 16: pred_energy *= 0.2
            
            interval_energy = pred_energy * 3
            total_generated += interval_energy
                
        net_energy = total_generated - user_consumption
        
        if net_energy <= 0:
            recommend_sell = False
            recommended_sell_kwh = 0
            advice_msg = f"DEFICIT: You will generate {round(total_generated, 1)} kWh but consume {user_consumption} kWh. Do not sell."
        else:
            recommend_sell = True
            recommended_sell_kwh = round(net_energy, 2)
            advice_msg = f"SURPLUS: You have {round(net_energy, 1)} kWh of excess energy available to sell."
        
        return jsonify({
            'total_generated': round(total_generated, 2),
            'user_consumption': user_consumption,
            'net_energy': round(net_energy, 2),
            'advisor': {
                'recommend_sell': recommend_sell,
                'recommended_sell_kwh': recommended_sell_kwh,
                'message': advice_msg
            }
        })
        
    except Exception as e:
        print(f"❌ Forecast Prediction Error: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/market-forecast', methods=['POST'])
def market_forecast():
    """
    Uses the trained AI Market Model to predict the Live Index.
    Stable, Economics-based, No Randomness.
    """
    try:
        data = request.json
        clouds = float(data.get('cloud_cover'))
        # If frontend doesn't send temp, assume 30°C (neutral temp)
        temp = float(data.get('temperature', 30)) 
        current_hour = datetime.now().hour
        
        market_index = 1.0 # Default

        # --- AI PREDICTION ---
        if market_model:
            # Prepare input exactly how we trained it: [hour, cloud_cover, temperature]
            input_data = pd.DataFrame([[current_hour, clouds, temp]], 
                                    columns=MARKET_FEATURES)
            
            # Get prediction
            prediction = market_model.predict(input_data)[0]
            market_index = round(prediction, 2)
        else:
            print("⚠️ Warning: Market Model not loaded. Using fallback 1.0")

        # --- GENERATE ADVICE TEXT ---
        if market_index >= 1.4:
            trend = "HIGH DEMAND 📈"
            advice = "Seller's Market! Grid is under stress."
            phase = "High Demand"
        elif market_index <= 0.7:
            trend = "OVERSUPPLY 📉"
            advice = "Buyer's Market! Too much solar on grid."
            phase = "Surplus Supply"
        else:
            trend = "BALANCED ⚖️"
            advice = "Supply matches Demand."
            phase = "Stable Market"

        # Calculate a display price (Base 10 * Index)
        fair_price = 10.0 * market_index

        return jsonify({
            'market_index': market_index, # The Smart AI Multiplier
            'fair_price': round(fair_price, 2),
            'trend': trend,
            'advice': advice,
            'condition': phase,
            'live_multiplier': market_index,
            'live_data': {'hour': current_hour, 'clouds': clouds, 'temp': temp}
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    print("🚀 AI Server running on port 5001")
    app.run(port=5001, debug=True)