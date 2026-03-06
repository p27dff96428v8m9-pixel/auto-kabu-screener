import streamlit as st
import yfinance as yf
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from datetime import timedelta
import time
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

# UTF-8 encoding is strictly enforced.
st.set_page_config(page_title="FX 勝率特化ダッシュボード", layout="wide", page_icon="📈")

def calculate_indicators(df):
    if len(df) < 30:
        df['RSI'] = 50
        df['SMA20'] = df['Close']
        df['UpperBB'] = df['Close'] * 1.01
        df['LowerBB'] = df['Close'] * 0.99
        df['ATR'] = df['Close'] * 0.005
        df['EMA9'] = df['Close']
        df['EMA50'] = df['Close']
        df['EMA200'] = df['Close']
        df['MACD'] = 0
        df['MACD_Signal'] = 0
        df['MACD_Hist'] = 0
        df['Stoch_K'] = 50
        df['Stoch_D'] = 50
        df['ADX'] = 25
        df['Plus_DI'] = 0
        df['Minus_DI'] = 0
        return df
        
    # RSI (14)
    delta = df['Close'].diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = -delta.clip(upper=0).rolling(14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # EMA (9, 50, 200)
    df['EMA9'] = df['Close'].ewm(span=9, adjust=False).mean()
    df['EMA50'] = df['Close'].ewm(span=50, adjust=False).mean()
    df['EMA200'] = df['Close'].ewm(span=200, adjust=False).mean() if len(df) >= 200 else df['Close'].ewm(span=min(len(df), 50), adjust=False).mean()
    
    # Bollinger Bands (20, 2.5σ)
    df['SMA20'] = df['Close'].rolling(20).mean()
    df['STD20'] = df['Close'].rolling(20).std()
    df['UpperBB'] = df['SMA20'] + (df['STD20'] * 2.5)
    df['LowerBB'] = df['SMA20'] - (df['STD20'] * 2.5)
    
    # ATR (14)
    high_low = df['High'] - df['Low']
    high_close = (df['High'] - df['Close'].shift()).abs()
    low_close = (df['Low'] - df['Close'].shift()).abs()
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    df['ATR'] = tr.rolling(14).mean().bfill()
    
    # MACD
    ema12 = df['Close'].ewm(span=12, adjust=False).mean()
    ema26 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = ema12 - ema26
    df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
    df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']
    
    # Stochastics
    low_14 = df['Low'].rolling(14).min()
    high_14 = df['High'].rolling(14).max()
    df['Stoch_K'] = 100 * (df['Close'] - low_14) / (high_14 - low_14 + 1e-10)
    df['Stoch_D'] = df['Stoch_K'].rolling(3).mean()
    
    # ADX
    plus_dm = df['High'].diff().clip(lower=0)
    minus_dm = (-df['Low'].diff()).clip(lower=0)
    plus_dm[plus_dm < minus_dm] = 0
    minus_dm[minus_dm < plus_dm] = 0
    atr_smooth = tr.rolling(14).mean()
    df['Plus_DI'] = 100 * (plus_dm.rolling(14).mean() / (atr_smooth + 1e-10))
    df['Minus_DI'] = 100 * (minus_dm.rolling(14).mean() / (atr_smooth + 1e-10))
    dx = 100 * ((df['Plus_DI'] - df['Minus_DI']).abs() / (df['Plus_DI'] + df['Minus_DI'] + 1e-10))
    df['ADX'] = dx.rolling(14).mean()
    
    return df

@st.cache_data(ttl=14400)
def get_daily_data(ticker):
    try:
        t = yf.Ticker(ticker)
        daily = t.history(period="6mo", interval="1d")
        if daily.empty: return None
        return calculate_indicators(daily)
    except Exception: return None

@st.cache_data(ttl=14400)
def get_ai_prediction_cached(data_summary, ticker_name, api_key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    prompt = f"""あなたは世界最高峰のFXプロトレーダーです。
以下のマーケットデータを分析し、最も勝率の高いエントリー判断をJSON形式で出力してください。
様子見は禁止です。

{data_summary}

出力形式:
{{
  "decision": "buy" | "sell",
  "target_price": 0.0000,
  "stop_loss": 0.0000,
  "confidence": 0-100,
  "reasoning": "根拠を日本語で3-5文"
}}
"""
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"response_mime_type": "application/json", "temperature": 0.1}
    }
    
    try:
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=60)
        res_json = response.json()
        content = json.loads(res_json['candidates'][0]['content']['parts'][0]['text'])
        content['confidence'] = min(content.get('confidence', 50), 85)
        return content
    except Exception as e:
        return {"decision": "buy", "target_price": 0, "stop_loss": 0, "confidence": 0, "reasoning": f"AIエラー: {e}"}

