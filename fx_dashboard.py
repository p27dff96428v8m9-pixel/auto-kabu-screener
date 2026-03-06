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
        for col in ['RSI', 'SMA20', 'UpperBB', 'LowerBB', 'ATR', 'EMA9', 'EMA50', 'EMA200', 'MACD', 'MACD_Signal', 'ADX']:
            df[col] = df['Close'] if 'price' in col or 'EMA' in col or 'BB' in col else 0
        return df
        
    # RSI
    delta = df['Close'].diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = -delta.clip(upper=0).rolling(14).mean()
    rs = gain / (loss + 1e-10)
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # EMA
    df['EMA9'] = df['Close'].ewm(span=9, adjust=False).mean()
    df['EMA50'] = df['Close'].ewm(span=50, adjust=False).mean()
    df['EMA200'] = df['Close'].ewm(span=200, adjust=False).mean()
    
    # Bollinger Bands (20, 2.5σ)
    df['SMA20'] = df['Close'].rolling(20).mean()
    df['STD20'] = df['Close'].rolling(20).std()
    df['UpperBB'] = df['SMA20'] + (df['STD20'] * 2.5)
    df['LowerBB'] = df['SMA20'] - (df['STD20'] * 2.5)
    
    # ATR
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
    
    # ADX
    plus_dm = df['High'].diff().clip(lower=0)
    minus_dm = (-df['Low'].diff()).clip(lower=0)
    atr_smooth = tr.rolling(14).mean()
    df['Plus_DI'] = 100 * (plus_dm.rolling(14).mean() / (atr_smooth + 1e-10))
    df['Minus_DI'] = 100 * (minus_dm.rolling(14).mean() / (atr_smooth + 1e-10))
    dx = 100 * ((df['Plus_DI'] - df['Minus_DI']).abs() / (df['Plus_DI'] + df['Minus_DI'] + 1e-10))
    df['ADX'] = dx.rolling(14).mean()
    
    return df

@st.cache_data(ttl=14400)
def get_ai_prediction_cached(data_summary, ticker_name, api_key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    prompt = f"""あなたはFXプロトレーダーです。以下のデータを分析し、最も勝率の高い判断をJSON形式で出力してください。
{ticker_name} の4時間足データ:
{data_summary}

出力形式(JSON):
{{
  "decision": "buy" | "sell",
  "target_price": 数値,
  "stop_loss": 数値,
  "confidence": 0-100,
  "reasoning": "日本語の解説3-5文"
}}"""
    payload = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"response_mime_type": "application/json", "temperature": 0.1}}
    try:
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=60)
        res_json = response.json()
        if 'candidates' not in res_json:
            error_msg = res_json.get('error', {}).get('message', 'Unknown API Error')
            return {"decision": "neutral", "reasoning": f"AIエラー: {error_msg}"}
        
        content_text = res_json['candidates'][0]['content']['parts'][0]['text']
        content = json.loads(content_text)
        return content
    except Exception as e:
        return {"decision": "neutral", "reasoning": f"解析エラー: {str(e)}"}

# --- CURRENCY LIST ---
CURRENCY_PAIRS = {
    "USD/JPY (ドル円)": "JPY=X", "EUR/USD (ユーロドル)": "EURUSD=X", "GBP/USD (ポンドドル)": "GBPUSD=X",
    "AUD/JPY (豪ドル円)": "AUDJPY=X", "EUR/JPY (ユーロ円)": "EURJPY=X", "GBP/JPY (ポンド円)": "GBPJPY=X",
    "AUD/USD (豪ドル米ドル)": "AUDUSD=X", "GOLD (金)": "GC=F", "Bitcoin (BTC)": "BTC-USD"
}

# --- Sidebar ---
st.sidebar.title("FX自動監視システム")
selected_name = st.sidebar.radio("ペアを選択", list(CURRENCY_PAIRS.keys()))
ticker = CURRENCY_PAIRS[selected_name]

default_key = "AIzaSyDq0VUftWsWWkumrW8NzSGBS59o3GWLCbo"
gemini_key = os.environ.get("FX_GEMINI_API_KEY", os.environ.get("GEMINI_API_KEY", default_key))

# --- Main ---
st.title(f"🤖 {selected_name} 分析ボード")

