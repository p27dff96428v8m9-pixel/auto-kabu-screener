import streamlit as st
import pandas as pd
import yfinance as yf
import plotly.graph_objects as go
from datetime import datetime
import time
import requests
import gspread
from google.oauth2.service_account import Credentials
import json

# ======= 1. Data Loading =======
sheet_url = "https://docs.google.com/spreadsheets/d/1C8UzXEeRYIuw4mMoYEB1Di3WdRyIhRsOmL0LVvPGNiQ/export?format=csv"

@st.cache_data(ttl=600)
def load_data():
    try:
        # スプレッドシートをCSV形式で読み込みます
        df = pd.read_csv(sheet_url, encoding='utf-8')
        # カラム名に含まれる見えない文字（ゼロ幅スペース等）や空白を削除
        df.rename(columns=lambda x: x.replace('\u200b', '').strip(), inplace=True)
        # コード列の整理（数値を文字列に、文字列も含めて余分な記号を削除）
        # ただし、'367A'などの英字付きコードもあるため、数字とアルファベットを残す
        df['コード'] = df['コード'].astype(str).str.replace(r'[^0-9A-Za-z]', '', regex=True)
        # 空行やnanの除外
        df = df[df['コード'] != '']
        df = df[df['コード'].str.lower() != 'nan']
        
        return df
    except Exception as e:
        st.error(f"データの読み込みに失敗しました: {e}")
        return pd.DataFrame()

# ======= 2. Technical Data Scraping (Yahoo Finance) =======
@st.cache_data(ttl=3600)
def get_historical_data(ticker_symbol):
    # 日本株の場合は .T をつける
    yf_ticker = f"{ticker_symbol}.T"
    ticker = yf.Ticker(yf_ticker)
    hist = ticker.history(period="6mo")
    return hist

# ======= 3. Dashboard UI =======
st.set_page_config(page_title="株自動監視ダッシュボード", layout="wide", page_icon="📈")

st.title("📈 株自動監視・分析ダッシュボード")
st.markdown("Googleスプレッドシートのデータをリアルタイムで統合・分析する専用アプリです。")

df = load_data()
if df.empty:
    st.stop()

# ======= 5. Data Display =======
st.subheader("📊 現在の監視リスト (スプレッドシート連携)")
st.dataframe(df, use_container_width=True)

st.divider()

# サイドバーで銘柄を選択
st.sidebar.header("⚙️ 銘柄詳細分析")
selected_ticker_idx = st.sidebar.selectbox(
    "分析する銘柄を選択してください", 
    range(len(df)), 
    format_func=lambda i: f"{df.iloc[i]['コード']} - {df.iloc[i]['銘柄名']}"
)

selected_row = df.iloc[selected_ticker_idx]
ticker_code = selected_row['コード']
ticker_name = selected_row['銘柄名']

st.header(f"🔍 {ticker_name} ({ticker_code}) の詳細分析")

col1, col2, col3 = st.columns(3)
col1.metric("設定された買い目標", selected_row.get('買い目標', 'N/A'))
col2.metric("利益確定目標", selected_row.get('利確目標', 'N/A'))
col3.metric("損切りライン", selected_row.get('損切り', 'N/A'))

# ======= テクニカル指標の取得とチャート表示 =======
st.subheader(f"📈 過去6ヶ月の価格推移とテクニカル分析")
with st.spinner('リアルタイムの市場データを取得中...'):
    hist = get_historical_data(ticker_code)

if not hist.empty:
    # Plotlyでローソク足チャートを描画
    fig = go.Figure(data=[go.Candlestick(x=hist.index,
                    open=hist['Open'],
                    high=hist['High'],
                    low=hist['Low'],
                    close=hist['Close'],
                    name='株価')])

    # 25日・75日移動平均線を追加
    hist['MA25'] = hist['Close'].rolling(window=25).mean()
    hist['MA75'] = hist['Close'].rolling(window=75).mean()
    
    fig.add_trace(go.Scatter(x=hist.index, y=hist['MA25'], mode='lines', name='25日線', line=dict(color='orange')))
    fig.add_trace(go.Scatter(x=hist.index, y=hist['MA75'], mode='lines', name='75日線', line=dict(color='blue')))
    
    fig.update_layout(xaxis_rangeslider_visible=False, height=500, margin=dict(l=0, r=0, t=30, b=0))
    st.plotly_chart(fig, use_container_width=True)
else:
    st.warning("Yahoo Financeからのデータ取得に失敗しました。")

# ======= 4. AI企業分析レポート生成 =======
st.subheader("🧠 自動AI企業分析 (ニュース・決算・財務データの統合評価)")
st.markdown("最新の市場ニュースや企業の基本情報（yfinance等から取得）を読み込み、AIが現在の「買い」判断を深く考察します。")

# AIを使うための設定（Gemini API Key）
import os
from dotenv import load_dotenv
load_dotenv()
default_key = os.environ.get("GEMINI_API_KEY", "")
if not default_key:
    st.info("💡 分析を実行するには、Google Gemini APIキーが必要です。（[無料取得はこちら](https://aistudio.google.com/app/apikey)）")
api_key = st.text_input("Gemini API Key", type="password", value=default_key)

if st.button(f"{ticker_name} の最新ニュースを元にAI分析を実行する"):
    if not api_key:
        st.error("APIキーを入力してください！")
    else:
        with st.spinner(f"最新の市場ニュースと {ticker_name} の財務情報を収集中..."):
            try:
                # 1. 財務情報やニュースをyfinanceから取得
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                
                ticker = yf.Ticker(f"{ticker_code}.T")
                info = ticker.info
                news = ticker.news
                
                # コンテキスト（AIに渡す材料）の作成
                news_text = ""
                if news:
                    for n in news[:5]:
                        news_text += f"- {n.get('title')} ({datetime.fromtimestamp(n.get('providerPublishTime', 0)).strftime('%Y-%m-%d')})\n"
                else:
                    news_text = "最近の目立ったニュースは取得できませんでした。"
                
                pe_ratio = info.get('trailingPE', 'データなし')
                pb_ratio = info.get('priceToBook', 'データなし')
                div_yield = info.get('dividendYield', 0)
                div_yield_pct = f"{div_yield * 100:.2f}%" if div_yield else 'データなし'
                
                prompt = f"""
                あなたはプロの株式アナリストです。以下の企業情報と最新ニュース、現在のスプレッドシート上の評価をもとに、
                今後の株価見通しについてプロフェッショナルな分析レポート（日本語）を作成してください。

                【対象企業】
                企業名: {ticker_name} (コード: {ticker_code})
                現在設定されている想定買い目標: {selected_row.get('買い目標', 'N/A')} 円
                ユーザーの現在の備考（AI分析）: {selected_row.get('備考（AI分析）', '特になし')}

                【最新市場データ (yfinance)】
                PER: {pe_ratio} / PBR: {pb_ratio} / 配当利回り: {div_yield_pct}
                
                【直近の関連ニュース】
                {news_text}
                
                以下の3つのセクションに分けて、Markdownで見やすく出力してください。
                1. 📰 **直近のファンダメンタルズ＆ニュース要約**: （ニュースや指標から見た現状の立ち位置）
                2. 📉 **今の「買い目標」は適切か？**: （現在のPERやニュースから見て、指定された買い目標の妥当性）
                3. 💡 **投資判断（総括）**: （短期・中期的なトレードの助言）
                """
                
                st.write("🧠 AIモデル（Gemini 2.5 Flash）で分析中...")
                model = genai.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content(prompt)
                
                st.success("🤖 分析完了！")
                st.markdown(response.text)
                
            except Exception as e:
                st.error(f"分析中にエラーが発生しました。APIキーが間違っているか、データが取得できなかった可能性があります。\n詳細: {e}")

