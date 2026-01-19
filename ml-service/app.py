from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

try:
    model = joblib.load('solar_model.pkl')
    print("✅ 24-Hour AI Forecaster Loaded")
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
        # We take the "Base Weather" for the day
        base_temp = float(data.get('temperature'))
        humidity = float(data.get('humidity'))
        clouds = float(data.get('cloud_cover'))
        
        total_24h_energy = 0
        hourly_breakdown = []

        # 🔄 LOOP: Predict for every hour from 0 (Midnight) to 23 (11 PM)
        for h in range(24):
            # Simulation Logic: 
            # We adjust temperature slightly for night/day realism
            # (Nights are ~5 degrees cooler than the base input)
            current_sim_temp = base_temp
            if h < 6 or h > 18: # If it's night time
                current_sim_temp = base_temp - 5 

            # Predict for this specific hour 'h'
            input_data = np.array([[current_sim_temp, humidity, clouds, h]])
            pred = model.predict(input_data)[0]
            
            # Physics rule: Energy can't be negative
            pred = max(0, pred)
            
            total_24h_energy += pred
            hourly_breakdown.append(pred)

        return jsonify({
            'predicted_energy': round(total_24h_energy, 2), # This is the TOTAL for 24h
            'message': "24-Hour Forecast Complete"
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    print("🚀 AI Server running on port 5001")
    app.run(port=5001, debug=True)