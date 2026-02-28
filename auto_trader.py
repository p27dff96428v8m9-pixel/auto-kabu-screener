import time
import requests
import yfinance as yf
import pandas as pd
import json
import logging
import os
import tweepy
from datetime import datetime

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

def post_to_twitter(base_text):
    """Geminiで文章を推敲し、Xに自動投稿する関数"""
    if not all([TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET]):
        logging.info("Twitterアカウントの環境変数が設定されていないため、ポストをスキップします。")
        return
        
    final_text = base_text
    
    # 1. Geminiによる文章のブラッシュアップ（AI鍵があれば）
    if genai and GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            prompt = (
                "以下の【元のテキスト】を元に、Twitter(X)のツイート文面を作成してください。\n"
                "絶対に以下の【希望のフォーマット】を崩さないようにしつつ、「〇〇商事」の部分を、"
                "与えられた銘柄コードから正しい日本の企業名（短縮名・馴染みのある名前）に書き換えてください。\n"
                "※Twitterの140文字（全角）制限に必ず収まるように、文字数を極力節約しつつ、指定の改行（空行）をキープしてください。\n\n"
                "【希望のフォーマット】\n"
                "【資金が少ないけど投資したい】\n"
                "【どの株を買うか迷っている】\n"
                "そんな方へ✨AI厳選の\n"
                "【本日の10万円以内で買える株】を紹介！\n\n"
                "銘柄名: 〇〇商事 (1234) 現在値: 50,000円 AI勝率: 80%💡\n"
                "AI考察\n"
                "テクニカル的にかなりの売られ過ぎ水準。\n\n"
                "拾い場、損切、利確が知りたい方はこちらへ\n"
                "(noteのリンクを貼る予定地)\n\n"
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
            
    # 2. X (Twitter) への送信処理
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

def post_to_wordpress(title, note_draft):
    """WordPressのXML-RPCを使って記事を自動投稿(有料部分をcodoc化)する関数"""
    if not all([WP_URL, WP_USERNAME, WP_APP_PASSWORD]):
        logging.info("WordPressの環境変数が設定されていないため、投稿をスキップします。")
        return None
        
    # note_draft の中身をcodocショートコードで囲む
    split_keyword = "👇ここから先は有料エリアとなります"
    if split_keyword in note_draft:
        parts = note_draft.split(split_keyword, 1)
        public_text = parts[0].strip()
        premium_text = split_keyword + "\n" + parts[1].strip()
        # [codoc]ショートコードで囲む
        content = f"{public_text}\n\n[codoc]\n{premium_text}\n[/codoc]"
        content = content.replace("\n", "<br>")
    else:
        content = note_draft.replace("\n", "<br>")
        
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
            
            # 各値を取得 (カンマが含まれている場合の対策)
            try:
                buy_val = float(str(row[c_buy]).replace(',', '').strip()) if c_buy != -1 and str(row[c_buy]).strip() else None
                tp_val = float(str(row[c_tp]).replace(',', '').strip()) if c_tp != -1 and str(row[c_tp]).strip() else None
                sl_val = float(str(row[c_sl]).replace(',', '').strip()) if c_sl != -1 and str(row[c_sl]).strip() else None
            except ValueError:
                continue # 数値に変換できない値が入っている行はスキップ
            
            # 株価データを取得して判定
            try:
                hist = yf.Ticker(f"{code}.T").history(period="1mo")
                if hist.empty: continue
                
                last_close = float(hist['Close'].iloc[-1])
                last_high = float(hist['High'].iloc[-1])
                last_low = float(hist['Low'].iloc[-1])
                
                # エントリー判定用に過去1ヶ月の安値を参照
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
                # その日の高値が利確を達成、または安値が損切を下回った場合
                if tp_val and last_high >= tp_val:
                    action = "hit_tp" if entered_flag else "delete"
                elif sl_val and last_low <= sl_val:
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
        
        for buy_pct in [0, 1, 2, 3]: # デイトレ最適化: 買い目標を浅く（0〜3%下）設定
            sim_buy = current_price * (1 - buy_pct/100)
            for tp_pct in range(2, 22, 2): # 利確目標を細かく (2%〜20%)
                sim_tp = sim_buy * (1 + tp_pct/100)
                if sim_tp <= current_price * 1.01: continue
                
                for sl_pct in range(2, 16, 2): # 損切りライン (2%〜14%)
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
                f"コード【{s_code}】\n"
                f"現在値: {current_price:.0f}円\n"
                f"目安の拾い場は{int(best_params['Buy'])}円付近\n"
                f"損切は{int(best_params['StopLoss'])}円\n"
                f"利確は{int(best_params['TakeProfit'])}円\n"
                f"過去勝率: {best_win_rate:.0f}%\n"
            )
            
            note_draft = (
                f"【本日の厳選ピックアップ銘柄】\n"
                f"銘柄コード: {s_code}\n"
                f"現在の株価: {current_price:.0f}円\n\n"
                f"👇ここから先は有料エリアとなります（テクニカル分析とトレード戦略）👇\n"
                f"==============================\n"
                f"【テクニカル分析】\n"
                f"25日移動平均線からの乖離率: {deviation:.1f}%\n"
                f"RSI: {rsi:.1f}\n"
                f"AI考察: {ai_text}\n\n"
                f"【具体的なトレード戦略（過去勝率{best_win_rate:.0f}%）】\n"
                f"✅ エントリー目安（買い場）: {int(best_params['Buy'])}円付近\n"
                f"🎯 利確目標: {int(best_params['TakeProfit'])}円\n"
                f"🛡️ 損切りライン: {int(best_params['StopLoss'])}円\n\n"
                f"※本記事は過去データに基づく統計的分析です。投資は自己責任でお願いいたします。"
            )
            
            # note用記事のAIによる推敲（よりリッチに・自然に）
            if genai and GEMINI_API_KEY:
                try:
                    client_note = genai.Client(api_key=GEMINI_API_KEY)
                    prompt_note = (
                        "以下の草案を元に、noteの有料部分（300円）として購読者が満足できるような、"
                        "丁寧でプロ風の分析記事テキストに推敲してください。"
                        "絵文字などを適格に使い、見出しを含めて読みやすいレイアウトにしてください。\n"
                        "※具体的な「買い場」「利確」「損切」の数値や「勝率」は絶対にそのまま残してください。\n\n"
                        f"【草案】\n{note_draft}"
                    )
                    res_note = client_note.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=prompt_note
                    )
                    if res_note.text:
                        note_draft = res_note.text.strip()
                        logging.info("Geminiによるnote記事推敲が成功しました。")
                except Exception as e:
                    logging.error(f"Gemini APIでのnote記事生成に失敗: {e}")
            
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
                "note_text": note_draft
            }
            
            try:
                res = requests.post(WEBHOOK_URL, json=payload)
                if res.status_code == 200:
                    logging.info(f"成功: {s_code} を追加しました (勝率: {best_win_rate:.1f}%)")
                    added_count += 1
                    
                    # 100%完全自動モード: WordPressへ記事を自動投稿
                    # ※WP設定が済んでいなければスキップされるだけです
                    wp_title = f"【本日の厳選AI分析】{s_code} の買い場と利確ライン（勝率{best_win_rate:.0f}%）"
                    wp_post_url = post_to_wordpress(wp_title, note_draft)
                    
                    # ユーザーの要望により、一時的にTwitter自動投稿を停止中（テスト期間）
                    # 下記は将来再開したい時、note用からWP用リンクに書き換えたものです
                    # if wp_post_url:
                    #     x_text = x_text.replace("(noteのリンクを貼る予定地)", wp_post_url)
                    # post_to_twitter(x_text)
                    
            except Exception as e:
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
