import yfinance as yf
import pandas as pd
import numpy as np

def identify_support_resistance(df, num_pivots=5):
    """過去の高値・安値からサポート・レジスタンス帯を自動計算"""
    highs = df['High'].values
    lows = df['Low'].values
    
    # 簡単なピボットポイント抽出（ローカルな高値安値）
    sr_levels = []
    for i in range(2, len(df)-2):
        if lows[i] < lows[i-1] and lows[i] < lows[i+1] and lows[i] < lows[i-2] and lows[i] < lows[i+2]:
            sr_levels.append(('Support', lows[i], df.index[i]))
        if highs[i] > highs[i-1] and highs[i] > highs[i+1] and highs[i] > highs[i-2] and highs[i] > highs[i+2]:
            sr_levels.append(('Resistance', highs[i], df.index[i]))
            
    return sr_levels[-num_pivots*2:] # 直近のものを返す

def detect_bullish_pinbar(row):
    """下ヒゲピンバー（買い圧力）の検知"""
    body = abs(row['Close'] - row['Open'])
    lower_wick = row['Open'] - row['Low'] if row['Close'] > row['Open'] else row['Close'] - row['Low']
    upper_wick = row['High'] - row['Close'] if row['Close'] > row['Open'] else row['High'] - row['Open']
    
    # 実体が小さく、下ヒゲが実体の2倍以上あり、上ヒゲが小さい
    if body > 0 and lower_wick > body * 2 and upper_wick < body:
        return True
    return False

def detect_bullish_engulfing(df, i):
    """強気包み足（Bull Cross/Pierceの類似サイン）"""
    if i < 1: return False
    prev = df.iloc[i-1]
    curr = df.iloc[i]
    
    # 前日が陰線、当日が陽線で、前日を包み込んでいる
    if prev['Close'] < prev['Open'] and curr['Close'] > curr['Open']:
        if curr['Open'] <= prev['Close'] and curr['Close'] >= prev['Open']:
            return True
    return False

def analyze_market_action(ticker="JPY=X", period="1mo", interval="1d"): # デフォルトはドル円
    print(f"=== {ticker} のプライスアクション分析 ({interval}足) ===")
    t = yf.Ticker(ticker)
    df = t.history(period=period, interval=interval)
    
    if df.empty:
        print("データを取得できませんでした。")
        return
        
    df['Pinbar'] = df.apply(detect_bullish_pinbar, axis=1)
    
    engulfing = [False]
    for i in range(1, len(df)):
        engulfing.append(detect_bullish_engulfing(df, i))
    df['Engulfing'] = engulfing

    # 直近のサポート・レジスタンス
    sr_levels = identify_support_resistance(df)
    
    current_price = float(df['Close'].iloc[-1])
    print(f"現在価格: {current_price:.3f}")
    
    print("\n--- 直近のサポート/レジスタンス帯 ---")
    sr_sorted = sorted([level[1] for level in sr_levels])
    for price in sr_sorted:
        tag = "🔴 レジスタンス (上値抵抗線)" if price > current_price else "🟢 サポート (下値支持線)"
        distance = abs(current_price - price)
        # 価格が近い順に強調
        if distance < (current_price * 0.005): # 0.5%以内
            print(f"⭐ {tag}: {price:.3f} (現在価格に非常に近いです！反発・ブレイク注意)")
        else:
            print(f"- {tag}: {price:.3f}")

    print("\n--- チャート・シグナル検知 ---")
    recent_signals = []
    
    for i in range(-5, 0): # 直近5本をチェック
        if df['Pinbar'].iloc[i]:
            recent_signals.append(f"{df.index[i].strftime('%Y-%m-%d %H:%M')}: 📍 下ヒゲピンバー出現（買い圧力の強まり）")
        if df['Engulfing'].iloc[i]:
            recent_signals.append(f"{df.index[i].strftime('%Y-%m-%d %H:%M')}: 🐂 強気包み足出現（大口の買い転換サイン）")
            
    if not recent_signals:
        print("直近に強い買いサインは出ていません。")
    else:
        for sig in recent_signals:
            print(sig)
            
    # レーダーのような総合判断
    print("\n--- AI 総合判断 ---")
    closest_support = max([p for p in sr_sorted if p < current_price], default=None)
    
    if closest_support and (current_price - closest_support) / current_price < 0.005 and recent_signals:
        print("★★★ 激熱サイン: 強力なサポートライン付近で買いシグナルが発生しています！絶好の買い（ロング）ポイントです。（損切りはサポートの少し下）")
    elif closest_support and (current_price - closest_support) / current_price < 0.005:
        print("★★☆ 注目: サポートライン付近まで落ちてきています。反発のサイン（陽線や下ヒゲ）が出るか監視してください。")
    elif recent_signals:
        print("★☆☆ サイン発生: 買いのシグナルは発生していますが、サポートラインからは少し離れています。")
    else:
        print("〇 様子見: 現在はサポート帯とレジスタンス帯の中間付近で、明確なサインも出ていません。")

if __name__ == "__main__":
    analyze_market_action(ticker="JPY=X", period="1mo", interval="1d") # ドル円の日足
    print("\n===============================")
    analyze_market_action(ticker="BTC-USD", period="15d", interval="4h") # ビットコインの4時間足
