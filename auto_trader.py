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
    """スプレッドシート上の保有銘柄のデータを取得し、利確・損切・出来高をチェック"""
    logging.info("--- 保有銘柄・監視銘柄のステータスチェック開始 ---")
    
    try:
        # 新しいGASコードでは action="get_all" で全データが取れる前提
        payload = {"action": "get_all"}
        res = requests.post(WEBHOOK_URL, json=payload)
        
        if res.status_code != 200 or "not found" in res.text:
            logging.info("GASからのデータ取得に失敗したか、未対応のGASコードです。")
            return
            
        try:
            values = res.json()
        except:
            logging.info("取得したデータがJSONではありません。GASコードのアップデートが必要です。")
            return
            
        if not values or len(values) < 2:
            logging.info("監視中の銘柄がありません。")
            return
            
        headers = values[0]
        # ヘッダー名からインデックスを探す
        col_idx = {str(h).replace('\u200b', '').replace(' ', ''): i for i, h in enumerate(headers)}
        
        c_code = col_idx.get('コード', -1)
        c_buy = col_idx.get('買い目標', -1)
        c_tp = col_idx.get('利確目標', -1)
        c_sl = col_idx.get('損切り', -1)
        
        if c_code == -1: return
        
        removed_count = 0
        
        # 2行目からチェック
        for i in range(1, len(values)):
            row = values[i]
            if len(row) <= c_code: continue
            
            code = str(row[c_code]).strip()
            if not code or code == 'None': continue
            
            # 各値を取得
            buy_val = float(row[c_buy]) if c_buy != -1 and row[c_buy] else None
            tp_val = float(row[c_tp]) if c_tp != -1 and row[c_tp] else None
            sl_val = float(row[c_sl]) if c_sl != -1 and row[c_sl] else None
            
            # 株価データを取得して判定
            try:
                hist = yf.Ticker(f"{code}.T").history(period="1mo")
                if hist.empty: continue
                
                last_close = float(hist['Close'].iloc[-1])
                hist_low = float(hist['Low'].min())
                
                vol_surge = False
                if len(hist) >= 5:
                    avg_vol = hist['Volume'].iloc[:-1].mean()
                    if hist['Volume'].iloc[-1] > avg_vol * 3:
                        vol_surge = True
                
                entered_flag = False
                if buy_val and hist_low <= buy_val:
                    entered_flag = True
                
                action = None
                if tp_val and last_close >= tp_val:
                    action = "hit_tp" if entered_flag else "delete"
                elif sl_val and last_close <= sl_val:
                    action = "hit_sl" if entered_flag else "delete"
                    
                if action:
                    req_p = {"action": action, "code": str(code)}
                    requests.post(WEBHOOK_URL, json=req_p)
                    removed_count += 1
                    logging.info(f"{code}: {action} により削除しました")
                elif vol_surge:
                    req_p = {"action": "update", "code": str(code), "volume_surge": True, "buy": buy_val, "tp": tp_val, "sl": sl_val}
                    requests.post(WEBHOOK_URL, json=req_p)
            except Exception as e:
                logging.error(f"{code} のチェック中エラー: {e}")
                
        logging.info(f"ステータスチェック完了。{removed_count} 件処理しました。")
    except Exception as e:
        logging.error(f"ステータスチェック中に通信エラー: {e}")