with st.spinner("データ取得中..."):
    df = yf.Ticker(ticker).history(period="60d", interval="4h")

if df.empty:
    st.error("データの取得に失敗しました。")
else:
    df = calculate_indicators(df)
    current_price = df['Close'].iloc[-1]

    # AI Analysis Trigger
    if st.sidebar.button("🤖 AI判定を再実行") or "ai_res" not in st.session_state:
        recent_summary = df.tail(50)[['Open', 'High', 'Low', 'Close', 'RSI']].to_string()
        with st.spinner("AI分析中..."):
            st.session_state.ai_res = get_ai_prediction_cached(recent_summary, selected_name, gemini_key)

    res = st.session_state.ai_res
    decision = res.get("decision", "neutral")
    reasoning = res.get("reasoning", "分析中...")
    target = float(res.get("target_price", 0))
    stop = float(res.get("stop_loss", 0))
    conf = res.get("confidence", 0)

    # Chart Background Color
    bg_color = "#0a2a12" if decision == "buy" else ("#2a0a0a" if decision == "sell" else "#111111")
    
    # --- PRO CHART ---
    fig = go.Figure()
    
    # Candles
    fig.add_trace(go.Candlestick(
        x=df.index, open=df['Open'], high=df['High'], low=df['Low'], close=df['Close'],
        increasing_line_color='#00ff00', decreasing_line_color='#ff3333', name="Price"
    ))
    
    # Indicators
    fig.add_trace(go.Scatter(x=df.index, y=df['UpperBB'], line=dict(color='rgba(255,255,0,0.3)', width=1), name='UpperBB'))
    fig.add_trace(go.Scatter(x=df.index, y=df['LowerBB'], line=dict(color='rgba(255,255,0,0.3)', width=1), name='LowerBB'))
    fig.add_trace(go.Scatter(x=df.index, y=df['SMA20'], line=dict(color='white', width=1), name='SMA20'))
    
    # AI Levels (Only if valid)
    if decision != "neutral":
        if target > 1: # Basic check to avoid plotting 0
            fig.add_hline(y=target, line_dash="dash", line_color="#00ff00", annotation_text=f"Target: {target:.3f}")
        if stop > 1:
            fig.add_hline(y=stop, line_dash="dash", line_color="#ff3333", annotation_text=f"Stop: {stop:.3f}")
        
        # Star Marker
        fig.add_trace(go.Scatter(
            x=[df.index[-1]], y=[current_price], mode='markers',
            marker=dict(symbol="star", size=20, color="yellow"), name="AI Signal"
        ))

    fig.update_layout(
        template="plotly_dark", plot_bgcolor=bg_color, paper_bgcolor="#111111", 
        height=600, margin=dict(l=0, r=0, b=0, t=30),
        xaxis_rangeslider_visible=False
    )
    
    # One Screen Info Overlay
    fig.add_annotation(
        x=0.01, y=0.98, xref="paper", yref="paper",
        text=f"<b>現在値: {current_price:.4f}</b><br>RSI: {df['RSI'].iloc[-1]:.1f}<br>自信度: {conf}%",
        showarrow=False, align="left", bgcolor="rgba(0,0,0,0.7)", bordercolor="gray", borderwidth=1, borderpad=10
    )
    
    st.plotly_chart(fig, use_container_width=True)

    # --- Reasoning Report ---
    if decision != "neutral":
        st.subheader(f"🤖 AI分析結果: {'買い' if decision=='buy' else '売り'}")
        if decision == "buy": st.success(reasoning)
        else: st.error(reasoning)
        
        c1, c2, c3 = st.columns(3)
        c1.metric("利確", f"{target:.4f}")
        c2.metric("損切", f"{stop:.4f}")
        c3.metric("AI自信度", f"{conf}%")
    else:
        st.warning(reasoning)

    # Technical Details
    with st.expander("📊 テクニカル指標詳細"):
        st.write(f"RSI: `{df['RSI'].iloc[-1]:.1f}` | MACD: `{df['MACD'].iloc[-1]:.6f}` | ATR: `{df['ATR'].iloc[-1]:.4f}`")
        st.write(f"Upper BB: `{df['UpperBB'].iloc[-1]:.4f}` | Lower BB: `{df['LowerBB'].iloc[-1]:.4f}`")
