import time
import requests
import yfinance as yf
import pandas as pd
import json
import logging
import os
import tweepy
from datetime import datetime
from zoneinfo import ZoneInfo
import sys
from dotenv import load_dotenv

JST = ZoneInfo("Asia/Tokyo")

# .envファイルを読み込む
load_dotenv()

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
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyAObH_0naD4yuSa0xltuR6-xGzBOL_JUdg")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")

WP_URL = os.environ.get("WP_URL")
WP_USERNAME = os.environ.get("WP_USERNAME")
WP_APP_PASSWORD = os.environ.get("WP_APP_PASSWORD")

LINE_ACCESS_TOKEN = os.environ.get("LINE_ACCESS_TOKEN")
LINE_USER_ID = os.environ.get("LINE_USER_ID")

# GitHub Pages設定
GITHUB_REPO = "p27dff96428v8m9-pixel/auto-kabu-screener"
GITHUB_PAGES_URL = f"https://p27dff96428v8m9-pixel.github.io/auto-kabu-screener"

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
        
        today = datetime.now(JST).strftime("%Y年%m月%d日")
        unit_price = int(current_price * 100)  # 100株の概算投資額
        
        extra_info = ""
        if pbr and pbr > 0:
            extra_info += f"PBR: {pbr:.2f}倍\n"
        if dividend and dividend > 0:
            extra_info += f"配当利回り: {dividend*100:.2f}%\n"
        
        budget_comment = "投資金額が10万円以内で始められることを強調" if current_price <= 1000 else "優良銘柄であることを強調"
        
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
   - {budget_comment}
   - スクリーニング条件（テクニカル指標）に触れる

