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
    
    # Bollinger Bands (20, 2σ & 2.5σ)
    df['SMA20'] = df['Close'].rolling(20).mean()
    df['STD20'] = df['Close'].rolling(20).std()
    df['UpperBB'] = df['SMA20'] + (df['STD20'] * 2.5)
    df['LowerBB'] = df['SMA20'] - (df['STD20'] * 2.5)
    df['UpperBB2'] = df['SMA20'] + (df['STD20'] * 2.0)
    df['LowerBB2'] = df['SMA20'] - (df['STD20'] * 2.0)
    
    # ATR (14)
    high_low = df['High'] - df['Low']
    high_close = (df['High'] - df['Close'].shift()).abs()
    low_close = (df['Low'] - df['Close'].shift()).abs()
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    df['ATR'] = tr.rolling(14).mean().bfill()
    
    # MACD (12, 26, 9)
    ema12 = df['Close'].ewm(span=12, adjust=False).mean()
    ema26 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = ema12 - ema26
    df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
    df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']
    
    # Stochastic Oscillator (14, 3, 3)
    low_14 = df['Low'].rolling(14).min()
    high_14 = df['High'].rolling(14).max()
    df['Stoch_K'] = 100 * (df['Close'] - low_14) / (high_14 - low_14 + 1e-10)
    df['Stoch_D'] = df['Stoch_K'].rolling(3).mean()
    
    # ADX (14) - Average Directional Index
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

def calculate_fibonacci_levels(df, lookback=100):
    """直近の高値安値からフィボナッチリトレースメントレベルを計算"""
    recent = df.tail(lookback)
    high = recent['High'].max()
    low = recent['Low'].min()
    diff = high - low
    return {
        '0.0%': high,
        '23.6%': high - diff * 0.236,
        '38.2%': high - diff * 0.382,
        '50.0%': high - diff * 0.500,
        '61.8%': high - diff * 0.618,
        '78.6%': high - diff * 0.786,
        '100.0%': low
    }

def calculate_pivot_points(df):
    """直近の日足からピボットポイントを計算"""
    last = df.iloc[-1]
    h, l, c = float(last['High']), float(last['Low']), float(last['Close'])
    pp = (h + l + c) / 3
    r1 = 2 * pp - l
    s1 = 2 * pp - h
    r2 = pp + (h - l)
    s2 = pp - (h - l)
    return {'PP': pp, 'R1': r1, 'R2': r2, 'S1': s1, 'S2': s2}

def detect_candlestick_patterns(df):
    """直近のローソク足パターンを検出"""
    patterns = []
    if len(df) < 5:
        return patterns
    
    for i in range(-3, 0):
        o, h, l, c = float(df['Open'].iloc[i]), float(df['High'].iloc[i]), float(df['Low'].iloc[i]), float(df['Close'].iloc[i])
        body = abs(c - o)
        upper_wick = h - max(o, c)
        lower_wick = min(o, c) - l
        total_range = h - l
        
        if total_range == 0:
            continue
            
        # Doji
        if body / total_range < 0.1:
            patterns.append(f"Doji detected at bar {i}")
        # Hammer / Shooting Star
        elif lower_wick > body * 2 and upper_wick < body * 0.5:
            patterns.append(f"Hammer (bullish reversal) at bar {i}")
        elif upper_wick > body * 2 and lower_wick < body * 0.5:
            patterns.append(f"Shooting Star (bearish reversal) at bar {i}")
        # Engulfing
        if i > -3:
            prev_o, prev_c = float(df['Open'].iloc[i-1]), float(df['Close'].iloc[i-1])
            if c > o and prev_c < prev_o and c > prev_o and o < prev_c:
                patterns.append(f"Bullish Engulfing at bar {i}")
            elif c < o and prev_c > prev_o and c < prev_o and o > prev_c:
                patterns.append(f"Bearish Engulfing at bar {i}")
    
    return patterns if patterns else ["No significant patterns detected"]

# ==========================================
# マルチタイムフレーム分析用の日足データ取得
# ==========================================
@st.cache_data(ttl=14400)
def get_daily_data(ticker):
    """日足データを取得してトレンド方向を確認する"""
    try:
        t = yf.Ticker(ticker)
        daily = t.history(period="6mo", interval="1d")
        if daily.empty:
            return None
        daily = calculate_indicators(daily)
        return daily
    except Exception:
        return None