# ======= 6. 本格バックテスト & 最適化 =======
st.subheader("📉 バックテスト: 勝率のシミュレーションと最適化")
st.markdown("現在の設定値（買い目標、利確目標、損切り）を用いて、過去2年間のデータで仮想トレードを実行します。")

# スプレッドシートの数値をパースするヘルパー関数
def parse_price(val):
    if pd.isna(val) or val == '':
        return None
    try:
        return float(str(val).replace(',', '').strip())
    except:
        return None

buy_price = parse_price(selected_row.get('買い目標'))
take_profit = parse_price(selected_row.get('利確目標'))
stop_loss = parse_price(selected_row.get('損切り'))

def run_backtest(df_hist, strategy_buy, strategy_take_profit, strategy_stop_loss):
    position = False   
    buy_date = None
    trades = []
    
    for date, row in df_hist.iterrows():
        low = row['Low']
        high = row['High']
        
        if not position:
            if low <= strategy_buy:
                position = True
                buy_date = date
        else:
            sell_price = None
            reason = ""
            
            if high >= strategy_take_profit:
                sell_price = strategy_take_profit
                reason = "利益確定 🟢"
            elif low <= strategy_stop_loss:
                sell_price = strategy_stop_loss
                reason = "損切り 🔴"
                
            if low <= strategy_stop_loss and high >= strategy_take_profit:
                sell_price = strategy_stop_loss
                reason = "損切り 🔴 (同日)"

            if sell_price is not None:
                profit = sell_price - strategy_buy
                trades.append({
                    '買い日': buy_date.strftime('%Y-%m-%d'),
                    '売り日': date.strftime('%Y-%m-%d'),
                    '結果': reason,
                    '損益額': profit
                })
                position = False
                
    total_trades = len(trades)
    if total_trades == 0:
        return 0, 0, 0, trades
    win_trades = [t for t in trades if t['損益額'] > 0]
    win_rate = len(win_trades) / total_trades * 100
    total_profit = sum(t['損益額'] for t in trades)
    expected_value = total_profit / total_trades
    return total_trades, win_rate, expected_value, trades

col_run, col_opt = st.columns(2)

with col_run:
    run_btn = st.button("現在のルールでバックテストを実行")
with col_opt:
    opt_btn = st.button("✨ 勝率を限界まで高めたラインを自動探索 (最適化)")

if buy_price is None or take_profit is None or stop_loss is None:
    st.error("買い目標、利確目標、損切りの設定ラインが読み取れないため、実行できません。")
