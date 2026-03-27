// ==========================================
// キーの取得（PropertiesService で安全に管理）
// GASエディタ → プロジェクトの設定 → スクリプトプロパティ に以下を登録:
//   GEMINI_API_KEY  : GeminiのAPIキー
//   LINE_TOKEN      : LINE Messaging APIのチャンネルアクセストークン
//   LINE_USER_ID    : 通知先のLINEユーザーID
// ==========================================
function getProps() {
  return PropertiesService.getScriptProperties().getProperties();
}

// ==========================================
// ヘルパー: 列番号 → アルファベット変換
// ==========================================
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

// ==========================================
// Webhook 受信 (auto_trader.py からのリクエスト)
// ==========================================
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  var h = values[0];

  // ヘッダーから列インデックスを動的に取得
  var codeIdx = -1;
  var buyColL = 'D', tpColL = 'E', slColL = 'F', rrColL = 'I', scoreColL = 'J', cColL = 'C', aiColL = 'L';

  for (var j = 0; j < h.length; j++) {
    var colN = String(h[j]).replace(/[\u200b\s]/g, '');
    if (colN.indexOf('コード') >= 0)            codeIdx = j;
    else if (colN.indexOf('買い目標') >= 0)      buyColL = getColLetter(j);
    else if (colN.indexOf('利確目標') >= 0)      tpColL  = getColLetter(j);
    else if (colN.indexOf('損切り') >= 0)        slColL  = getColLetter(j);
    else if (colN.indexOf('リスクリワード') >= 0) rrColL  = getColLetter(j);
    else if (colN.indexOf('投資効率スコア') >= 0) scoreColL = getColLetter(j);
    else if (colN.indexOf('現在値') >= 0)        cColL   = getColLetter(j);
    else if (colN.indexOf('AI分析') >= 0)        aiColL  = getColLetter(j);
  }
  if (codeIdx < 0) return ContentService.createTextOutput("header_not_found");
  var codeLetter = getColLetter(codeIdx);

  // ── get_all ──
  if (data.action === "get_all") {
    return ContentService.createTextOutput(JSON.stringify(values))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ── log_time ──
  if (data.action === "log_time") {
    sheet.getRange(1, 1).setNote(
      "🤖 自動監視 最終完了日時: " + data.time + "\n本日追加された銘柄: " + data.count + " 件"
    );
    return ContentService.createTextOutput("time_logged");
  }

  // ── add_new ──
  if (data.action === "add_new") {
    // 重複チェック
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][codeIdx]).replace(/[\u200b\s]/g, '') == String(data.code).replace(/[\u200b\s]/g, '')) {
        return ContentService.createTextOutput("already exists");
      }
    }

    var newRow = new Array(h.length).fill("");
    var rowIdx = sheet.getLastRow() + 1;
    var rrColIdx = -1, scoreColIdx = -1, aiColIdx = -1, nameColIdx = -1;
    var nameBgColor = '';

    for (var j = 0; j < h.length; j++) {
      var colName = String(h[j]).replace(/[\u200b\s]/g, '');

      if (colName.indexOf('コード') >= 0) {
        newRow[j] = data.code;

      } else if (colName.indexOf('銘柄名') >= 0) {
        newRow[j] = '=IMPORTXML("https://finance.yahoo.co.jp/quote/" & ' + codeLetter + rowIdx + ', "//h1")';
        if (data.current_price) {
          var p = Number(data.current_price);
          if      (p <= 1000)  nameBgColor = '#d9ead3';
          else if (p <= 3000)  nameBgColor = '#fff2cc';
          else if (p <= 5000)  nameBgColor = '#fce5cd';
          else if (p <= 10000) nameBgColor = '#f4cccc';
          else                 nameBgColor = '#ea9999';
        }
        nameColIdx = j + 1;

      } else if (colName.indexOf('現在値') >= 0) {
        newRow[j] = '=ROUND(VALUE(REGEXREPLACE(INDEX(IMPORTXML("https://www.google.com/finance/quote/" & '
          + codeLetter + rowIdx + '&":TYO","//div[@class=\'YMlKec fxKbKc\']"),1), "[^0-9.]", "")))';

      } else if (colName.indexOf('出来高') >= 0) {
        newRow[j] = '=IFERROR(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(INDEX(IMPORTXML("https://www.google.com/finance/quote/" & '
          + codeLetter + rowIdx + ' & ":TYO","//div[@class=\'P6K39c\']"),5),"K",""),"M",""),".","")*10, 0)';

      } else if (colName.indexOf('買い目標') >= 0) {
        newRow[j] = Math.round(data.buy);

      } else if (colName.indexOf('利確目標') >= 0) {
        // ── BUG修正: Pythonが計算したATRベースのTP値を使用。未指定時のみデフォルト値 ──
        newRow[j] = data.tp ? Math.round(data.tp) : Math.round(data.buy * 1.1);

      } else if (colName.indexOf('損切り') >= 0) {
        // ── BUG修正: Pythonが計算したATRベースのSL値を使用。未指定時のみデフォルト値 ──
        newRow[j] = data.sl ? Math.round(data.sl) : Math.round(data.buy * 0.95);

      } else if (colName.indexOf('リスクリワード') >= 0) {
        newRow[j] = '=ROUND((' + tpColL + rowIdx + '-' + buyColL + rowIdx + ')/(' + buyColL + rowIdx + '-' + slColL + rowIdx + '), 1)';
        rrColIdx = j + 1;

      } else if (colName.indexOf('投資効率スコア') >= 0) {
        newRow[j] = '=ROUND((' + rrColL + rowIdx + ') * (0.1 / ((' + tpColL + rowIdx + '-' + buyColL + rowIdx + ')/' + buyColL + rowIdx + ')), 1)';
        scoreColIdx = j + 1;

      } else if (colName.indexOf('AI分析') >= 0) {
        // ── lot_size/max_loss/max_gain をAI分析テキストに追記 ──
        var lotInfo = '';
        if (data.lot_size && data.invest_amount && data.max_loss && data.max_gain) {
          lotInfo = '\n【推奨】' + data.lot_size + '株（投資額約' + Number(data.invest_amount).toLocaleString()
            + '円）| 損失上限-' + Number(data.max_loss).toLocaleString()
            + '円 / 利益目標+' + Number(data.max_gain).toLocaleString() + '円';
        }
        newRow[j] = (data.ai_text || '') + lotInfo;
        aiColIdx = j + 1;

      } else if (colName.indexOf('X配信テキスト') >= 0) {
        newRow[j] = data.x_post_text || '';

      } else if (colName.indexOf('ホームページ') >= 0 || colName.indexOf('ホームページへの自動記載') >= 0) {
        newRow[j] = data.hp_text || '';

      } else if (colName.indexOf('SNS配信済') >= 0) {
        newRow[j] = data.sns_done || false;

      } else if (colName.indexOf('判定') >= 0) {
        newRow[j] = "監視中";
      }
    }

    sheet.appendRow(newRow);
    var addedRowNumber = sheet.getLastRow();

    // チェックボックスのクリーンアップ
    for (var j = 0; j < h.length; j++) {
      var cHeader = String(h[j]).replace(/[\u200b\s]/g, '');
      var targetRange = sheet.getRange(addedRowNumber, j + 1);
      if (cHeader === 'SNS配信済') {
        targetRange.insertCheckboxes();
      } else {
        targetRange.clearDataValidations();
        targetRange.setDataValidation(null);
      }
    }

    var addedRange = sheet.getRange(addedRowNumber, 1, 1, h.length);
    addedRange.setFontWeight('bold');
    if (nameColIdx > 0 && nameBgColor !== '') sheet.getRange(addedRowNumber, nameColIdx).setBackground(nameBgColor);
    if (rrColIdx > 0)    sheet.getRange(addedRowNumber, rrColIdx).setNumberFormat('0.0');
    if (scoreColIdx > 0) sheet.getRange(addedRowNumber, scoreColIdx).setNumberFormat('0.0');
    if (aiColIdx > 0) {
      var bg = '#ffffff';
      if      (data.ai_color === 'green')     bg = '#d9ead3';
      else if (data.ai_color === 'yellow')    bg = '#fff2cc';
      else if (data.ai_color === 'blue')      bg = '#cfe2f3';
      else if (data.ai_color === 'orange')    bg = '#fce5cd';
      else if (data.ai_color === 'lightblue') bg = '#d0e0e3';
      sheet.getRange(addedRowNumber, aiColIdx).setBackground(bg);
    }

    return ContentService.createTextOutput("added");
  }

  // ── 既存行を対象とした操作（hit_tp / hit_sl / delete / update）──
  for (var i = 1; i < values.length; i++) {
    var cellCode = String(values[i][codeIdx]).replace(/\s/g, '');
    if (cellCode !== String(data.code).replace(/\s/g, '')) continue;

    // ── BUG修正: hit_tp / hit_sl を正しく処理 ──
    if (data.action === "hit_tp") {
      // 判定列に記録してから行削除
      _markAndDelete(sheet, i + 1, h, "✅利確完了", "#d9ead3");
      return ContentService.createTextOutput("hit_tp_deleted");
    }

    if (data.action === "hit_sl") {
      _markAndDelete(sheet, i + 1, h, "⚠️損切り完了", "#cfe2f3");
      return ContentService.createTextOutput("hit_sl_deleted");
    }

    if (data.action === "delete") {
      sheet.deleteRow(i + 1);
      return ContentService.createTextOutput("deleted");
    }

    if (data.action === "update" || !data.action) {
      for (var c = 0; c < h.length; c++) {
        var colN = String(h[c]).replace(/[\u200b\s]/g, '');
        if (colN.indexOf('買い目標') >= 0 && data.buy !== undefined) sheet.getRange(i + 1, c + 1).setValue(Math.round(data.buy));
        if (colN.indexOf('利確目標') >= 0 && data.tp  !== undefined) sheet.getRange(i + 1, c + 1).setValue(Math.round(data.tp));
        if (colN.indexOf('損切り')   >= 0 && data.sl  !== undefined) sheet.getRange(i + 1, c + 1).setValue(Math.round(data.sl));
      }
      return ContentService.createTextOutput("success");
    }
  }

  return ContentService.createTextOutput("not found");
}