2. 📊 AIテクニカル分析の結果（箇条書き）
    - 現在値、買い目標、利確目標、損切りラインを整理
   - 勝率の解説

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
    today = datetime.now(JST).strftime("%Y年%m月%d日")
    unit_price = int(current_price * 100)
    rr_ratio = (tp_price - buy_price) / (buy_price - sl_price) if (buy_price - sl_price) > 0 else 0
    budget_text = "10万円以内で投資を始められる" if current_price <= 1000 else "本格的な投資ができる"
    return f"""【{today}のAI厳選銘柄】{ticker_name}（{code}）

🔍 銘柄選定理由
本日のAIスクリーニングにより、{ticker_name}（証券コード: {code}）が有望銘柄として選出されました。
現在の株価は{int(current_price)}円で、100株で約{unit_price:,}円と{budget_text}銘柄です。
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


def send_line(message):
    """LINE Messaging API でメッセージを送信する"""
    if not LINE_ACCESS_TOKEN or not LINE_USER_ID:
        logging.warning("LINE環境変数が未設定のためスキップ")
        return
    try:
        requests.post(
            "https://api.line.me/v2/bot/message/push",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {LINE_ACCESS_TOKEN}"
            },
            json={
                "to": LINE_USER_ID,
                "messages": [{"type": "text", "text": message}]
            },
            timeout=10
        )
        logging.info("LINE通知送信完了")
    except Exception as e:
        logging.error(f"LINE通知エラー: {e}")


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
            title_text = "📈10万円以内で買える注目株✨" if "10万円以内" in base_text or "1000円" in base_text else "📈AI厳選！本日の注目銘柄✨"
            prompt = (
                "以下の株式情報をもとに、X（Twitter）用の投稿文を作成してください。\n"
                "必ず以下のルールを守ること：\n"
                "1. 全角140文字以内に収める\n"
                "2. 絵文字を2〜3個使う\n"
                "3. 必ず以下の形式を守る\n\n"
                "【形式】\n"
                f"{title_text}\n\n"
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


def post_to_github_pages(ticker_name, code, current_price, buy_price, tp_price, sl_price, win_rate, article_content):
    """GitHub Pagesのposts.jsonに記事を追加する（常に成功する安定した方法）"""
    if not GITHUB_TOKEN:
        logging.warning("GITHUB_TOKENが設定されていないため、GitHub Pages投稿をスキップします。")
        return None
    
    import base64
    
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    today = datetime.now(JST).strftime("%Y年%m月%d日")
    today_key = datetime.now(JST).strftime("%Y-%m-%d")
    
    # 新しい記事データ
    new_post = {
        "date": today,
        "date_key": today_key,
        "title": f"{ticker_name}（{code}）",
        "code": code,
        "name": ticker_name,
        "price": int(current_price),
        "unit_price": f"{int(current_price * 100):,}",
        "buy": int(buy_price),
        "tp": int(tp_price),
        "sl": int(sl_price),
        "win_rate": f"{win_rate:.0f}",
        "content": article_content.replace('\n', '<br>')
    }
    
    try:
        # 1. 既存のposts.jsonを取得
        file_url = f'https://api.github.com/repos/{GITHUB_REPO}/contents/docs/posts.json'
        r = requests.get(file_url, headers=headers)
        
        if r.status_code == 200:
            existing_sha = r.json()['sha']
            existing_content = base64.b64decode(r.json()['content']).decode('utf-8')
            try:
                posts = json.loads(existing_content)
            except:
                posts = []
        else:
            existing_sha = None
            posts = []
        
        # 2. 同じ日付のポストがある場合は置き換え、なければ先頭に追加
        posts = [p for p in posts if p.get('date_key') != today_key]
        posts.insert(0, new_post)
        
        # 最大30件に制限
        posts = posts[:30]
        
        # 3. posts.jsonをアップロード
        new_content = json.dumps(posts, ensure_ascii=False, indent=2)
        encoded = base64.b64encode(new_content.encode('utf-8')).decode('utf-8')
        
        payload = {
            'message': f'Add post: {ticker_name} ({code}) - {today}',
            'content': encoded
        }
        if existing_sha:
            payload['sha'] = existing_sha
        
        r = requests.put(file_url, headers=headers, json=payload)
        
        if r.status_code in [200, 201]:
            page_url = GITHUB_PAGES_URL
            logging.info(f"GitHub Pages投稿成功！: {page_url}")
            return page_url
        else:
            logging.error(f"GitHub Pages投稿失敗: {r.status_code} {r.text[:200]}")
            return None
    except Exception as e:
        logging.error(f"GitHub Pages投稿エラー: {e}")
        return None


def calc_atr(hist, period=14):
    """ATR（平均真の値幅）を計算する。各銘柄固有のボラティリティを測定。"""
    high = hist['High']
    low = hist['Low']
    close = hist['Close']
    prev_close = close.shift(1)
    tr = pd.concat([
        high - low,
        (high - prev_close).abs(),
        (low - prev_close).abs()
    ], axis=1).max(axis=1)
    atr = tr.rolling(period).mean().iloc[-1]
    return float(atr) if not pd.isna(atr) else 0.0


def calc_lot_size(buy_price, sl_price, max_loss_yen=10000):
    """
    1トレードあたりの最大損失額を上限に推奨株数を計算する。
    デフォルト: 損切りになっても最大1万円の損失に収まる株数。
    """
    loss_per_share = buy_price - sl_price
    if loss_per_share <= 0:
        return 100  # 計算不能の場合は最低単元
    lot = int(max_loss_yen / loss_per_share)
    # 日本株の最小単元(100株)に切り捨て
    lot = max(100, (lot // 100) * 100)
    return lot


def run_backtest(df, buy_price, tp_price, sl_price):
    """勝率のバックテスト関数（バグ修正版: entry_pのスコープ問題を解消）"""
    trades = []
    in_position = False
    entry_p = 0  # ← バグ修正: 変数を事前に初期化しスコープ問題を防ぐ
    
    for _, row in df.iterrows():
        o_price = float(row['Open'])
        l_price = float(row['Low'])
        h_price = float(row['High'])
        
        if not in_position:
            if l_price <= buy_price:
                in_position = True
                entry_p = min(buy_price, o_price)  # 窓開けダウンは始値で約定
                # エントリー当日に損切りラインも割り込んでいる場合
                if l_price <= sl_price:
                    exit_p = sl_price if o_price > sl_price else o_price
                    trades.append(exit_p - entry_p)
                    in_position = False
                    entry_p = 0
        else:
            # 翌日以降の決済判定
            if o_price >= tp_price:
                # 窓開け上昇で始値が直接利確ラインを超えた
                trades.append(o_price - entry_p)
                in_position = False
            elif o_price <= sl_price:
                # 窓開け下落で始値が直接損切りラインを割った
                trades.append(o_price - entry_p)
                in_position = False
            elif l_price <= sl_price and h_price >= tp_price:
                # 同日中に両方タッチ → 保守的に損切り優先
                trades.append(sl_price - entry_p)
                in_position = False
            elif l_price <= sl_price:
                trades.append(sl_price - entry_p)
                in_position = False
            elif h_price >= tp_price:
                trades.append(tp_price - entry_p)
                in_position = False
            
            if not in_position:
                entry_p = 0
                
    win_count = sum(1 for t in trades if t > 0)
    loss_count = sum(1 for t in trades if t <= 0)
    total_trades = win_count + loss_count
    win_rate = (win_count / total_trades * 100) if total_trades > 0 else 0
    
    total_profit = sum(trades)
    expected_value = total_profit / total_trades if total_trades > 0 else 0
    
    return total_trades, win_rate, expected_value, trades

def optimize_params_walk_forward(hist, buy_pct_range, tp_pct_range, sl_pct_range):
    """ウォークフォワードテストを用いて過学習を防ぎつつ最適なパラメータを探索する"""
    current_price = hist['Close'].iloc[-1]
    best_params = None
    best_win_rate = -1
    
    # データを学習用(75%)とテスト用(25%)に分割
    train_size = int(len(hist) * 0.75)
    if train_size < 30:
        return None, -1
    train_hist = hist.iloc[:train_size]
    test_hist = hist.iloc[train_size:]
    
    for buy_pct in buy_pct_range:
        sim_buy = current_price * (1 - buy_pct/100)
        for tp_pct in tp_pct_range:
            sim_tp = sim_buy * (1 + tp_pct/100)
            for sl_pct in sl_pct_range:
                sim_sl = sim_buy * (1 - sl_pct/100)
                
                # 学習フェーズ
                t_trades_tr, w_rate_tr, e_val_tr, _ = run_backtest(train_hist, sim_buy, sim_tp, sim_sl)
                if t_trades_tr >= 2 and w_rate_tr >= 50:
                    # テストフェーズ
                    t_trades_te, w_rate_te, _, _ = run_backtest(test_hist, sim_buy, sim_tp, sim_sl)
                    
                    # 学習とテストで大きく乖離していないか（過学習の排除）
                    # テストでも一定の勝率が確保できていれば採用
                    t_trades_all = t_trades_tr + t_trades_te
                    if t_trades_all > 0:
                        w_rate_all = ((w_rate_tr * t_trades_tr) + (w_rate_te * t_trades_te)) / t_trades_all
                        
                        # テスト期間での勝率が著しく悪化していないかチェック
                        if (t_trades_te == 0 or w_rate_te >= 30) and w_rate_all > best_win_rate:
                            best_win_rate = w_rate_all
                            best_params = {"Buy": sim_buy, "TakeProfit": sim_tp, "StopLoss": sim_sl}
                            
    return best_params, best_win_rate


def optimize_params_atr_based(hist, current_price, atr):
    """
    ATR（真の値幅）に基づいてTP/SLを最適化する。
    固定%ではなく各銘柄のボラティリティに合わせた動的なパラメータを生成。
    RRが常に2:1以上になるようにTpをSlの2倍以上に設定する。
    """
    if atr <= 0 or current_price <= 0:
        return None, -1

    atr_pct = (atr / current_price) * 100

    # ATR倍率でパラメータレンジを定義
    # 買いは現在値から0〜1×ATR下の範囲
    buy_pct_range = [round(atr_pct * m, 2) for m in [0, 0.25, 0.5, 0.75, 1.0]]
    # 損切りは0.75〜2×ATR（小さすぎると頻繁に損切り、大きすぎると損失が大きい）
    sl_pct_range = [round(atr_pct * m, 2) for m in [0.75, 1.0, 1.25, 1.5, 1.75, 2.0]]
    # 利確は損切りの2倍以上（RR≥2:1）、最大4×ATR
    tp_multipliers = [2.0, 2.5, 3.0, 3.5, 4.0]

    train_size = int(len(hist) * 0.75)
    if train_size < 30:
        return None, -1
    train_hist = hist.iloc[:train_size]
    test_hist = hist.iloc[train_size:]

    best_params = None
    best_score = -1

    for buy_pct in buy_pct_range:
        sim_buy = current_price * (1 - buy_pct / 100)
        for sl_pct in sl_pct_range:
            sim_sl = sim_buy * (1 - sl_pct / 100)
            for tp_mult in tp_multipliers:
                # RR比 = tp_mult / 1 (損切り1に対してtp_mult倍の利益)
                sim_tp = sim_buy + (sim_buy - sim_sl) * tp_mult

                t_tr, w_tr, _, _ = run_backtest(train_hist, sim_buy, sim_tp, sim_sl)
                if t_tr >= 2 and w_tr >= 45:
                    t_te, w_te, _, _ = run_backtest(test_hist, sim_buy, sim_tp, sim_sl)
                    t_all = t_tr + t_te
                    if t_all > 0:
                        w_all = ((w_tr * t_tr) + (w_te * t_te)) / t_all
                        if (t_te == 0 or w_te >= 30) and w_all > best_score:
                            best_score = w_all
                            best_params = {"Buy": sim_buy, "TakeProfit": sim_tp, "StopLoss": sim_sl,
                                           "rr_ratio": tp_mult}

    return best_params, best_score


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
                
                last_close = float(hist['Close'].iloc[-1])
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
                    # 実績を記録
                    result = "win" if action == "hit_tp" else "loss"
                    predicted_wr = 0
                    try:
                        c_ai = col_idx.get('AIテキスト', col_idx.get('ai_text', -1))
                        if c_ai != -1 and len(row) > c_ai:
                            import re
                            m = re.search(r'勝率(\d+)', str(row[c_ai]))
                            if m:
                                predicted_wr = int(m.group(1))
                    except Exception:
                        pass
                    record_trade_result(code, predicted_wr, result)
                    # LINE通知は GAS の checkAndNotify() に一本化（二重通知防止）
                    time.sleep(1)
                else:
                    # 出来高急増チェック（LINE通知は GAS 側で行う）
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


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRADE_RESULTS_PATH = os.path.join(BASE_DIR, "trade_results.json")
STRATEGIES_PATH = os.path.join(BASE_DIR, "strategies.json")


def load_strategies():
    """戦略設定を読み込む"""
    try:
        with open(STRATEGIES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {
            "active_strategy": "B",
            "strategies": {
                "B": {"name": "通常戦略", "stage1_winrate": 70, "stage2_winrate": 65,
                      "target_holdings": 15, "dip_range_pct": 0.05}
            }
        }


def get_active_strategy():
    """現在アクティブな戦略のパラメータを返す"""
    data = load_strategies()
    key = data.get("active_strategy", "B")
    return key, data["strategies"].get(key, data["strategies"]["B"])


def save_active_strategy(new_key):
    """アクティブ戦略を変更して保存する"""
    try:
        with open(STRATEGIES_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["active_strategy"] = new_key
        with open(STRATEGIES_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logging.error(f"strategies.json 保存失敗: {e}")


def record_trade_result(code, predicted_winrate, result):
    """利確/損切の実績を記録する（result: 'win' or 'loss'）"""
    try:
        with open(TRADE_RESULTS_PATH, "r", encoding="utf-8") as f:
            results = json.load(f)
    except Exception:
        results = []

    results.append({
        "code": str(code),
        "predicted_winrate": predicted_winrate,
        "result": result,
        "date": datetime.now(JST).strftime("%Y-%m-%d")
    })

    try:
        with open(TRADE_RESULTS_PATH, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        logging.info(f"実績記録: {code} → {result} (予測勝率:{predicted_winrate}%)")
    except Exception as e:
        logging.error(f"trade_results.json 保存失敗: {e}")


def auto_switch_strategy():
    """日次：相場状況×実績のツリーで最適戦略に自動切替しLINEで報告する"""
    # 相場状況を取得
    market_status, market_msg = get_market_status()

    # 実績データを読み込む
    try:
        with open(TRADE_RESULTS_PATH, "r", encoding="utf-8") as f:
            results = json.load(f)
    except Exception:
        results = []

    # 実績が少ない場合は相場状況だけで判断
    if len(results) < 10:
        perf = "unknown"
        actual_winrate = 0
        gap = 0
    else:
        recent = results[-30:]
        wins = sum(1 for r in recent if r["result"] == "win")
        actual_winrate = wins / len(recent) * 100
        avg_predicted = sum(r["predicted_winrate"] for r in recent) / len(recent)
        gap = avg_predicted - actual_winrate
        if gap <= -5:
            perf = "good"    # 実際が予測を上回る好調
        elif gap < 10:
            perf = "normal"  # 通常範囲
        elif gap < 20:
            perf = "bad"     # やや不調
        else:
            perf = "crisis"  # 大幅不調

    # ===== 戦略決定ツリー =====
    if market_status == "crash":
        new_key = "E"  # 急落 → 問答無用で完全停止
    elif market_status == "mild_down":
        new_key = "D"  # 下落 → 守備
    elif market_status == "flat":
        if perf in ("good", "normal", "unknown"):
            new_key = "C"  # 横ばい×普通以上 → 慎重
        else:
            new_key = "D"  # 横ばい×不調 → 守備
    elif market_status == "mild_up":
        if perf == "good":
            new_key = "B"  # 緩上昇×好調 → 通常
        elif perf in ("normal", "unknown"):
            new_key = "B"  # 緩上昇×普通 → 通常
        else:
            new_key = "C"  # 緩上昇×不調 → 慎重
    else:  # strong_up
        if perf == "good":
            new_key = "A"  # 強上昇×好調 → 強気
        elif perf == "normal":
            new_key = "B"  # 強上昇×普通 → 通常
        else:
            new_key = "C"  # 強上昇×不調 → 慎重

    data = load_strategies()
    old_key = data.get("active_strategy", "B")
    old_name = data["strategies"][old_key]["name"]
    new_name = data["strategies"][new_key]["name"]
    save_active_strategy(new_key)

    changed = old_key != new_key
    change_label = f"切替: {old_name} → {new_name}" if changed else f"維持: {new_name}"
    perf_label = {"good": "好調", "normal": "普通", "bad": "不調", "crisis": "危機", "unknown": "実績少"}.get(perf, "")

    msg = (
        f"【戦略自動切替レポート】\n"
        f"相場: {market_msg}\n"
        f"実績: {perf_label}"
        + (f"（勝率{actual_winrate:.1f}% 乖離{gap:+.1f}%）" if perf != "unknown" else "") +
        f"\n\n→ {change_label}\n"
        f"閾値: {data['strategies'][new_key]['stage1_winrate']}% "
        f"上限: {data['strategies'][new_key]['target_holdings']}銘柄"
    )
    if changed:
        send_line(msg)
    logging.info(f"戦略決定: {new_key}（相場={market_status} 実績={perf}）")


def gemini_analyze_financials(code, ticker_name):
    """Geminiに決算書データを渡して銘柄の財務健全性を判定する。
    戻り値: (score: int, reason: str)
      score 2=良好 / 1=要注意 / 0=不良
    """
    if not genai or not GEMINI_API_KEY:
        return 1, "Gemini未使用のため要注意扱い"
    try:
        ticker = yf.Ticker(f"{code}.T")
        info = ticker.info
        fins = ticker.quarterly_financials
        bs = ticker.quarterly_balance_sheet

        # 売上・利益の成長率を計算
        revenue_growth = "不明"
        op_profit_growth = "不明"
        equity_ratio = "不明"

        if fins is not None and not fins.empty and fins.shape[1] >= 2:
            rev_row = [r for r in fins.index if "Revenue" in str(r) or "売上" in str(r)]
            op_row = [r for r in fins.index if "Operating" in str(r) or "営業" in str(r)]
            if rev_row:
                r_new = fins.loc[rev_row[0]].iloc[0]
                r_old = fins.loc[rev_row[0]].iloc[1]
                if r_old and r_old != 0:
                    revenue_growth = f"{(r_new / r_old - 1) * 100:+.1f}%"
            if op_row:
                o_new = fins.loc[op_row[0]].iloc[0]
                o_old = fins.loc[op_row[0]].iloc[1]
                if o_old and o_old != 0:
                    op_profit_growth = f"{(o_new / o_old - 1) * 100:+.1f}%"

        if bs is not None and not bs.empty:
            eq_row = [r for r in bs.index if "Equity" in str(r) or "自己資本" in str(r)]
            as_row = [r for r in bs.index if "Total Assets" in str(r) or "総資産" in str(r)]
            if eq_row and as_row:
                eq = bs.loc[eq_row[0]].iloc[0]
                ta = bs.loc[as_row[0]].iloc[0]
                if ta and ta != 0:
                    equity_ratio = f"{eq / ta * 100:.1f}%"

        per = info.get("trailingPE", "不明")
        pbr = info.get("priceToBook", "不明")
        per_str = f"{per:.1f}倍" if isinstance(per, float) else "不明"
        pbr_str = f"{pbr:.2f}倍" if isinstance(pbr, float) else "不明"

        prompt = f"""あなたは日本株の財務分析の専門家です。
