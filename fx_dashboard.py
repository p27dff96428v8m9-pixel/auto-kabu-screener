import streamlit as st
import yfinance as yf
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from datetime import timedelta

st.set_page_config(page_title="FX 勝率特化ダッシュボード", layout="wide", page_icon="📈")

# ==========================================
# 究極の高勝率ロジック (RSI極値 + ボリンジャーバンド2.5σ)
# ==========================================
def calculate_indicators(df):
    if len(df) < 30:
        df['RSI'] = 50
        df['SMA20'] = df['Close']
        df['UpperBB'] = df['Close'] * 1.01
        df['LowerBB'] = df['Close'] * 0.99
        df['ATR'] = df['Close'] * 0.005
        df['Strong_Buy'] = False
        df['Strong_Sell'] = False
        return df
        
    # RSI (14)
    delta = df['Close'].diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = -delta.clip(upper=0).rolling(14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # Bollinger Bands (20, 2.5σ) - かなり厳しい条件
    df['SMA20'] = df['Close'].rolling(20).mean()
    df['STD20'] = df['Close'].rolling(20).std()
    df['UpperBB'] = df['SMA20'] + (df['STD20'] * 2.5)
    df['LowerBB'] = df['SMA20'] - (df['STD20'] * 2.5)
    
    # ATR (14) - ボラティリティ把握と損切幅計算用
    df['ATR'] = (df['High'] - df['Low']).rolling(14).mean().bfill()
    
    # 超高勝率シグナル判定
    # 買い: バンド下限突き抜け ＆ RSI 25以下 (極端な売られすぎからの反発)
    df['Strong_Buy'] = (df['Low'] <= df['LowerBB']) & (df['RSI'] < 25)
    
    # 売り: バンド上限突き抜け ＆ RSI 75以上 (極端な買われすぎからの反落)
    df['Strong_Sell'] = (df['High'] >= df['UpperBB']) & (df['RSI'] > 75)
    
    return df

def calculate_win_rate(df):
    bull_wins = 0; bull_losses = 0
    bear_wins = 0; bear_losses = 0
    outcomes_record = []
    
    for i in range(25, len(df) - 15):
        current_price = df['Close'].iloc[i]
        current_idx = df.index[i]
        atr = df['ATR'].iloc[i]
        
        # 買いシグナル勝敗判定 (超高勝率仕様)
        if df['Strong_Buy'].iloc[i] and pd.notna(df['LowerBB'].iloc[i]):
            stop = df['Low'].iloc[i] - (atr * 2.0) # 損切を極限まで広げ狩りを防ぐ
            target = current_price + (atr * 0.8)   # 利確を確実な反発幅（0.8ATR）に設定
            
            outcome = "none"
            for j in range(1, 40): # 最大約1週間待つ
                if i+j >= len(df): break
                if df['Low'].iloc[i+j] <= stop: outcome = "loss"; break
                if df['High'].iloc[i+j] >= target: outcome = "win"; break
            if outcome == "win": 
                bull_wins += 1
                outcomes_record.append(('bull_win', current_idx, current_price - (atr*0.8))) 
            elif outcome == "loss": 
                bull_losses += 1
                outcomes_record.append(('bull_loss', current_idx, current_price - (atr*0.8))) 
        
        # 売りシグナル勝敗判定 (超高勝率仕様)
        if df['Strong_Sell'].iloc[i] and pd.notna(df['UpperBB'].iloc[i]):
            stop = df['High'].iloc[i] + (atr * 2.0) 
            target = current_price - (atr * 0.8)
            
            outcome = "none"
            for j in range(1, 40): 
                if i+j >= len(df): break
                if df['High'].iloc[i+j] >= stop: outcome = "loss"; break
                if df['Low'].iloc[i+j] <= target: outcome = "win"; break
            if outcome == "win": 
                bear_wins += 1
                outcomes_record.append(('bear_win', current_idx, current_price + (atr*0.8))) 
            elif outcome == "loss": 
                bear_losses += 1
                outcomes_record.append(('bear_loss', current_idx, current_price + (atr*0.8))) 

    bull_total = bull_wins + bull_losses
    bear_total = bear_wins + bear_losses
    bull_rate = (bull_wins / bull_total * 100) if bull_total > 0 else 0
    bear_rate = (bear_wins / bear_total * 100) if bear_total > 0 else 0
    
    return bull_rate, bull_total, bear_rate, bear_total, outcomes_record


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
    "GOLD (金)": "GC=F", 
    "Bitcoin (BTC)": "BTC-USD"
}