def build_market_context(df, daily_df, ticker_name):
    """AIに送る包括的なマーケットコンテキストを構築"""
    current_price = float(df['Close'].iloc[-1])
    
    # === 4時間足の分析 ===
    recent = df.tail(50)
    rsi = float(df['RSI'].iloc[-1])
    macd = float(df['MACD'].iloc[-1])
    macd_signal = float(df['MACD_Signal'].iloc[-1])
    macd_hist = float(df['MACD_Hist'].iloc[-1])
    stoch_k = float(df['Stoch_K'].iloc[-1])
    stoch_d = float(df['Stoch_D'].iloc[-1])
    adx = float(df['ADX'].iloc[-1])
    plus_di = float(df['Plus_DI'].iloc[-1])
    minus_di = float(df['Minus_DI'].iloc[-1])
    atr = float(df['ATR'].iloc[-1])
    ema9 = float(df['EMA9'].iloc[-1])
    ema50 = float(df['EMA50'].iloc[-1])
    ema200 = float(df['EMA200'].iloc[-1])
    sma20 = float(df['SMA20'].iloc[-1])
    upper_bb = float(df['UpperBB'].iloc[-1])
    lower_bb = float(df['LowerBB'].iloc[-1])
    
    # トレンド強度の判定
    ema_alignment = "bullish" if ema9 > ema50 > ema200 else ("bearish" if ema9 < ema50 < ema200 else "mixed")
    price_vs_ema = "above all EMAs" if current_price > max(ema9, ema50, ema200) else ("below all EMAs" if current_price < min(ema9, ema50, ema200) else "between EMAs")
    
    # MACDの状態
    macd_state = "bullish crossover" if macd > macd_signal and macd_hist > 0 else ("bearish crossover" if macd < macd_signal and macd_hist < 0 else "converging")
    macd_trend = "histogram expanding" if len(df) > 2 and abs(macd_hist) > abs(float(df['MACD_Hist'].iloc[-2])) else "histogram contracting"
    
    # ボリンジャーバンド位置
    bb_position = (current_price - lower_bb) / (upper_bb - lower_bb + 1e-10) * 100
    
    # フィボナッチレベル
    fib_levels = calculate_fibonacci_levels(df)
    
    # ピボットポイント
    pivot = calculate_pivot_points(df)
    
    # ローソク足パターン
    candle_patterns = detect_candlestick_patterns(df)
    
    # 直近の値動き分析
    price_5bars_ago = float(df['Close'].iloc[-6]) if len(df) > 5 else current_price
    price_20bars_ago = float(df['Close'].iloc[-21]) if len(df) > 20 else current_price
    momentum_5 = ((current_price - price_5bars_ago) / price_5bars_ago) * 100
    momentum_20 = ((current_price - price_20bars_ago) / price_20bars_ago) * 100
    
    # 高値安値の推移（ダウ理論）
    highs = [float(df['High'].iloc[i]) for i in range(-10, 0)]
    lows = [float(df['Low'].iloc[i]) for i in range(-10, 0)]
    higher_highs = sum(1 for i in range(1, len(highs)) if highs[i] > highs[i-1])
    higher_lows = sum(1 for i in range(1, len(lows)) if lows[i] > lows[i-1])
    
    # === 日足の分析（マルチタイムフレーム） ===
    daily_context = "日足データ取得不可"
    if daily_df is not None and not daily_df.empty:
        d_rsi = float(daily_df['RSI'].iloc[-1])
        d_macd = float(daily_df['MACD'].iloc[-1])
        d_macd_sig = float(daily_df['MACD_Signal'].iloc[-1])
        d_ema9 = float(daily_df['EMA9'].iloc[-1])
        d_ema50 = float(daily_df['EMA50'].iloc[-1])
        d_adx = float(daily_df['ADX'].iloc[-1])
        d_close = float(daily_df['Close'].iloc[-1])
        d_trend = "上昇" if d_ema9 > d_ema50 and d_close > d_ema50 else ("下降" if d_ema9 < d_ema50 and d_close < d_ema50 else "横ばい")
        d_macd_state = "ゴールデンクロス中" if d_macd > d_macd_sig else "デッドクロス中"
        daily_context = f"""日足トレンド: {d_trend}
日足RSI: {d_rsi:.1f}
日足MACD: {d_macd_state} (MACD={d_macd:.6f})
日足ADX: {d_adx:.1f} ({'トレンド強い' if d_adx > 25 else 'トレンド弱い/レンジ'})
日足EMA9: {d_ema9:.5f}, EMA50: {d_ema50:.5f}"""
    
    # === OHLC直近データ (直近30本を圧縮して送る) ===
    recent_30 = df.tail(30)[['Open', 'High', 'Low', 'Close', 'Volume']].copy()
    recent_30.index = recent_30.index.strftime('%Y-%m-%d %H:%M')
    ohlc_data = recent_30.to_string()
    
    context = f"""=== マーケット分析データ ({ticker_name}) ===

【現在値】{current_price:.5f}

【4時間足テクニカル指標】
- RSI(14): {rsi:.1f} ({'買われすぎ' if rsi > 70 else '売られすぎ' if rsi < 30 else '中立'})
- MACD: {macd:.6f} (Signal: {macd_signal:.6f}, Hist: {macd_hist:.6f})
- MACD状態: {macd_state}, {macd_trend}
- ストキャスティクス: K={stoch_k:.1f}, D={stoch_d:.1f} ({'買われすぎ' if stoch_k > 80 else '売られすぎ' if stoch_k < 20 else '中立'})
- ADX: {adx:.1f} ({'+DI' if plus_di > minus_di else '-DI'}優勢, +DI={plus_di:.1f}, -DI={minus_di:.1f})
- ATR(14): {atr:.5f} (ボラティリティ)

【移動平均線の配列】
- EMA9: {ema9:.5f}
- SMA20: {sma20:.5f}
- EMA50: {ema50:.5f}
- EMA200: {ema200:.5f}
- EMA配列: {ema_alignment}
- 現在値の位置: {price_vs_ema}

【ボリンジャーバンド】
- 上部バンド(2.5σ): {upper_bb:.5f}
- 下部バンド(2.5σ): {lower_bb:.5f}
- バンド内の位置: {bb_position:.1f}% (0%=下限, 100%=上限)

【モメンタム】
- 5本前からの変動: {momentum_5:+.3f}%
- 20本前からの変動: {momentum_20:+.3f}%
- 直近10本の高値更新数: {higher_highs}/9
- 直近10本の安値更新数(切り上がり): {higher_lows}/9

【フィボナッチリトレースメント (直近100本)】
{chr(10).join([f'- {k}: {v:.5f}' for k, v in fib_levels.items()])}

【ピボットポイント】
- PP: {pivot['PP']:.5f}
- R1: {pivot['R1']:.5f}, R2: {pivot['R2']:.5f}
- S1: {pivot['S1']:.5f}, S2: {pivot['S2']:.5f}

【ローソク足パターン (直近3本)】
{chr(10).join(['- ' + p for p in candle_patterns])}

【マルチタイムフレーム - 日足分析】
{daily_context}

【直近30本の4時間足OHLCデータ】
{ohlc_data}"""
    
    return context

