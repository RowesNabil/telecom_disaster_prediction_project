
"""
app.py — Early Fire/Failure Warning Dashboard
================================================
Professional Streamlit dashboard for monitoring telecom central offices and
predicting fire risk or major equipment failure early, with an email alert
system for the maintenance team.

Run:  streamlit run app.py
"""

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

import streamlit as st
import pandas as pd
import numpy as np
import joblib
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime

from feature_engineering import build_features
from alert_system import send_email_alert, classify_risk_level, WARNING_THRESHOLD, CRITICAL_THRESHOLD

st.set_page_config(
    page_title="Early Warning System - Telecom Central Offices",
    page_icon="🔥",
    layout="wide",
)

MODELS_DIR = "models"


# ---------------------------------------------------------------
# Load model artifacts (cached)
# ---------------------------------------------------------------
@st.cache_resource
def load_artifacts():
    meta = joblib.load(f"{MODELS_DIR}/production_meta.pkl")
    model = joblib.load(f"{MODELS_DIR}/production_model.pkl")
    feature_cols = meta["feature_cols"]
    threshold = meta["threshold"]
    return model, feature_cols, threshold, meta["model_name"]


@st.cache_data
def load_and_process_data(path):
    df = pd.read_csv(path, parse_dates=["timestamp"])
    df = build_features(df, horizon_steps=2)
    return df


# ---------------------------------------------------------------
# Sidebar
# ---------------------------------------------------------------
st.sidebar.title("⚙️ System Settings")
central_name = st.sidebar.text_input("Central Office Name", "Ramses Central - Main Building")
data_source = st.sidebar.radio("Data Source", ["Default Data", "Upload CSV File"])

if data_source == "Upload CSV File":
    uploaded = st.sidebar.file_uploader("Upload sensor data file (CSV)", type=["csv"])
    data_path = uploaded if uploaded else "data/features_data.csv"
else:
    data_path = "data/features_data.csv"

enable_email = st.sidebar.checkbox("Enable real email alerts", value=False)
st.sidebar.markdown("---")
st.sidebar.markdown(
    f"**Warning threshold:** {WARNING_THRESHOLD:.0%}  \n**Critical threshold (email):** {CRITICAL_THRESHOLD:.0%}"
)

st.title("🔥 Early Warning System for Fire & Major Failures — Telecom Central Offices")
st.caption("AI for Business | Early risk prediction using Machine Learning + Deep Learning")

# ---------------------------------------------------------------
# Load data and model
# ---------------------------------------------------------------
try:
    model, feature_cols, threshold, model_name = load_artifacts()
except FileNotFoundError:
    st.error("⚠️ No trained model found. First run: `python src/train_ml_models.py`")
    st.stop()

try:
    df = load_and_process_data(data_path)
except Exception as e:
    st.error(f"Error loading data: {e}")
    st.stop()

available_cols = [c for c in feature_cols if c in df.columns]
missing = set(feature_cols) - set(available_cols)
if missing:
    st.warning(f"Some columns are missing from this file and were filled with 0: {len(missing)} column(s)")
    for c in missing:
        df[c] = 0

X_all = df[feature_cols]
df["risk_probability"] = model.predict_proba(X_all)[:, 1]
df["risk_level"] = df["risk_probability"].apply(classify_risk_level)

latest = df.iloc[-1]

# ---------------------------------------------------------------
# Top KPIs
# ---------------------------------------------------------------
col1, col2, col3, col4, col5 = st.columns(5)
col1.metric("🌡️ Current Temperature", f"{latest['temperature']:.1f} °C")
col2.metric("💨 Smoke Level", f"{latest['smoke_level']:.1f} ppm")
col3.metric("⚡ Power Load", f"{latest['power_load']:.1f} %")
col4.metric("📡 Network Traffic", f"{latest['network_traffic']:.1f}")

risk_prob = latest["risk_probability"]
risk_level = latest["risk_level"]
level_color = {"NORMAL": "🟢", "WARNING": "🟡", "CRITICAL": "🔴"}
col5.metric("🎯 Risk Probability (AI model)", f"{risk_prob:.1%}", delta=level_color[risk_level] + " " + risk_level)

st.markdown("---")

# ---------------------------------------------------------------
# Risk gauge
# ---------------------------------------------------------------
gauge_col, chart_col = st.columns([1, 2])