st.sidebar.image("https://img.icons8.com/color/96/000000/line-chart.png", width=60)
st.sidebar.title("FX自動監視システム")
st.sidebar.markdown("完全勝率特化ロジック適用中")
st.sidebar.markdown("---")

# ボタンのズレ問題を解決するため、ラジオボタンを使用
if 'selected_pair' not in st.session_state:
    st.session_state.selected_pair = list(CURRENCY_PAIRS.keys())[0]

# ラジオボタンで状態管理のズレを完全解消
selected_name = st.sidebar.radio(
    "**分析するペア（4時間足）を選択**",
    list(CURRENCY_PAIRS.keys()),
    index=list(CURRENCY_PAIRS.keys()).index(st.session_state.selected_pair)
)
st.session_state.selected_pair = selected_name
ticker = CURRENCY_PAIRS[selected_name]

# 期間と足の設定（4時間足で固定）
period = "60d" 
interval = "4h"

# ==========================================
# メイン画面
# ==========================================
st.title(f"📊 {selected_name} - 勝率特化 分析ダッシュボード")
st.markdown("従来の複雑なロジックを排除し、**「ボリンジャーバンド2.5σ突破」かつ「RSI極値到達」の鉄板回帰ポイントのみ**を厳選して抽出します。")

# データの取得
with st.spinner(f"{selected_name}のデータを取得・解析中..."):
    t = yf.Ticker(ticker)
    df = t.history(period=period, interval=interval)
    
if df.empty:
    st.error("データを取得できませんでした。休場時間、あるいはティッカーが無効の可能性があります。")
