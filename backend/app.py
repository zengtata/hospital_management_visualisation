from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')


def load_csv(filename):
    """
    Helper function to load a CSV file, handle missing values,
    and return a list of dictionaries.
    """
    filepath = os.path.join(DATA_DIR, filename)

    if not os.path.exists(filepath):
        return None

    try:
        df = pd.read_csv(filepath)

        # Fill NaN values with None (which becomes null in JSON) or empty strings
        # JSON standard doesn't support NaN
        df = df.where(pd.notnull(df), None)

        return df
    except Exception as e:
        print(f"Error reading {filename}: {e}")
        return None


# ----------------------------------------------------------------
# 1. Raw Data Endpoints (Table Views)
# ----------------------------------------------------------------

@app.route('/api/patients', methods=['GET'])
def get_patients():
    """Returns all patient records."""
    df = load_csv('patients.csv')
    if df is None:
        return jsonify({"error": "patients.csv not found"}), 404
    return jsonify(df.to_dict(orient='records'))


@app.route('/api/staff', methods=['GET'])
def get_staff():
    """Returns list of all staff members."""
    df = load_csv('staff.csv')
    if df is None:
        return jsonify({"error": "staff.csv not found"}), 404
    return jsonify(df.to_dict(orient='records'))


@app.route('/api/services/weekly', methods=['GET'])
def get_services_weekly():
    """Returns weekly service metrics (beds, satisfaction, etc)."""
    df = load_csv('services_weekly.csv')
    if df is None:
        return jsonify({"error": "services_weekly.csv not found"}), 404
    return jsonify(df.to_dict(orient='records'))


@app.route('/api/staff/schedule', methods=['GET'])
def get_staff_schedule():
    """Returns the weekly schedule."""
    df = load_csv('staff_schedule.csv')
    if df is None:
        return jsonify({"error": "staff_schedule.csv not found"}), 404
    return jsonify(df.to_dict(orient='records'))


# ----------------------------------------------------------------
# 2. Aggregated/Dashboard Endpoints (Smart Data)
# ----------------------------------------------------------------

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """
    Returns calculated summary statistics for the dashboard cards.
    """
    patients_df = load_csv('patients.csv')
    services_df = load_csv('services_weekly.csv')

    stats = {
        "total_patients": 0,
        "avg_satisfaction": 0,
        "total_admitted": 0,
        "avg_staff_morale": 0
    }

    # Calculate Patient Stats
    if patients_df is not None and not patients_df.empty:
        stats["total_patients"] = len(patients_df)
        stats["avg_satisfaction"] = round(patients_df['satisfaction'].mean(), 1)

    # Calculate Service Stats
    if services_df is not None and not services_df.empty:
        stats["total_admitted"] = int(services_df['patients_admitted'].sum())
        stats["avg_staff_morale"] = round(services_df['staff_morale'].mean(), 1)

    return jsonify(stats)


@app.route('/api/dashboard/occupancy', methods=['GET'])
def get_occupancy_trends():
    """
    Returns data formatted specifically for a line chart:
    Average occupancy rate per week per service.
    """
    df = load_csv('services_weekly.csv')
    if df is None:
        return jsonify({"error": "Data not found"}), 404

    # Calculate Occupancy Rate: (Admitted / Available Beds) * 100
    # Avoid division by zero
    df['occupancy_rate'] = df.apply(
        lambda x: round((x['patients_admitted'] / x['available_beds'] * 100), 1)
        if x['available_beds'] > 0 else 0, axis=1
    )

    # Group by Week and Service to get cleaner chart data
    chart_data = df[['week', 'service', 'occupancy_rate']].to_dict(orient='records')
    return jsonify(chart_data)


if __name__ == '__main__':
    # Run on port 5000
    app.run(debug=True, port=5000)
