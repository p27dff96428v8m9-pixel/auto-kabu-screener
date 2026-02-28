import streamlit as st
import yfinance as yf
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from datetime import timedelta

st.set_page_config(page_title="FX・為替 自動分析ダッシュボード", layout="wide", page_icon="📈")

# ==========================================
# テクニカル分析用関数群
# ==========================================
def identify_support_resistance(df, num_pivots=5):
    highs = df['High'].values
    lows = df['Low'].values
    sr_levels = []
    
    for i in range(2, len(df)-2):
        if lows[i] < lows[i-1] and lows[i] < lows[i+1] and lows[i] < lows[i-2] and lows[i] < lows[i+2]:
            sr_levels.append(('Support', lows[i], df.index[i]))
        if highs[i] > highs[i-1] and highs[i] > highs[i+1] and highs[i] > highs[i-2] and highs[i] > highs[i+2]:
            sr_levels.append(('Resistance', highs[i], df.index[i]))
            
    return sr_levels[-num_pivots*2:] 

def detect_bullish_pinbar(row):
    body = abs(row['Close'] - row['Open'])
    lower_wick = row['Open'] - row['Low'] if row['Close'] > row['Open'] else row['Close'] - row['Low']
    upper_wick = row['High'] - row['Close'] if row['Close'] > row['Open'] else row['High'] - row['Open']
    # 実体の2倍以上の下ヒゲがあり、上ヒゲが実体より小さい（条件緩和）
    if body > 0 and lower_wick >= body * 2.0 and upper_wick <= body:
        return True
    return False

def detect_bearish_pinbar(row):
    body = abs(row['Close'] - row['Open'])
    lower_wick = row['Open'] - row['Low'] if row['Close'] > row['Open'] else row['Close'] - row['Low']
    upper_wick = row['High'] - row['Close'] if row['Close'] > row['Open'] else row['High'] - row['Open']
    if body > 0 and upper_wick >= body * 2.0 and lower_wick <= body:
        return True
    return False

def detect_bullish_engulfing(df, i):
    if i < 1: return False
    prev = df.iloc[i-1]
    curr = df.iloc[i]
    if prev['Close'] < prev['Open'] and curr['Close'] > curr['Open']: # 陰線の後に陽線
        if curr['Open'] <= prev['Close'] and curr['Close'] >= prev['Open']: # 包み込み
            return True
    return False

def detect_bearish_engulfing(df, i):
    if i < 1: return False
    prev = df.iloc[i-1]
    curr = df.iloc[i]
    if prev['Close'] > prev['Open'] and curr['Close'] < curr['Open']: # 陽線の後に陰線
        if curr['Open'] >= prev['Close'] and curr['Close'] <= prev['Open']:
            return True
    return False