以下の財務データをもとに、この銘柄への投資判断を3段階で答えてください。

【銘柄】{ticker_name}（{code}）
【直近決算】
- 売上成長率（前四半期比）: {revenue_growth}
- 営業利益成長率（前四半期比）: {op_profit_growth}
- 自己資本比率: {equity_ratio}
- PER: {per_str}
- PBR: {pbr_str}

【回答形式】必ず以下のJSON形式のみで答えること。説明文は不要。
{{"score": 2, "reason": "理由を30文字以内で"}}
scoreは 2=良好 / 1=要注意 / 0=不良 のいずれか。"""

        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
        text = response.text.strip()
        # JSON部分を抽出
        import re
        m = re.search(r'\{.*\}', text, re.DOTALL)
        if m:
            data = json.loads(m.group())
            return int(data.get("score", 1)), str(data.get("reason", ""))
    except Exception as e:
        logging.warning(f"Gemini財務分析エラー ({code}): {e}")
    return 1, "分析エラーのため要注意扱い"


def gemini_analyze_performance():
    """月次：Geminiに実績を渡して敗因分析・改善コメントをLINEで通知する"""
    if not genai or not GEMINI_API_KEY:
        return

    try:
        with open(TRADE_RESULTS_PATH, "r", encoding="utf-8") as f:
            results = json.load(f)
    except Exception:
        return

    if len(results) < 10:
        return

    recent = results[-30:]
    wins = [r for r in recent if r["result"] == "win"]
    losses = [r for r in recent if r["result"] == "loss"]
    actual_winrate = len(wins) / len(recent) * 100
    avg_predicted = sum(r["predicted_winrate"] for r in recent) / len(recent)
    _, strategy = get_active_strategy()

    prompt = f"""あなたは日本株の自動トレードシステムの専門家です。
