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

# ==========================================
# 価格フィルタ設定
# ==========================================
MAX_STOCK_PRICE = 1000  # 1株の価格上限（円）。単元株100株で10万円以内 = 1株1000円以内

if not WEBHOOK_URL:
    logging.error("WEBHOOK_URL が設定されていません。終了します。")
    sys.exit(1)


def generate_ai_article(ticker_name, code, current_price, buy_price, tp_price, sl_price, win_rate, pbr=None, dividend=None):
    """Geminiを使って、魅力的なホームページ記事を自動生成する"""
    if not genai or not GEMINI_API_KEY:
        # Geminiが使えない場合のフォールバック
        return generate_fallback_article(ticker_name, code, current_price, buy_price, tp_price, sl_price, win_rate)
    
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        today = datetime.now().strftime("%Y年%m月%d日")
        unit_price = int(current_price * 100)  # 100株の概算投資額
        
        extra_info = ""
        if pbr and pbr > 0:
            extra_info += f"PBR: {pbr:.2f}倍\n"
        if dividend and dividend > 0:
            extra_info += f"配当利回り: {dividend*100:.2f}%\n"
        
        prompt = f"""あなたは日本株投資の専門ライターです。以下の銘柄データをもとに、
投資初心者でもわかりやすく、魅力的で読み応えのある記事を書いてください。

【銘柄データ】
銘柄名: {ticker_name}
証券コード: {code}
現在の株価: {int(current_price)}円（100株で約{unit_price:,}円）
AI算出 買い目標: {int(buy_price)}円
AI算出 利確目標: {int(tp_price)}円
AI算出 損切りライン: {int(sl_price)}円
過去2年の検証勝率: {win_rate:.0f}%
{extra_info}

【記事構成 - 必ずこの構成で書くこと】

タイトル: 【{today}のAI厳選銘柄】{ticker_name}（{code}）

1. 🔍 なぜこの銘柄が選ばれたのか（3-4文）
   - 投資金額が10万円以内で始められることを強調
   - スクリーニング条件（テクニカル指標）に触れる

2. 📊 AIテクニカル分析の結果（箇条書き）
   - 現在値、買い目標、利確目標、損切りラインを整理
   - 勝率の解説

3. 💡 投資のポイント（2-3文）
   - リスクリワード比に触れる
   - 初心者へのアドバイス

4. ⚠️ リスクと注意点（2文）
   - 投資は自己責任
   - 過去の勝率は将来を保証しない

【ルール】
- 900〜1200文字程度
- 専門用語は最低限で、わかりやすく
- 絵文字を適度に使う
- 最後に「※本記事はAIによる自動分析です。投資判断は自己責任でお願いします。」を必ず入れる
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        if response.text:
            logging.info("Geminiによるホームページ記事生成に成功しました。")
            return response.text.strip()
    except Exception as e:
        logging.error(f"Gemini記事生成エラー: {e}")
    
    return generate_fallback_article(ticker_name, code, current_price, buy_price, tp_price, sl_price, win_rate)


def generate_fallback_article(ticker_name, code, current_price, buy_price, tp_price, sl_price, win_rate):
    """Geminiが使えない場合のフォールバック記事"""
    today = datetime.now().strftime("%Y年%m月%d日")
    unit_price = int(current_price * 100)
    rr_ratio = (tp_price - buy_price) / (buy_price - sl_price) if (buy_price - sl_price) > 0 else 0
    
    return f"""【{today}のAI厳選銘柄】{ticker_name}（{code}）

🔍 銘柄選定理由
本日のAIスクリーニングにより、{ticker_name}（証券コード: {code}）が有望銘柄として選出されました。
現在の株価は{int(current_price)}円で、100株でも約{unit_price:,}円と10万円以内で投資を始められる銘柄です。
テクニカル指標が買いシグナルを示しており、過去データの検証でも高い勝率を記録しています。

📊 AIテクニカル分析の結果
・現在値: {int(current_price)}円
・AI算出 買い目標: {int(buy_price)}円
・AI算出 利確目標: {int(tp_price)}円（+{((tp_price/buy_price - 1)*100):.1f}%）
・AI算出 損切りライン: {int(sl_price)}円（-{((1 - sl_price/buy_price)*100):.1f}%）
・過去2年の検証勝率: {win_rate:.0f}%
・リスクリワード比: {rr_ratio:.1f}:1