# --- CURRENCY LIST (FULL) ---
CURRENCY_PAIRS = {
    "USD/JPY (ドル円)": "JPY=X", 
    "EUR/USD (ユーロドル)": "EURUSD=X", 
    "GBP/USD (ポンドドル)": "GBPUSD=X",
    "AUD/JPY (豪ドル円)": "AUDJPY=X", 
    "EUR/JPY (ユーロ円)": "EURJPY=X", 
    "GBP/JPY (ポンド円)": "GBPJPY=X",
    "AUD/USD (豪ドル米ドル)": "AUDUSD=X", 
    "USD/CAD (ドルカナダ)": "CAD=X", 
    "USD/CHF (ドルスイス)": "CHF=X",
    "NZD/USD (NZドル米ドル)": "NZDUSD=X", 
    "AUD/CAD (豪ドルカナダ)": "AUDCAD=X", 
    "AUD/NZD (豪ドルNZドル)": "AUDNZD=X",
    "CAD/JPY (カナダ円)": "CADJPY=X", 
    "CAD/CHF (カナダスイス)": "CADCHF=X", 
    "EUR/CAD (ユーロカナダ)": "EURCAD=X",
    "EUR/NZD (ユーロNZドル)": "EURNZD=X", 
    "GBP/NZD (ポンドNZドル)": "GBPNZD=X", 
    "NZD/CAD (NZドルカナダ)": "NZDCAD=X",
    "NZD/CHF (NZドルスイス)": "NZDCHF=X", 
    "NZD/JPY (NZドル円)": "NZDJPY=X", 
    "CHF/JPY (スイス円)": "CHFJPY=X",
    "AUD/CHF (豪ドルスイス)": "AUDCHF=X", 
    "EUR/AUD (ユーロ豪ドル)": "EURAUD=X", 
    "EUR/CHF (ユーロスイス)": "EURCHF=X",
    "EUR/GBP (ユーロポンド)": "EURGBP=X", 
    "GBP/AUD (ポンド豪ドル)": "GBPAUD=X", 
    "GBP/CHF (ポンドスイス)": "GBPCHF=X",
    "GBP/CAD (ポンドカナダ)": "GBPCAD=X",
    "GOLD (金)": "GC=F", 
    "Bitcoin (BTC)": "BTC-USD"
}

# --- Sidebar ---
st.sidebar.title("FX自動監視システム")
st.sidebar.markdown("🤖 **AI分析完全特化モード**")

radio_options = list(CURRENCY_PAIRS.keys())
if "selected_pair" not in st.session_state:
    st.session_state.selected_pair = radio_options[0]

def reset_ai():
    st.session_state.ai_decision = "neutral"

selected_name = st.sidebar.radio("ペアを選択", radio_options, index=radio_options.index(st.session_state.get('selected_pair', radio_options[0])), on_change=reset_ai)
st.session_state.selected_pair = selected_name
ticker = CURRENCY_PAIRS[selected_name]

# API KEY MANAGEMENT
default_key = "AIzaSyDhyO5ka9EvEqVeHBtB6F43yN4S2m7BXjE"
gemini_key = os.environ.get("FX_GEMINI_API_KEY", os.environ.get("GEMINI_API_KEY", default_key))
input_key = st.sidebar.text_input("Gemini API Key", type="password", value=gemini_key)
if input_key: gemini_key = input_key

# --- Main ---
st.title(f"🤖 {selected_name} - AI分析ダッシュボード")

df = yf.Ticker(ticker).history(period="60d", interval="4h")
daily_df = get_daily_data(ticker)

if df.empty:
    st.error("データ取得失敗")