// 判定列に結果を書いた後に行削除するヘルパー
function _markAndDelete(sheet, rowNumber, headers, label, bgColor) {
  for (var c = 0; c < headers.length; c++) {
    var colN = String(headers[c]).replace(/[\u200b\s]/g, '');
    if (colN.indexOf('判定') >= 0) {
      sheet.getRange(rowNumber, c + 1).setValue(label).setBackground(bgColor).setFontWeight('bold');
      break;
    }
  }
  // スプレッドシートに書き込みが反映されてから削除
  SpreadsheetApp.flush();
  sheet.deleteRow(rowNumber);
}


// ==========================================
// 株価チェック＆ステータス更新（時間トリガーで実行）
// ==========================================
function checkStockTargets() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("シート1");
  const data = sheet.getDataRange().getValues();
  const h = data[0];

  // 列インデックスをヘッダーから動的に取得
  var idx = {};
  for (var j = 0; j < h.length; j++) {
    var n = String(h[j]).replace(/[\u200b\s]/g, '');
    if (n.indexOf('現在値')  >= 0) idx.price  = j;
    if (n.indexOf('買い目標') >= 0) idx.buy    = j;
    if (n.indexOf('利確目標') >= 0) idx.tp     = j;
    if (n.indexOf('損切り')   >= 0) idx.sl     = j;
    if (n.indexOf('判定')     >= 0) idx.status = j;
  }

  for (let i = 1; i < data.length; i++) {
    const price  = data[i][idx.price];
    const buy    = data[i][idx.buy];
    const tp     = data[i][idx.tp];
    const sl     = data[i][idx.sl];
    const statusCell = sheet.getRange(i + 1, (idx.status || 12) + 1);

    if (!price || typeof price !== 'number') {
      statusCell.setValue("").setBackground(null).setFontColor(null);
      continue;
    }

    if (tp && price >= tp) {
      statusCell.setValue("🎯利確到達").setBackground("#e06666").setFontColor("white").setHorizontalAlignment("center");
    } else if (sl && price <= sl) {
      statusCell.setValue("⚠️損切到達").setBackground("#3d85c6").setFontColor("white").setHorizontalAlignment("center");
    } else if (buy && price <= buy) {
      statusCell.setValue("💰買い目標").setBackground("#ffd966").setFontColor("black").setHorizontalAlignment("center");
    } else {
      statusCell.setValue("監視中").setBackground(null).setFontColor("#999999").setHorizontalAlignment("center");
    }
  }
}