💡 投資のポイント
リスクリワード比が{rr_ratio:.1f}:1と{'良好' if rr_ratio >= 1.5 else '妥当'}な水準です。
損切りラインを{int(sl_price)}円に設定し、リスク管理を徹底しましょう。
少額から始められるので、投資初心者の方にもおすすめの銘柄です。

👇ここから先は有料エリアとなります

📈 エントリー戦略の詳細
買い目標の{int(buy_price)}円付近まで下落した場合にエントリーを検討します。
利確目標は{int(tp_price)}円で、損切りは{int(sl_price)}円を割り込んだ場合に実行します。

⚠️ リスクと注意点
投資は元本保証ではなく、損失が生じる可能性があります。
過去の勝率は将来の成績を保証するものではありません。必ずご自身の判断と責任で投資を行ってください。

※本記事はAIによる自動分析です。投資判断は自己責任でお願いします。"""


def post_to_twitter(base_text, link_url=None):
    """Geminiで文章を推敲し、Xに自動投稿する関数"""
    if not all([TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET]):
        logging.warning("Twitterの環境変数が不足しています。スキップします。")
        logging.warning(f"  API_KEY: {'設定あり' if TWITTER_API_KEY else '未設定'}")
        logging.warning(f"  API_SECRET: {'設定あり' if TWITTER_API_SECRET else '未設定'}")
        logging.warning(f"  ACCESS_TOKEN: {'設定あり' if TWITTER_ACCESS_TOKEN else '未設定'}")
        logging.warning(f"  ACCESS_SECRET: {'設定あり' if TWITTER_ACCESS_SECRET else '未設定'}")
        return base_text
        
    final_text = base_text
    
    # 1. Geminiによるツイート文の生成
    if genai and GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            prompt = (
                "以下の株式情報をもとに、X（Twitter）用の投稿文を作成してください。\n"
                "必ず以下のルールを守ること：\n"
                "1. 全角140文字以内に収める\n"
                "2. 絵文字を2〜3個使う\n"
                "3. 必ず以下の形式を守る\n\n"
                "【形式】\n"
                "📈10万円以内で買える注目株✨\n\n"
                "銘柄名（コード）\n"
                "現在値: ○○○円\n"
                "AI分析勝率: ○○%\n\n"
                "詳しくはブログで👇\n"
                "(リンク)\n\n"
                "#日本株 #少額投資 #AI分析\n\n"
                f"【元の情報】\n{base_text}"
            )
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            if response.text:
                final_text = response.text.strip()
                logging.info("Geminiによるツイート文の推敲が成功しました。")
        except Exception as e:
            logging.error(f"Gemini APIでのテキスト生成に失敗: {e}")
            
    # 2. リンクの埋め込み
    if link_url:
        if "(リンク)" in final_text:
            final_text = final_text.replace("(リンク)", link_url)
        elif "(ホームページのリンクはこちら)" in final_text:
            final_text = final_text.replace("(ホームページのリンクはこちら)", link_url)
        else:
            # リンクがテキストにない場合、末尾に追加
            final_text = final_text.rstrip() + f"\n{link_url}"
    else:
        final_text = final_text.replace("(リンク)", "").replace("(ホームページのリンクはこちら)", "").strip()

    # 3. X (Twitter) への送信処理
    try:
        t_client = tweepy.Client(
            consumer_key=TWITTER_API_KEY,
            consumer_secret=TWITTER_API_SECRET,
            access_token=TWITTER_ACCESS_TOKEN,
            access_token_secret=TWITTER_ACCESS_SECRET
        )
        t_client.create_tweet(text=final_text)
        logging.info(f"Twitterへの自動投稿に成功しました！ 文字数: {len(final_text)}")
    except Exception as e:
        logging.error(f"Twitterへの自動投稿に失敗: {e}")
        # エラー内容を詳しくログ出力
        if hasattr(e, 'response') and e.response is not None:
            logging.error(f"  Status: {e.response.status_code}")
            logging.error(f"  Body: {e.response.text}")
        
    return final_text


def post_to_wordpress(title, hp_content):
    """WordPress REST APIを使って記事を自動投稿する関数
    (XML-RPCが無効なサーバーでも動作するようREST APIに変更)"""
    if not all([WP_URL, WP_USERNAME, WP_APP_PASSWORD]):
        logging.warning("WordPressの環境変数が不足しています。スキップします。")
        logging.warning(f"  WP_URL: {'設定あり' if WP_URL else '未設定'}")
        logging.warning(f"  WP_USERNAME: {'設定あり' if WP_USERNAME else '未設定'}")
        logging.warning(f"  WP_APP_PASSWORD: {'設定あり' if WP_APP_PASSWORD else '未設定'}")
        return None
    
    # 記事の有料エリアをcodocショートコードで囲む
    split_keyword = "👇ここから先は有料エリアとなります"
    if split_keyword in hp_content:
        parts = hp_content.split(split_keyword, 1)
        public_text = parts[0].strip()
        premium_text = split_keyword + "\n" + parts[1].strip()
        content_html = public_text.replace("\n", "<br>") + "\n\n[codoc]\n" + premium_text.replace("\n", "<br>") + "\n[/codoc]"
    else:
        content_html = hp_content.replace("\n", "<br>")
    
    # === 方法1: REST API (推奨) ===
    rest_url = f"{WP_URL}/wp-json/wp/v2/posts"
    
    try:
        import base64
        credentials = base64.b64encode(f"{WP_USERNAME}:{WP_APP_PASSWORD}".encode()).decode()
        headers = {
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json"
        }
        
        post_data = {
            "title": title,
            "content": content_html,
            "status": "publish"
        }
        
        response = requests.post(rest_url, json=post_data, headers=headers, timeout=30)
        
        if response.status_code in [200, 201]:
            post_url = response.json().get("link", f"{WP_URL}/?p={response.json().get('id', '')}")
            logging.info(f"WordPress REST APIで投稿に成功しました！: {post_url}")
            return post_url
        else:
            logging.warning(f"REST API失敗 (status={response.status_code}): {response.text[:200]}")
            # REST APIが失敗した場合、XML-RPCにフォールバック
    except Exception as e:
        logging.warning(f"REST APIエラー: {e}")
    
    # === 方法2: XML-RPC (フォールバック) ===
    try:
        import xmlrpc.client
        xmlrpc_url = f"{WP_URL}/xmlrpc.php"
        
        server = xmlrpc.client.ServerProxy(xmlrpc_url)
        content_struct = {
            'post_title': title,
            'post_content': content_html,
            'post_status': 'publish'
        }
        post_id = server.wp.newPost(1, WP_USERNAME, WP_APP_PASSWORD, content_struct)
        post_url = f"{WP_URL}/?p={post_id}"
        logging.info(f"WordPress XML-RPCで投稿に成功しました！: {post_url}")
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
                    # APIへの負荷軽減
                    time.sleep(1)
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
    logging.info(f"価格フィルタ: 1株 {MAX_STOCK_PRICE}円以下（100株で{MAX_STOCK_PRICE * 100:,}円以内）")
    
    import random
    all_codes = [str(c) for c in range(1300, 9999)]
    target_codes = random.sample(all_codes, 600)
    
    # 600銘柄を100銘柄ずつのチャンクに分ける（429エラー対策）
    chunk_size = 100
    candidates = []
    
    for i in range(0, len(target_codes), chunk_size):
        chunk = target_codes[i:i + chunk_size]
        ticker_str = " ".join([f"{c}.T" for c in chunk])
        logging.info(f"スクリーニング中: {i} to {i+chunk_size} 銘柄目...")
        
        try:
            data = yf.download(ticker_str, period="3mo", group_by="ticker", threads=True, progress=False)
            
            for code in chunk:
                t_code = f"{code}.T"
                if t_code not in data.columns.levels[0]: continue
                df = data[t_code]
                if df.empty or len(df) < 30: continue
                try:
                    current_price = float(df['Close'].iloc[-1])
                    
                    # ===== 価格フィルタ: 10万円以内で100株買える銘柄のみ =====
                    if current_price < 100:
                        continue  # 極端に安い銘柄は除外
                    if current_price > MAX_STOCK_PRICE:
                        continue  # 1株1000円超 = 100株で10万円超なので除外
                    # ===============================================
                    
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
        except Exception as e:
            logging.error(f"チャンク取得エラー: {e}")
        
        # チャンクごとに少し休憩
        time.sleep(2)
    
    logging.info(f"価格フィルタ通過候補: {len(candidates)} 銘柄（すべて1株{MAX_STOCK_PRICE}円以下）")
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
        
        # 最終確認: 10万円以下であることを再チェック
        if current_price > MAX_STOCK_PRICE:
            logging.warning(f"{s_code}: 現在値{int(current_price)}円 > 上限{MAX_STOCK_PRICE}円。スキップ。")
            continue
        
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
            
            logging.info(f"有望銘柄発見: {ticker_name}({s_code}) 現在値:{int(current_price)}円 (100株で{int(current_price*100):,}円) 勝率:{best_win_rate:.0f}%")
                
            # AI考察テキスト
            rr_ratio = (best_params['TakeProfit'] - best_params['Buy']) / (best_params['Buy'] - best_params['StopLoss']) if (best_params['Buy'] - best_params['StopLoss']) > 0 else 0
            ai_text = f"【AI判定】過去2年の検証勝率{best_win_rate:.0f}%。テクニカル反発期待。RR比: {rr_ratio:.1f}:1"
            ai_color = "orange" if best_win_rate < 70 else "green"
            
            # ===== 1. ホームページ記事を生成 =====
            hp_article = generate_ai_article(
                ticker_name, s_code, current_price,
                best_params['Buy'], best_params['TakeProfit'], best_params['StopLoss'],
                best_win_rate, 
                pbr=cand.get('pbr'),
                dividend=cand.get('dividend')
            )
            
            # ===== 2. WordPressに投稿 =====
            wp_title = f"【{datetime.now().strftime('%m/%d')} AI厳選】{ticker_name}（{s_code}）- 10万円以内で始める注目株"
            wp_post_url = post_to_wordpress(wp_title, hp_article)
            
            if wp_post_url:
                logging.info(f"WordPress投稿成功: {wp_post_url}")
            else:
                logging.warning("WordPress投稿が失敗しました。Twitter投稿はリンクなしで続行します。")
            
            # ===== 3. Twitterに投稿（WP投稿の成否に関係なく必ず実行） =====
            x_base_text = (
                f"📈10万円以内で買える注目株✨\n\n"
                f"{ticker_name}（{s_code}）\n"
                f"現在値: {int(current_price)}円（100株で{int(current_price*100):,}円）\n"
                f"AI分析勝率: {best_win_rate:.0f}%\n\n"
                f"詳しくはブログで👇\n"
                f"(リンク)\n\n"
                f"#日本株 #少額投資 #AI分析"
            )
            x_text = post_to_twitter(x_base_text, link_url=wp_post_url)
            
            # ===== 4. スプレッドシートに追加 =====
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
                "hp_text": hp_article,
                "sns_done": True,
                "sheet_sns": "SNS配信済",
                "sheet_x": "X配信テキスト",
                "sheet_hp": "ホームページへの自動記載"
            }
            try:
                res = requests.post(WEBHOOK_URL, json=payload)
                if res.status_code == 200:
                    logging.info(f"成功: {s_code} をスプレッドシートに追加しました")
                    added_count += 1
                else:
                    logging.error(f"スプレッドシート追加失敗 ({s_code}): status={res.status_code}")
            except Exception as e:
                logging.error(f"エラー ({s_code}): {e}")
                
    logging.info(f"完了 ({added_count} 銘柄追加)")
    if added_count == 0:
        logging.warning("今日は条件を満たす銘柄が見つかりませんでした。")
    
    try:
        jst_now = datetime.now().strftime("%Y/%m/%d %H:%M")
        requests.post(WEBHOOK_URL, json={"action": "log_time", "time": jst_now, "count": added_count})
    except: pass


if __name__ == "__main__":
    check_portfolio_status()
    auto_screen_and_add()
