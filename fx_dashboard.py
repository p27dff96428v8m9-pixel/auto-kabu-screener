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

# ==========================================
# AI決定モード (Gemini 2.0 Flash 分析)
# ==========================================
@st.cache_data(ttl=14400) # 4時間（4時間足の1本分）キャッシュを保持
def get_ai_prediction_cached(data_summary, ticker_name, api_key):
    # 指定されたGemini 2.5 FlashのURL
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    prompt = f"""
    あなたは世界最高峰のFXプロトレーダー兼戦略アナリストです。
    4時間足のチャートデータを分析し、プロの視点から「安定した中長期的な判断」を行ってください。
    
    【分析のルール】
    1. **安定性重視**: 1〜2本のローソク足の動きで判断をコロコロ変えないでください。
    2. **ターゲットの明示**: エントリーした場合の「具体的な利確ターゲット価格」と「損切り価格」を現在の価格水準を考慮して算出してください。
    3. **トレンド把握**: 直近100本のデータから、現在の大きな「流れ（上昇・下落・レンジ）」を特定してください。
    4. **エントリー基準**: 明確なトレンドの方向、または強力なレジサポ転換を考慮し、プロとして必ず「buy（買い）」または「sell（売り）」のいずれかを選択してください。
    5. **絶対ルール**: 「様子見（neutral）」は禁止です。データから最も可能性が高い方向を必ず断定してください。
    6. **解説**: 日本語で、なぜその判断に至ったか、なぜそのターゲット価格にしたのかを論理的に詳しく説明してください。
    
    通貨ペア: {ticker_name}
    現在の足: 4時間足
    直近100件のデータ:
    {data_summary}
    
    【出力形式】
    必ず以下のJSON形式でのみ回答してください。
    {{
      "decision": "buy" | "sell",
      "target_price": 0.0000,
      "stop_loss": 0.0000,
      "reason": "詳細な解説"
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
        return {
            "decision": res_json.get("decision", "buy"),
            "target": res_json.get("target_price", 0),
            "stop": res_json.get("stop_loss", 0),
            "reason": res_json.get("reason", "分析失敗")
        }
    except Exception as e:
        return {
            "decision": "buy",
            "target": 0,
            "stop": 0,
            "reason": f"AI分析エラー: {e}"
        }

def get_ai_prediction(df, ticker_name, api_key):
    if not api_key:
        return "neutral", "APIキーが入力されていません。"
    
    # データが変わったときだけ再送するように、直近のデータを文字列化してハッシュキーにする
    recent_df = df.tail(100).copy()
    data_summary = recent_df[['Open', 'High', 'Low', 'Close', 'RSI']].to_string()
    
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
# 安全なキー管理: ハードコードを廃止し環境変数から読み込み
gemini_key = os.environ.get("FX_GEMINI_API_KEY", os.environ.get("GEMINI_API_KEY", ""))

if use_ai:
    # ユーザーがサイドバーで手動入力した場合はそれを優先
    input_key = st.sidebar.text_input("Gemini API Key", type="password", value=gemini_key, help="コード内には保存されません。.envファイルまたはここで設定してください。")
    if input_key:
        gemini_key = input_key
    
    if not gemini_key:
        st.sidebar.warning("⚠️ 分析にはAPIキーが必要ですが、設定されていません。")
        st.sidebar.info("取得したキーを上に入力するか、.envファイルに FX_GEMINI_API_KEY として設定してください。")

# 期間と足の設定（4時間足で固定）
period = "60d" 
interval = "4h"

# ==========================================
# メイン画面
# ==========================================
st.title(f"🤖 {selected_name} - AI完全特化 分析ダッシュボード")
st.markdown("従来の鉄板ロジックをAIが吸収・進化。Gemini 2.5 Flashが、チャートの全データを多角的に分析し、次の一手を断定します。")

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
            
            with st.spinner("Gemini 2.5 Flash が相場を分析中..."):
                ai_data = get_ai_prediction(df, selected_name, gemini_key)
                st.session_state.ai_decision = ai_data["decision"]
                st.session_state.ai_reason = ai_data["reason"]
                st.session_state.ai_target = ai_data["target"]
                st.session_state.ai_stop = ai_data["stop"]
        
        ai_decision = st.session_state.get('ai_decision', 'neutral')
        ai_reason = st.session_state.get('ai_reason', 'サイドバーのボタンを押して分析を開始してください。')
        ai_target = st.session_state.get('ai_target', 0)
        ai_stop = st.session_state.get('ai_stop', 0)
        
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

    info_text = (
        f"<b>【AI分析ステータス】</b><br>"
        f"<span style='color:{current_trend_color}; font-size:18px;'><b>{current_trend_text}</b></span><br>"
        f"現在値: {current_price:.4f}<br>"
        f"RSI(14): <b>{current_rsi:.1f}</b><br><br>"
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
        
        col_res1, col_res2 = st.columns([1, 1])
        with col_res1:
            if ai_decision == "buy":
                st.success(f"🚀 **AI判定: 買い (BUY)**")
                st.metric("🎯 利確ターゲット", f"{ai_target:.4f}")
                st.metric("🛡️ 損切り目安", f"{ai_stop:.4f}", delta=f"{ai_stop - current_price:.4f}", delta_color="inverse")
            else:
                st.error(f"💥 **AI判定: 売り (SELL)**")
                st.metric("🎯 利確ターゲット", f"{ai_target:.4f}")
                st.metric("🛡️ 損切り目安", f"{ai_stop:.4f}", delta=f"{ai_stop - current_price:.4f}")
        
        with col_res2:
            st.info("AIが分析を完了しました。判定結果を確認してください。")

    # ==========================================
    # 分析パネル
    # ==========================================
    col1, col2 = st.columns([1, 1.5])
    
    with col1:
        st.subheader("💡 現在のパラメーター値")
        st.write(f"- **現在価格**: `{current_price:.4f}`")
        st.write(f"- **RSI (14)**: `{current_rsi:.1f}`")
        st.write(f"- **20 SMA (中央線)**: `{sma20:.4f}`")
        st.write(f"- **上部バンド (+2.5σ)**: `{upper_bb:.4f}`")
        st.write(f"- **下部バンド (-2.5σ)**: `{lower_bb:.4f}`")

    with col2:
        st.subheader("🤖 AI完全監視・分析中")
        st.info("AIがチャートの形状、テクニカル指標、ボラティリティを総合的に判断しています。結果は上のレポートを確認してください。")