// ==========================================
// LINE通知付き監視（時間トリガーで実行）
// ── BUG修正: 通知済みフラグで重複送信を防止 ──
// ── BUG修正: Geminiプロンプトを現実的な内容に修正 ──
// ==========================================
function checkAndNotify() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const h = data[0];

  var idx = {};
  for (var j = 0; j < h.length; j++) {
    var n = String(h[j]).replace(/[\u200b\s]/g, '');
    if (n.indexOf('銘柄名')   >= 0) idx.name   = j;
    if (n.indexOf('現在値')   >= 0) idx.price  = j;
    if (n.indexOf('買い目標') >= 0) idx.buy    = j;
    if (n.indexOf('利確目標') >= 0) idx.tp     = j;
    if (n.indexOf('損切り')   >= 0) idx.sl     = j;
    if (n.indexOf('リスクリワード') >= 0) idx.rr = j;
    if (n.indexOf('投資効率スコア') >= 0) idx.score = j;
    if (n.indexOf('判定')     >= 0) idx.status = j;
    if (n.indexOf('AI分析')   >= 0) idx.ai     = j;
  }

  for (let i = 1; i < data.length; i++) {
    const name  = data[i][idx.name  !== undefined ? idx.name  : 0];
    const price = data[i][idx.price !== undefined ? idx.price : 2];
    const buy   = data[i][idx.buy   !== undefined ? idx.buy   : 3];
    const tp    = data[i][idx.tp    !== undefined ? idx.tp    : 4];
    const sl    = data[i][idx.sl    !== undefined ? idx.sl    : 5];
    const rr    = data[i][idx.rr    !== undefined ? idx.rr    : 9];
    const score = data[i][idx.score !== undefined ? idx.score : 10];
    const aiText = data[i][idx.ai   !== undefined ? idx.ai    : 11] || '';

    if (!name || name === "#N/A" || typeof price !== 'number') continue;

    const statusCol  = (idx.status !== undefined ? idx.status : 12) + 1;
    const statusCell = sheet.getRange(i + 1, statusCol);
    const currentVal = statusCell.getValue();

    // ── 通知済みフラグがある行はスキップ（重複送信防止）──
    if (currentVal === "【通知済】利確" || currentVal === "【通知済】損切り" || currentVal === "【通知済】厳選買い") continue;

    const fmt    = (n) => (typeof n === 'number') ? Math.round(n).toLocaleString() : "---";
    const fmtDec = (n) => (typeof n === 'number') ? n.toFixed(1) : "---";

    // 1. 損切りライン到達
    if (sl && price <= sl) {
      statusCell.setBackground("#4a86e8").setFontColor("white").setValue("【通知済】損切り");
      sendLineMessage(
        "⚠️ 損切りライン到達\n" +
        name + "\n" +
        "現在値: " + fmt(price) + "円 ≤ 損切り: " + fmt(sl) + "円\n" +
        "────────────\n" +
        "迷わず損切りしてください。"
      );
      continue;
    }

    // 2. 利確ライン到達
    if (tp && price >= tp) {
      statusCell.setBackground("#e06666").setFontColor("white").setValue("【通知済】利確");
      sendLineMessage(
        "✅ 利確達成！\n" +
        name + "\n" +
        "現在値: " + fmt(price) + "円 ≥ 利確: " + fmt(tp) + "円\n" +
        "────────────\n" +
        "利益を確定してください。"
      );
      continue;
    }

    // 3. 厳選エントリーシグナル（オレンジ点灯済み + RR比・スコア条件）
    const currentBg = statusCell.getBackground();
    if (currentBg === "#ffd966" && rr >= 2 && score >= 2) {
      const aiAdvice = getGeminiAnalysis(name, price, rr, score);
      statusCell.setValue("【通知済】厳選買い");
      sendLineMessage(
        "🔥 厳選エントリーチャンス！\n" +
        name + " (" + fmt(price) + "円)\n" +
        "RR比: " + fmtDec(rr) + " / スコア: " + fmtDec(score) + "\n" +
        "利確: " + fmt(tp) + "円 / 損切: " + fmt(sl) + "円\n" +
        "────────────\n" +
        "🤖 AI分析:\n" + aiAdvice
      );
      continue;
    }

    // 4. 買い目標到達（初回のみオレンジ点灯、LINEは送らない → 厳選条件を満たしたら送信）
    if (buy && price <= buy && currentBg !== "#ffd966") {
      statusCell.setBackground("#ffd966").setFontColor("black").setValue("買い目標到達");
      continue;
    }

    // 5. 監視中（オレンジ以外）
    if (currentBg !== "#ffd966") {
      statusCell.setBackground("#444444").setFontColor("#ffffff").setValue("監視中");
    }
  }
}