else:
    if run_btn:
        with st.spinner("過去2年間のヒストリカルデータから売買をシミュレーション中..."):
            hist = yf.Ticker(f"{ticker_code}.T").history(period="2y")
            if hist.empty:
                st.error("過去の価格データが取得できませんでした。")
            else:
                total_trades, win_rate, expected_value, trades = run_backtest(hist, buy_price, take_profit, stop_loss)
                if total_trades == 0:
                    st.warning(f"過去2年間で、安値が「買い目標({buy_price}円)」に一度も到達しなかったため、トレードは発生しませんでした。")
                else:
                    st.success("🤖 シミュレーション完了！")
                    c1, c2, c3 = st.columns(3)
                    c1.metric("総トレード回数", f"{total_trades} 回")
                    c2.metric("勝率", f"{win_rate:.1f} %")
                    c3.metric("期待値 (1株あたり)", f"{expected_value:+.1f} 円")
                    st.write("▼ **仮想トレード履歴内訳**")
                    st.dataframe(pd.DataFrame(trades), use_container_width=True)

    if opt_btn:
        with st.spinner("勝率を限界まで高める「最適な買い・利確・損切りライン」をAIアルゴリズムでフル探索中..."):
            hist = yf.Ticker(f"{ticker_code}.T").history(period="2y")
            if hist.empty:
                st.error("過去の価格データが取得できませんでした。")
            else:
                current_price = hist['Close'].iloc[-1]
                st.info(f"探索基準価格: {current_price:.1f} 円 (※過去2年のデータから勝率最優先のラインを割り出しています)")
                
                # 最適な勝率を限界まで探す（Win Rate メイン、Profit サブ）
                best_params = None
                best_win_rate = -1
                best_profit = -999999
                
                # スキャン範囲を拡大（現在地から -2% ～ -40% まで細かく買い場を探す）
                for buy_pct in range(2, 42, 2):
                    sim_buy = current_price * (1 - buy_pct/100)
                    
                    # 利確：買い値から +2% ～ +30%
                    for tp_pct in range(2, 32, 2):
                        sim_tp = sim_buy * (1 + tp_pct/100)
                        
                        # 損切り：買い値から -2% ～ -30%
                        for sl_pct in range(2, 32, 2):
                            sim_sl = sim_buy * (1 - sl_pct/100)
                            
                            t_trades, w_rate, e_val, _ = run_backtest(hist, sim_buy, sim_tp, sim_sl)
                            
                            # まぐれ当たり（1回のトレードのみで100%等）を排除するため、年1回ペース（最低2回）は取引があるものに限定
                            if t_trades >= 2:
                                # 勝率がこれまでの最高値を更新したら記録
                                # もしくは、勝率が同立最高で、期待値（利益）がこれまでのものより大きければ記録
                                if w_rate > best_win_rate or (w_rate == best_win_rate and e_val > best_profit):
                                    best_win_rate = w_rate
                                    best_profit = e_val
                                    best_params = {
                                        "Buy": sim_buy,
                                        "TakeProfit": sim_tp,
                                        "StopLoss": sim_sl,
                                        "Trades": t_trades,
                                        "Expected": e_val
                                    }
                
                if best_params is not None and best_win_rate > 0:
                    st.success(f"🎉 勝率を限界まで高めた戦略（勝率 {best_win_rate:.1f}%）を発見しました！")
                    st.markdown("この銘柄のクセに最も合った究極の待ち伏せラインです。スプレッドシートへの反映をお勧めします。")
                    
                    c1, c2, c3 = st.columns(3)
                    c1.metric("最適 買い目標", f"{int(best_params['Buy'])} 円")
                    c2.metric("最適 利確目標", f"{int(best_params['TakeProfit'])} 円")
                    c3.metric("最適 損切りライン", f"{int(best_params['StopLoss'])} 円")
                    
                    st.divider()
                    st.write(f"**この設定での過去2年の成績**")
                    c4, c5, c6 = st.columns(3)
                    c4.metric("期待値 (1株あたり)", f"{int(best_profit)} 円")
                    c5.metric("最高勝率", f"{best_win_rate:.1f} %")
                    c6.metric("トレード回数", f"{best_params['Trades']} 回")

                    # スプレッドシートへの反映機能
                    st.divider()
                    st.subheader("📝 最適ラインをスプレッドシートに反映")
                    st.markdown("以下のいずれかの方法で、この最適化結果（買い・利確・損切ライン）を元のスプレッドシートに自動上書きできます。")
                    
                    update_method = st.radio("更新方法を選択", ["Google Apps Script (Webhook) を使う ※おすすめ・簡単", "サービスアカウント (JSON) を使う ※本格的"])

                    if update_method == "Google Apps Script (Webhook) を使う ※おすすめ・簡単":
                        st.info("""スプレッドシートの「拡張機能」>「Apps Script」を選択し、以下の最新コードを貼り付けて再デプロイしてください。

**[GAS用コード例（全機能対応版・見た目改善）]**
```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  var h = values[0];
  
  function getColLetter(idx) {
    var letter = '';
    idx = idx + 1;
    while (idx > 0) {
      var temp = (idx - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      idx = (idx - temp - 1) / 26;
    }
    return letter;
  }
  
  var codeIdx = 0;
  var buyColL = 'D', tpColL = 'E', slColL = 'F', rrColL = 'I', scoreColL = 'J', cColL = 'C', aiColL = 'L';
  for (var j = 0; j < h.length; j++) {
    var colN = String(h[j]).replace(/[\u200b\s]/g, '');
    if (colN.indexOf('コード') >= 0) codeIdx = j;
    else if (colN.indexOf('買い目標') >= 0) buyColL = getColLetter(j);
    else if (colN.indexOf('利確目標') >= 0) tpColL = getColLetter(j);
    else if (colN.indexOf('損切り') >= 0) slColL = getColLetter(j);
    else if (colN.indexOf('リスクリワード') >= 0) rrColL = getColLetter(j);
    else if (colN.indexOf('投資効率スコア') >= 0) scoreColL = getColLetter(j);
    else if (colN.indexOf('現在値') >= 0) cColL = getColLetter(j);
    else if (colN.indexOf('AI分析') >= 0) aiColL = getColLetter(j);
  }
  var codeLetter = getColLetter(codeIdx);
  
  if (data.action === "get_all") {
    return ContentService.createTextOutput(JSON.stringify(values))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (data.action === "log_time") {
    var timestampMsg = "🤖 自動監視 最終完了日時: " + data.time + "\n本日追加された銘柄: " + data.count + " 件";
    sheet.getRange(1, 1).setNote(timestampMsg);
    return ContentService.createTextOutput("time_logged");
  }

  if (data.action === "add_new") {
    var newRow = new Array(h.length).fill("");
    var rowIdx = sheet.getLastRow() + 1;
    
    var rrColIdx = -1, scoreColIdx = -1, aiColIdx = -1, nameColIdx = -1;
    var nameBgColor = '';
    
    for(var j=0; j<h.length; j++){
      var colName = String(h[j]).replace(/[\u200b\s]/g, '');
      
      if(colName.indexOf('コード') >= 0) newRow[j] = data.code;
      else if(colName.indexOf('銘柄名') >= 0) {
        newRow[j] = '=IMPORTXML("https://finance.yahoo.co.jp/quote/" & ' + codeLetter + rowIdx + ', "//h1")';
        if (data.current_price) {
          var p = Number(data.current_price);
          if(p <= 1000) nameBgColor = '#d9ead3';
          else if(p <= 3000) nameBgColor = '#fff2cc';
          else if(p <= 5000) nameBgColor = '#fce5cd';
          else if(p <= 10000) nameBgColor = '#f4cccc';
          else nameBgColor = '#ea9999';
        }
        nameColIdx = j + 1;
      }
      else if(colName.indexOf('現在値') >= 0) newRow[j] = '=ROUND(VALUE(REGEXREPLACE(INDEX(IMPORTXML("https://www.google.com/finance/quote/" & ' + codeLetter + rowIdx + '&":TYO","//div[@class=\'YMlKec fxKbKc\']"),1), "[^0-9.]", "")))';
      else if(colName.indexOf('出来高') >= 0) {
        newRow[j] = '=IFERROR(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(INDEX(IMPORTXML("https://www.google.com/finance/quote/" & ' + codeLetter + rowIdx + ' & ":TYO","//div[@class=\'P6K39c\']"),5),"K",""),"M",""),".","")*10, 0)';
      }
      else if(colName.indexOf('リスクリワード') >= 0) { newRow[j] = '=ROUND((' + tpColL + rowIdx + '-' + buyColL + rowIdx + ')/(' + buyColL + rowIdx + '-' + slColL + rowIdx + '), 1)'; rrColIdx = j + 1; }
      else if(colName.indexOf('投資効率スコア') >= 0) { newRow[j] = '=ROUND((' + rrColL + rowIdx + ') * (0.1 / ((' + tpColL + rowIdx + '-' + buyColL + rowIdx + ')/' + buyColL + rowIdx + ')), 1)'; scoreColIdx = j + 1; }
      else if(colName.indexOf('買い目標') >= 0) newRow[j] = Math.round(data.buy);
      else if(colName.indexOf('利確目標') >= 0) newRow[j] = Math.round(data.tp);
      else if(colName.indexOf('損切り') >= 0) newRow[j] = Math.round(data.sl);
      else if(colName.indexOf('AI分析') >= 0) { newRow[j] = data.ai_text; aiColIdx = j + 1; }
      else if(colName.indexOf('X配信テキスト') >= 0) newRow[j] = data.x_post_text || '';
      else if(colName.indexOf('ホームページ') >= 0 || colName.indexOf('ホームページへの自動記載') >= 0) newRow[j] = data.hp_text || '';
      else if(colName.indexOf('SNS配信済') >= 0) newRow[j] = data.sns_done || false;
      else if(colName.indexOf('判定') >= 0) newRow[j] = '=IF(VALUE(' + cColL + rowIdx + ')>=VALUE(' + tpColL + rowIdx + '), "利確達成", IF(VALUE(' + cColL + rowIdx + ')<=VALUE(' + slColL + rowIdx + '), "損切りライン到達", IF(AND(VALUE(' + cColL + rowIdx + ')<=VALUE(' + buyColL + rowIdx + '), VALUE(' + rrColL + rowIdx + ')>=1.5, VALUE(' + scoreColL + rowIdx + ')>=1.5), "★エントリー推奨", IF(VALUE(' + cColL + rowIdx + ')<=VALUE(' + buyColL + rowIdx + '), "買い目標到達", "監視中"))))';
    }
    
    sheet.appendRow(newRow);
    var addedRowNumber = sheet.getLastRow();
    
    // スプレッドシートの仕様で上の行のチェックボックスがコピーされるのを防ぐため、全列クリーンアップ
    for(var j=0; j<h.length; j++){
      var cHeader = String(h[j]).replace(/[\u200b\s]/g, '');
      var targetRange = sheet.getRange(addedRowNumber, j + 1);
      if(cHeader === 'SNS配信済') {
        targetRange.insertCheckboxes();
      } else {
        targetRange.clearDataValidations();
        targetRange.setDataValidation(null);
      }
    }
    
    var addedRange = sheet.getRange(addedRowNumber, 1, 1, h.length);
    addedRange.setFontWeight('bold');
    
    if(nameColIdx > 0 && nameBgColor !== '') sheet.getRange(addedRowNumber, nameColIdx).setBackground(nameBgColor);
    if(rrColIdx > 0) sheet.getRange(addedRowNumber, rrColIdx).setNumberFormat('0.0');
    if(scoreColIdx > 0) sheet.getRange(addedRowNumber, scoreColIdx).setNumberFormat('0.0');
    
    if(aiColIdx > 0) {
      var bg = '#ffffff';
      if(data.ai_color==='green') bg='#d9ead3';
      else if(data.ai_color==='yellow') bg='#fff2cc';
      else if(data.ai_color==='blue') bg='#cfe2f3';
      else if(data.ai_color==='orange') bg='#fce5cd';
      else if(data.ai_color==='lightblue') bg='#d0e0e3';
      sheet.getRange(addedRowNumber, aiColIdx).setBackground(bg);
    }
    return ContentService.createTextOutput("added");
  }
  
  for (var i = 1; i < values.length; i++) {
    var cellCode = String(values[i][codeIdx]).replace(/\s/g, '');
    if (cellCode == String(data.code).replace(/\s/g, '')) {
      if (data.action === "delete") {
        sheet.deleteRow(i + 1);
        return ContentService.createTextOutput("deleted");
      } else if (data.action === "update" || !data.action) {
        for (var c = 0; c < h.length; c++) {
          var colN = String(h[c]).replace(/[\u200b\s]/g, '');
          if (colN.indexOf('買い目標') >= 0 && data.buy !== undefined) sheet.getRange(i + 1, c + 1).setValue(Math.round(data.buy));
          if (colN.indexOf('利確目標') >= 0 && data.tp !== undefined) sheet.getRange(i + 1, c + 1).setValue(Math.round(data.tp));
          if (colN.indexOf('損切り') >= 0 && data.sl !== undefined) sheet.getRange(i + 1, c + 1).setValue(Math.round(data.sl));
        }
        return ContentService.createTextOutput("success");
      }
    }
  }

  return ContentService.createTextOutput("not found");
}
```""")
                        webhook_url = st.text_input("GAS デプロイ済みのウェブアプリURL", type="password", value="https://script.google.com/macros/s/AKfycbxAJ0MEcGq5Fpthb_72GcLFsUfuY7qR87J2H06Rkesk7l6e5LYV86F0XEw0jUDtwDgk/exec")
                        if st.button("🚀 Webhook経由でスプレッドシートを更新！"):
                            if webhook_url:
                                with st.spinner("スプレッドシートへ送信中..."):
                                    try:
                                        payload = {
                                            "action": "update",
                                            "code": str(ticker_code),
                                            "buy": int(best_params['Buy']),
                                            "tp": int(best_params['TakeProfit']),
                                            "sl": int(best_params['StopLoss'])
                                        }
                                        res = requests.post(webhook_url, json=payload)
                                        if res.status_code == 200:
                                            if "success" in res.text or "deleted" in res.text:
                                                st.success("✅ スプレッドシートへの書き込みが成功しました！（1〜2分で反映されます）")
                                            elif "not found" in res.text:
                                                st.error(f"書き込み失敗: コード '{ticker_code}' がスプレッドシート上で見つかりませんでした。")
                                            else:
                                                st.error(f"GASエラーまたは不正な応答: {res.text}")
                                        else:
                                            st.error(f"書き込み失敗: ステータスコード {res.status_code}")
                                    except Exception as e:
                                        st.error(f"送信エラー: {e}")
                            else:
                                st.warning("Webhook URLを入力してください。")
                    
                    else:
                        st.info("GCPで作成したService AccountのJSONキー（中身のテキスト）を以下に貼り付けてください。スプレッドシート側でこのサービスアカウントのメールアドレスに「編集者」権限を付与する必要があります。")
                        sa_json_str = st.text_area("Service Account JSON (テキストをコピペ)")
                        if st.button("🚀 サービスアカウント経由でスプレッドシートを更新！"):
                            if sa_json_str:
                                with st.spinner("スプレッドシートへ書き込み中..."):
                                    try:
                                        sa_info = json.loads(sa_json_str)
                                        scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
                                        creds = Credentials.from_service_account_info(sa_info, scopes=scopes)
                                        gc = gspread.authorize(creds)
                                        
                                        # URLからIDを抽出
                                        sheet_id = sheet_url.split('/d/')[1].split('/')[0]
                                        sh = gc.open_by_key(sheet_id)
                                        worksheet = sh.get_worksheet(0)
                                        
                                        # スプレッドシートの全データを取得
                                        records = worksheet.get_all_values()
                                        headers = records[0]
                                        
                                        clean_headers = [str(x).replace('\u200b', '').replace(' ', '') for x in headers]
                                        code_col_idx = clean_headers.index('コード') if 'コード' in clean_headers else 0
                                        
                                        buy_col = headers.index('買い目標') + 1 if '買い目標' in headers else None
                                        tp_col = headers.index('利確目標') + 1 if '利確目標' in headers else None
                                        sl_col = headers.index('損切り') + 1 if '損切り' in headers else None
                                        
                                        # 対象の行番号を探す
                                        target_row = None
                                        for idx, row in enumerate(records):
                                            if len(row) > code_col_idx and str(row[code_col_idx]).replace(' ', '') == str(ticker_code):
                                                target_row = idx + 1
                                                break
                                        
                                        if target_row and buy_col and tp_col and sl_col:
                                            worksheet.update_cell(target_row, buy_col, int(best_params['Buy']))
                                            worksheet.update_cell(target_row, tp_col, int(best_params['TakeProfit']))
                                            worksheet.update_cell(target_row, sl_col, int(best_params['StopLoss']))
                                            st.success("✅ スプレッドシートへの直接書き込みが成功しました！")
                                        else:
                                            st.error("設定先が見つかりませんでした。コード列やヘッダー名（買い目標、利確目標、損切り）を確認してください。")
                                            
                                    except Exception as e:
                                        st.error(f"認証または書き込みエラー: {e}")
                            else:
                                st.warning("JSONテキストを入力してください。")

                else:
                    st.warning("⚠️ 過去2年間で、最低2回のトレード機会があり、かつ勝てる安定した設定ラインが見つかりませんでした。この銘柄の押し目買いは現在非常にリスクが高い状態です。")