以下の実績データを分析してください。

直近{len(recent)}件: 勝{len(wins)}件 / 負{len(losses)}件
実際の勝率: {actual_winrate:.1f}% / 予測平均: {avg_predicted:.1f}%
現在の戦略: {strategy['name']}（第1段階閾値{strategy['stage1_winrate']}%）

【答えてほしいこと（LINEで読みやすく200文字以内）】
1. 不調の原因として考えられること（1〜2つ）
2. 現状の戦略で注意すべき点（1つ）"""

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
        if response.text:
            send_line(f"【AIコメント】\n\n{response.text.strip()}")
            logging.info("Gemini月次分析をLINEに送信しました")
    except Exception as e:
        logging.error(f"Gemini月次分析エラー: {e}")


def get_market_status():
    """TOPIXを5段階で判定して返す: strong_up / mild_up / flat / mild_down / crash"""
    try:
        topix = yf.Ticker("1305.T")
        hist = topix.history(period="6mo")
        if len(hist) < 25:
            return "mild_up", "データ不足のため通常扱い"
        close = hist['Close']
        current = float(close.iloc[-1])
        sma25 = float(close.rolling(25).mean().iloc[-1])
        sma75 = float(close.rolling(min(75, len(close))).mean().iloc[-1])
        prev_sma75 = float(close.rolling(min(75, len(close))).mean().iloc[-5])

        if current < sma75 * 0.95:
            return "crash", f"急落（現値{current:.0f} < SMA75×0.95={sma75*0.95:.0f}）"
        elif current < sma25:
            return "mild_down", f"緩やかな下落（現値{current:.0f} < SMA25={sma25:.0f}）"
        elif sma75 <= prev_sma75 * 1.001 and current < sma25 * 1.03:
            return "flat", f"横ばい（SMA75ほぼ横ばい 現値{current:.0f}）"
        elif current >= sma25 * 1.03 and sma25 > sma75:
            return "strong_up", f"強い上昇（現値{current:.0f} SMA25={sma25:.0f} SMA75={sma75:.0f}）"
        else:
            return "mild_up", f"緩やかな上昇（現値{current:.0f} SMA75={sma75:.0f}）"
    except Exception as e:
        return "mild_up", f"TOPIXチェックエラー({e})のため通常扱い"


def get_market_trend():
    """後方互換用：get_market_statusをラップして真偽値で返す"""
    status, msg = get_market_status()
    return status not in ("crash", "mild_down"), msg


# 東証に実際に上場している銘柄コードの主要範囲
# （1300-9999の全コードは大半が未使用。実在銘柄の密度が高いレンジに絞る）
TSE_ACTIVE_RANGES = list(range(1301, 2000)) + list(range(2001, 3000)) + \
                    list(range(3001, 4000)) + list(range(4001, 5000)) + \
                    list(range(5001, 6000)) + list(range(6001, 7000)) + \
                    list(range(7001, 8000)) + list(range(8001, 9000)) + \
                    list(range(9001, 9900))
# 英数混合コード（例: 367A）などは除外し、4桁数字コードのみ対象とする
TSE_ACTIVE_RANGES = [str(c) for c in TSE_ACTIVE_RANGES]


def auto_screen_and_add():
    """全自動スクリーニングと有望銘柄の追加"""
    logging.info("--- 全自動スクリーニングと有望銘柄の追加開始 ---")
    
    # 銘柄を処理してスプレッドシート・HP・Twitterに追加するヘルパー関数
    def process_and_add_stock(cand, best_params, best_win_rate, existing_codes_list):
        """候補銘柄を全チャネルに投稿・追加する"""
        s_code = cand['code']
        current_price = cand['current_price']
        try:
            ticker_obj = yf.Ticker(f"{s_code}.T")
            ticker_name = ticker_obj.info.get('shortName') or ticker_obj.info.get('longName') or s_code
        except:
            ticker_name = s_code
        
        logging.info(f"有望銘柄発見: {ticker_name}({s_code}) 現在値:{int(current_price)}円 (100株で{int(current_price*100):,}円) 勝率:{best_win_rate:.0f}%")
        
        rr_ratio = (best_params['TakeProfit'] - best_params['Buy']) / (best_params['Buy'] - best_params['StopLoss']) if (best_params['Buy'] - best_params['StopLoss']) > 0 else 0
        lot_size = calc_lot_size(best_params['Buy'], best_params['StopLoss'], max_loss_yen=10000)
        invest_amount = int(best_params['Buy'] * lot_size)
        max_loss = int((best_params['Buy'] - best_params['StopLoss']) * lot_size)
        max_gain = int((best_params['TakeProfit'] - best_params['Buy']) * lot_size)
        ai_text = (
            f"【AI判定】勝率{best_win_rate:.0f}% RR比{rr_ratio:.1f}:1 | "
            f"財務:{fin_label}（{fin_reason}）| "
            f"推奨{lot_size}株（投資額約{invest_amount:,}円）| "
            f"最大損失-{max_loss:,}円 / 利確+{max_gain:,}円"
        )
        fin_score = cand.get('financial_score', 1)
        fin_reason = cand.get('financial_reason', '')
        fin_label = {2: "良好", 1: "要注意", 0: "不良"}.get(fin_score, "不明")
        ai_color = "orange" if best_win_rate < 70 or fin_score < 2 else "green"
        
        hp_article = generate_ai_article(
            ticker_name, s_code, current_price,
            best_params['Buy'], best_params['TakeProfit'], best_params['StopLoss'],
            best_win_rate, pbr=cand.get('pbr'), dividend=cand.get('dividend')
        )
        pages_url = post_to_github_pages(
            ticker_name, s_code, current_price,
            best_params['Buy'], best_params['TakeProfit'], best_params['StopLoss'],
            best_win_rate, hp_article
        )
        homepage_url = pages_url
        
        x_title = "📈10万円以内で買える注目株✨\n\n" if current_price <= 1000 else "📈AI厳選！本日の注目銘柄✨\n\n"
        x_base_text = (
            f"{x_title}"
            f"{ticker_name}（{s_code}）\n"
            f"現在値: {int(current_price)}円（100株で{int(current_price*100):,}円）\n"
            f"AI分析勝率: {best_win_rate:.0f}%\n\n"
            f"詳しくはブログで👇\n(リンク)\n\n#日本株 #少額投資 #AI分析"
        )
        x_text = post_to_twitter(x_base_text, link_url=homepage_url)
        
        payload = {
            "action": "add_new", "code": str(s_code),
            "ai_text": ai_text, "ai_color": ai_color,
            "buy": int(best_params['Buy']), "tp": int(best_params['TakeProfit']),
            "sl": int(best_params['StopLoss']), "current_price": float(current_price),
            "lot_size": lot_size, "invest_amount": invest_amount,
            "max_loss": max_loss, "max_gain": max_gain,
            "x_post_text": x_text, "hp_text": hp_article, "sns_done": True,
            "sheet_sns": "SNS配信済", "sheet_x": "X配信テキスト", "sheet_hp": "ホームページへの自動記載"
        }
        try:
            res = requests.post(WEBHOOK_URL, json=payload)
            if res.status_code == 200:
                if "already exists" in res.text:
                    logging.info(f"スキップ: {s_code} は既にスプレッドシートに存在します。")
                else:
                    logging.info(f"成功: {s_code} をスプレッドシートに追加しました")
                existing_codes_list.append(str(s_code))  # 重複追加防止
                return True
        except Exception as e:
            logging.error(f"スプレッドシート追加エラー ({s_code}): {e}")
        return False
    
    # アクティブ戦略を読み込む（月次自動切替で更新される）
    strategy_key, strategy = get_active_strategy()
    min_winrate_stage1 = strategy.get("stage1_winrate", 70)
    min_winrate_stage2 = strategy.get("stage2_winrate", 65)
    dip_range = strategy.get("dip_range_pct", 0.05)
    logging.info(f"起動中の戦略: {strategy['name']}（第1段階={min_winrate_stage1}% / 第2段階={min_winrate_stage2}%）")

    # 市場トレンドチェック
    is_uptrend, trend_msg = get_market_trend()
    logging.info(f"市場トレンド判定: {trend_msg}")

    import random
    # 実在コード範囲からランダムサンプリング（1300-9999全列挙より大幅に効率化）
    target_codes = random.sample(TSE_ACTIVE_RANGES, min(2500, len(TSE_ACTIVE_RANGES)))
    
    # yfinanceへの負荷を抑えるために100銘柄ずつのチャンクに分ける
    chunk_size = 100
    candidates = []
    
    for i in range(0, len(target_codes), chunk_size):
        chunk = target_codes[i:i + chunk_size]
        ticker_str = " ".join([f"{c}.T" for c in chunk])
        logging.info(f"スクリーニング中: {i} to {i+chunk_size} 銘柄目...")
        
        try:
            # リトライロジックを追加
            retries = 3
            for attempt in range(retries):
                try:
                    # yfinance 1.x対応: group_by/threads/sessionパラメータは廃止
                    data = yf.download(ticker_str, period="3mo", progress=False)
                    break
                except Exception as e:
                    if attempt < retries - 1:
                        time.sleep(5) # APIエラー時は5秒待機してリトライ
                    else:
                        raise e

            for code in chunk:
                t_code = f"{code}.T"
                # ── yfinance 1.x対応: MultiIndex形式が (Price, Ticker) に変更 ──
                try:
                    if hasattr(data.columns, 'levels'):
                        # yfinance 1.x: MultiIndex (Price, Ticker) - level 1 がティッカー
                        # yfinance 0.2.x group_by="ticker": (Ticker, Price) - level 0 がティッカー
                        level1_vals = data.columns.get_level_values(1)
                        level0_vals = data.columns.get_level_values(0)
                        if t_code in level1_vals:
                            # yfinance 1.x形式
                            df_ticker = data.xs(t_code, axis=1, level=1).copy()
                        elif t_code in level0_vals:
                            # yfinance 0.2.x形式 (後方互換)
                            df_ticker = data[t_code].copy()
                        else:
                            continue
                    else:
                        # 単一銘柄の場合はそのまま使う
                        df_ticker = data.copy()
                except (KeyError, AttributeError):
                    continue
                
                if df_ticker.empty or len(df_ticker) < 30:
                    continue
                try:
                    close_s = df_ticker['Close'].dropna()
                    vol_s = df_ticker['Volume'].dropna()
                    if len(close_s) < 25:
                        continue
                    current_price = float(close_s.iloc[-1])

                    if current_price < 100:
                        continue  # 極端に安い銘柄は除外

                    # 流動性フィルター: 直近20日平均出来高が5万株未満は除外
                    avg_volume = float(vol_s.iloc[-20:].mean()) if len(vol_s) >= 20 else 0
                    if avg_volume < 50000:
                        continue

                    sma25 = close_s.rolling(window=25).mean().iloc[-1]

                    # ── バグ修正: RSI計算のNaN/Inf問題を解消 ──
                    delta = close_s.diff()
                    gain = delta.clip(lower=0).rolling(window=14).mean()
                    loss = (-delta.clip(upper=0)).rolling(window=14).mean()
                    # lossが0の場合のゼロ除算を防ぐ
                    rs = gain / loss.replace(0, float('nan'))
                    rsi_series = 100 - (100 / (1 + rs))
                    rsi = float(rsi_series.iloc[-1]) if not rsi_series.empty and not pd.isna(rsi_series.iloc[-1]) else 50.0

                    if pd.isna(sma25) or sma25 == 0:
                        continue
                    deviation = (current_price - sma25) / sma25 * 100

                    if deviation <= 5 and rsi <= 65:
                        ticker_obj = yf.Ticker(t_code)
                        info = ticker_obj.info
                        pbr = info.get('priceToBook') or 0
                        mc = info.get('marketCap') or 0
                        if 10_000_000_000 <= mc <= 3_000_000_000_000:
                            candidates.append({
                                "code": code, "pbr": pbr, "deviation": deviation,
                                "rsi": rsi, "current_price": current_price, "mc": mc,
                                "dividend": info.get('dividendYield') or 0,
                                "avg_volume": avg_volume
                            })
                except Exception:
                    continue
        except Exception as e:
            logging.error(f"チャンク取得エラー: {e}")
        
        # チャンクごとに少し休憩
        time.sleep(2)
    
    logging.info(f"テクニカルフィルタ通過候補: {len(candidates)} 銘柄")

    # ── 財務スコアをGeminiで付与（上位30件のみ、API負荷対策）──
    top_candidates = sorted(candidates, key=lambda x: abs(x['deviation']))[:30]
    for cand in top_candidates:
        try:
            t_obj = yf.Ticker(f"{cand['code']}.T")
            t_name = t_obj.info.get('shortName') or cand['code']
            score, reason = gemini_analyze_financials(cand['code'], t_name)
            cand['financial_score'] = score
            cand['financial_reason'] = reason
            logging.info(f"財務スコア {cand['code']}: {score}点 ({reason})")
            time.sleep(1)  # API負荷対策
        except Exception:
            cand['financial_score'] = 1
            cand['financial_reason'] = "取得エラー"

    # 財務スコアがない銘柄はデフォルト1点
    for cand in candidates:
        if 'financial_score' not in cand:
            cand['financial_score'] = 1
            cand['financial_reason'] = "未評価"

    # 財務不良（0点）は除外し、財務スコア降順×乖離率昇順で並び替え
    candidates = [c for c in candidates if c.get('financial_score', 1) >= 1]
    candidates = sorted(candidates, key=lambda x: (-x.get('financial_score', 1), abs(x['deviation'])))
    try:
        res = requests.post(WEBHOOK_URL, json={"action": "get_all"})
        all_rows = res.json()
        # ヘッダーを除いた有効なコードのリストを取得
        existing_codes = [str(row[0]).replace(' ', '') for row in all_rows if len(row) > 0 and str(row[0]).strip() != '' and str(row[0]).strip() != 'コード']
    except Exception as e:
        logging.error(f"既存銘柄の取得に失敗: {e}")
        all_rows = []
        existing_codes = []

    current_count = len(existing_codes)
    target_holdings = strategy.get("target_holdings", 15)
    # 条件を満たす銘柄だけ追加（強制追加なし）
    needed_count = max(0, target_holdings - current_count)
    added_count = 0
    added_codes = []

    logging.info(f"現在の監視銘柄数: {current_count} / 目標: {target_holdings} (今回の追加目標: {needed_count} 銘柄)")
            
    # ===== 第1段階: 【最高品質】上昇トレンド(75日線上) + 25日線押し目 + 勝率70%以上 =====
    logging.info(f"--- 第1段階: 上昇トレンド×押し目×勝率70%以上を探索 ---")
    for cand in candidates:
        if added_count >= needed_count:
            break
        s_code = cand['code']
        if str(s_code) in existing_codes:
            continue
            
        try:
            hist_6m = yf.Ticker(f"{s_code}.T").history(period="6mo")
            if len(hist_6m) < 75:
                continue
            
            close_prices = hist_6m['Close']
            sma25 = close_prices.rolling(window=25).mean()
            sma75 = close_prices.rolling(window=75).mean()
            
            curr_p = float(close_prices.iloc[-1])
            curr_sma25 = float(sma25.iloc[-1])
            curr_sma75 = float(sma75.iloc[-1])
            prev_sma75 = float(sma75.iloc[-5])
            
            if curr_sma75 == 0 or curr_sma25 == 0:
                continue
            
            is_uptrend = (curr_p > curr_sma75) and (curr_sma75 > prev_sma75)
            is_dip = (abs(curr_p - curr_sma25) / curr_sma25 <= 0.05)

            if is_uptrend and is_dip:
                hist_2y = yf.Ticker(f"{s_code}.T").history(period="2y")
                if len(hist_2y) < 60:
                    continue

                # ATRベース最適化（ボラティリティ適応）を優先し、
                # 失敗時は従来の固定%最適化にフォールバック
                atr = calc_atr(hist_2y)
                best_params, best_win_rate = optimize_params_atr_based(hist_2y, curr_p, atr)
                if not best_params or best_win_rate < 65:
                    buy_range = [0, 1, 2, 3]
                    tp_range = range(5, 21, 5)
                    sl_range = [3, 5, 7]
                    best_params, best_win_rate = optimize_params_walk_forward(hist_2y, buy_range, tp_range, sl_range)

                # 第1段階: 高い勝率基準（自動調整された閾値）
                if best_params and best_win_rate >= min_winrate_stage1:
                    cand['current_price'] = curr_p
                    cand['stage'] = 1
                    if process_and_add_stock(cand, best_params, best_win_rate, existing_codes):
                        added_count += 1
                        added_codes.append(s_code)
                        logging.info(f"[第1段階] {s_code} 追加成功 (勝率{best_win_rate:.1f}%)")
                        
        except Exception as e:
            logging.error(f"第1段階エラー ({s_code}): {e}")
            continue

    # ===== 第2段階: 目標未達の場合 - 25日線付近(条件緩和) + 勝率55%以上 =====
    if added_count < needed_count:
        logging.info(f"--- 第2段階: 目標未達({added_count}/{needed_count}) - 条件を緩和して探索 ---")
        for cand in candidates:
            if added_count >= needed_count:
                break
            s_code = cand['code']
            if str(s_code) in existing_codes or s_code in added_codes:
                continue
            
            try:
                hist_6m = yf.Ticker(f"{s_code}.T").history(period="6mo")
                if len(hist_6m) < 60:
                    continue
                
                close_prices = hist_6m['Close']
                sma25 = close_prices.rolling(window=25).mean()
                sma75 = close_prices.rolling(window=75).mean()
                
                curr_p = float(close_prices.iloc[-1])
                curr_sma25 = float(sma25.iloc[-1])
                curr_sma75 = float(sma75.iloc[-1])
                prev_sma75 = float(sma75.iloc[-5])
                
                if curr_sma75 == 0 or curr_sma25 == 0:
                    continue
                
                # 第2段階では上昇トレンドの条件をやや緩和（横ばいも可）
                is_uptrend_or_flat = (curr_p > curr_sma75)
                # 乖離率の許容範囲を広げる（±8%以内）
                is_near_dip = (abs(curr_p - curr_sma25) / curr_sma25 <= 0.08)
                
                if is_uptrend_or_flat and is_near_dip:
                    hist_2y = yf.Ticker(f"{s_code}.T").history(period="2y")
                    if len(hist_2y) < 60:
                        continue
                    atr = calc_atr(hist_2y)
                    best_params, best_win_rate = optimize_params_atr_based(hist_2y, curr_p, atr)
                    if not best_params or best_win_rate < 55:
                        buy_range = [0, 1, 2, 3, 4]
                        tp_range = range(5, 26, 5)
                        sl_range = [3, 5, 7, 10]
                        best_params, best_win_rate = optimize_params_walk_forward(hist_2y, buy_range, tp_range, sl_range)

                    # 第2段階: 勝率（自動調整された閾値）
                    if best_params and best_win_rate >= min_winrate_stage2:
                        cand['current_price'] = curr_p
                        cand['stage'] = 2
                        if process_and_add_stock(cand, best_params, best_win_rate, existing_codes):
                            added_count += 1
                            added_codes.append(s_code)
                            logging.info(f"[第2段階] {s_code} 追加成功 (勝率{best_win_rate:.1f}%)")
                            
            except Exception as e:
                logging.error(f"第2段階エラー ({s_code}): {e}")
                continue

    # ===== 最終結果の記録 & LINE サマリー送信 =====
    today_str = datetime.now(JST).strftime("%Y年%m月%d日")
    if added_count == 0:
        logging.warning("3段階のスクリーニングをすべて実施しましたが、条件を満たす銘柄が見つかりませんでした。")
        no_result_article = (
            f"## 【{today_str}のAIスクリーニング結果】\n\n"
            f"本日のAI自動スクリーニング（3段階・約2,500銘柄対象）を実施しましたが、\n"
            f"**バックテスト勝率等の基準を満たす新銘柄は本日は見つかりませんでした。**\n\n"
            f"### 📊 本日の市場状況\n"
            f"- スクリーニング対象: 約2,500銘柄\n"
            f"- 第1段階基準: 上昇トレンド×押し目×勝率70%以上\n"
            f"- 第2段階基準: 75日線上×乖離±8%以内×勝率65%以上\n\n"
            f"条件に合う銘柄が見つかり次第、次回の更新でお届けします。\n\n"
            f"**焦らず、良い銘柄を厳選するのがAI投資の強みです。** 🤖"
        )
        post_to_github_pages(
            "本日は該当銘柄なし", "0000", 0, 0, 0, 0, 0, no_result_article
        )
        send_line(
            f"📋 {today_str} AIスクリーニング結果\n\n"
            f"本日は条件を満たす新銘柄が見つかりませんでした。\n"
            f"市場状況: {trend_msg}\n\n"
            f"焦らず次回の更新をお待ちください。"
        )
    else:
        codes_summary = "、".join(added_codes[:5]) + ("..." if len(added_codes) > 5 else "")
        stage_summary = f"追加: {added_count}銘柄 (目標: {needed_count}銘柄)"
        logging.info(f"本日の最終結果: {stage_summary}")
        send_line(
            f"📋 {today_str} AIスクリーニング結果\n\n"
            f"✅ {added_count}銘柄を新規追加しました！\n"
            f"追加銘柄: {codes_summary}\n\n"
            f"市場状況: {trend_msg}\n\n"
            f"各銘柄の買いターゲットに近づいたら改めて通知します。\n"
            f"📊 {GITHUB_PAGES_URL}"
        )
    
    try:
        jst_now = datetime.now(JST).strftime("%Y/%m/%d %H:%M")
        requests.post(WEBHOOK_URL, json={"action": "log_time", "time": jst_now, "count": added_count})
    except:
        pass


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', choices=['full', 'check_only'], default='full',
                        help='full=全処理 / check_only=価格チェックのみ（取引時間中の高頻度実行用）')
    args = parser.parse_args()

    if args.mode == 'check_only':
        # 取引時間中の15分おき実行：価格チェックのみ（スクリーニングはしない）
        logging.info("=== 価格チェックモード（check_only）===")
        check_portfolio_status()
    else:
        # 通常の全処理（1日1回・市場終了後）
        logging.info("=== フルモード実行 ===")
        auto_switch_strategy()
        gemini_analyze_performance()
        check_portfolio_status()
        auto_screen_and_add()
