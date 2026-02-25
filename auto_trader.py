import time
import requests
import yfinance as yf
import pandas as pd
import json
import logging
import os
from datetime import datetime

# ==========================================
# GitHub Actions で毎日自動で動くスクリプト
# ==========================================

# ログの設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Webhook URLは環境変数（GitHub Secrets）から取得
WEBHOOK_URL = os.environ.get("WEBHOOK_URL")

if not WEBHOOK_URL:
    logging.error("WEBHOOK_URL が設定されていません。終了します。")
    sys.exit(1)

def run_backtest(df, buy_price, tp_price, sl_price):
    """勝率のバックテスト関数"""
    trades = []
    in_position = False
    
    for _, row in df.iterrows():
        l_price = row['Low']
        h_price = row['High']
        c_price = row['Close']
        
        if not in_position:
            if l_price <= buy_price:
                in_position = True
        else:
            if l_price <= sl_price and h_price >= tp_price:
                if (sl_price - l_price) < (h_price - tp_price):
                    trades.append(-1)
                else:
                    trades.append(1)
                in_position = False
            elif l_price <= sl_price:
                trades.append(-1)
                in_position = False
            elif h_price >= tp_price:
                trades.append(1)
                in_position = False
                
    win_count = sum(1 for t in trades if t == 1)
    loss_count = sum(1 for t in trades if t == -1)
    total_trades = win_count + loss_count
    win_rate = (win_count / total_trades * 100) if total_trades > 0 else 0
    
    profit_per_share = (tp_price - buy_price) * win_count
    loss_per_share = (buy_price - sl_price) * loss_count
    expected_value = (profit_per_share - loss_per_share) / total_trades if total_trades > 0 else 0
    
    return total_trades, win_rate, expected_value, trades

def check_portfolio_status():
    """スプレッドシート上の保有銘柄の利確・損切、出来高急増をチェック"""
    logging.info("--- 保有銘柄・監視銘柄のステータスチェック開始 ---")
    
    try:
        # スプレッドシート側のGASは "get" アクションで現在のデータを返してくれないため、
        # 自動化する場合は「監視・利確チェック」はPythonからGASへのWebhookでバッチ処理させるよう
        # GAS側を改修するか、スプシの一括ダウンロードが必要です。
        # 今のアプリの仕様では「ユーザーが画面にコードを手入力してチェック」する仕組みです。
        
        # 今回の完全自動化では、"全自動スクリーニングと追加" に特化します。
        # (スプレッドシートの中身を取り出すAPIがないため、追加のみ行います)
        pass
    except Exception as e:
        logging.error(f"ステータスチェック中にエラー: {e}")