# ==========================================
# AI決定モード (Gemini 2.5 Flash 高精度分析)
# ==========================================
@st.cache_data(ttl=14400)
def get_ai_prediction_cached(data_summary, ticker_name, api_key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    prompt = f"""あなたは20年以上の実績を持つ機関投資家レベルのFXストラテジストです。
以下の包括的なマーケットデータを用いて、統計的・論理的に最も勝率の高いエントリーを導出してください。

★★★ 分析フレームワーク（すべて順番に実施すること）★★★

【STEP 1: マルチタイムフレーム・トレンド判定】
- 日足の方向（上位足のトレンド）を最優先で確認
- 4時間足が日足と「同方向」のときのみ順張り → 勝率が最も高い
- 日足と逆方向の場合、逆張りは「明確な反転シグナルが3つ以上重なる場合のみ」許可

【STEP 2: 構造分析（ダウ理論）】
- 高値・安値の切り上げ/切り下げパターンを確認
- 直近のスイングハイ・スイングローを特定
- トレンド転換の有無を判断

【STEP 3: テクニカル・コンフルエンス分析】
以下の指標の「一致度」を確認し、3つ以上が同方向を示す場合にエントリー方向を決定:
  a) EMA配列（9 > 50 > 200 = 上昇 / 9 < 50 < 200 = 下降）
  b) RSI（50以上=買い優勢 / 50以下=売り優勢、極値での逆張りも考慮）
  c) MACD（ヒストグラムの方向と拡大・縮小）
  d) ストキャスティクス（クロスオーバーのタイミング）
  e) ADX（25以上でトレンド確認、+DI/-DI方向）
  f) ボリンジャーバンド（バンドウォーク、スクイーズ、ブレイクアウト）
  g) ピボットポイント（S/R水準での反応）
  h) フィボナッチ（38.2%/50%/61.8%レベルでの反応）
  i) ローソク足パターン（反転・継続）

【STEP 4: エントリー価格の最適化】
- 現在値でのエントリーが最適か、を検討
- レジサポの切りの良い価格での指値を考慮

【STEP 5: リスクリワードの計算】
- 損切り: 直近のスイングポイント＋ATRの0.5倍のバッファを設定
- 利確: リスクリワード比が最低1.5:1以上になるターゲットを設定
- フィボナッチやピボットポイントがターゲット/ストップと一致すればより信頼度が高い

【STEP 6: 信頼度スコアの算出】
以下を基に0〜100のスコアを算出:
- 日足と4H足のトレンド一致: +20点
- テクニカル指標のコンフルエンス(3つ以上一致): +20点
- ローソク足パターンの確認: +15点  
- フィボナッチ/ピボットでの反応: +15点
- リスクリワード比1.5以上: +15点
- ADX 25以上のトレンド確認: +15点

{data_summary}

【出力形式 - 必ず以下のJSON形式でのみ回答】
{{
  "decision": "buy" | "sell",
  "target_price": 具体的な利確価格(数値),
  "stop_loss": 具体的な損切り価格(数値),
  "confidence": 0〜100の信頼度スコア(整数),
  "reasoning": "エントリー根拠の要約（日本語で3〜5文）"
}}

注意:
- 「neutral/様子見」は禁止。必ずbuyかsellを選択すること。
- confidence が低くても、最も確率の高い方向を選択すること。
- target_priceとstop_lossは必ず現実的な価格水準にすること。"""
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.1
        }
    }
    
    try:
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=60)
        response.raise_for_status()
        res_data = response.json()
        text_content = res_data['candidates'][0]['content']['parts'][0]['text']
        res_json = json.loads(text_content)
        
        decision = res_json.get("decision", "buy")
        target = float(res_json.get("target_price", 0))
        stop = float(res_json.get("stop_loss", 0))
        raw_confidence = int(res_json.get("confidence", 50))
        # AIの自己採点は過大評価されるため、上限85%にキャップ
        # 「信頼度100%」は存在しない。どんなに条件が揃っても相場に絶対はない。
        confidence = min(raw_confidence, 85)
        reasoning = res_json.get("reasoning", "")
        
        return {
            "decision": decision,
            "target": target,
            "stop": stop,
            "confidence": confidence,
            "reason": reasoning
        }
    except Exception as e:
        return {
            "decision": "buy",
            "target": 0,
            "stop": 0,
            "confidence": 0,
            "reason": f"AI分析エラー: {e}"
        }