def calculate_pa_confidence_score(df, i, is_bull, sr_levels):
    """
    小波を無視し、大局的な「上がりきった場所（天井）」「下がりきった場所（大底）」での
    強力な反発（マクロ的なトレンド転換）のみを狙い撃ちするプライスアクション判定。
    """
    score = 0
    current_price = df['Close'].iloc[i]
    atr = df['ATR'].iloc[i]
    
    # 1. ローソク足の基礎モメンタム形状 (最大50点)
    if is_bull:
        if detect_bullish_pinbar(df.iloc[i]): score += 50
        elif detect_bullish_engulfing(df, i): score += 40
    else:
        if detect_bearish_pinbar(df.iloc[i]): score += 50
        elif detect_bearish_engulfing(df, i): score += 40

    if score == 0:
        return 0 # プライスアクションがなければ即0点
        
    # 2. 波の大きさ（スイング）と「サインの集中（ダマシの吸収）」の判定
    macro_score = 0
    
    if is_bull:
        low_current = df['Low'].iloc[i]
        recent_max = df['High'].iloc[max(0, i-30):i].max() if i > 0 else current_price
        recent_min = df['Low'].iloc[max(0, i-30):i].min() if i > 0 else current_price
        
        wave_drop = recent_max - low_current
        
        if wave_drop > atr * 2.5: # 明らかな下落波
            # 過去30本の最安値をさらに下抜けてから反発したか（ストップハンティング/スイープ）
            if low_current <= recent_min:
                macro_score += 40 # 相場の底を完璧に捉えた可能性
            elif low_current <= recent_min + (atr * 0.4):
                macro_score += 20 # 底値圏
                
        # 過去15本以内にブル（買い）サインが出ているか？（底固めのクラスター）
        bull_cluster = sum(1 for k in range(max(0, i-15), i) if detect_bullish_pinbar(df.iloc[k]) or detect_bullish_engulfing(df, k))
        if bull_cluster >= 1:
            macro_score += 30 # クラスター形成（ここでダマシを吸収してホンモノになる）

    else: # is_bear
        high_current = df['High'].iloc[i]
        recent_max = df['High'].iloc[max(0, i-30):i].max() if i > 0 else current_price
        recent_min = df['Low'].iloc[max(0, i-30):i].min() if i > 0 else current_price
        
        wave_rise = high_current - recent_min
        
        if wave_rise > atr * 2.5: # 明らかな上昇波
            # 過去30本の最高値をさらに上抜けてから叩き落とされたか（ストップハンティング/スイープ）
            if high_current >= recent_max:
                macro_score += 40 # 相場の天井を完璧に捉えた可能性（一番上の〇）
            elif high_current >= recent_max - (atr * 0.4):
                macro_score += 20 # 天井圏
                
        # 過去15本以内にクマ（売り）サインが出ているか？（天井固めのクラスター）
        bear_cluster = sum(1 for k in range(max(0, i-15), i) if detect_bearish_pinbar(df.iloc[k]) or detect_bearish_engulfing(df, k))
        if bear_cluster >= 1:
            macro_score += 30 # クラスター形成（ここでダマシを吸収してホンモノになる）

    score += macro_score
    return min(100, score)

def calculate_win_rate(df, sr_levels):
    """過去のシグナルから勝率（リスク1:リワード1.5）をATRベースで動的に計算"""
    bull_wins = 0; bull_losses = 0
    bear_wins = 0; bear_losses = 0
    outcomes_record = []
    
    # ボラティリティ（ATR）のみ計算
    df['ATR'] = (df['High'] - df['Low']).rolling(14).mean().bfill()
    
    for i in range(14, len(df) - 15):
        current_price = df['Close'].iloc[i]
        current_idx = df.index[i]
        atr = df['ATR'].iloc[i]
        
        # ボラティリティに応じてサポレジのストライクゾーンを動的変動 (ATRの50%以内なら近接とみなす)
        is_near_supp = False
        is_near_res = False
        for s_type, price, _ in sr_levels:
            if s_type == 'Support' and abs(current_price - price) <= atr * 0.8:
                is_near_supp = True
            if s_type == 'Resistance' and abs(current_price - price) <= atr * 0.8:
                is_near_res = True

        # PAスコアの計算とフィルターの適用
        # 買い: PA確信度スコアが 80点以上なら良しとする
        bull_score = calculate_pa_confidence_score(df, i, True, sr_levels)
        bear_score = calculate_pa_confidence_score(df, i, False, sr_levels)
        
        is_valid_bull = (bull_score >= 80)
        is_valid_bear = (bear_score >= 80)

        # 買いサインの勝敗検証
        if (df['Bull_Pinbar'].iloc[i] or df['Bull_Engulfing'].iloc[i]) and is_valid_bull:
            # エントリー位置（終値）からではなく、ローソク足の最安値（ヒゲの先）の少し下にストップを置く（プロの損切位置）
            stop = df['Low'].iloc[i] - (atr * 0.3)
            risk = current_price - stop
            target = current_price + (risk * 1.5) # リスクリワード1:1.5
            
            outcome = "none"
            for j in range(1, 15): 
                if df['Low'].iloc[i+j] <= stop: outcome = "loss"; break
                if df['High'].iloc[i+j] >= target: outcome = "win"; break
            if outcome == "win": 
                bull_wins += 1
                outcomes_record.append(('bull_win', current_idx, current_price - (atr*0.8))) 
            elif outcome == "loss": 
                bull_losses += 1
                outcomes_record.append(('bull_loss', current_idx, current_price - (atr*0.8))) 
        
        # 売りサインの勝敗検証
        if (df['Bear_Pinbar'].iloc[i] or df['Bear_Engulfing'].iloc[i]) and is_valid_bear:
            # ヒゲの頂点（最高値）の少し上にストップを置く（天井固め中のノイズで狩られないようにする）
            stop = df['High'].iloc[i] + (atr * 0.3)
            risk = stop - current_price
            target = current_price - (risk * 1.5) # リスクリワード1:1.5
            
            outcome = "none"
            for j in range(1, 15): 
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
# サイドバー（銘柄選択）
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
st.sidebar.markdown("MT4ベースのプライスアクション分析")
st.sidebar.markdown("---")