with gauge_col:
    fig_gauge = go.Figure(go.Indicator(
        mode="gauge+number",
        value=risk_prob * 100,
        title={"text": f"Current Risk Level — {model_name}"},
        gauge={
            "axis": {"range": [0, 100]},
            "bar": {"color": "black"},
            "steps": [
                {"range": [0, WARNING_THRESHOLD * 100], "color": "#a5d6a7"},
                {"range": [WARNING_THRESHOLD * 100, CRITICAL_THRESHOLD * 100], "color": "#fff59d"},
                {"range": [CRITICAL_THRESHOLD * 100, 100], "color": "#ef9a9a"},
            ],
        },
    ))
    fig_gauge.update_layout(height=320, margin=dict(t=50, b=10))
    st.plotly_chart(fig_gauge, use_container_width=True)

    if risk_level == "CRITICAL":
        st.error("🚨 Critical condition! High probability of an imminent fire/major failure.")
        if enable_email:
            sent, _ = send_email_alert(
                central_name, risk_prob,
                {
                    "Temperature": f"{latest['temperature']:.1f} °C",
                    "Smoke": f"{latest['smoke_level']:.1f} ppm",
                    "Power Load": f"{latest['power_load']:.1f}%",
                    "Voltage Fluctuation": f"{latest.get('voltage_fluctuation', 0):.1f}%",
                },
            )
            if sent:
                st.success("📧 Alert email sent to the emergency team.")
    elif risk_level == "WARNING":
        st.warning("⚠️ Warning level: close monitoring and preventive inspection recommended.")
    else:
        st.success("✅ Normal condition, no current risk indicators.")

with chart_col:
    tail = df.tail(300)
    fig_risk = px.line(
        tail, x="timestamp", y="risk_probability",
        title="Risk Probability Over Time (last 300 readings)",
    )
    fig_risk.add_hline(y=WARNING_THRESHOLD, line_dash="dot", line_color="orange", annotation_text="Warning threshold")
    fig_risk.add_hline(y=CRITICAL_THRESHOLD, line_dash="dot", line_color="red", annotation_text="Critical threshold")
    fig_risk.update_layout(height=320, yaxis_tickformat=".0%")
    st.plotly_chart(fig_risk, use_container_width=True)

st.markdown("---")

# ---------------------------------------------------------------
# Detailed sensor charts
# ---------------------------------------------------------------
st.subheader("📊 Sensor Readings Over Time")
sensor_tabs = st.tabs(["🌡️ Temperature & Smoke", "⚡ Power & Voltage", "📡 Network & Weather"])

with sensor_tabs[0]:
    fig = px.line(df.tail(500), x="timestamp", y=["temperature", "smoke_level", "humidity"])
    st.plotly_chart(fig, use_container_width=True)

with sensor_tabs[1]:
    fig = px.line(df.tail(500), x="timestamp", y=["power_load", "voltage_fluctuation"])
    st.plotly_chart(fig, use_container_width=True)

with sensor_tabs[2]:
    fig = px.line(df.tail(500), x="timestamp", y=["network_traffic", "wind_speed", "precipitation"])
    st.plotly_chart(fig, use_container_width=True)

# ---------------------------------------------------------------
# Feature importance (model explainability)
# ---------------------------------------------------------------
st.subheader("🔑 Top Factors Driving the Model's Decision (Explainability)")
try:
    importance_df = pd.read_csv(f"{MODELS_DIR}/feature_importance.csv", index_col=0)
    importance_df.columns = ["importance"]
    top15 = importance_df.sort_values("importance", ascending=False).head(15).reset_index()
    top15.columns = ["feature", "importance"]
    fig_imp = px.bar(top15, x="importance", y="feature", orientation="h")
    fig_imp.update_layout(yaxis={"categoryorder": "total ascending"}, height=450)
    st.plotly_chart(fig_imp, use_container_width=True)
except FileNotFoundError:
    st.info("Train the model first to display feature importance.")

# ---------------------------------------------------------------
# Alert history log
# ---------------------------------------------------------------
st.subheader("📋 Recent Alerts Log")
import json
if os.path.exists("data/alerts_log.json"):
    with open("data/alerts_log.json", encoding="utf-8") as f:
        logs = json.load(f)
    if logs:
        st.dataframe(pd.DataFrame(logs).sort_values("timestamp", ascending=False), use_container_width=True)
    else:
        st.info("No alerts logged yet.")
else:
    st.info("No alerts logged yet.")

st.markdown("---")
st.caption(f"Last data update: {latest['timestamp']} | Model used: {model_name} | Threshold: {threshold:.2f}")