def get_ai_prediction(df, ticker_name, api_key, daily_df=None):
    if not api_key:
        return {"decision": "neutral", "target": 0, "stop": 0, "confidence": 0, "reason": "APIキーが入力されていません。"}
    
    # 包括的なマーケットコンテキストを構築
    data_summary = build_market_context(df, daily_df, ticker_name)
    
    return get_ai_prediction_cached(data_summary, ticker_name, api_key)

# ==========================================
# 全通貨ペア一括シグナル判定 (高速版)
# ==========================================
@st.cache_data(ttl=3600) # 一括チェックは1時間保持
def check_all_pair_signals(pairs_dict):
    # 全ペアリストを表示するのみ（シグナル判定は削除）
    return {name: "neutral" for name in pairs_dict.keys()}

# calculate_win_rate functions have been removed


# ==========================================
# サイドバー（通貨ペア選択）
# ==========================================
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

st.sidebar.image("https://img.icons8.com/color/96/000000/line-chart.png", width=60)
st.sidebar.title("FX自動監視システム")
st.sidebar.markdown("🤖 **AI分析完全特化モード** 稼働中")

# CSS インジェクション (スタイル調整のみ、アニメーションは廃止)
st.markdown("""
<style>
    .stRadio > label { display: none; }
</style>
""", unsafe_allow_html=True)

