import time
import requests
import yfinance as yf
import pandas as pd
import json
import logging
import os
import tweepy
from datetime import datetime
import sys

try:
    from google import genai
except ImportError:
    genai = None

# ==========================================
# GitHub Actions で毎日自動で動くスクリプト
# ==========================================

# ログの設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Webhook URLは環境変数（GitHub Secrets）から取得
WEBHOOK_URL = os.environ.get("WEBHOOK_URL")

TWITTER_API_KEY = os.environ.get("TWITTER_API_KEY")
TWITTER_API_SECRET = os.environ.get("TWITTER_API_SECRET")
TWITTER_ACCESS_TOKEN = os.environ.get("TWITTER_ACCESS_TOKEN")
TWITTER_ACCESS_SECRET = os.environ.get("TWITTER_ACCESS_SECRET")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

WP_URL = os.environ.get("WP_URL")
WP_USERNAME = os.environ.get("WP_USERNAME")
WP_APP_PASSWORD = os.environ.get("WP_APP_PASSWORD")

if not WEBHOOK_URL:
    logging.error("WEBHOOK_URL が設定されていません。終了します。")
    sys.exit(1)

def post_to_twitter(base_text, link_url=None):
    """Geminiで文章を推敲し、Xに自動投稿する関数"""
    if not all([TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET]):
        logging.info("Twitterアカウントの環境変数が設定されていないため、ポストをスキップします。")
        return base_text
        
    final_text = base_text
    
    # 1. Geminiによる文章のブラッシュアップ（AI鍵があれば）
    if genai and GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            prompt = (
                "絶対に以下の【希望のフォーマット】を崩さないようにしつつ、記事の内容を元に、"
                "正しい日本の企業名や株価などを抽出して、{{NAME}} などのプレースホルダーを書き換えてください。\n"
                "※Twitterの140文字（全角）制限に必ず収まるように、文字数を極力節約しつつ、指定の改行（空行）をキープしてください。\n\n"
                "【希望のフォーマット】\n"
                "【資金が少ないけど投資したい】\n"
                "【どの株を買うか迷っている】\n"
                "そんな方へ✨AI厳選の\n"
                "【本日の10万円以内で買える株】を紹介！\n\n"
                "銘柄名: {{NAME}} ({{CODE}}) 現在値: {{PRICE}}円 AI勝率: {{WINRATE}}%💡\n"
                "AI考察\n"
                "{{ANALYSIS}}\n\n"
                "拾い場、損切、利確が知りたい方はこちらへ\n"
                "(ホームページのリンクはこちら)\n\n"
                "※投資は自己責任で。 #日本株 #デイトレ\n\n"
                f"【元のテキスト】\n{base_text}"
            )
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            if response.text:
                final_text = response.text.strip()
                logging.info("Geminiによる推敲が成功しました。")
        except Exception as e:
            logging.error(f"Gemini APIでのテキスト生成に失敗: {e}")
            
    # 2. リンクの流し込み
    if link_url:
        final_text = final_text.replace("(ホームページのリンクはこちら)", link_url)
    elif "(ホームページのリンクはこちら)" in final_text:
        # リンクがない場合はリンク行を削除
        final_text = final_text.replace("(ホームページのリンクはこちら)", "").strip()

    # 3. X (Twitter) への送信処理
    try:
        t_client = tweepy.Client(
            consumer_key=TWITTER_API_KEY,
            consumer_secret=TWITTER_API_SECRET,
            access_token=TWITTER_ACCESS_TOKEN,
            access_token_secret=TWITTER_ACCESS_SECRET
        )
        t_client.create_tweet(text=final_text)
        logging.info("Twitterへの自動投稿に成功しました！")
    except Exception as e:
        logging.error(f"Twitterへの自動投稿に失敗: {e}")
        
    return final_text