// ==========================================
// Gemini分析（現実的なプロンプトに修正）
// ── BUG修正: Danelfin/PDF要求を削除。取得可能なデータのみで分析 ──
// ==========================================
function getGeminiAnalysis(name, price, rr, score) {
  try {
    const props = getProps();
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + props.GEMINI_API_KEY;
    const prompt =
      "日本株「" + name + "」(現在値:" + Math.round(price) + "円) について、\n" +
      "テクニカル分析の観点から「今買うべきか・待つべきか」を\n" +
      "以下の情報をもとに100文字以内で判断してください。\n" +
      "・リスクリワード比: " + (typeof rr === 'number' ? rr.toFixed(1) : '不明') + "\n" +
      "・投資効率スコア: " + (typeof score === 'number' ? score.toFixed(1) : '不明') + "\n" +
      "根拠のない情報は含めず、わかる範囲で簡潔に。";

    const payload = {
      "contents": [{ "parts": [{ "text": prompt }] }],
      "safetySettings": [
        { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" },
        { "category": "HARM_CATEGORY_HARASSMENT",        "threshold": "BLOCK_NONE" }
      ]
    };
    const res = UrlFetchApp.fetch(url, {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    });
    return JSON.parse(res.getContentText()).candidates[0].content.parts[0].text.trim();
  } catch (e) {
    return "AI分析取得に失敗しました。スプレッドシートの数値を参考にしてください。";
  }
}


// ==========================================
// LINE メッセージ送信
// ==========================================
function sendLineMessage(message) {
  const props = getProps();
  UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + props.LINE_TOKEN
    },
    "payload": JSON.stringify({
      "to": props.LINE_USER_ID,
      "messages": [{ "type": "text", "text": message }]
    })
  });
}