st.sidebar.markdown("---")

# シグナル一括チェックを実行
all_signals = check_all_pair_signals(CURRENCY_PAIRS)
st.sidebar.markdown("---")

# ラジオボタンの選択肢
radio_options = list(CURRENCY_PAIRS.keys())

# ブラウザのリロード対策: クエリパラメータから取得
if "p" in st.query_params and st.query_params["p"] in radio_options:
    st.session_state.selected_pair = st.query_params["p"]

selected_idx = 0
current_p = st.session_state.get('selected_pair', radio_options[0])
if current_p in radio_options:
    selected_idx = radio_options.index(current_p)

# AIの状態をリセットするコールバック関数
def reset_ai_state():
    # ウィジェットのキーから選択された値を取得
    new_val = st.session_state.currency_selector_fixed
    st.session_state.selected_pair = new_val
    st.query_params["p"] = new_val # URLに保存
    
    st.session_state.ai_decision = "neutral"
    st.session_state.ai_reason = "通貨ペアが変更されました。AI分析を自動的に開始します..."

def format_pair_label(name):
    return f"🌐 {name}"

selected_name = st.sidebar.radio(
    "**分析するペアを選択**",
    radio_options,
    index=selected_idx,
    on_change=reset_ai_state,
    key="currency_selector_fixed",
    format_func=format_pair_label
)

# 通貨ペア情報の確定
st.session_state.selected_pair = selected_name
ticker = CURRENCY_PAIRS[selected_name]
current_signal = all_signals.get(selected_name, "neutral")

# 選択中のペアの状態を強調表示
if current_signal == "buy":
    st.sidebar.success(f"⬆️ {selected_name}: 買いシグナル発生中")
elif current_signal == "sell":
    st.sidebar.error(f"⬇️ {selected_name}: 売りシグナル発生中")

st.sidebar.subheader("🤖 AI決定モード")
# AI分析を常にオンにする（無効化不可）
use_ai = True 
st.sidebar.info("AI分析は常時有効化されています")
gemini_key = "AIzaSyDs-rvi8f7TuIYF7ovgNAbu-_2E1Twbapc"  # 提供されたAPIキー
if use_ai:
    # キー入力を非表示にするか、確認用に残す (提供されたキーを優先)
    input_key = st.sidebar.text_input("Gemini API Key", type="password", value=gemini_key)
    if input_key:
        gemini_key = input_key
    if not gemini_key:
        st.sidebar.warning("分析にはAPIキーが必要です。")

# 期間と足の設定（4時間足で固定）
period = "60d" 
interval = "4h"

# ==========================================
# メイン画面
# ==========================================
st.title(f"🤖 {selected_name} - AI完全特化 分析ダッシュボード")
st.markdown("Gemini 2.5 Flashがテクニカル指標・マルチタイムフレーム分析を多角的に実施し、エントリー方向を提案します。")
st.warning("⚠️ **重要**: AI分析は参考情報です。信頼度スコアはAIの自己評価であり、実際の勝率を保証するものではありません。最終的な投資判断はご自身の責任で行ってください。")

# ==========================================
# データ取得 (キャッシュ付き)
# ==========================================
@st.cache_data(ttl=14400)  # データを4時間保持
def get_data_cached(ticker, period, interval):
    t = yf.Ticker(ticker)
    return t.history(period=period, interval=interval)

# データの取得（キャッシュを活用してAPI負荷を軽減）
with st.spinner(f"{selected_name}のデータを取得中..."):
    df = get_data_cached(ticker, period, interval)
    daily_df = get_daily_data(ticker)  # マルチタイムフレーム用の日足データ
    
if df.empty:
    st.error("データを取得できませんでした。休場時間、あるいはティッカーが無効の可能性があります。")