def post_to_wordpress(title, hp_draft):
    """WordPressのXML-RPCを使って記事を自動投稿(有料部分をcodoc化)する関数"""
    if not all([WP_URL, WP_USERNAME, WP_APP_PASSWORD]):
        logging.info("WordPressの環境変数が設定されていないため、投稿をスキップします。")
        return None
        
    # hp_draft の中身をcodocショートコードで囲む
    split_keyword = "👇ここから先は有料エリアとなります"
    if split_keyword in hp_draft:
        parts = hp_draft.split(split_keyword, 1)
        public_text = parts[0].strip()
        premium_text = split_keyword + "\n" + parts[1].strip()
        # [codoc]ショートコードで囲む
        content = f"{public_text}\n\n[codoc]\n{premium_text}\n[/codoc]"
        content = content.replace("\n", "<br>")
    else:
        content = hp_draft.replace("\n", "<br>")
        
    import xmlrpc.client
    
    # HTTPのまま通信できる旧式のAPI（XML-RPC）を設定
    xmlrpc_url = f"{WP_URL}/xmlrpc.php"
    
    try:
        server = xmlrpc.client.ServerProxy(xmlrpc_url)
        content_struct = {
            'post_title': title,
            'post_content': content,
            'post_status': 'publish'
        }
        # wp.newPost (blog_id, username, password, content)
        post_id = server.wp.newPost(1, WP_USERNAME, WP_APP_PASSWORD, content_struct)
        post_url = f"{WP_URL}/?p={post_id}"
        logging.info(f"WordPressへの自動投稿に成功しました！: {post_url}")
        return post_url
    except Exception as e:
        logging.error(f"WordPress投稿エラー(XML-RPC): {e}")
        return None

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
            try:
                buy_val = float(str(row[c_buy]).replace(',', '').strip()) if c_buy != -1 and str(row[c_buy]).strip() else None
                tp_val = float(str(row[c_tp]).replace(',', '').strip()) if c_tp != -1 and str(row[c_tp]).strip() else None
                sl_val = float(str(row[c_sl]).replace(',', '').strip()) if c_sl != -1 and str(row[c_sl]).strip() else None
            except ValueError:
                continue
            
            # 株価データを取得して判定
            try:
                hist = yf.Ticker(f"{code}.T").history(period="1mo")
                if hist.empty: continue
                
                last_high = float(hist['High'].iloc[-1])
                last_low = float(hist['Low'].iloc[-1])
                hist_low = float(hist['Low'].min())
                
                entered_flag = False
                if buy_val and hist_low <= buy_val:
                    entered_flag = True
                
                action = None
                if tp_val and last_high >= tp_val:
                    action = "hit_tp" if entered_flag else "delete"
                elif sl_val and last_low <= sl_val:
                    action = "hit_sl" if entered_flag else "delete"
                    
                if action:
                    req_p = {"action": action, "code": str(code)}
                    requests.post(WEBHOOK_URL, json=req_p)
                    removed_count += 1
                    logging.info(f"{code}: {action} により削除しました")
                else:
                    # 出来高急増チェック
                    if len(hist) >= 5:
                        avg_vol = hist['Volume'].iloc[:-1].mean()
                        if hist['Volume'].iloc[-1] > avg_vol * 3:
                            req_p = {"action": "update", "code": str(code), "volume_surge": True}
                            requests.post(WEBHOOK_URL, json=req_p)
            except Exception as e:
                logging.error(f"{code} のチェック中エラー: {e}")
                
        logging.info(f"ステータスチェック完了。{removed_count} 件処理しました。")
    except Exception as e:
        logging.error(f"ステータスチェック中に通信エラー: {e}")

