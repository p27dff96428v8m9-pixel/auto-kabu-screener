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

# UTF-8 encoding is strictly enforced for this file.
st.set_page_config(page_title="FX 勝率特化ダッシュボード", layout="wide", page_icon="📈")

def calculate_indicators(df):
    if len(df) < 30:
        df['RSI'] = 50
        df['SMA20'] = df['Close']
        df['UpperBB'] = df['Close'] * 1.01
        df['LowerBB'] = df['Close'] * 0.99
        df['ATR'] = df['Close'] * 0.005
        return df
        
    # RSI (14)
    delta = df['Close'].diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = -delta.clip(upper=0).rolling(14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # Bollinger Bands (20, 2.5σ)
    df['SMA20'] = df['Close'].rolling(20).mean()
    df['STD20'] = df['Close'].rolling(20).std()
    df['UpperBB'] = df['SMA20'] + (df['STD20'] * 2.5)
    df['LowerBB'] = df['SMA20'] - (df['STD20'] * 2.5)
    
    # ATR (14)
    df['ATR'] = (df['High'] - df['Low']).rolling(14).mean().bfill()
    
    return df

@st.cache_data(ttl=3600)
def get_ai_prediction_cached(data_summary, ticker_name, api_key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    prompt = f"""あなたは世界最高峰のFXプロトレーダー兼戦略アナリストです。
4時間足のチャートデータを分析し、プロの視点から「安定した中長期的な判断」を行ってください。

【分析のルール】
1. **安定性重視**: 1〜2本のローソク足の動きで判断をコロコロ変えないでください。
2. **トレンド把握**: 直近100本のデータから、現在の大きな「流れ（上昇・下落・レンジ）」を特定してください。
3. **エントリー基準**: 明確なトレンドの方向、または強力なレジサポ転換を考慮し、プロとして必ず「buy（買い）」または「sell（売り）」のいずれかを選択してください。
4. **絶対ルール**: 「様子見(neutral)」は禁止です。データから最も可能性が高い方向を必ず断定してください。
5. **解説**: 日本語で、なぜその判断に至ったか論理的に詳しく説明してください。

通貨ペア: {ticker_name}
現在の足: 4時間足
直近100件のデータ:
{data_summary}

【出力形式】
必ず以下のJSON形式でのみ回答してください。
{{
  "decision": "buy" | "sell",
  "reason": "詳細な解説"
}}
"""
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"response_mime_type": "application/json"}
    }
    
    try:
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=60)
        response.raise_for_status()
        res_data = response.json()
        text_content = res_data['candidates'][0]['content']['parts'][0]['text']
        res_json = json.loads(text_content)
        return res_json.get("decision", "buy"), res_json.get("reason", "分析失敗")
    except Exception as e:
        return "buy", f"AI分析エラー: {e}"

def get_ai_prediction(df, ticker_name, api_key):
    if not api_key:
        return "neutral", "APIキーが入力されていません。"
    recent_df = df.tail(100).copy()
    data_summary = recent_df[['Open', 'High', 'Low', 'Close', 'RSI']].to_string()
    return get_ai_prediction_cached(data_summary, ticker_name, api_key)

@st.cache_data(ttl=300)
def check_all_pair_signals(pairs_dict):
    return {name: "neutral" for name in pairs_dict.keys()}

CURRENCY_PAIRS = {
    "USD/JPY (ドル円)": "JPY=X", 
    "EUR/USD (ユーロドル)": "EURUSD=X", 
    "GBP/USD (ポンドドル)": "GBPUSD=X",
    "AUD/JPY (豪ドル円)": "AUDJPY=X", 
    "EUR/JPY (ユーロ円)": "EURJPY=X", 
    "GBP/JPY (ポンド円)": "GBPJPY=X",
    "GOLD (金)": "GC=F", 
    "Bitcoin (BTC)": "BTC-USD"
}

