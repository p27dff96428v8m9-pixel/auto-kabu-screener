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

st.set_page_config(page_title="FX 勝率特化ダッシュボード, layout="wide", page_icon="📈")

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
    
    # Bollinger Bands (20, 2.5ﾏ・
    df['SMA20'] = df['Close'].rolling(20).mean()
    df['STD20'] = df['Close'].rolling(20).std()
    df['UpperBB'] = df['SMA20'] + (df['STD20'] * 2.5)
    df['LowerBB'] = df['SMA20'] - (df['STD20'] * 2.5)
    
    # ATR (14)
    df['ATR'] = (df['High'] - df['Low']).rolling(14).mean().bfill()
    
    return df

# ==========================================
# AI豎ｺ螳壹Δ繝ｼ繝・(Gemini 2.5 Flash 蛻・梵)
# ==========================================
@st.cache_data(ttl=3600) # 1譎る俣縺ｯ繧ｭ繝｣繝・す繝･繧剃ｿ晄戟
def get_ai_prediction_cached(data_summary, ticker_name, api_key):
    # 謖・ｮ壹＆繧後◆Gemini 2.5 Flash縺ｮURL
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    prompt = f"""
    縺ゅ↑縺溘・荳也阜譛鬮伜ｳｰ縺ｮFX繝励Ο繝医Ξ繝ｼ繝繝ｼ蜈ｼ謌ｦ逡･繧｢繝翫Μ繧ｹ繝医〒縺吶・
    4譎る俣雜ｳ縺ｮ繝√Ε繝ｼ繝医ョ繝ｼ繧ｿ繧貞・譫舌＠縲√・繝ｭ縺ｮ隕也せ縺九ｉ縲悟ｮ牙ｮ壹＠縺滉ｸｭ髟ｷ譛溽噪縺ｪ蛻､譁ｭ縲阪ｒ陦後▲縺ｦ縺上□縺輔＞縲・
    
    縲仙・譫舌・繝ｫ繝ｼ繝ｫ縲・
    1. **螳牙ｮ壽ｧ驥崎ｦ・*: 1縲・譛ｬ縺ｮ繝ｭ繝ｼ繧ｽ繧ｯ雜ｳ縺ｮ蜍輔″縺ｧ蛻､譁ｭ繧偵さ繝ｭ繧ｳ繝ｭ螟峨∴縺ｪ縺・〒縺上□縺輔＞縲・
    2. **繝医Ξ繝ｳ繝画滑謠｡**: 逶ｴ霑・00譛ｬ縺ｮ繝・・繧ｿ縺九ｉ縲∫樟蝨ｨ縺ｮ螟ｧ縺阪↑縲梧ｵ√ｌ・井ｸ頑・繝ｻ荳玖誠繝ｻ繝ｬ繝ｳ繧ｸ・峨阪ｒ迚ｹ螳壹＠縺ｦ縺上□縺輔＞縲・
    3. **繧ｨ繝ｳ繝医Μ繝ｼ蝓ｺ貅・*: 譏守｢ｺ縺ｪ繝医Ξ繝ｳ繝峨・譁ｹ蜷代√∪縺溘・蠑ｷ蜉帙↑繝ｬ繧ｸ繧ｵ繝時ｻ｢謠帙ｒ閠・・縺励√・繝ｭ縺ｨ縺励※蠢・★縲恵uy・郁ｲｷ縺・ｼ峨阪∪縺溘・縲茎ell・亥｣ｲ繧奇ｼ峨阪・縺・★繧後°繧帝∈謚槭＠縺ｦ縺上□縺輔＞縲・
    4. **邨ｶ蟇ｾ繝ｫ繝ｼ繝ｫ**: 縲梧ｧ伜ｭ占ｦ具ｼ・eutral・峨阪・遖∵ｭ｢縺ｧ縺吶ゅョ繝ｼ繧ｿ縺九ｉ譛繧ょ庄閭ｽ諤ｧ縺碁ｫ倥＞譁ｹ蜷代ｒ蠢・★譁ｭ螳壹＠縺ｦ縺上□縺輔＞縲・
    5. **隗｣隱ｬ**: 譌･譛ｬ隱槭〒縲√↑縺懊◎縺ｮ蛻､譁ｭ縺ｫ閾ｳ縺｣縺溘°隲也炊逧・↓隧ｳ縺励￥隱ｬ譏弱＠縺ｦ縺上□縺輔＞縲・
    
    騾夊ｲｨ繝壹い: {ticker_name}
    迴ｾ蝨ｨ縺ｮ雜ｳ: 4譎る俣雜ｳ
    逶ｴ霑・00莉ｶ縺ｮ繝・・繧ｿ:
    {data_summary}
    
    縲仙・蜉帛ｽ｢蠑上・
    蠢・★莉･荳九・JSON蠖｢蠑上〒縺ｮ縺ｿ蝗樒ｭ斐＠縺ｦ縺上□縺輔＞縲・
    {{
      "decision": "buy" | "sell",
      "reason": "隧ｳ邏ｰ縺ｪ隗｣隱ｬ"
    }}
    """
    
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "response_mime_type": "application/json",
        }
    }
    
    try:
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'})
        response.raise_for_status()
        res_data = response.json()
        text_content = res_data['candidates'][0]['content']['parts'][0]['text']
        res_json = json.loads(text_content)
        return res_json.get("decision", "buy"), res_json.get("reason", "蛻・梵螟ｱ謨・)
    except Exception as e:
        return "buy", f"AI蛻・梵繧ｨ繝ｩ繝ｼ: {e} (豕ｨ: 繝｢繝・Ν蜷・'gemini-2.5-flash' 縺梧怏蜉ｹ縺狗｢ｺ隱阪＠縺ｦ縺上□縺輔＞)"

def get_ai_prediction(df, ticker_name, api_key):
    if not api_key:
        return "neutral", "API繧ｭ繝ｼ縺悟・蜉帙＆繧後※縺・∪縺帙ｓ縲・
    
    # 繝・・繧ｿ縺悟､峨ｏ縺｣縺溘→縺阪□縺大・騾√☆繧九ｈ縺・↓縲∫峩霑代・繝・・繧ｿ繧呈枚蟄怜・蛹悶＠縺ｦ繝上ャ繧ｷ繝･繧ｭ繝ｼ縺ｫ縺吶ｋ
    recent_df = df.tail(100).copy()
    data_summary = recent_df[['Open', 'High', 'Low', 'Close', 'RSI']].to_string()
    
    return get_ai_prediction_cached(data_summary, ticker_name, api_key)

# ==========================================
# 蜈ｨ騾夊ｲｨ繝壹い荳諡ｬ繧ｷ繧ｰ繝翫Ν蛻､螳・(鬮倬溽沿)
# ==========================================
@st.cache_data(ttl=300)
def check_all_pair_signals(pairs_dict):
    # 蜈ｨ繝壹い繝ｪ繧ｹ繝医ｒ陦ｨ遉ｺ縺吶ｋ縺ｮ縺ｿ・医す繧ｰ繝翫Ν蛻､螳壹・蜑企勁・・
    return {name: "neutral" for name in pairs_dict.keys()}

# calculate_win_rate functions have been removed


# ==========================================
# 繧ｵ繧､繝峨ヰ繝ｼ・磯夊ｲｨ繝壹い驕ｸ謚橸ｼ・
# ==========================================
CURRENCY_PAIRS = {
    "USD/JPY (繝峨Ν蜀・": "JPY=X", 
    "EUR/USD (繝ｦ繝ｼ繝ｭ繝峨Ν)": "EURUSD=X", 
    "GBP/USD (繝昴Φ繝峨ラ繝ｫ)": "GBPUSD=X",
    "AUD/JPY (雎ｪ繝峨Ν蜀・": "AUDJPY=X", 
    "EUR/JPY (繝ｦ繝ｼ繝ｭ蜀・": "EURJPY=X", 
    "GBP/JPY (繝昴Φ繝牙・)": "GBPJPY=X",
    "AUD/USD (雎ｪ繝峨Ν邀ｳ繝峨Ν)": "AUDUSD=X", 
    "USD/CAD (繝峨Ν繧ｫ繝翫ム)": "CAD=X", 
    "USD/CHF (繝峨Ν繧ｹ繧､繧ｹ)": "CHF=X",
    "NZD/USD (NZ繝峨Ν邀ｳ繝峨Ν)": "NZDUSD=X", 
    "AUD/CAD (雎ｪ繝峨Ν繧ｫ繝翫ム)": "AUDCAD=X", 
    "AUD/NZD (雎ｪ繝峨ΝNZ繝峨Ν)": "AUDNZD=X",
    "CAD/JPY (繧ｫ繝翫ム蜀・": "CADJPY=X", 
    "CAD/CHF (繧ｫ繝翫ム繧ｹ繧､繧ｹ)": "CADCHF=X", 
    "EUR/CAD (繝ｦ繝ｼ繝ｭ繧ｫ繝翫ム)": "EURCAD=X",
    "EUR/NZD (繝ｦ繝ｼ繝ｭNZ繝峨Ν)": "EURNZD=X", 
    "GBP/NZD (繝昴Φ繝丑Z繝峨Ν)": "GBPNZD=X", 
    "NZD/CAD (NZ繝峨Ν繧ｫ繝翫ム)": "NZDCAD=X",
    "NZD/CHF (NZ繝峨Ν繧ｹ繧､繧ｹ)": "NZDCHF=X", 
    "NZD/JPY (NZ繝峨Ν蜀・": "NZDJPY=X", 
    "CHF/JPY (繧ｹ繧､繧ｹ蜀・": "CHFJPY=X",
    "AUD/CHF (雎ｪ繝峨Ν繧ｹ繧､繧ｹ)": "AUDCHF=X", 
    "EUR/AUD (繝ｦ繝ｼ繝ｭ雎ｪ繝峨Ν)": "EURAUD=X", 
    "EUR/CHF (繝ｦ繝ｼ繝ｭ繧ｹ繧､繧ｹ)": "EURCHF=X",
    "EUR/GBP (繝ｦ繝ｼ繝ｭ繝昴Φ繝・": "EURGBP=X", 
    "GBP/AUD (繝昴Φ繝芽ｱｪ繝峨Ν)": "GBPAUD=X", 
    "GBP/CHF (繝昴Φ繝峨せ繧､繧ｹ)": "GBPCHF=X",
    "GBP/CAD (繝昴Φ繝峨き繝翫ム)": "GBPCAD=X",
    "GOLD (驥・": "GC=F", 
    "Bitcoin (BTC)": "BTC-USD"
}

st.sidebar.image("https://img.icons8.com/color/96/000000/line-chart.png", width=60)
st.sidebar.title("FX閾ｪ蜍慕屮隕悶す繧ｹ繝・Β")
st.sidebar.markdown("､・**AI蛻・梵螳悟・迚ｹ蛹悶Δ繝ｼ繝・* 遞ｼ蜒堺ｸｭ")

# CSS 繧､繝ｳ繧ｸ繧ｧ繧ｯ繧ｷ繝ｧ繝ｳ (繧ｹ繧ｿ繧､繝ｫ隱ｿ謨ｴ縺ｮ縺ｿ縲√い繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ縺ｯ蟒・ｭ｢)
st.markdown("""
<style>
    .stRadio > label { display: none; }
</style>
""", unsafe_allow_html=True)

st.sidebar.markdown("---")

# 繧ｷ繧ｰ繝翫Ν荳諡ｬ繝√ぉ繝・け繧貞ｮ溯｡・
all_signals = check_all_pair_signals(CURRENCY_PAIRS)
st.sidebar.markdown("---")

# 繝ｩ繧ｸ繧ｪ繝懊ち繝ｳ縺ｮ驕ｸ謚櫁い・亥ｮ牙ｮ壹・縺溘ａ縲∝錐蜑阪・縺ｿ繧偵Μ繧ｹ繝医↓縺吶ｋ・・
radio_options = list(CURRENCY_PAIRS.keys())

selected_idx = 0
current_p = st.session_state.get('selected_pair', radio_options[0])
if current_p in radio_options:
    selected_idx = radio_options.index(current_p)

# AI縺ｮ迥ｶ諷九ｒ繝ｪ繧ｻ繝・ヨ縺吶ｋ繧ｳ繝ｼ繝ｫ繝舌ャ繧ｯ髢｢謨ｰ
def reset_ai_state():
    st.session_state.ai_decision = "neutral"
    st.session_state.ai_reason = "騾夊ｲｨ繝壹い縺悟､画峩縺輔ｌ縺ｾ縺励◆縲・I蛻・梵繧定・蜍慕噪縺ｫ髢句ｧ九＠縺ｾ縺・.."

def format_pair_label(name):
    return f"倹 {name}"

selected_name = st.sidebar.radio(
    "**蛻・梵縺吶ｋ繝壹い繧帝∈謚・*",
    radio_options,
    index=selected_idx,
    on_change=reset_ai_state,
    key="currency_selector_fixed",
    format_func=format_pair_label
)

# 騾夊ｲｨ繝壹い諠・ｱ縺ｮ遒ｺ螳・
st.session_state.selected_pair = selected_name
ticker = CURRENCY_PAIRS[selected_name]
current_signal = all_signals.get(selected_name, "neutral")

# 驕ｸ謚樔ｸｭ縺ｮ繝壹い縺ｮ迥ｶ諷九ｒ蠑ｷ隱ｿ陦ｨ遉ｺ
if current_signal == "buy":
    st.sidebar.success(f"筮・ｸ・{selected_name}: 雋ｷ縺・す繧ｰ繝翫Ν逋ｺ逕滉ｸｭ")
elif current_signal == "sell":
    st.sidebar.error(f"筮・ｸ・{selected_name}: 螢ｲ繧翫す繧ｰ繝翫Ν逋ｺ逕滉ｸｭ")

st.sidebar.subheader("､・AI豎ｺ螳壹Δ繝ｼ繝・)
# AI蛻・梵繧貞ｸｸ縺ｫ繧ｪ繝ｳ縺ｫ縺吶ｋ・育┌蜉ｹ蛹紋ｸ榊庄・・
use_ai = True 
st.sidebar.info("AI蛻・梵縺ｯ蟶ｸ譎よ怏蜉ｹ蛹悶＆繧後※縺・∪縺・)
gemini_key = "AIzaSyAwXJBVQ2GmpgLfNCzvz3h-VfEZ3HykoGA"  # 謠蝉ｾ帙＆繧後◆API繧ｭ繝ｼ
if use_ai:
    # 繧ｭ繝ｼ蜈･蜉帙ｒ髱櫁｡ｨ遉ｺ縺ｫ縺吶ｋ縺九∫｢ｺ隱咲畑縺ｫ谿九☆ (謠蝉ｾ帙＆繧後◆繧ｭ繝ｼ繧貞━蜈・
    input_key = st.sidebar.text_input("Gemini API Key", type="password", value=gemini_key)
    if input_key:
        gemini_key = input_key
    if not gemini_key:
        st.sidebar.warning("蛻・梵縺ｫ縺ｯAPI繧ｭ繝ｼ縺悟ｿ・ｦ√〒縺吶・)

# 譛滄俣縺ｨ雜ｳ縺ｮ險ｭ螳夲ｼ・譎る俣雜ｳ縺ｧ蝗ｺ螳夲ｼ・
period = "60d" 
interval = "4h"

# ==========================================
# 繝｡繧､繝ｳ逕ｻ髱｢
# ==========================================
st.title(f"､・{selected_name} - AI螳悟・迚ｹ蛹・蛻・梵繝繝・す繝･繝懊・繝・)
st.markdown("蠕捺擂縺ｮ驩・攸繝ｭ繧ｸ繝・け繧但I縺悟精蜿弱・騾ｲ蛹悶・emini 2.0 Flash縺後√メ繝｣繝ｼ繝医・蜈ｨ繝・・繧ｿ繧貞､夊ｧ堤噪縺ｫ蛻・梵縺励∵ｬ｡縺ｮ荳謇九ｒ譁ｭ螳壹＠縺ｾ縺吶・)

# 繝・・繧ｿ縺ｮ蜿門ｾ暦ｼ医く繝｣繝・す繝･繧呈ｴｻ逕ｨ縺励※API雋闕ｷ繧定ｻｽ貂幢ｼ・
with st.spinner(f"{selected_name}縺ｮ繝・・繧ｿ繧貞叙蠕嶺ｸｭ..."):
    t = yf.Ticker(ticker)
    df = t.history(period=period, interval=interval)
    
if df.empty:
    st.error("繝・・繧ｿ繧貞叙蠕励〒縺阪∪縺帙ｓ縺ｧ縺励◆縲ゆｼ大ｴ譎る俣縲√≠繧九＞縺ｯ繝・ぅ繝・き繝ｼ縺檎┌蜉ｹ縺ｮ蜿ｯ閭ｽ諤ｧ縺後≠繧翫∪縺吶・)
else:
    # 謖・ｨ吶・險育ｮ・
    df = calculate_indicators(df)
    current_price = float(df['Close'].iloc[-1])
    
    # 蜍晉紫縺ｮ險育ｮ励Ο繧ｸ繝・け縺ｯ蜑企勁
    outcomes_record = []
    
    # ==========================================
    # 繝励Ο莉墓ｧ倥・繝√Ε繝ｼ繝域緒逕ｻ (Plotly)
    # ==========================================
    fig = go.Figure()
    
    # 繝ｭ繝ｼ繧ｽ繧ｯ雜ｳ
    fig.add_trace(go.Candlestick(x=df.index,
                    open=df['Open'], high=df['High'],
                    low=df['Low'], close=df['Close'],
                    name="萓｡譬ｼ",
                    increasing_line_color='blue',   
                    decreasing_line_color='red',    
                    increasing_fillcolor='blue',
                    decreasing_fillcolor='red'
                    ))
    
    # 繝懊Μ繝ｳ繧ｸ繝｣繝ｼ繝舌Φ繝画緒逕ｻ
    fig.add_trace(go.Scatter(x=df.index, y=df['UpperBB'], mode='lines', line=dict(color='rgba(255, 255, 0, 0.5)', width=1, dash='dash'), name='Upper BB (2.5ﾏ・'))
    fig.add_trace(go.Scatter(x=df.index, y=df['LowerBB'], mode='lines', line=dict(color='rgba(0, 255, 255, 0.5)', width=1, dash='dash'), name='Lower BB (2.5ﾏ・', fill='tonexty', fillcolor='rgba(255,255,255,0.05)'))
    fig.add_trace(go.Scatter(x=df.index, y=df['SMA20'], mode='lines', line=dict(color='rgba(255, 255, 255, 0.3)', width=1), name='SMA 20'))

    # 驩・攸繧ｵ繧､繝ｳ縺ｮ繝励Ο繝・ヨ縺ｯ蜑企勁
                                 
    # AI蛻､譁ｭ縺ｮ繝励Ο繝・ヨ
    ai_decision = "neutral"
    ai_reason = ""
    if use_ai and gemini_key:
        # 閾ｪ蜍募・譫舌∪縺溘・繝懊ち繝ｳ縺ｫ繧医ｋ謇句虚譖ｴ譁ｰ
        if st.session_state.get('ai_decision', 'neutral') == 'neutral' or st.sidebar.button("､・AI蛻､螳壹ｒ譖ｴ譁ｰ"):
            # 繧ｭ繝｣繝・す繝･繧偵け繝ｪ繧｢縺励※蠑ｷ蛻ｶ譖ｴ譁ｰ縺励◆縺・ｴ蜷医・繧ｵ繧､繝峨ヰ繝ｼ繝懊ち繝ｳ縺ｧ蟇ｾ蠢懷庄閭ｽ縺ｫ
            if st.session_state.get('ai_decision', 'neutral') != 'neutral':
                st.cache_data.clear()
            
            with st.spinner("Gemini 2.5 Flash 縺檎嶌蝣ｴ繧貞・譫蝉ｸｭ..."):
                ai_decision, ai_reason = get_ai_prediction(df, selected_name, gemini_key)
                st.session_state.ai_decision = ai_decision
                st.session_state.ai_reason = ai_reason
        
        ai_decision = st.session_state.get('ai_decision', 'neutral')
        ai_reason = st.session_state.get('ai_reason', '繧ｵ繧､繝峨ヰ繝ｼ縺ｮ繝懊ち繝ｳ繧呈款縺励※蛻・梵繧帝幕蟋九＠縺ｦ縺上□縺輔＞縲・)
        
        if ai_decision != "neutral":
            color = "#00ff00" if ai_decision == "buy" else "#ff3333"
            symbol = "star"
            fig.add_trace(go.Scatter(x=[df.index[-1]], y=[current_price], mode='markers+text',
                                     marker=dict(symbol=symbol, size=25, color=color, line=dict(color="white", width=2)),
                                     text=[f"AI: {ai_decision.upper()}"] , textposition="top center",
                                     textfont=dict(color=color, size=16, weight='bold'),
                                     name='AI蛻､螳・))
                                 
    # 蜍晄風縺ｮ繝励Ο繝・ヨ
    win_x = [rt[1] for rt in outcomes_record if 'win' in rt[0]]
    win_y = [rt[2] for rt in outcomes_record if 'win' in rt[0]]
    if win_x:
        fig.add_trace(go.Scatter(x=win_x, y=win_y, mode='text', text=["箝・] * len(win_x), textposition="middle center", textfont=dict(size=14), name='蛻ｩ遒ｺ'))

    loss_x = [rt[1] for rt in outcomes_record if 'loss' in rt[0]]
    loss_y = [rt[2] for rt in outcomes_record if 'loss' in rt[0]]
    if loss_x:
        fig.add_trace(go.Scatter(x=loss_x, y=loss_y, mode='text', text=["笶・] * len(loss_x), textposition="middle center", textfont=dict(size=14), name='謳榊・'))

    # 迴ｾ蝨ｨ迥ｶ諷九・蛻､螳壹→閭梧勹濶ｲ
    current_atr = df['ATR'].iloc[-1]
    current_rsi = df['RSI'].iloc[-1]
    sma20 = df['SMA20'].iloc[-1]
    upper_bb = df['UpperBB'].iloc[-1]
    lower_bb = df['LowerBB'].iloc[-1]
    
    # AI蛻､譁ｭ縺ｫ蝓ｺ縺･縺・※閭梧勹濶ｲ縺ｨ繝・く繧ｹ繝医ｒ險ｭ螳・
    ai_decision = st.session_state.get('ai_decision', 'neutral')
    
    if ai_decision == "buy":
        bg_color = "#1a4d29"
        current_trend_text = "噫 AI蛻､螳・ 雋ｷ縺・(BUY) 蜆ｪ蜍｢"
        current_trend_color = "#00ff00"
    elif ai_decision == "sell":
        bg_color = "#4d1a1a"
        current_trend_text = "徴 AI蛻､螳・ 螢ｲ繧・(SELL) 蜆ｪ蜍｢"
        current_trend_color = "#ff0000"
    else:
        bg_color = "#111111"
        current_trend_text = "竚・AI蛻・梵荳ｭ..."
        current_trend_color = "#ffffff"

    info_text = (
        f"<b>縲植I蛻・梵繧ｹ繝・・繧ｿ繧ｹ縲・/b><br>"
        f"<span style='color:{current_trend_color}; font-size:18px;'><b>{current_trend_text}</b></span><br>"
        f"迴ｾ蝨ｨ蛟､: {current_price:.4f}<br>"
        f"RSI(14): <b>{current_rsi:.1f}</b><br><br>"
        f"笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏<br>"
        f"､・<b>AI螳悟・迚ｹ蛹悶Δ繝ｼ繝臥ｨｼ蜒堺ｸｭ</b>"
    )
    
    fig.update_layout(
        title=f"縲須selected_name}縲・4譎る俣雜ｳ - AI蛻・梵繝√Ε繝ｼ繝・,
        yaxis_title="萓｡譬ｼ (Price)",
        xaxis_title="譌･譎・(4H)",
        template="plotly_dark",
        plot_bgcolor=bg_color,
        paper_bgcolor="#111111",
        height=700,
        margin=dict(l=0, r=0, b=0, t=40),
        legend=dict(yanchor="top", y=0.99, xanchor="left", x=0.01),
        dragmode='pan'
    )
    
    fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor='rgba(255, 255, 255, 0.1)', rangeslider_visible=False)
    
    default_start_idx = max(0, len(df) - 60)
    y_min_val = df['Low'].iloc[default_start_idx:].min() * 0.995
    y_max_val = df['High'].iloc[default_start_idx:].max() * 1.005
    fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor='rgba(255, 255, 255, 0.1)', fixedrange=False, autorange=False, range=[y_min_val, y_max_val])
    
    fig.add_annotation(
        x=0.99, y=0.98, xref="paper", yref="paper",
        text=info_text,
        showarrow=False,
        font=dict(size=14, color="white"),
        align="left",
        bgcolor="rgba(0,0,0,0.7)",
        bordercolor="gray", borderwidth=1, borderpad=8
    )
    
    st.plotly_chart(fig, use_container_width=True, config={'scrollZoom': True}, key=f"chart_{selected_name}")

    if use_ai:
        st.markdown("---")
        st.subheader("､・Gemini 2.5 Flash AI蛻・梵繝ｬ繝昴・繝・)
        if ai_decision == "buy":
            st.success(f"噫 **AI蛻､螳・ 雋ｷ縺・(BUY)**\n\n{ai_reason}")
        else:
            st.error(f"徴 **AI蛻､螳・ 螢ｲ繧・(SELL)**\n\n{ai_reason}")

    # ==========================================
    # 蛻・梵繝代ロ繝ｫ
    # ==========================================
    col1, col2 = st.columns([1, 1.5])
    
    with col1:
        st.subheader("庁 迴ｾ蝨ｨ縺ｮ繝代Λ繝｡繝ｼ繧ｿ繝ｼ蛟､")
        st.write(f"- **迴ｾ蝨ｨ萓｡譬ｼ**: `{current_price:.4f}`")
        st.write(f"- **RSI (14)**: `{current_rsi:.1f}`")
        st.write(f"- **20 SMA (荳ｭ螟ｮ邱・**: `{sma20:.4f}`")
        st.write(f"- **荳企Κ繝舌Φ繝・(+2.5ﾏ・**: `{upper_bb:.4f}`")
        st.write(f"- **荳矩Κ繝舌Φ繝・(-2.5ﾏ・**: `{lower_bb:.4f}`")

    with col2:
        st.subheader("､・AI螳悟・逶｣隕悶・蛻・梵荳ｭ")
        st.info("AI縺後メ繝｣繝ｼ繝医・蠖｢迥ｶ縲√ユ繧ｯ繝九き繝ｫ謖・ｨ吶√・繝ｩ繝・ぅ繝ｪ繝・ぅ繧堤ｷ丞粋逧・↓蛻､譁ｭ縺励※縺・∪縺吶らｵ先棡縺ｯ荳翫・繝ｬ繝昴・繝医ｒ遒ｺ隱阪＠縺ｦ縺上□縺輔＞縲・)