if 'selected_pair' not in st.session_state:
    st.session_state.selected_pair = list(CURRENCY_PAIRS.keys())[0]

st.sidebar.markdown("**分析するペア（4時間足）を選択**")
for pair_name in CURRENCY_PAIRS.keys():
    # 選択されているボタンは視覚的に少し変える（Streamlitのデフォルトスタイル内で対応）
    is_selected = (pair_name == st.session_state.selected_pair)
    button_type = "primary" if is_selected else "secondary"
    
    if st.sidebar.button(pair_name, use_container_width=True, type=button_type):
        st.session_state.selected_pair = pair_name

selected_name = st.session_state.selected_pair
ticker = CURRENCY_PAIRS[selected_name]

# 期間と足の設定（4時間足で固定）
period = "60d" 
interval = "4h"

# ==========================================
# メイン画面
# ==========================================
st.title(f"📊 {selected_name} - チャート分析ダッシュボード")
st.markdown("AIが過去の高値・安値から**レジスタンス/サポート（抵抗帯/支持帯）**を自動計算し、強い転換サイン（包み足・ピンバー）を検知します。")

# データの取得
with st.spinner("リアルタイム為替データを取得・AI解析中..."):
    t = yf.Ticker(ticker)
    df = t.history(period=period, interval=interval)
    
if df.empty:
    st.error("データを取得できませんでした。休場時間、あるいはティッカーが無効の可能性があります。")