st.sidebar.title("FX自動監視システム")
st.sidebar.markdown("🤖 **AI分析完全特化モード** 稼働中")

radio_options = list(CURRENCY_PAIRS.keys())

def reset_ai_state():
    st.session_state.ai_decision = "neutral"
    st.session_state.ai_reason = "通貨ペアが変更されました。AI分析を開始します..."

selected_name = st.sidebar.radio("ペアを選択", radio_options, on_change=reset_ai_state)
ticker = CURRENCY_PAIRS[selected_name]

gemini_key = os.environ.get("FX_GEMINI_API_KEY", os.environ.get("GEMINI_API_KEY", ""))
input_key = st.sidebar.text_input("Gemini API Key", type="password", value=gemini_key)
if input_key: gemini_key = input_key

# Setting for period and interval
period = "60d" 
interval = "4h"

st.title(f"🤖 {selected_name} - AI分析ダッシュボード")
st.markdown("従来の鉄板ロジックをAIが吸収・進化。Gemini 2.5 Flashが分析し、次の一手を断定します。")

with st.spinner(f"{selected_name}のデータを取得中..."):
    df = yf.Ticker(ticker).history(period=period, interval=interval)
    
if df.empty:
    st.error("データを取得できませんでした。")
else:
    df = calculate_indicators(df)
    current_price = float(df['Close'].iloc[-1])
    
    if st.session_state.get('ai_decision', 'neutral') == 'neutral' or st.sidebar.button("🤖 AI判定を更新"):
        if st.session_state.get('ai_decision', 'neutral') != 'neutral':
            st.cache_data.clear()
        
        with st.spinner("Gemini 2.5 Flash 分析中..."):
            ai_decision, ai_reason = get_ai_prediction(df, selected_name, gemini_key)
            st.session_state.ai_decision = ai_decision
            st.session_state.ai_reason = ai_reason
    
    ai_decision = st.session_state.get('ai_decision', 'neutral')
    ai_reason = st.session_state.get('ai_reason', 'サイドバーのボタンを押して分析を開始してください。')
    
    bg_color = "#1a4d29" if ai_decision == "buy" else ("#4d1a1a" if ai_decision == "sell" else "#111111")
    
    fig = go.Figure()
    fig.add_trace(go.Candlestick(x=df.index, open=df['Open'], high=df['High'], low=df['Low'], close=df['Close'], name="価格"))
    fig.add_trace(go.Scatter(x=df.index, y=df['UpperBB'], line=dict(color='yellow', dash='dash'), name='Upper BB'))
    fig.add_trace(go.Scatter(x=df.index, y=df['LowerBB'], line=dict(color='yellow', dash='dash'), name='Lower BB'))
    fig.add_trace(go.Scatter(x=df.index, y=df['SMA20'], line=dict(color='white'), name='SMA 20'))
    
    if ai_decision != "neutral":
        fig.add_trace(go.Scatter(x=[df.index[-1]], y=[current_price], mode='markers+text',
                                 marker=dict(symbol="star", size=25, color="lime" if ai_decision=="buy" else "red"),
                                 text=[f"AI: {ai_decision.upper()}"] , textposition="top center"))

    fig.update_layout(template="plotly_dark", plot_bgcolor=bg_color, paper_bgcolor="#111111", height=700)
    st.plotly_chart(fig, use_container_width=True)

    if ai_decision != "neutral":
        st.markdown(f"### AI判定: {'買い' if ai_decision=='buy' else '売り'}")
        st.info(ai_reason)

    col1, col2 = st.columns(2)
    with col1:
        st.subheader("💡 現在の指標")
        st.write(f"- 価格: `{current_price:.4f}`")
        st.write(f"- RSI: `{df['RSI'].iloc[-1]:.1f}`")
    with col2:
        st.subheader("🤖 AI完全監視・分析中")
        st.info("チャート形状とテクニカル指標を総合判断しています。")