def auto_screen_and_add():
    """全自動スクリーニングと有望銘柄の追加"""
    logging.info("--- 全自動スクリーニングと有望銘柄の追加開始 ---")
    
    # 日経225やTOPIXの主要銘柄のティッカーリスト（サンプルとして200銘柄程度を想定）
    # 実際は日本の代表的なコードをリストアップします。
    # APIの負荷を下げるため、ランダムに50銘柄程度を抽出してテスト
    # ここでは1300番台〜9900番台の一部をサンプリングします。
    import random
    all_codes = [str(c) for c in range(1300, 9999)]
    target_codes = random.sample(all_codes, 300) # 300銘柄ランダムにピックアップして探索
    
    # 株価データを一括取得
    ticker_str = " ".join([f"{c}.T" for c in target_codes])
    data = yf.download(ticker_str, period="1mo", group_by="ticker", threads=True, show_errors=False)
    
    candidates = []
    
    for code in target_codes:
        t_code = f"{code}.T"
        if t_code not in data.columns.levels[0]: continue
        
        df = data[t_code]
        if df.empty or len(df) < 10: continue
        
        try:
            current_price = float(df['Close'].iloc[-1])
            past_price = float(df['Close'].iloc[-10])
            
            if current_price < 100: continue # 100円未満の超低位株は除外
            
            drop_pct = (past_price - current_price) / past_price * 100
            
            # 直近10日で少しでも下落している（安くなっている）銘柄を対象にする
            if drop_pct > 0:
                ticker_obj = yf.Ticker(t_code)
                info = ticker_obj.info
                pbr = info.get('priceToBook', 0)
                dividend = info.get('dividendYield', 0)
                mc = info.get('marketCap', 0)
                
                # 最低限のファンダメンタルズ
                if pbr is not None and dividend is not None and mc is not None:
                    if 0.1 <= pbr <= 10.0 and mc >= 10_000_000_000:
                        candidates.append({
                            "code": code,
                            "pbr": pbr,
                            "dividend": dividend,
                            "drop_pct": drop_pct,
                            "current_price": current_price,
                            "mc": mc
                        })
        except Exception:
            continue
            
    # 下落率が大きい順（大きく売られている順）に並び替え
    candidates = sorted(candidates, key=lambda x: x['drop_pct'], reverse=True)
    logging.info(f"一次スクリーニングで {len(candidates)} 銘柄を発見")
    
    added_count = 0
    needed_count = 3 # 毎日最大3銘柄まで追加
    
    for cand in candidates:
        if added_count >= needed_count:
            break
            
        s_code = cand['code']
        pbr = cand['pbr']
        drop_pct = cand['drop_pct']
        c_div = cand['dividend']
        c_mc = cand['mc']
        current_price = cand['current_price']
        
        # 過去2年分の詳しいデータを取得してバックテスト
        hist_2y = yf.Ticker(f"{s_code}.T").history(period="2y")
        if hist_2y.empty: continue
        
        best_params = None
        best_win_rate = -1
        best_profit = -999999
        
        for buy_pct in range(2, 42, 6):
            sim_buy = current_price * (1 - buy_pct/100)
            for tp_pct in range(2, 32, 6):
                sim_tp = sim_buy * (1 + tp_pct/100)
                if sim_tp <= current_price * 1.01: continue
                
                for sl_pct in range(2, 32, 6):
                    sim_sl = sim_buy * (1 - sl_pct/100)
                    t_trades, w_rate, e_val, _ = run_backtest(hist_2y, sim_buy, sim_tp, sim_sl)
                    
                    if t_trades >= 2:
                        if w_rate > best_win_rate or (w_rate == best_win_rate and e_val > best_profit):
                            best_win_rate = w_rate
                            best_profit = e_val
                            best_params = {"Buy": sim_buy, "TakeProfit": sim_tp, "StopLoss": sim_sl}
                            
        if best_params is not None and best_win_rate >= 65:
            # AI分析風テキスト
            ai_color = "orange"
            ai_text = f"【自動検知】直近下落率{drop_pct:.1f}%。勝率{best_win_rate:.0f}%の反発ラインに到達。"
            
            if pbr > 0 and pbr < 1.0:
                ai_color = "yellow"
                ai_text = f"【自動検知/割安】PBR {pbr:.2f}倍と割安。勝率{best_win_rate:.0f}%の優位なポイント。"
            elif c_div is not None and c_div > 0.035:
                ai_color = "green"
                ai_text = f"【自動検知/高配当】配当利回り{c_div*100:.1f}%。統計上、勝率{best_win_rate:.0f}%で安全圏。"
            elif c_mc > 1_000_000_000_000:
                ai_color = "blue"
                ai_text = f"【自動検知/大型優良】時価総額1兆円超の主力銘柄の調整。勝率{best_win_rate:.0f}%のサポートライン。"
                
            payload = {
                "action": "add_new",
                "code": str(s_code),
                "ai_text": ai_text,
                "ai_color": ai_color,
                "buy": int(best_params['Buy']),
                "tp": int(best_params['TakeProfit']),
                "sl": int(best_params['StopLoss']),
                "current_price": float(current_price)
            }
            
            try:
                res = requests.post(WEBHOOK_URL, json=payload)
                if res.status_code == 200:
                    logging.info(f"成功: {s_code} を追加しました (勝率: {best_win_rate:.1f}%)")
                    added_count += 1
            except Exception as e:
                logging.error(f"スプレッドシートへの通信エラー ({s_code}): {e}")
                
    logging.info(f"--- 全自動スクリーニング完了 ({added_count} 銘柄追加) ---")

if __name__ == "__main__":
    check_portfolio_status()
    auto_screen_and_add()