def auto_screen_and_add():
    """全自動スクリーニングと有望銘柄の追加"""
    logging.info("--- 全自動スクリーニングと有望銘柄の追加開始 ---")
    
    # 日経225やTOPIXの主要銘柄のティッカーリスト（サンプルとして200銘柄程度を想定）
    # 実際は日本の代表的なコードをリストアップします。
    # APIの負荷を下げるため、ランダムに50銘柄程度を抽出してテスト
    # ここでは1300番台〜9900番台の一部をサンプリングします。
    import random
    all_codes = [str(c) for c in range(1300, 9999)]
    target_codes = random.sample(all_codes, 600) # デイトレ仕様のため少し多めに
    
    ticker_str = " ".join([f"{c}.T" for c in target_codes])
    # 25日移動平均やRSI算出のため3ヶ月取得
    data = yf.download(ticker_str, period="3mo", group_by="ticker", threads=True)
    
    candidates = []
    
    for code in target_codes:
        t_code = f"{code}.T"
        if not hasattr(data.columns, 'levels') or t_code not in data.columns.levels[0]: continue
        
        df = data[t_code]
        if df.empty or len(df) < 30: continue # 25日計算のため余裕を持たせる
        
        try:
            current_price = float(df['Close'].iloc[-1])
            if current_price < 100 or current_price > 1000: continue
            
            sma25 = df['Close'].rolling(window=25).mean().iloc[-1]
            delta = df['Close'].diff()
            gain = delta.clip(lower=0).rolling(window=14).mean()
            loss = -delta.clip(upper=0).rolling(window=14).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs)).iloc[-1]
            
            deviation = (current_price - sma25) / sma25 * 100
            
            # 乖離率 -3%以下 かつ RSI 50以下 (遊びを持たせる)
            if deviation <= -3 and rsi <= 50:
                ticker_obj = yf.Ticker(t_code)
                info = ticker_obj.info
                pbr = info.get('priceToBook', 0)
                dividend = info.get('dividendYield', 0)
                mc = info.get('marketCap', 0)
                forward_pe = info.get('forwardPE', 0)
                trailing_eps = info.get('trailingEps', 0)
                
                if pbr is not None and mc is not None:
                    # 時価総額 100億円〜1兆円, PBR 0.2倍〜5.0倍 に緩和
                    if (10_000_000_000 <= mc <= 1_000_000_000_000) and (0.2 <= pbr <= 5.0) and (forward_pe > 0 or trailing_eps > 0):
                        candidates.append({
                            "code": code,
                            "pbr": pbr,
                            "dividend": dividend,
                            "drop_pct": abs(deviation), # ロジック整合性のため、乖離の広さを"drop_pct"として扱う
                            "deviation": deviation,
                            "rsi": rsi,
                            "current_price": current_price,
                            "mc": mc
                        })
        except Exception:
            continue
            
    # 乖離が激しい（マイナスに大きい）順に並び替え
    candidates = sorted(candidates, key=lambda x: x['drop_pct'], reverse=True)
    logging.info(f"一次スクリーニングで {len(candidates)} 銘柄を発見")
    
    added_count = 0
    needed_count = 1 # 毎日1銘柄のみ厳選追加
    
    # 既存の配信済み銘柄を取得（重複排除）
    try:
        res = requests.post(WEBHOOK_URL, json={"action": "get_all"})
        existing_data = res.json()
        # 1列目(インデックス0)がコードだと仮定
        existing_codes = [str(row[0]).replace(' ', '') for row in existing_data if len(row) > 0]
    except Exception as e:
        logging.warning(f"既存銘柄の取得に失敗: {e}")
        existing_codes = []
            
    for cand in candidates:
        if added_count >= needed_count:
            break
            
        s_code = cand['code']
        if str(s_code) in existing_codes:
            continue
            
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
            deviation = cand.get('deviation', 0)
            rsi = cand.get('rsi', 0)

            ai_color = "orange"
            ai_text = f"【デイトレ特化】25日乖離 {deviation:.1f}%、RSI {rsi:.1f}到達。勝率{best_win_rate:.0f}%の超短期反発ライン。"
            
            if 1.0 <= pbr <= 1.5:
                ai_color = "yellow"
                ai_text = f"【仕手化排除/割安】PBR {pbr:.2f}倍と堅実。大底RSI {rsi:.1f}。勝率{best_win_rate:.0f}%の固いポイント。"
            elif c_div is not None and c_div > 0.035:
                ai_color = "green"
                ai_text = f"【反発/高配当】配当利回り{c_div*100:.1f}%が下支え。乖離{deviation:.1f}% 統計勝率{best_win_rate:.0f}%。"
            elif c_mc > 100_000_000_000:
                ai_color = "blue"
                ai_text = f"【中大型/業績良好】時価総額1千億超え＆業績堅調による安心感で買いが入りやすい。勝率{best_win_rate:.0f}%。"
                
            x_text = (
                f"🤖本日のAI厳選【10万円以下で買える大底株】\n\n"
                f"銘柄コード: {s_code}\n"
                f"現在値: {current_price:.0f}円（必要資金 {int(current_price * 100):,}円）\n"
                f"25日線乖離率: {deviation:.1f}%\n"
                f"AI過去勝率: {best_win_rate:.0f}%\n\n"
                f"💡テクニカル的にかなりの売られすぎ水準。目安の拾い場は{int(best_params['Buy'])}円付近です！\n\n"
                f"※投資は自己責任でお願いします。\n"
                f"#日本株 #デイトレ #投資初心者 #日本株予想"
            )
            
            payload = {
                "action": "add_new",
                "code": str(s_code),
                "ai_text": ai_text,
                "ai_color": ai_color,
                "buy": int(best_params['Buy']),
                "tp": int(best_params['TakeProfit']),
                "sl": int(best_params['StopLoss']),
                "current_price": float(current_price),
                "x_post_text": x_text
            }
            
            try:
                res = requests.post(WEBHOOK_URL, json=payload)
                if res.status_code == 200:
                    logging.info(f"成功: {s_code} を追加しました (勝率: {best_win_rate:.1f}%)")
                    added_count += 1
            except Exception as e:
                logging.error(f"スプレッドシートへの通信エラー ({s_code}): {e}")
                logging.error(f"スプレッドシートへの通信エラー ({s_code}): {e}")
                
    logging.info(f"--- 全自動スクリーニング完了 ({added_count} 銘柄追加) ---")
    
    # 最後に更新ログを書き込む
    try:
        from datetime import timezone, timedelta
        jst = timezone(timedelta(hours=+9), 'JST')
        now_str = datetime.now(jst).strftime("%Y/%m/%d %H:%M")
        requests.post(WEBHOOK_URL, json={"action": "log_time", "time": now_str, "count": added_count})
    except Exception:
        pass

if __name__ == "__main__":
    check_portfolio_status()
    auto_screen_and_add()