else:
    # 指標の計算
    df = calculate_indicators(df)
    current_price = float(df['Close'].iloc[-1])
    
    # 勝率の計算ロジックは削除
    outcomes_record = []
    
    # ==========================================
    # プロ仕様のチャート描画 (Plotly)
    # ==========================================
    fig = go.Figure()
    
    # ローソク足
    fig.add_trace(go.Candlestick(x=df.index,
                    open=df['Open'], high=df['High'],
                    low=df['Low'], close=df['Close'],
                    name="価格",
                    increasing_line_color='blue',   
                    decreasing_line_color='red',    
                    increasing_fillcolor='blue',
                    decreasing_fillcolor='red'
                    ))
    
    # ボリンジャーバンド描画
    fig.add_trace(go.Scatter(x=df.index, y=df['UpperBB'], mode='lines', line=dict(color='rgba(255, 255, 0, 0.5)', width=1, dash='dash'), name='Upper BB (2.5σ)'))
    fig.add_trace(go.Scatter(x=df.index, y=df['LowerBB'], mode='lines', line=dict(color='rgba(0, 255, 255, 0.5)', width=1, dash='dash'), name='Lower BB (2.5σ)', fill='tonexty', fillcolor='rgba(255,255,255,0.05)'))
    fig.add_trace(go.Scatter(x=df.index, y=df['SMA20'], mode='lines', line=dict(color='rgba(255, 255, 255, 0.3)', width=1), name='SMA 20'))
    
    # EMA線の追加
    fig.add_trace(go.Scatter(x=df.index, y=df['EMA9'], mode='lines', line=dict(color='rgba(0, 200, 255, 0.6)', width=1), name='EMA 9'))
    fig.add_trace(go.Scatter(x=df.index, y=df['EMA50'], mode='lines', line=dict(color='rgba(255, 165, 0, 0.6)', width=1.5), name='EMA 50'))

    # 鉄板サインのプロットは削除
                                 
    # AI判断のプロット
    ai_decision = "neutral"
    ai_reason = ""
    if use_ai and gemini_key:
        # 自動分析またはボタンによる手動更新
        if st.session_state.get('ai_decision', 'neutral') == 'neutral' or st.sidebar.button("🤖 AI判定を更新"):
            # キャッシュをクリアして強制更新したい場合はサイドバーボタンで対応可能に
            if st.session_state.get('ai_decision', 'neutral') != 'neutral':
                st.cache_data.clear()
            
            with st.spinner("Gemini 2.5 Flash がマルチタイムフレーム分析中..."):
                ai_data = get_ai_prediction(df, selected_name, gemini_key, daily_df=daily_df)
                st.session_state.ai_decision = ai_data["decision"]
                st.session_state.ai_reason = ai_data["reason"]
                st.session_state.ai_target = ai_data["target"]
                st.session_state.ai_stop = ai_data["stop"]
                st.session_state.ai_confidence = ai_data.get("confidence", 50)
        
        ai_decision = st.session_state.get('ai_decision', 'neutral')
        ai_reason = st.session_state.get('ai_reason', 'サイドバーのボタンを押して分析を開始してください。')
        ai_target = st.session_state.get('ai_target', 0)
        ai_stop = st.session_state.get('ai_stop', 0)
        ai_confidence = st.session_state.get('ai_confidence', 0)
        
        if ai_decision != "neutral":
            color = "#00ff00" if ai_decision == "buy" else "#ff3333"
            symbol = "star"
            fig.add_trace(go.Scatter(x=[df.index[-1]], y=[current_price], mode='markers+text',
                                     marker=dict(symbol=symbol, size=25, color=color, line=dict(color="white", width=2)),
                                     text=[f"AI: {ai_decision.upper()}"] , textposition="top center",
                                     textfont=dict(color=color, size=16, weight='bold'),
                                     name='AI判定'))
            
            # ターゲットと損切りの水平線
            if ai_target > 0:
                fig.add_hline(y=ai_target, line_dash="dot", line_color="#00ff00", 
                              annotation_text=f"AI Target: {ai_target:.4f}", annotation_position="bottom right")
            if ai_stop > 0:
                fig.add_hline(y=ai_stop, line_dash="dot", line_color="#ff3333", 
                              annotation_text=f"AI Stop: {ai_stop:.4f}", annotation_position="top right")
                                 
    # 勝敗のプロット
    win_x = [rt[1] for rt in outcomes_record if 'win' in rt[0]]
    win_y = [rt[2] for rt in outcomes_record if 'win' in rt[0]]
    if win_x:
        fig.add_trace(go.Scatter(x=win_x, y=win_y, mode='text', text=["⭕"] * len(win_x), textposition="middle center", textfont=dict(size=14), name='利確'))

    loss_x = [rt[1] for rt in outcomes_record if 'loss' in rt[0]]
    loss_y = [rt[2] for rt in outcomes_record if 'loss' in rt[0]]
    if loss_x:
        fig.add_trace(go.Scatter(x=loss_x, y=loss_y, mode='text', text=["❌"] * len(loss_x), textposition="middle center", textfont=dict(size=14), name='損切'))

    # 現在状態の判定と背景色
    current_atr = df['ATR'].iloc[-1]
    current_rsi = df['RSI'].iloc[-1]
    sma20 = df['SMA20'].iloc[-1]
    upper_bb = df['UpperBB'].iloc[-1]
    lower_bb = df['LowerBB'].iloc[-1]
    
    # AI判断に基づいて背景色とテキストを設定
    ai_decision = st.session_state.get('ai_decision', 'neutral')
    ai_confidence = st.session_state.get('ai_confidence', 0)
    
    if ai_decision == "buy":
        bg_color = "#1a4d29"
        current_trend_text = "🚀 AI判定: 買い (BUY) 優勢"
        current_trend_color = "#00ff00"
    elif ai_decision == "sell":
        bg_color = "#4d1a1a"
        current_trend_text = "💥 AI判定: 売り (SELL) 優勢"
        current_trend_color = "#ff0000"
    else:
        bg_color = "#111111"
        current_trend_text = "⌛ AI分析中..."
        current_trend_color = "#ffffff"
    
    # AI自信度の色
    if ai_confidence >= 70:
        conf_color = "#00ff00"
    elif ai_confidence >= 50:
        conf_color = "#ffaa00"
    else:
        conf_color = "#ff5555"

    info_text = (
        f"<b>【AI分析ステータス】</b><br>"
        f"<span style='color:{current_trend_color}; font-size:18px;'><b>{current_trend_text}</b></span><br>"
        f"現在値: {current_price:.4f}<br>"
        f"RSI(14): <b>{current_rsi:.1f}</b><br>"
        f"<span style='color:{conf_color};'>AI自信度: <b>{ai_confidence}%</b></span><br>"
        f"<span style='color:#888; font-size:10px;'>※勝率ではありません</span><br>"
        f"────────────────<br>"
        f"🤖 <b>AI完全特化モード稼働中</b>"
    )
    
    fig.update_layout(
        title=f"【{selected_name}】 4時間足 - AI分析チャート",
        yaxis_title="価格 (Price)",
        xaxis_title="日時 (4H)",
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
        st.subheader("🤖 Gemini 2.5 Flash AI分析レポート")
        
        if ai_decision == "buy":
            st.success(f"🚀 **AI判定: 買い (BUY)**")
        else:
            st.error(f"💥 **AI判定: 売り (SELL)**")
        
        # AI自信度スコア表示（※勝率ではない）
        col_conf, col_rr = st.columns([1, 1])
        with col_conf:
            if ai_confidence >= 70:
                st.success(f"📊 **AI自信度: {ai_confidence}/85** (条件良好)")
            elif ai_confidence >= 50:
                st.warning(f"📊 **AI自信度: {ai_confidence}/85** (注意して判断)")
            else:
                st.error(f"📊 **AI自信度: {ai_confidence}/85** (シグナル弱い)")
            st.caption("※ AI自信度はAI自身のテクニカル分析の一致度を示すもので、実際の勝率ではありません。上限は85%です。")
        with col_rr:
            # リスクリワード比の計算
            if ai_target > 0 and ai_stop > 0 and ai_decision != "neutral":
                if ai_decision == "buy":
                    reward = ai_target - current_price
                    risk = current_price - ai_stop
                else:
                    reward = current_price - ai_target
                    risk = ai_stop - current_price
                if risk > 0:
                    rr_ratio = reward / risk
                    if rr_ratio >= 2.0:
                        st.success(f"⚖️ **リスクリワード比: {rr_ratio:.2f}:1** (優秀)")
                    elif rr_ratio >= 1.5:
                        st.info(f"⚖️ **リスクリワード比: {rr_ratio:.2f}:1** (良好)")
                    else:
                        st.warning(f"⚖️ **リスクリワード比: {rr_ratio:.2f}:1** (要注意)")
            
        col_res1, col_res2 = st.columns([1, 1])
        with col_res1:
            st.metric("🎯 利確ターゲット", f"{ai_target:.4f}")
        with col_res2:
            if ai_decision == "buy":
                st.metric("🛡️ 損切り目安", f"{ai_stop:.4f}", delta=f"{ai_stop - current_price:.4f}", delta_color="inverse")
            else:
                st.metric("🛡️ 損切り目安", f"{ai_stop:.4f}", delta=f"{ai_stop - current_price:.4f}")
        
        # AI分析根拠の表示
        if ai_reason:
            st.markdown("---")
            st.subheader("📝 AI分析根拠")
            st.info(ai_reason)

    # ==========================================
    # 分析パネル
    # ==========================================
    col1, col2 = st.columns([1, 1.5])
    
    with col1:
        st.subheader("💡 テクニカル指標")
        st.write(f"- **現在価格**: `{current_price:.4f}`")
        st.write(f"- **RSI (14)**: `{current_rsi:.1f}`")
        st.write(f"- **MACD**: `{float(df['MACD'].iloc[-1]):.6f}`")
        st.write(f"- **MACD Signal**: `{float(df['MACD_Signal'].iloc[-1]):.6f}`")
        st.write(f"- **ストキャスティクス K/D**: `{float(df['Stoch_K'].iloc[-1]):.1f} / {float(df['Stoch_D'].iloc[-1]):.1f}`")
        st.write(f"- **ADX**: `{float(df['ADX'].iloc[-1]):.1f}`")
        st.write(f"- **EMA 9**: `{float(df['EMA9'].iloc[-1]):.4f}`")
        st.write(f"- **EMA 50**: `{float(df['EMA50'].iloc[-1]):.4f}`")
        st.write(f"- **20 SMA (中央線)**: `{sma20:.4f}`")
        st.write(f"- **上部バンド (+2.5σ)**: `{upper_bb:.4f}`")
        st.write(f"- **下部バンド (-2.5σ)**: `{lower_bb:.4f}`")

    with col2:
        st.subheader("🤖 マルチタイムフレーム分析")
        if daily_df is not None and not daily_df.empty:
            d_rsi = float(daily_df['RSI'].iloc[-1])
            d_ema9 = float(daily_df['EMA9'].iloc[-1])
            d_ema50 = float(daily_df['EMA50'].iloc[-1])
            d_close = float(daily_df['Close'].iloc[-1])
            d_trend = "🟢 上昇" if d_ema9 > d_ema50 and d_close > d_ema50 else ("🔴 下降" if d_ema9 < d_ema50 and d_close < d_ema50 else "🟡 横ばい")
            h4_ema9 = float(df['EMA9'].iloc[-1])
            h4_ema50 = float(df['EMA50'].iloc[-1])
            h4_trend = "🟢 上昇" if h4_ema9 > h4_ema50 and current_price > h4_ema50 else ("🔴 下降" if h4_ema9 < h4_ema50 and current_price < h4_ema50 else "🟡 横ばい")
            alignment = "✅ 一致" if d_trend[:2] == h4_trend[:2] else "⚠️ 不一致"
            st.write(f"- **日足トレンド**: {d_trend}")
            st.write(f"- **4H足トレンド**: {h4_trend}")
            st.write(f"- **トレンド一致**: {alignment}")
            st.write(f"- **日足RSI**: `{d_rsi:.1f}`")
            st.write(f"- **日足EMA9**: `{d_ema9:.5f}`")
            st.write(f"- **日足EMA50**: `{d_ema50:.5f}`")
        else:
            st.warning("日足データを取得できませんでした。")