def auto_screen_and_add():
    """全自動スクリーニングと有望銘柄の追加"""
    logging.info("--- 全自動スクリーニングと有望銘柄の追加開始 ---")
    
    import random
    all_codes = [str(c) for c in range(1300, 9999)]
    target_codes = random.sample(all_codes, 600)
    
    ticker_str = " ".join([f"{c}.T" for c in target_codes])
    data = yf.download(ticker_str, period="3mo", group_by="ticker", threads=True)
    
    candidates = []
    for code in target_codes:
        t_code = f"{code}.T"
        if not hasattr(data.columns, 'levels') or t_code not in data.columns.levels[0]: continue
        df = data[t_code]
        if df.empty or len(df) < 30: continue
        
        try:
            current_price = float(df['Close'].iloc[-1])
            if current_price < 100: continue
            
            sma25 = df['Close'].rolling(window=25).mean().iloc[-1]
            delta = df['Close'].diff()
            gain = delta.clip(lower=0).rolling(window=14).mean()
            loss = -delta.clip(upper=0).rolling(window=14).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs)).iloc[-1]
            deviation = (current_price - sma25) / sma25 * 100
            
            if deviation <= 5 and rsi <= 65:
                ticker_obj = yf.Ticker(t_code)
                info = ticker_obj.info
                pbr = info.get('priceToBook', 0)
                mc = info.get('marketCap', 0)
                if pbr is not None and mc is not None and (10_000_000_000 <= mc <= 3_000_000_000_000):
                    candidates.append({
                        "code": code, "pbr": pbr, "deviation": deviation, "rsi": rsi, "current_price": current_price, "mc": mc,
                        "dividend": info.get('dividendYield', 0)
                    })
        except: continue
            
    candidates = sorted(candidates, key=lambda x: abs(x['deviation']), reverse=True)
    added_count = 0
    needed_count = 1 
    
    try:
        res = requests.post(WEBHOOK_URL, json={"action": "get_all"})
        existing_codes = [str(row[0]).replace(' ', '') for row in res.json() if len(row) > 0]
    except: existing_codes = []
            
    for cand in candidates:
        if added_count >= needed_count: break
        s_code = cand['code']
        if str(s_code) in existing_codes: continue
            
        hist_2y = yf.Ticker(f"{s_code}.T").history(period="2y")
        if hist_2y.empty: continue
        
        current_price = cand['current_price']
        best_params = None
        best_win_rate = -1
        
        for buy_pct in [0, 1, 2, 3]:
            sim_buy = current_price * (1 - buy_pct/100)
            for tp_pct in range(2, 22, 2):
                sim_tp = sim_buy * (1 + tp_pct/100)
                if sim_tp <= current_price * 1.01: continue
                for sl_pct in range(2, 16, 2):
                    sim_sl = sim_buy * (1 - sl_pct/100)
                    t_trades, w_rate, _, _ = run_backtest(hist_2y, sim_buy, sim_tp, sim_sl)
                    if t_trades >= 2 and w_rate > best_win_rate:
                        best_win_rate = w_rate
                        best_params = {"Buy": sim_buy, "TakeProfit": sim_tp, "StopLoss": sim_sl}
                            
        if best_params is not None and best_win_rate >= 55:
            # 銘柄名を取得
            try:
                ticker_obj = yf.Ticker(f"{s_code}.T")
                ticker_name = ticker_obj.info.get('shortName') or ticker_obj.info.get('longName') or s_code
            except:
                ticker_name = s_code
                
            ai_text = f"【AI判定】過去勝率{best_win_rate:.0f}%。テクニカル反発期待。"
            ai_color = "orange"
            
            x_text = f"銘柄名: {ticker_name} コード: {s_code} 現在値: {int(current_price)}円 目安: {int(best_params['Buy'])}円 勝率: {best_win_rate:.0f}%"
            hp_draft = f"【本日の厳選AI分析】\n銘柄名: {ticker_name}\nコード: {s_code}\n株価: {int(current_price)}円\nAI考察: {ai_text}\n買い目標: {int(best_params['Buy'])}円\n利確目標: {int(best_params['TakeProfit'])}円\n損切り: {int(best_params['StopLoss'])}円"
            
            wp_post_url = post_to_wordpress(f"【厳選AI分析】{ticker_name} ({s_code})", hp_draft)
            if wp_post_url: x_text = post_to_twitter(x_text, link_url=wp_post_url)
            else: x_text = post_to_twitter(x_text)
            
            payload = {
                "action": "add_new",
                "code": str(s_code),
                "ai_text": ai_text,
                "ai_color": ai_color,
                "buy": int(best_params['Buy']),
                "tp": int(best_params['TakeProfit']),
                "sl": int(best_params['StopLoss']),
                "current_price": float(current_price),
                "x_post_text": x_text,
                "hp_text": hp_draft,
                "sns_done": True,
                "sheet_sns": "SNS配信済",
                "sheet_x": "X配信テキスト",
                "sheet_hp": "ホームページへの自動記載"
            }
            try:
                res = requests.post(WEBHOOK_URL, json=payload)
                if res.status_code == 200:
                    logging.info(f"成功: {s_code} を追加し新シートに振り分けました")
                    added_count += 1
            except Exception as e:
                logging.error(f"エラー ({s_code}): {e}")
                
    logging.info(f"完了 ({added_count} 銘柄)")
    try:
        jst_now = datetime.now().strftime("%Y/%m/%d %H:%M")
        requests.post(WEBHOOK_URL, json={"action": "log_time", "time": jst_now, "count": added_count})
    except: pass

if __name__ == "__main__":
    check_portfolio_status()
    auto_screen_and_add()