else:
    # 指標の計算
    df = calculate_indicators(df)
    current_price = float(df['Close'].iloc[-1])
    
    # 勝率の計算
    bull_rate, bull_total, bear_rate, bear_total, outcomes_record = calculate_win_rate(df)
    
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

    # アラートサインのプロット
    bull_signs_idx = df.index[df['Strong_Buy']]
    bull_signs_y = df['Low'][df['Strong_Buy']] - (df['ATR'][df['Strong_Buy']] * 0.5)
    
    if len(bull_signs_idx) > 0:
        fig.add_trace(go.Scatter(x=bull_signs_idx, y=bull_signs_y, mode='markers+text',
                                 marker=dict(symbol='triangle-up', size=20, color='#00ff00'),
                                 text=["⬆️ 買い"] * len(bull_signs_idx), textposition="bottom center",
                                 textfont=dict(color="#00ff00", size=15, weight='bold'),
                                 name='買いサイン'))
                                 
    bear_signs_idx = df.index[df['Strong_Sell']]
    bear_signs_y = df['High'][df['Strong_Sell']] + (df['ATR'][df['Strong_Sell']] * 0.5)
    
    if len(bear_signs_idx) > 0:
        fig.add_trace(go.Scatter(x=bear_signs_idx, y=bear_signs_y, mode='markers+text',
                                 marker=dict(symbol='triangle-down', size=20, color='#ff0000'),
                                 text=["⬇️ 売り"] * len(bear_signs_idx), textposition="top center",
                                 textfont=dict(color="#ff0000", size=15, weight='bold'),
                                 name='売りサイン'))
                                 
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
    upper_bb = df['UpperBB'].iloc[-1]
    lower_bb = df['LowerBB'].iloc[-1]
    sma20 = df['SMA20'].iloc[-1]
    
    is_strong_buy = df['Strong_Buy'].iloc[-1]
    is_strong_sell = df['Strong_Sell'].iloc[-1]
    
    bg_color = "#111111"
    current_trend_text = "🔄 待機・様子見"
    current_trend_color = "white"
    tp_val = "---"
    sl_val = "---"
    
    if is_strong_buy:
        bg_color = "#1a4d29"
        current_trend_text = "🚀 【激熱】鉄板買いポイント到達！"
        current_trend_color = "#00ff00"
        sl_val = f"{(current_price - current_atr * 2.0):.3f}"
        tp_val = f"{(current_price + current_atr * 0.8):.3f}"
    elif is_strong_sell:
        bg_color = "#4d1a1a"
        current_trend_text = "💥 【激熱】鉄板売りポイント到達！"
        current_trend_color = "#ff0000"
        sl_val = f"{(current_price + current_atr * 2.0):.3f}"
        tp_val = f"{(current_price - current_atr * 0.8):.3f}"
    elif current_price <= lower_bb * 1.002:
        bg_color = "#1a3320"
        current_trend_text = "🔽 買い準備 (バンド下限到達)"
        current_trend_color = "#88ff88"
    elif current_price >= upper_bb * 0.998:
        bg_color = "#331a1a"
        current_trend_text = "🔼 売り準備 (バンド上限到達)"
        current_trend_color = "#ff8888"

    info_text = (
        f"<b>【現在ステータス】</b><br>"
        f"<span style='color:{current_trend_color}; font-size:18px;'><b>{current_trend_text}</b></span><br>"
        f"現在値: {current_price:.3f}<br>"
        f"RSI(14): <b>{current_rsi:.1f}</b><br><br>"
        f"目標値(TP): <span style='color:dodgerblue;'>{tp_val}</span><br>"
        f"損切り(SL): <span style='color:red;'>{sl_val}</span><br>"
        f"────────────────<br>"
        f"<b>【鉄板サイン勝率統計】</b><br>"
        f"🔼 買い勝率: <b style='color:#00ff00;'>{bull_rate:.1f}%</b> ({bull_total}回)<br>"
        f"🔽 売り勝率: <b style='color:#ff5555;'>{bear_rate:.1f}%</b> ({bear_total}回)"
    )
    
    fig.update_layout(
        title=f"【{selected_name}】 4時間足 - ボリンジャーバンド & RSI 極地反発チャート",
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
    
    st.plotly_chart(fig, use_container_width=True, config={'scrollZoom': True})

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
        st.subheader("🤖 完全勝率特化AI アドバイス")
        
        if is_strong_buy:
            st.success("★★★★★ **【鉄板・買いシグナル点灯】**: \n価格がバンドの下限(-2.5σ)を突き破り、RSIも25未満の超・売られすぎ水準に達しました！ 強烈な反発（買い）の絶好機です。")
        elif is_strong_sell:
            st.error("★★★★★ **【鉄板・売りシグナル点灯】**: \n価格がバンドの上限(+2.5σ)を突き破り、RSIも75以上の超・買われすぎ水準に達しました！ 強烈な反落（売り）の絶好機です。")
        elif current_rsi < 35:
            st.warning("⚠️ **【買い準備アラート】**: \nRSIが売られすぎ水準に近づいています。バンドの下限にタッチしたら買いの準備をしてください。")
        elif current_rsi > 65:
            st.warning("⚠️ **【売り準備アラート】**: \nRSIが買われすぎ水準に近づいています。バンドの上限にタッチしたら売りの準備をしてください。")
        else:
            st.info("☆☆☆☆☆ **【完全様子見】**: \n現在は価格が通常レンジ内で推移しています。確実な勝率を叩き出すため、極値に達するまで一切手を出さずに待機してください。勝率を落とす最大の原因は『待てないこと』です。")