else:
    # 指標の計算
    df['Bull_Pinbar'] = df.apply(detect_bullish_pinbar, axis=1)
    df['Bear_Pinbar'] = df.apply(detect_bearish_pinbar, axis=1)
    
    bull_engulfing = [False]
    bear_engulfing = [False]
    for i in range(len(df)):
        bull_engulfing.append(detect_bullish_engulfing(df, i))
        bear_engulfing.append(detect_bearish_engulfing(df, i))
    # 長さを合わせる
    bull_engulfing = bull_engulfing[:len(df)]
    bear_engulfing = bear_engulfing[:len(df)]
    
    df['Bull_Engulfing'] = bull_engulfing
    df['Bear_Engulfing'] = bear_engulfing

    sr_levels = identify_support_resistance(df)
    current_price = float(df['Close'].iloc[-1])
    
    # 最近の勝率を計算（サポレジの情報を渡し、勝敗の座標を受け取る）
    bull_rate, bull_total, bear_rate, bear_total, outcomes_record = calculate_win_rate(df, sr_levels)
    
    # ==========================================
    # プロ仕様のチャート描画 (Plotly)
    # ==========================================
    fig = go.Figure(data=[go.Candlestick(x=df.index,
                    open=df['Open'], high=df['High'],
                    low=df['Low'], close=df['Close'],
                    name="価格",
                    increasing_line_color='blue',   # 陽線を青（ブル）に
                    decreasing_line_color='red',    # 陰線を赤（ベア）に
                    increasing_fillcolor='blue',
                    decreasing_fillcolor='red'
                    )])
    
    sr_sorted = sorted([level[1] for level in sr_levels])
    
    # サポート・レジスタンスラインの色分け描画
    for s_type, price, dt in sr_levels:
        # サポートは緑(lime)、レジスタンスは黄(yellow)に色分け
        color = "lime" if s_type == 'Support' else "yellow"
        dash = "solid"
        
        fig.add_shape(type="line",
            x0=df.index[0], y0=price, x1=df.index[-1] + timedelta(days=2), y1=price,
            line=dict(color=color, width=1, dash=dash),
            opacity=0.5
        )

    # アラートサインのプロット
    bull_signs_idx = df.index[df['Bull_Pinbar'] | df['Bull_Engulfing']]
    bull_signs_y = df['Low'][df['Bull_Pinbar'] | df['Bull_Engulfing']] - (current_price*0.002)
    
    if len(bull_signs_idx) > 0:
        fig.add_trace(go.Scatter(x=bull_signs_idx, y=bull_signs_y, mode='markers+text',
                                 marker=dict(symbol='triangle-up', size=14, color='lime'),
                                 text=["ブル(Bull)"] * len(bull_signs_idx), textposition="bottom center",
                                 textfont=dict(color="lime"),
                                 name='買いサイン'))
                                 
    bear_signs_idx = df.index[df['Bear_Pinbar'] | df['Bear_Engulfing']]
    bear_signs_y = df['High'][df['Bear_Pinbar'] | df['Bear_Engulfing']] + (current_price*0.002)
    
    if len(bear_signs_idx) > 0:
        fig.add_trace(go.Scatter(x=bear_signs_idx, y=bear_signs_y, mode='markers+text',
                                 marker=dict(symbol='triangle-down', size=14, color='white'),
                                 text=["クマ(Bear)"] * len(bear_signs_idx), textposition="top center",
                                 textfont=dict(color="white"),
                                 name='売りサイン'))
                                 
    # 過去のアラートの勝敗（〇と×）をプロット
    # 絵文字に戻して表示
    win_x = [rt[1] for rt in outcomes_record if 'win' in rt[0]]
    win_y = [rt[2] for rt in outcomes_record if 'win' in rt[0]]
    if win_x:
        fig.add_trace(go.Scatter(x=win_x, y=win_y, mode='text',
                                 text=["⭕"] * len(win_x), textposition="middle center",
                                 textfont=dict(size=16),
                                 name='利確 (Win)'))

    loss_x = [rt[1] for rt in outcomes_record if 'loss' in rt[0]]
    loss_y = [rt[2] for rt in outcomes_record if 'loss' in rt[0]]
    if loss_x:
        fig.add_trace(go.Scatter(x=loss_x, y=loss_y, mode='text',
                                 text=["❌"] * len(loss_x), textposition="middle center",
                                 textfont=dict(size=16),
                                 name='損切 (Loss)'))

    # 直感的な買い・売りゾーンの背景色追加
    has_bull_recent_bg = False
    has_bear_recent_bg = False
    for i in range(-3, 0): # 直近12時間で強いサインがあれば背景を変える
        if df['Bull_Pinbar'].iloc[i] or df['Bull_Engulfing'].iloc[i]:
            has_bull_recent_bg = True
        if df['Bear_Pinbar'].iloc[i] or df['Bear_Engulfing'].iloc[i]:
            has_bear_recent_bg = True
            
    closest_supp_bg = max([p for p in sr_sorted if p < current_price], default=None)
    closest_res_bg = min([p for p in sr_sorted if p > current_price], default=None)
    
    current_atr = df['ATR'].iloc[-1]
    
    # どちらにより近いかを比較
    dist_to_supp = (current_price - closest_supp_bg) if closest_supp_bg else 999999
    dist_to_res = (closest_res_bg - current_price) if closest_res_bg else 999999
    
    # ATRの0.8倍以内なら「ゾーン内」と判定
    is_near_supp_bg = dist_to_supp <= current_atr * 0.8
    is_near_res_bg = dist_to_res <= current_atr * 0.8
    
    bg_color = "#111111" # デフォルト背景
    
    current_trend_text = "🔄 様子見 (Neutral)"
    current_trend_color = "white"
    tp_val = "---"
    sl_val = "---"
    entry_val = f"{current_price:.3f}"
    
    # 売り買い両方に近い場合は、より近い方を優先する
    if is_near_supp_bg and (not is_near_res_bg or dist_to_supp <= dist_to_res):
        if has_bull_recent_bg:
            bg_color = "#1a4d29" # 激熱の買い（濃い緑背景）
            current_trend_text = "🚀 激熱買い (STRONG BUY)"
            current_trend_color = "#00ff00"
        else:
            bg_color = "#1a3320" # 買い準備（薄い緑背景）
            current_trend_text = "🔼 買い準備ゾーン (BULL ZONE)"
            current_trend_color = "#88ff88"
            
        sl_val = f"{closest_supp_bg * 0.998:.3f}" if closest_supp_bg else "---"
        res_above = min([p for p in sr_sorted if p > current_price], default=None)
        tp_val = f"{res_above:.3f}" if res_above else "---"
        
    elif is_near_res_bg and (not is_near_supp_bg or dist_to_res < dist_to_supp):
        if has_bear_recent_bg:
            bg_color = "#4d1a1a" # 激熱の売り（濃い赤背景）
            current_trend_text = "💥 激熱売り (STRONG SELL)"
            current_trend_color = "#ff0000"
        else:
            bg_color = "#331a1a" # 売り準備（薄い赤背景）
            current_trend_text = "🔽 売り準備ゾーン (BEAR ZONE)"
            current_trend_color = "#ff8888"
            
        sl_val = f"{closest_res_bg * 1.002:.3f}" if closest_res_bg else "---"
        supp_below = max([p for p in sr_sorted if p < current_price], default=None)
        tp_val = f"{supp_below:.3f}" if supp_below else "---"
        
    # 右上に表示するまとめたテキスト
    info_text = (
        f"<b>【現在ステータス】</b><br>"
        f"<span style='color:{current_trend_color}; font-size:18px;'><b>{current_trend_text}</b></span><br>"
        f"現在値 (Entry): {entry_val}<br>"
        f"目標値 (TP)   : <span style='color:dodgerblue;'>{tp_val}</span><br>"
        f"損切り (SL)   : <span style='color:red;'>{sl_val}</span><br>"
        f"────────────────<br>"
        f"<b>【統計データ (厳選サイン)】</b><br>"
        f"🔼 ブル勝率: <b style='color:#00ff00;'>{bull_rate:.1f}%</b> (過去{bull_total}回)<br>"
        f"🔽 ベア勝率: <b style='color:#ff5555;'>{bear_rate:.1f}%</b> (過去{bear_total}回)"
    )

    # TPとSLのラインをチャート上に直接描写（設定されている場合のみ）
    if tp_val != "---":
        fig.add_hline(y=float(tp_val), line_dash="dashdot", line_color="dodgerblue", line_width=2,
                      annotation_text="🎯 目標値 (TP)", annotation_position="top right", 
                      annotation_font_color="dodgerblue", annotation_font_size=14)
    if sl_val != "---":
        fig.add_hline(y=float(sl_val), line_dash="dash", line_color="red", line_width=2,
                      annotation_text="✂️ 損切り (SL)", annotation_position="bottom right", 
                      annotation_font_color="red", annotation_font_size=14)
                      
    fig.update_layout(
        title=f"【{selected_name}】 4時間足 - プライスアクション自動認識チャート",
        yaxis_title="価格 (Price)",
        xaxis_title="日時 (4H)",
        template="plotly_dark", # MT4のような黒背景
        plot_bgcolor=bg_color,  # チャートの背景色をシグナル状態に応じて変更
        paper_bgcolor="#111111",
        height=750, # 高さを750に戻して大きく表示
        margin=dict(l=0, r=0, b=0, t=40),
        legend=dict(yanchor="top", y=0.99, xanchor="left", x=0.01),
        dragmode='pan' # 初期状態でマウスドラッグを「移動(パン)」に設定（MT4と同じ挙動）
    )
    
    # チャートに白のグリッド線を追加し、縦横の自由な伸縮（スケール変更）を許可
    fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor='rgba(255, 255, 255, 0.1)')
    # デフォルト表示範囲（直近14日）の最低・最高価格を基にY軸の初期範囲を設定し、オートレンジを強制的オフにする
    # これによりユーザーがY軸を直接ドラッグしても押し戻されなくなります
    default_start_idx = max(0, len(df) - 84) # 4時間足で直近14日分（約84本）
    y_min_val = df['Low'].iloc[default_start_idx:].min() * 0.998
    y_max_val = df['High'].iloc[default_start_idx:].max() * 1.002
    fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor='rgba(255, 255, 255, 0.1)', fixedrange=False, autorange=False, range=[y_min_val, y_max_val])
    
    # 右上のステータスパネルを独立して追加
    fig.add_annotation(
        x=0.99, y=0.98, xref="paper", yref="paper",
        text=info_text,
        showarrow=False,
        font=dict(size=14, color="white"),
        align="left",
        bgcolor="rgba(0,0,0,0.7)",
        bordercolor="gray",
        borderwidth=1,
        borderpad=8
    )
    
    # デフォルトの表示期間を短くしてローソク足を太く見せる（MT4風の表示幅へ拡大）
    default_start = df.index[-1] - timedelta(days=14)
    default_end = df.index[-1] + timedelta(days=2)
    
    # MT4風の拡大・縮小ボタンをチャートの左上に追加
    fig.update_xaxes(
        range=[default_start, default_end], # 初期表示を直近2週間にズームイン
        rangeslider_visible=False,
        rangeselector=dict(
            buttons=list([
                dict(count=3, label="🔍 拡大 (3日)", step="day", stepmode="backward"),
                dict(count=7, label="🔎 拡大 (1週)", step="day", stepmode="backward"),
                dict(count=14, label="📊 標準 (2週)", step="day", stepmode="backward"),
                dict(step="all", label="🌐 全体 (縮小)")
            ]),
            bgcolor="#333333",
            activecolor="#00ffff"
        )
    )
    
    # configを使って、マウスのホイール（コロコロ）での拡大縮小を有効化
    st.plotly_chart(fig, use_container_width=True, config={'scrollZoom': True})

    # ==========================================
    # AI 分析パネル
    # ==========================================
    col1, col2 = st.columns([1, 1.5])
    
    with col1:
        st.subheader("💡 認識されたライン一覧")
        st.caption("現在価格に近いラインが「攻防の要」となります")
        
        for price in sr_sorted:
            tag = "🟡 上値抵抗線 (レジスタンス)" if price > current_price else "🟢 下値支持線 (サポート)"
            distance = abs(current_price - price) / current_price
            if distance < 0.003: # よりシビアに
                st.markdown(f"**🔥 {tag} : `{price:.3f}`  (超接近！)**")
            else:
                st.write(f"- {tag} : `{price:.3f}`")

    with col2:
        st.subheader("🤖 自動トレード AI総合判断")
        st.markdown(f"### 現在価格: 👉 **`{current_price:.3f}`**")
        
        recent_signals = []
        for i in range(-6, 0): # 直近のローソク足6本分（24時間）
            dt_str = df.index[i].strftime('%m/%d %H:%M')
            if df['Bull_Pinbar'].iloc[i]:
                recent_signals.append(f"**[{dt_str}]** 📍 **下ヒゲピンバー出現**（反発の強い買い圧力）")
            if df['Bull_Engulfing'].iloc[i]:
                recent_signals.append(f"**[{dt_str}]** 🐂 **Bull Pierce (包み足) 出現**（買い目線へ転換）")
            if df['Bear_Pinbar'].iloc[i]:
                recent_signals.append(f"**[{dt_str}]** 📍 **上ヒゲピンバー出現**（頭打ちの強い売り圧力）")
            if df['Bear_Engulfing'].iloc[i]:
                recent_signals.append(f"**[{dt_str}]** 🐻 **Bearish (包み足) 出現**（売り目線へ転換）")
        
        closest_supp = max([p for p in sr_sorted if p < current_price], default=None)
        closest_res = min([p for p in sr_sorted if p > current_price], default=None)
        
        current_atr = df['ATR'].iloc[-1]
        
        # 0.8x ATR以内にいればストライクゾーン
        is_near_supp = closest_supp and (current_price - closest_supp) <= current_atr * 0.8
        is_near_res = closest_res and (closest_res - current_price) <= current_atr * 0.8
        
        has_bull_recent = any("買い圧力" in s or "Bull Pierce" in s for s in recent_signals)
        has_bear_recent = any("売り圧力" in s or "Bearish" in s for s in recent_signals)
        
        bull_score = calculate_pa_confidence_score(df, -1, True, sr_levels)
        bear_score = calculate_pa_confidence_score(df, -1, False, sr_levels)
        
        bull_score = calculate_pa_confidence_score(df, -1, True, sr_levels)
        bear_score = calculate_pa_confidence_score(df, -1, False, sr_levels)
        
        is_strict_bull = bull_score >= 80
        is_strict_bear = bear_score >= 80
        
        is_weak_bull = (0 < bull_score < 80)
        is_weak_bear = (0 < bear_score < 80)

        st.markdown(f"**🟢 買い(Bull) 波の極値スコア:** `{bull_score} 点` / **🔴 売り(Bear) 波の極値スコア:** `{bear_score} 点`")
        
        st.markdown("#### 【現在の裁量アドバイス】")
        if is_strict_bull:
            st.success("★★★★★ **【鉄板・大底での反発買いサイン】**: \n充分な下落波が完了した大底の位置で、**ブル（買いサイン）の集中（底固め）**を伴う完璧な買いアクションを作りました！\nピンポイントでの大底ロング（買い）絶好機です。")
            st.info("💡 チャート背景が『濃い緑色』に点灯中（大底からのリバーサルゾーン）")
        elif is_strict_bear:
            st.error("★★★★★ **【鉄板・天井での反落売りサイン】**: \n充分な上昇波が完了した大天井の位置で、**クマ（売りサイン）の集中（頭打ち）**を伴う完璧な売りアクションを作りました！\nピンポイントでの大天井ショート（売り）絶好機です。")
            st.error("💡 チャート背景が『濃い赤色』に点灯中（天井からのリバーサルゾーン）")
        elif is_weak_bull:
            st.warning("⚠️ **【優位性不足の買いサイン】**: \n買いアクションが発生しましたが、まだ『下がりきった場所（マクロ的な大底）』ではありません。単なる小波のノイズの可能性があるため見送りが無難です。")
        elif is_weak_bear:
            st.warning("⚠️ **【優位性不足の売りサイン】**: \n売りアクションが発生しましたが、まだ『上がりきった場所（マクロ的な天井）』ではありません。単なる小波のノイズの可能性があるため見送りが無難です。")
        elif is_near_supp:
            st.success("★★★★☆ **【大底到達・監視激熱ゾーン】**: \n波が完全に下がりきった極値（サポート水準）に突入しました！\nここで反発のプライスアクションが作られれば、強烈な買いの絶好機になります。")
            st.info("💡 チャート背景が『薄い緑色』に点灯中（買い準備ゾーン）")
        elif is_near_res:
            st.error("★★★★☆ **【天井到達・監視激熱ゾーン】**: \n波が完全に上がりきった極値（レジスタンス水準）に突入しました！\nここで反落のプライスアクションが作られれば、強烈な売りの絶好機になります。")
            st.error("💡 チャート背景が『薄い赤色』に点灯中（売り準備ゾーン）")
        elif bull_score > 0:
            st.info("★★☆☆☆ **【買いアクション発生中】**: \n反発サインが出ていますが、大底スコアが足りません。")
        elif bear_score > 0:
            st.info("★★☆☆☆ **【売りアクション発生中】**: \n反落サインが出ていますが、天井スコアが足りません。")
        else:
            st.write("☆☆☆☆☆ **【中途半端なゾーン・完全様子見】**: \n相場が大波の極値（大底や大天井）にいません。ここで手を出しても刈られるだけです。方向転換の準備ができるまで待つのがプロです。")
            
        if recent_signals:
            st.markdown("---")
            st.markdown("##### ⏱️ 直近24時間のアラート履歴")
            for s in recent_signals:
                st.markdown(s)