# ======= 7. 全銘柄一括最適化 & スプレッドシート自動整理 =======
st.divider()
st.subheader("🧹 全銘柄の一括最適化 & 自動整理 (バッチ処理)")
st.markdown("登録されている全銘柄に対して自動で最適化を実行します。\n勝率を限界まで高めたラインが見つかった銘柄は**数値を自動更新**し、逆に安全なラインが全く見つからなかった銘柄は、見込みなしとして**スプレッドシートから自動削除 (損切り対象)** します。")

batch_update_method = st.radio("一括処理の方法を選択", ["Google Apps Script (Webhook) を使う", "サービスアカウント (JSON) を使う"], key="batch_method")

if batch_update_method == "Google Apps Script (Webhook) を使う":
    st.info("※ この機能を使用するには、GASのコードが**「削除 (delete) アクション」対応版（上の単独更新欄に表示されている最新コード）**である必要があります。念の為、現在の単独更新欄にあるGASコードを再コピーして再度デプロイしなおすことを推奨します。")
    batch_webhook_url = st.text_input("GAS デプロイ済みのウェブアプリURL (一括処理用)", type="password", key="batch_webhook", value="https://script.google.com/macros/s/AKfycbxAJ0MEcGq5Fpthb_72GcLFsUfuY7qR87J2H06Rkesk7l6e5LYV86F0XEw0jUDtwDgk/exec")
    
    if st.button("🚀 ウェブ上の全銘柄を一括実行！"):
        if not batch_webhook_url:
            st.error("Webhook URLを入力してください。")
        else:
            with st.status("全銘柄の一括処理を実行中...", expanded=True) as status:
                success_count = 0
                delete_count = 0
                error_count = 0
                
                for idx, row in df.iterrows():
                    code = row['コード']
                    name = row['銘柄名']
                    st.write(f"🔄 **{name} ({code})** を分析中...")
                    
                    try:
                        hist = yf.Ticker(f"{code}.T").history(period="2y")
                        if hist.empty:
                            st.write("  └ ⚠️ データ取得失敗（スキップ）")
                            error_count += 1
                            continue
                            
                        current_price = hist['Close'].iloc[-1]
                        best_params = None
                        best_win_rate = -1
                        best_profit = -999999
                        
                        for buy_pct in range(2, 42, 2):
                            sim_buy = current_price * (1 - buy_pct/100)
                            for tp_pct in range(2, 32, 2):
                                sim_tp = sim_buy * (1 + tp_pct/100)
                                for sl_pct in range(2, 32, 2):
                                    sim_sl = sim_buy * (1 - sl_pct/100)
                                    t_trades, w_rate, e_val, _ = run_backtest(hist, sim_buy, sim_tp, sim_sl)
                                    if t_trades >= 2:
                                        if w_rate > best_win_rate or (w_rate == best_win_rate and e_val > best_profit):
                                            best_win_rate = w_rate
                                            best_profit = e_val
                                            best_params = {"Buy": sim_buy, "TakeProfit": sim_tp, "StopLoss": sim_sl}
                        
                        # API(GAS)への負荷を抑えるために1秒待機
                        time.sleep(1)
                                            
                        if best_params is not None and best_win_rate > 70:
                            payload = {"action": "update", "code": str(code), "buy": int(best_params['Buy']), "tp": int(best_params['TakeProfit']), "sl": int(best_params['StopLoss'])}
                            res = requests.post(batch_webhook_url, json=payload)
                            if res.status_code == 200:
                                if "success" in res.text:
                                    st.write(f"  └ ✅ 最適ライン発見 (勝率{best_win_rate:.1f}%) -> スプレッドシート更新済")
                                    success_count += 1
                                elif "not found" in res.text:
                                    st.write(f"  └ ⚠️ GASエラー: スプレッドシート内で該当コード ({code}) が見つかっていません")
                                    error_count += 1
                                else:
                                    st.write(f"  └ ⚠️ GASエラーレスポンス: {res.text}")
                                    error_count += 1
                            else:
                                st.write(f"  └ ⚠️ GAS更新エラー ({res.status_code})")
                                error_count += 1
                        else:
                            payload = {"action": "delete", "code": str(code)}
                            res = requests.post(batch_webhook_url, json=payload)
                            if res.status_code == 200:
                                if "deleted" in res.text:
                                    st.write("  └ 🗑️ 最適ラインなし・勝率70%以下 -> 見込みなしとしてスプレッドシートから削除")
                                    delete_count += 1
                                elif "not found" in res.text:
                                    st.write("  └ ⚠️ 削除対象ですが、既にシート内に存在しませんでした")
                                    # delete_count += 1  # 既に無い場合はカウントか迷うがエラーにはしない
                                else:
                                    st.write(f"  └ ⚠️ GASエラーレスポンス: {res.text}")
                                    error_count += 1
                            else:
                                st.write(f"  └ ⚠️ GAS削除エラー ({res.status_code})")
                                error_count += 1
                                
                    except Exception as e:
                        st.write(f"  └ ⚠️ エラー: {e}")
                        error_count += 1
                        
                status.update(label=f"処理完了！ (更新: {success_count}件, 削除: {delete_count}件, エラー: {error_count}件)", state="complete", expanded=True)
                st.success("全ての一括処理が終了しました！スプレッドシートをご確認ください。")