else:
    df = calculate_indicators(df)
    current_price = df['Close'].iloc[-1]
    
    if st.session_state.get('ai_decision', 'neutral') == 'neutral' or st.sidebar.button("🤖 AI判定を更新"):
        st.cache_data.clear()
        recent_data = df.tail(100)[['Open', 'High', 'Low', 'Close', 'RSI']].to_string()
        with st.spinner("AI分析中..."):
            ai_data = get_ai_prediction_cached(recent_data, selected_name, gemini_key)
            st.session_state.ai_decision = ai_data["decision"]
            st.session_state.ai_reason = ai_data["reasoning"]
            st.session_state.ai_target = ai_data["target_price"]
            st.session_state.ai_stop = ai_data["stop_loss"]
            st.session_state.ai_confidence = ai_data.get("confidence", 50)

    ai_decision = st.session_state.ai_decision
    ai_confidence = st.session_state.ai_confidence
    bg_color = "#1a4d29" if ai_decision == "buy" else ("#4d1a1a" if ai_decision == "sell" else "#111111")
    
    # Information Box (Single screen focus)
    info_text = (
        f"現在値: {current_price:.4f}<br>"
        f"RSI: {df['RSI'].iloc[-1]:.1f}<br>"
        f"AI自信度: {ai_confidence}%"
    )

    fig = go.Figure()
    fig.add_trace(go.Candlestick(x=df.index, open=df['Open'], high=df['High'], low=df['Low'], close=df['Close'], name="価格"))
    fig.add_trace(go.Scatter(x=df.index, y=df['UpperBB'], line=dict(color='yellow', width=1, dash='dash'), name='Upper BB'))
    fig.add_trace(go.Scatter(x=df.index, y=df['LowerBB'], line=dict(color='yellow', width=1, dash='dash'), name='Lower BB'))
    fig.add_trace(go.Scatter(x=df.index, y=df['SMA20'], line=dict(color='white', width=1), name='SMA 20'))
    
    if ai_decision != "neutral":
        fig.add_hline(y=st.session_state.ai_target, line_dash="dot", line_color="lime", annotation_text="Target")
        fig.add_hline(y=st.session_state.ai_stop, line_dash="dot", line_color="red", annotation_text="Stop")
        fig.add_trace(go.Scatter(x=[df.index[-1]], y=[current_price], mode='markers+text',
                                 marker=dict(symbol="star", size=20, color="lime" if ai_decision=="buy" else "red"),
                                 text=[f"AI: {ai_decision.upper()}"] , textposition="top center"))

    fig.update_layout(
        template="plotly_dark", 
        plot_bgcolor=bg_color, 
        paper_bgcolor="#111111", 
        height=700,
        margin=dict(l=0, r=0, b=0, t=30)
    )
    
    # Inline Annotation for "One Screen" feel
    fig.add_annotation(
        x=0.01, y=0.99, xref="paper", yref="paper",
        text=info_text, showarrow=False, align="left",
        bgcolor="rgba(0,0,0,0.6)", bordercolor="gray", borderwidth=1, borderpad=10
    )
    
    st.plotly_chart(fig, use_container_width=True)

    if ai_decision != "neutral":
        st.subheader(f"🤖 AI判定: {'買い' if ai_decision=='buy' else '売り'}")
        st.success(st.session_state.ai_reason) if ai_decision == "buy" else st.error(st.session_state.ai_reason)
        
        c1, c2, c3 = st.columns(3)
        c1.metric("利確", f"{st.session_state.ai_target:.4f}")
        c2.metric("損切", f"{st.session_state.ai_stop:.4f}")
        c3.metric("自信度", f"{ai_confidence}%")

    # Metrics Panel
    st.markdown("---")
    colA, colB = st.columns(2)
    with colA:
        st.subheader("📊 テクニカル指標")
        st.write(f"RSI(14): `{df['RSI'].iloc[-1]:.1f}`")
        st.write(f"MACD: `{df['MACD'].iloc[-1]:.6f}`")
        st.write(f"ADX: `{df['ADX'].iloc[-1]:.1f}`")
    with colB:
        st.subheader("🌐 マルチタイムフレーム")
        if daily_df is not None:
            d_trend = "上昇" if daily_df['EMA9'].iloc[-1] > daily_df['EMA50'].iloc[-1] else "下降"
            st.write(f"日足トレンド: **{d_trend}**")
            st.write(f"日足RSI: `{daily_df['RSI'].iloc[-1]:.1f}`")
        else:
            st.write("日足データ取得中...")