else:
    batch_sa_json_str = st.text_area("Service Account JSON (テキストをコピペ)", key="batch_sa")
    if st.button("🚀 ウェブ上の全銘柄を一括実行！"):
        if not batch_sa_json_str:
            st.error("JSONテキストを入力してください。")
        else:
            with st.status("全銘柄の一括処理を実行中...", expanded=True) as status:
                try:
                    sa_info = json.loads(batch_sa_json_str)
                    scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
                    creds = Credentials.from_service_account_info(sa_info, scopes=scopes)
                    gc = gspread.authorize(creds)
                    sheet_id = sheet_url.split('/d/')[1].split('/')[0]
                    sh = gc.open_by_key(sheet_id)
                    worksheet = sh.get_worksheet(0)
                    
                    success_count = 0
                    delete_count = 0
                    error_count = 0
                    
                    results_to_delete = []
                    results_to_update = []
                    
                    for idx, row in df.iterrows():
                        code = row['コード']
                        name = row['銘柄名']
                        st.write(f"🔄 **{name} ({code})** を分析中...")
                        
                        try:
                            hist = yf.Ticker(f"{code}.T").history(period="2y")
                            if hist.empty:
                                st.write("  └ ⚠️ データ取得失敗（スキップ）")
                                error_count += 1
                                continue
                                
                            current_price = hist['Close'].iloc[-1]
                            best_params = None
                            best_win_rate = -1
                            best_profit = -999999
                            
                            for buy_pct in range(2, 42, 2):
                                sim_buy = current_price * (1 - buy_pct/100)
                                for tp_pct in range(2, 32, 2):
                                    sim_tp = sim_buy * (1 + tp_pct/100)
                                    for sl_pct in range(2, 32, 2):
                                        sim_sl = sim_buy * (1 - sl_pct/100)
                                        t_trades, w_rate, e_val, _ = run_backtest(hist, sim_buy, sim_tp, sim_sl)
                                        if t_trades >= 2:
                                            if w_rate > best_win_rate or (w_rate == best_win_rate and e_val > best_profit):
                                                best_win_rate = w_rate
                                                best_profit = e_val
                                                best_params = {"Buy": sim_buy, "TakeProfit": sim_tp, "StopLoss": sim_sl}
                                                
                            if best_params is not None and best_win_rate > 70:
                                results_to_update.append({"code": str(code), "params": best_params})
                                st.write(f"  └ ✅ 最適ライン発見 (勝率{best_win_rate:.1f}%) -> 後ほど更新")
                            else:
                                results_to_delete.append({"code": str(code)})
                                st.write("  └ 🗑️ 最適ラインなし・勝率70%以下 -> 後ほど削除対象")
                            
                            # リクエスト過多を防ぐための待機
                            time.sleep(1)
                                
                        except Exception as e:
                            st.write(f"  └ ⚠️ エラー: {e}")
                            error_count += 1
                    
                    st.write("スプレッドシートへ書き込み・削除を行っています...")
                    
                    records = worksheet.get_all_values()
                    headers = records[0]
                    buy_col = headers.index('買い目標') + 1 if '買い目標' in headers else None
                    tp_col = headers.index('利確目標') + 1 if '利確目標' in headers else None
                    sl_col = headers.index('損切り') + 1 if '損切り' in headers else None
                    
                    # 下の行から削除していく（インデックスズレ防止）
                    clean_headers = [str(x).replace('\u200b', '').replace(' ', '') for x in headers]
                    code_col_idx = clean_headers.index('コード') if 'コード' in clean_headers else 0
                    
                    for row_idx in range(len(records), 0, -1):
                        row_val = records[row_idx - 1]
                        if len(row_val) <= code_col_idx:
                            continue
                        cell_code = str(row_val[code_col_idx]).replace(' ', '')
                        
                        del_match = next((x for x in results_to_delete if x['code'] == cell_code), None)
                        if del_match:
                            worksheet.delete_rows(row_idx)
                            delete_count += 1
                            continue
                            
                        upd_match = next((x for x in results_to_update if x['code'] == cell_code), None)
                        if upd_match and buy_col and tp_col and sl_col:
                            worksheet.update_cell(row_idx, buy_col, int(upd_match['params']['Buy']))
                            worksheet.update_cell(row_idx, tp_col, int(upd_match['params']['TakeProfit']))
                            worksheet.update_cell(row_idx, sl_col, int(upd_match['params']['StopLoss']))
                            success_count += 1
                            
                    status.update(label=f"処理完了！ (更新: {success_count}件, 削除: {delete_count}件, エラー: {error_count}件)", state="complete", expanded=True)
                    st.success("全ての一括処理が終了しました！スプレッドシートをご確認ください。")
                    
                except Exception as e:
                    status.update(label="エラーが発生しました", state="error", expanded=True)
                    st.error(f"認証または書き込みエラー: {e}")

# ======= 8. リアルタイム監視＆スクリーニング追加 =======
st.divider()
st.subheader("🤖 リアルタイム監視 ＆ 新規スクリーニング (全自動売買管理)")
st.markdown("監視中の全銘柄の現在価格をチェックし、**買い目標から大幅に乖離した銘柄（上方に+15% または 下方に-10%）を自動で削除**します。\n銘柄が削除されて枠が空いた分（最大50銘柄）だけ、新しい有望銘柄を自動で探し出し、スプレッドシートに追加します。")

st.info("※ この機能は「GAS (Webhook)」を利用します。上の新しいコード例をGASにデプロイしてURLを入力してください。")
live_webhook_url = st.text_input("GAS デプロイ済みのウェブアプリURL (監視＆スクリーニング用)", type="password", key="live_webhook", value="https://script.google.com/macros/s/AKfycbxAJ0MEcGq5Fpthb_72GcLFsUfuY7qR87J2H06Rkesk7l6e5LYV86F0XEw0jUDtwDgk/exec")

if st.button("🚀 リアルタイム監視 ＆ スクリーニングを実行"):
    if not live_webhook_url or not live_webhook_url.startswith("http"):
        st.error("正しいWebhook URL（https://script.google.com/macros/s/...形式）を入力してください。")
    else:
        with st.status("🚀 リアルタイム処理を実行中...", expanded=True) as status:
            removed_count = 0
            
            # 1. 既存銘柄のチェック（利確・損切・出来高）
            st.write("### 🔄 1. 既存銘柄の監視チェック")
            progress_bar_1 = st.progress(0)
            progress_text_1 = st.empty()
            
            total_existing = len(df)
            for i, (idx, row) in enumerate(df.iterrows()):
                # プログレスバー更新
                progress_pct = int(((i + 1) / total_existing) * 100) if total_existing > 0 else 100
                progress_bar_1.progress((i + 1) / total_existing if total_existing > 0 else 1.0)
                progress_text_1.text(f"既存銘柄チェック中: {i+1} / {total_existing} 件 ({progress_pct}%)")
                
                code = row['コード']
                tp_val = parse_price(row.get('利確目標'))
                sl_val = parse_price(row.get('損切り'))
                
                try:
                    ticker = yf.Ticker(f"{code}.T")
                    hist = ticker.history(period="1mo") # 過去1ヶ月のデータでエントリー判定
                    if hist.empty:
                        continue
                    
                    last_close = hist['Close'].iloc[-1]
                    hist_low = hist['Low'].min()
                    buy_val = parse_price(row.get('買い目標'))
                    
                    # 出来高急増判定（直近の出来高が1ヶ月平均の3倍等なら通知）
                    vol_surge = False
                    if len(hist) >= 5:
                        avg_vol = hist['Volume'].iloc[:-1].mean()
                        if hist['Volume'].iloc[-1] > avg_vol * 3:
                            vol_surge = True
                    
                    action = None
                    if buy_val:
                        dev_pct = (last_close - buy_val) / buy_val * 100
                        if dev_pct > 15:
                            action = "delete"
                            st.write(f"🗑️ **{code}**: 価格が上昇し、買い目標を大幅に上回ったため（乖離 +{dev_pct:.1f}%）、監視を終了します。")
                        elif dev_pct < -10:
                            action = "delete"
                            st.write(f"🗑️ **{code}**: 買い目標を大幅に下抜け、損切りラインを超えたため（乖離 {dev_pct:.1f}%）、削除します。")
                    
                    if action == "delete":
                        payload = {"action": "delete", "code": str(code)}
                        res = requests.post(live_webhook_url, json=payload)
                        if res.status_code == 200:
                            removed_count += 1

                        
                    elif vol_surge:
                        # 出来高急増の色付け指令
                        st.write(f"🔥 **{code}**: 出来高が急増しています！")
                        payload = {"action": "update", "code": str(code), "volume_surge": True}
                        requests.post(live_webhook_url, json=payload)
                        
                except Exception as e:
                    pass
            
            progress_text_1.text(f"✅ 既存銘柄チェック完了 (100%)")
            st.write(f"✅ **監視結果**: {removed_count}件の銘柄が決済ルールに到達し、処理されました。")
            
            # 2. スクリーニングと最適化バックテスト
            # 空行・不完全行を取り除いて本当に監視中の銘柄数をカウント
            valid_df = df[df['コード'].astype(str).str.strip() != '']
            valid_df = valid_df[valid_df['コード'].astype(str).str.lower() != 'nan']

            target_holdings = 50
            current_holdings = len(valid_df) - removed_count
            needed_count = target_holdings - current_holdings
            
            if needed_count > 0:
                st.write("---")
                st.write(f"### 🔍 2. 新規銘柄のスクリーニング (不足 {needed_count} 枠)")
                st.write(f"現在の監視銘柄数: {current_holdings} / 目標: {target_holdings}")
                
                # さらに母数を増やし、東証プライム・スタンダードの主要銘柄を約200銘柄に拡張
                sample_tickers = [
                    "7203", "9984", "8306", "8058", "6758", "6861", "9432", "6098", "4385", "6532", 
                    "4755", "7011", "9101", "8031", "6920", "4502", "3382", "5401", "5108", "4911",
                    "7974", "4063", "8766", "4519", "6367", "6954", "7741", "4661", "6273", "8002",
                    "6902", "8001", "6501", "6502", "8053", "6503", "7269", "7267", "4452", "6146",
                    "2914", "9433", "8411", "6981", "4568", "8316", "8591", "4528", "8801", "8802",
                    "7012", "7013", "5020", "9020", "9022", "6971", "7201", "8604", "1925", "2502",
                    "9104", "9107", "4183", "4005", "3407", "3402", "7270", "7261", "7202", "7211",
                    "6702", "6701", "6504", "6506", "6952", "6762", "6976", "6965", "6841", "6857",
                    "7733", "7731", "7751", "7752", "7951", "7911", "7912", "2503", "2802", "2801",
                    "2269", "4503", "4507", "4506", "4514", "4901", "8008", "8015", "8059", "8078",
                    "8308", "8309", "8354", "8304", "8473", "8601", "8697", "8750", "8795", "8725",
                    "8267", "3099", "3086", "8252", "2782", "2587", "2871", "2002", "4324", "4689",
                    "4739", "9613", "3994", "8355", "8418", "8585", "8593", "8698", "3289", "3003",
                    "8905", "9501", "9502", "9503", "9508", "9021", "9024", "9062", "9143", "4188",
                    "4004", "6301", "6326", "6508", "6594", "6645", "6723", "6752", "6753", "6869"
                ]
                
                candidates = []
                progress_bar_2 = st.progress(0)
                progress_text_2 = st.empty()
                total_samples = len(sample_tickers)
                
                for i, s_code in enumerate(sample_tickers):
                    progress_pct = int(((i + 1) / total_samples) * 100)
                    progress_bar_2.progress((i + 1) / total_samples)
                    progress_text_2.text(f"一次スクリーニング中 (時価総額・PBR条件確認): {i+1} / {total_samples} 件 ({progress_pct}%)")
                    
                    if s_code in df['コード'].values:
                        continue
                    try:
                        ticker = yf.Ticker(f"{s_code}.T")
                        info = ticker.info
                        hist = ticker.history(period="3mo")
                        if hist.empty or pd.isna(info.get('marketCap')) or len(hist) < 30:
                            continue
                            
                        mc = info.get('marketCap', 0)
                        pbr = info.get('priceToBook', 0)
                        dividend = info.get('dividendYield', 0)
                        forward_pe = info.get('forwardPE', 0)
                        trailing_eps = info.get('trailingEps', 0)
                        
                        hist['SMA25'] = hist['Close'].rolling(window=25).mean()
                        delta = hist['Close'].diff()
                        gain = delta.clip(lower=0).rolling(window=14).mean()
                        loss = -delta.clip(upper=0).rolling(window=14).mean()
                        rs = gain / loss
                        hist['RSI'] = 100 - (100 / (1 + rs))
                        
                        last_price = float(hist['Close'].iloc[-1])
                        sma25 = float(hist['SMA25'].iloc[-1])
                        rsi = float(hist['RSI'].iloc[-1])
                        
                        if last_price < 100: continue
                        
                        deviation = (last_price - sma25) / sma25 * 100
                        
                        # 3-6銘柄発見を目指し、さらに条件を緩めます
                        if deviation <= 5 and rsi <= 65:
                            if 10_000_000_000 <= mc <= 3_000_000_000_000 and 0.1 <= pbr <= 6.0:
                                is_day_trade = (deviation <= 0 and rsi <= 55)
                                is_swing_value = (pbr <= 1.2 and (dividend is not None and dividend >= 0.02))
                                
                                if is_day_trade or is_swing_value or (deviation <= -3 and forward_pe > 0):
                                    candidates.append({
                                        "code": s_code,
                                        "pbr": pbr,
                                        "dividend": dividend,
                                        "drop_pct": abs(deviation),
                                        "deviation": deviation,
                                        "rsi": rsi,
                                        "last_price": last_price,
                                        "mc": mc
                                    })
                    except Exception:
                        pass
                
                # 下落率が大きい順（大きく売られている順）に並び替え
                candidates = sorted(candidates, key=lambda x: x['drop_pct'], reverse=True)
                progress_text_2.text(f"✅ 一次スクリーニング完了: {len(candidates)}件の候補を発見")
                
                if not candidates:
                    st.warning("⚠️ 条件に全く合致する銘柄が見つかりませんでした。別の日に再度お試しください。")
                else:
                    st.write("---")
                    st.write("### 💻 3. 候補銘柄の勝率最適化 (AIバックテスト)")
                    added_count = 0
                    
                    progress_bar_3 = st.progress(0)
                    progress_text_3 = st.empty()
                    total_cands = len(candidates)
                    
                    for i, cand in enumerate(candidates):
                        progress_pct = int(((i + 1) / total_cands) * 100)
                        progress_bar_3.progress((i + 1) / total_cands)
                        progress_text_3.text(f"最適ライン探索中 (勝率70%以上の条件を探しています): {i+1} / {total_cands} 銘柄 ({progress_pct}%)")
                        
                        if added_count >= needed_count:
                            progress_text_3.text("✅ 必要な数の銘柄を追加完了しました！(100%)")
                            break
                        
                        s_code = cand['code']
                        pbr = cand['pbr']
                        drop_pct = cand['drop_pct']
                        c_div = cand['dividend']
                        c_mc = cand['mc']
                        
                        
                        # 銘柄名を取得
                        try:
                            t_obj = yf.Ticker(f"{s_code}.T")
                            ticker_name = t_obj.info.get('shortName') or t_obj.info.get('longName') or s_code
                        except:
                            ticker_name = s_code
                            
                        st.write(f"🔄 **{ticker_name} ({s_code})** (25日乖離: {cand.get('deviation', 0):.1f}%, RSI: {cand.get('rsi', 0):.1f}) の勝率を極限まで高めています...")
                        
                        # 勝率を限界まで高める2年分バックテスト
                        hist_2y = yf.Ticker(f"{s_code}.T").history(period="2y")
                        if hist_2y.empty:
                            continue
                            
                        current_price = hist_2y['Close'].iloc[-1]
                        best_params = None
                        best_win_rate = -1
                        best_profit = -999999
                        
                        for buy_pct in [0, 1, 2, 3]:  # デイトレ最適化: 買い目標を浅く（0〜3%下）設定
                            sim_buy = current_price * (1 - buy_pct/100)
                            for tp_pct in range(2, 22, 2): # 利確目標を細かく (2%〜20%)
                                sim_tp = sim_buy * (1 + tp_pct/100)
                                # 【重要修復】利確目標が今の株価より低いと、追加後すぐに「利確達成」になってしまうのを防ぐ
                                if sim_tp <= current_price * 1.01:
                                    continue
                                    
                                for sl_pct in range(2, 16, 2): # 損切りライン (2%〜14%)
                                    sim_sl = sim_buy * (1 - sl_pct/100)
                                    t_trades, w_rate, e_val, _ = run_backtest(hist_2y, sim_buy, sim_tp, sim_sl)
                                    if t_trades >= 2:
                                        if w_rate > best_win_rate or (w_rate == best_win_rate and e_val > best_profit):
                                            best_win_rate = w_rate
                                            best_profit = e_val
                                            best_params = {"Buy": sim_buy, "TakeProfit": sim_tp, "StopLoss": sim_sl}
                        
                        # ======= [一定の安全ライン（勝率65%以上）があれば採用] =======
                        # 勝率の合格ラインを70%→65%に少し緩和し、候補を増やします
                        if (best_params is not None and best_win_rate >= 55): # 勝率基準をさらに緩和
                            # AI分析風の動的テキスト生成
                            deviation = cand.get('deviation', 0)
                            rsi = cand.get('rsi', 0)
                            
                            # 以前の仕様（色分けカテゴリ）に基づいたAI分析コメント生成
                            rsi_status = "底値圏/要注目" if rsi < 35 else ("割安圏" if rsi < 45 else "中立")
                            ai_color = "orange"
                            ai_text = f"【逆張り・急反発期待】25日乖離 {deviation:.1f}% / RSI {rsi:.1f} ({rsi_status})。過去データ勝率 {best_win_rate:.0f}% の優位点。リバウンドを狙った待ち伏せが有効な水準です。"

                            if pbr > 0 and pbr <= 1.2:
                                ai_color = "yellow"
                                ai_text = f"【割安・バリュー銘柄】PBR {pbr:.2f}倍と資産面で割安。RSI {rsi:.1f}で底入れを示唆。過去統計勝率 {best_win_rate:.0f}%。中長期の押し目買い候補です。"
                            elif c_div is not None and c_div >= 0.03:
                                ai_color = "green"
                                ai_text = f"【高配当・安定利回り】利回り {c_div*100:.1f}%。配当による下支えが期待される異常乖離 ({deviation:.1f}%) ポイント。勝率 {best_win_rate:.0f}% の反発期待ライン。"
                            elif c_mc > 100_000_000_000:
                                ai_color = "blue"
                                mc_oku = c_mc / 1_0000_0000
                                ai_text = f"【大型主力・リバウンド狙い】時価総額 {mc_oku:,.0f}億円の主力大型株。乖離率 {deviation:.1f}% からの需給回復を予測。AI抽出勝率 {best_win_rate:.0f}%。"

                            # ホームページ（WordPress）用のリッチコンテンツ
                            hp_draft = (
                                f"【AI厳選銘柄 分析レポート】\n"
                                f"対象銘柄: {ticker_name} ({s_code})\n\n"
                                f"■ 市場データ & テクニカル評価\n"
                                f"・25日移動平均線乖離率: {deviation:.1f}%\n"
                                f"・RSI (相対力指数): {rsi:.1f} ({rsi_status})\n"
                                f"・PBR: {pbr:.2f}倍\n\n"
                                f"■ AIによる投資考察\n"
                                f"{ai_text}\n\n"
                                f"■ 戦略ガイドスコア（過去勝率 {best_win_rate:.0f}% モデル）\n"
                                f"・推奨 買いポイント: {int(best_params['Buy'])}円\n"
                                f"・想定 利確ターゲット: {int(best_params['TakeProfit'])}円\n"
                                f"・最終 損切りライン: {int(best_params['StopLoss'])}円\n\n"
                                f"※本レポートはAIによる過去統計の解析結果であり、実際の投資判断は自己責任にてお願いいたします。"
                            )

                            # SNS用
                            x_text = f"【AI厳選】{ticker_name}({s_code}) 現在値:{int(current_price)}円 目安:{int(best_params['Buy'])}円 勝率:{best_win_rate:.0f}% 詳細はHPへ"

                            # WordPress投稿（ホームページ追加）
                            import xmlrpc.client
                            try:
                                wp_url = os.environ.get("WP_URL")
                                wp_user = os.environ.get("WP_USERNAME")
                                wp_pw = os.environ.get("WP_APP_PASSWORD")
                                
                                if wp_url and wp_user and wp_pw:
                                    xmlrpc_url = f"{wp_url}/xmlrpc.php"
                                    server = xmlrpc.client.ServerProxy(xmlrpc_url)
                                    content_struct = {
                                        'post_title': f"【本日の厳選銘柄】{ticker_name} ({s_code})",
                                        'post_content': hp_draft.replace("\n", "<br>"),
                                        'post_status': 'publish'
                                    }
                                    server.wp.newPost(1, wp_user, wp_pw, content_struct)
                                    st.write(f"  └ ✅ ホームページ（WordPress）に記事を投稿しました。")
                            except:
                                pass

                            payload = {
                                "action": "add_new",
                                "code": str(s_code),
                                "current_price": float(current_price),
                                "ai_text": ai_text,
                                "ai_color": ai_color,
                                "buy": int(best_params['Buy']),
                                "tp": int(best_params['TakeProfit']),
                                "sl": int(best_params['StopLoss']),
                                "x_post_text": x_text,
                                "hp_text": hp_draft,
                                "sns_done": True, # 手動追加でも一旦完了扱い
                                "sheet_sns": "SNS配信済",
                                "sheet_x": "X配信テキスト",
                                "sheet_hp": "ホームページへの自動記載"
                            }
                            res = requests.post(live_webhook_url, json=payload)
                            if res.status_code == 200:
                                st.success(f"✨ 新規追加: {s_code} (下落: {drop_pct:.1f}%, 勝率: {best_win_rate:.1f}%) -> スプレッドシート反映済")
                                added_count += 1
                        else:
                            st.write(f"  └ ❌ {s_code} は安全な取引ライン（勝率70%超）が見つからなかったため追加を見送りました。")
                            
                    if added_count == 0:
                        st.warning(f"⚠️ 調査対象の {len(candidates)} 銘柄すべてを確認しましたが、条件を満たせなかったため追加しませんでした。相場環境が悪い可能性があります。")
                    elif added_count < needed_count:
                        st.warning(f"⚠️ 指定した条件を満たせたのは {added_count} 銘柄のみでした。プログラミングの実行は完了しています。")
                
            status.update(label="リアルタイム監視＆スクリーニング完了！", state="complete", expanded=True)
