/**
 * WorkflowTemplates - ワークフロー定義モジュール
 *
 * ワークフロー定義スプレッドシートからタスクテンプレートを読み込む。
 * スプレッドシートを編集することでワークフローを変更可能。
 *
 * シート構成:
 *   シート名 = プロジェクト種別名（例: "新商品", "リニューアル・軽微な変更"）
 *   カラム: 親タスク番号, 親タスク名, 子タスク番号, 子タスク名, ロール, 担当者（正）, 担当者（副）, 依存関係(先行タスク), 備考
 */

/** ワークフロー定義スプレッドシートの名前 */
var WORKFLOW_SHEET_NAME = 'ワークフロー定義';

/** プロジェクト種別コードとシート名の対応 */
var WORKFLOW_SHEET_MAP = {
  'NEW_PRODUCT': '新商品',
  'RENEWAL': 'リニューアル・軽微な変更',
  'PB_NEW_FORMULA': '新商品',
  'PB_EXISTING_FORMULA': 'リニューアル・軽微な変更'
};

// ==================================================
// ワークフロー定義スプレッドシートの初期作成
// ==================================================

/**
 * ワークフロー定義スプレッドシートを作成し、初期データを書き込む。
 * GAS エディタから手動で1回実行する。
 * 作成後、スクリプトプロパティ WORKFLOW_SPREADSHEET_ID に自動設定される。
 */
function createWorkflowSheet() {
  var token = ScriptApp.getOAuthToken();

  // Drive API でスプレッドシートを作成
  var driveResponse = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + token },
    contentType: 'application/json',
    payload: JSON.stringify({
      name: WORKFLOW_SHEET_NAME,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: [PROJECT_FOLDER_ID]
    }),
    muteHttpExceptions: true
  });

  if (driveResponse.getResponseCode() !== 200) {
    throw new Error('Drive API エラー: ' + driveResponse.getContentText());
  }

  var fileData = JSON.parse(driveResponse.getContentText());
  var ssId = fileData.id;

  // スクリプトプロパティに保存
  PropertiesService.getScriptProperties().setProperty('WORKFLOW_SPREADSHEET_ID', ssId);

  // ヘッダー行の定義
  var headers = ['親タスク番号', '親タスク名', '子タスク番号', '子タスク名', 'ロール', '担当者（正）', '担当者（副）', '依存関係(先行タスク)', '備考'];

  // 新商品ワークフローのデータ
  var newProductData = [
    headers,
    [1, '基本情報作成', '',  '基本情報入力',     'コンセプトWG',     '川村斗紀育', '',           '',        ''],
    [2, '承認1',       '',  '',                 '代表取締役',       '小塚貴哉',   '',           '1',       ''],
    [3, '試算確定',     1,   '配合作成',         '原価・配合WG',     '石原孝則',   '',           '2',       ''],
    [3, '試算確定',     2,   '資材見積取得',     'コピー・外装WG',   '石原智',     '',           '3-1',     ''],
    [3, '試算確定',     3,   '原料見積取得',     '製造・物流部',     '',           '',           '3-1',     '別途個別にアサイン'],
    [3, '試算確定',     4,   '製造工場決定',     '製造・物流部',     '服部一也',   '',           '3-1',     ''],
    [3, '試算確定',     5,   '工賃計算',         '製造・物流部',     '',           '',           '3-1',     '3-4で担当者決定'],
    [4, '承認2',       1,   '部長承認1',         '営業部長',         '伊藤浩司',   '',           '3',       ''],
    [4, '承認2',       2,   '部長承認2',         '製造・物流部長',   '服部一也',   '',           '3',       ''],
    [4, '承認2',       3,   '部長承認3',         '研究開発部長',     '向真樹',     '',           '3',       ''],
    [5, 'コード取得',   1,   '資材品番取得',     '統括事務部',       '五十嵐仁美', '越智由加里', '4',       ''],
    [5, 'コード取得',   2,   '原料品番取得',     '統括事務部',       '五十嵐仁美', '越智由加里', '4',       ''],
    [5, 'コード取得',   3,   '製品品番・JAN取得', '統括事務部',       '五十嵐仁美', '越智由加里', '4',       ''],
    [6, 'パッケージ制作', 1, '表面デザイン作成', 'コピー・外装WG',   '菅原奏可',   '',           '4',       ''],
    [6, 'パッケージ制作', 2, '裏面デザイン作成', 'コピー・外装WG',   '菅原奏可',   '梶田雄佑',   '4',       ''],
    [6, 'パッケージ制作', 3, '入稿',             'コピー・外装WG',   '菅原奏可',   '',           '4',       ''],
    [7, '製造',         1,   '資材発注',         '製造・物流部',     '',           '',           '5-1',     '3-4で担当者決定'],
    [7, '製造',         2,   '原料発注',         '製造・物流部',     '',           '',           '5-2',     '別途個別にアサイン'],
    [7, '製造',         3,   '初回製造',         '製造・物流部',     '',           '',           '7-1,7-2', '3-4で担当者決定'],
    [8, '発売案内',     '',  '',                 '広報室',           '西泉',       '',           '4',       ''],
    [9, '初回出荷',     '',  '',                 '製造・物流部',     '',           '',           '7-3',     '3-4で担当者決定']
  ];

  // リニューアル・軽微な変更ワークフローのデータ
  var renewalData = [
    headers,
    [1, '基本情報作成', '',  '基本情報入力',     'コンセプトWG',     '川村斗紀育', '',           '',        ''],
    [2, '承認1',       '',  '',                 '代表取締役',       '小塚貴哉',   '',           '1',       'スキップ'],
    [3, '試算確定',     1,   '配合作成',         '原価・配合WG',     '石原孝則',   '',           '2',       ''],
    [3, '試算確定',     2,   '資材見積取得',     'コピー・外装WG',   '石原智',     '',           '3-1',     ''],
    [3, '試算確定',     3,   '原料見積取得',     '製造・物流部',     '',           '',           '3-1',     '別途個別にアサイン'],
    [3, '試算確定',     4,   '製造工場決定',     '製造・物流部',     '服部一也',   '',           '3-1',     '不要'],
    [3, '試算確定',     5,   '工賃計算',         '製造・物流部',     '',           '',           '3-1',     '3-4で担当者決定'],
    [4, '承認2',       1,   '部長承認1',         '営業部長',         '伊藤浩司',   '',           '3',       ''],
    [4, '承認2',       2,   '部長承認2',         '製造・物流部長',   '服部一也',   '',           '3',       ''],
    [4, '承認2',       3,   '部長承認3',         '研究開発部長',     '向真樹',     '',           '3',       ''],
    [5, 'コード取得',   1,   '資材品番取得',     '統括事務部',       '五十嵐仁美', '越智由加里', '4',       '必要に応じて'],
    [5, 'コード取得',   2,   '原料品番取得',     '統括事務部',       '五十嵐仁美', '越智由加里', '4',       '必要に応じて'],
    [5, 'コード取得',   3,   '製品品番・JAN取得', '統括事務部',       '五十嵐仁美', '越智由加里', '4',       '必要に応じて'],
    [6, 'パッケージ制作', 1, '表面デザイン作成', 'コピー・外装WG',   '菅原奏可',   '',           '4',       '必要に応じて'],
    [6, 'パッケージ制作', 2, '裏面デザイン作成', 'コピー・外装WG',   '菅原奏可',   '梶田雄佑',   '4',       '必要に応じて'],
    [6, 'パッケージ制作', 3, '入稿',             'コピー・外装WG',   '菅原奏可',   '',           '4',       ''],
    [7, '製造',         1,   '資材発注',         '製造・物流部',     '',           '',           '5-1',     '3-4で担当者決定'],
    [7, '製造',         2,   '原料発注',         '製造・物流部',     '',           '',           '5-2',     '別途個別にアサイン'],
    [7, '製造',         3,   '初回製造',         '製造・物流部',     '',           '',           '7-1,7-2', '3-4で担当者決定'],
    [8, '発売案内',     '',  '',                 '広報室',           '西泉',       '',           '4',       '必要に応じて'],
    [9, '初回出荷',     '',  '',                 '製造・物流部',     '',           '',           '7-3',     '3-4で担当者決定']
  ];

  // Sheets API: デフォルトシートをリネーム + 新商品データを書き込み
  var batchRequests = [
    {
      updateSheetProperties: {
        properties: { sheetId: 0, title: '新商品', gridProperties: { frozenRowCount: 1 } },
        fields: 'title,gridProperties.frozenRowCount'
      }
    },
    {
      updateCells: {
        rows: sheetRowsToApi_(newProductData),
        start: { sheetId: 0, rowIndex: 0, columnIndex: 0 },
        fields: 'userEnteredValue'
      }
    },
    // リニューアルシートを追加
    {
      addSheet: {
        properties: { title: 'リニューアル・軽微な変更', gridProperties: { frozenRowCount: 1 } }
      }
    }
  ];

  var batchResponse = UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/' + ssId + ':batchUpdate', {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + token },
    contentType: 'application/json',
    payload: JSON.stringify({ requests: batchRequests }),
    muteHttpExceptions: true
  });

  if (batchResponse.getResponseCode() !== 200) {
    throw new Error('Sheets batchUpdate エラー: ' + batchResponse.getContentText());
  }

  // 追加されたリニューアルシートのIDを取得
  var batchResult = JSON.parse(batchResponse.getContentText());
  var renewalSheetId = batchResult.replies[2].addSheet.properties.sheetId;

  // リニューアルシート + 担当者・ロール定義シート + ディレクトリシートを追加
  var secondBatch = {
    requests: [
      {
        updateCells: {
          rows: sheetRowsToApi_(renewalData),
          start: { sheetId: renewalSheetId, rowIndex: 0, columnIndex: 0 },
          fields: 'userEnteredValue'
        }
      },
      {
        addSheet: {
          properties: { title: '担当者・ロール定義', gridProperties: { frozenRowCount: 1 } }
        }
      },
      {
        addSheet: {
          properties: { title: 'ディレクトリ', hidden: true }
        }
      }
    ]
  };

  var secondResponse = UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/' + ssId + ':batchUpdate', {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + token },
    contentType: 'application/json',
    payload: JSON.stringify(secondBatch),
    muteHttpExceptions: true
  });

  if (secondResponse.getResponseCode() !== 200) {
    throw new Error('Sheets batchUpdate (2) エラー: ' + secondResponse.getContentText());
  }

  var secondResult = JSON.parse(secondResponse.getContentText());
  var roleSheetId = secondResult.replies[1].addSheet.properties.sheetId;
  var dirSheetId = secondResult.replies[2].addSheet.properties.sheetId;

  // ディレクトリシートに People API からユーザー一覧を書き込み
  var directoryUsers = getDirectoryUsers_();
  var dirData = [['担当者名', 'メールアドレス']];
  directoryUsers.forEach(function(user) {
    dirData.push([user.name, user.email]);
  });

  // 担当者・ロール定義シートのデータ（メールアドレスは VLOOKUP 数式）
  var roleHeaders = ['ロール', '担当者名', 'メールアドレス', '正/副'];
  var roleInitialData = [
    { role: 'コンセプトWG',     name: '川村斗紀育',   type: '正' },
    { role: '原価・配合WG',     name: '石原孝則',     type: '正' },
    { role: 'コピー・外装WG',   name: '菅原奏可',     type: '正' },
    { role: 'コピー・外装WG',   name: '梶田雄佑',     type: '副' },
    { role: '代表取締役',       name: '小塚貴哉',     type: '正' },
    { role: '製造・物流部',     name: '服部一也',     type: '正' },
    { role: '統括事務部',       name: '五十嵐仁美',   type: '正' },
    { role: '統括事務部',       name: '越智由加里',   type: '副' },
    { role: '広報室',           name: '西泉',         type: '正' },
    { role: '営業部長',         name: '伊藤浩司',     type: '正' },
    { role: '製造・物流部長',   name: '服部一也',     type: '正' },
    { role: '研究開発部長',     name: '向真樹',       type: '正' }
  ];

  // ヘッダー行
  var roleRows = [
    {
      values: roleHeaders.map(function(h) {
        return { userEnteredValue: { stringValue: h } };
      })
    }
  ];

  // データ行（メールアドレス列は VLOOKUP 数式）
  roleInitialData.forEach(function(item, idx) {
    var rowNum = idx + 2; // 行番号（1始まり、ヘッダー除く）
    roleRows.push({
      values: [
        { userEnteredValue: { stringValue: item.role } },
        { userEnteredValue: { stringValue: item.name } },
        { userEnteredValue: { formulaValue: '=IFERROR(VLOOKUP(B' + rowNum + ',ディレクトリ!A:B,2,FALSE),"")' } },
        { userEnteredValue: { stringValue: item.type } }
      ]
    });
  });

  // 担当者名列にデータバリデーション（ドロップダウン）を設定
  var thirdBatch = {
    requests: [
      // ディレクトリシートにデータ書き込み
      {
        updateCells: {
          rows: sheetRowsToApi_(dirData),
          start: { sheetId: dirSheetId, rowIndex: 0, columnIndex: 0 },
          fields: 'userEnteredValue'
        }
      },
      // 担当者・ロール定義シートにデータ書き込み
      {
        updateCells: {
          rows: roleRows,
          start: { sheetId: roleSheetId, rowIndex: 0, columnIndex: 0 },
          fields: 'userEnteredValue'
        }
      },
      // 担当者名列（B列）にデータバリデーション設定
      {
        setDataValidation: {
          range: {
            sheetId: roleSheetId,
            startRowIndex: 1,
            startColumnIndex: 1,
            endColumnIndex: 2
          },
          rule: {
            condition: {
              type: 'ONE_OF_RANGE',
              values: [{ userEnteredValue: '=ディレクトリ!$A$2:$A$' + (dirData.length > 1 ? dirData.length : 100) }]
            },
            showCustomUi: true,
            strict: false
          }
        }
      }
    ]
  };

  // ワークフローシートの担当者（正）・担当者（副）列にデータバリデーションを追加
  // 担当者・ロール定義シートの担当者名（B列）を選択肢とする
  var workflowSheetIds = [0, renewalSheetId]; // 新商品(sheetId=0), リニューアル
  workflowSheetIds.forEach(function(wsId) {
    // 担当者（正）列 = F列 = index 5
    thirdBatch.requests.push({
      setDataValidation: {
        range: {
          sheetId: wsId,
          startRowIndex: 1,
          startColumnIndex: 5,
          endColumnIndex: 6
        },
        rule: {
          condition: {
            type: 'ONE_OF_RANGE',
            values: [{ userEnteredValue: '=担当者・ロール定義!$B$2:$B$100' }]
          },
          showCustomUi: true,
          strict: false
        }
      }
    });
    // 担当者（副）列 = G列 = index 6
    thirdBatch.requests.push({
      setDataValidation: {
        range: {
          sheetId: wsId,
          startRowIndex: 1,
          startColumnIndex: 6,
          endColumnIndex: 7
        },
        rule: {
          condition: {
            type: 'ONE_OF_RANGE',
            values: [{ userEnteredValue: '=担当者・ロール定義!$B$2:$B$100' }]
          },
          showCustomUi: true,
          strict: false
        }
      }
    });
  });

  UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/' + ssId + ':batchUpdate', {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + token },
    contentType: 'application/json',
    payload: JSON.stringify(thirdBatch),
    muteHttpExceptions: true
  });

  var ssUrl = 'https://docs.google.com/spreadsheets/d/' + ssId + '/edit';
  Logger.log('ワークフロー定義スプレッドシートを作成しました: ' + ssUrl);
  Logger.log('スクリプトプロパティ WORKFLOW_SPREADSHEET_ID に設定しました: ' + ssId);
  Logger.log('ディレクトリユーザー数: ' + directoryUsers.length);

  return { spreadsheetId: ssId, spreadsheetUrl: ssUrl };
}

/**
 * ディレクトリシートのユーザー一覧を最新の People API データで更新する。
 * 新しいメンバーが入社した場合などに実行する。
 * GASエディタから手動実行、またはトリガーで定期実行可能。
 */
function syncDirectory() {
  var ssId = PropertiesService.getScriptProperties().getProperty('WORKFLOW_SPREADSHEET_ID');
  if (!ssId) {
    throw new Error('WORKFLOW_SPREADSHEET_ID が未設定です。createWorkflowSheet() を先に実行してください。');
  }

  var token = ScriptApp.getOAuthToken();

  // People API からユーザー一覧を取得
  var directoryUsers = getDirectoryUsers_();
  var dirData = [['担当者名', 'メールアドレス']];
  directoryUsers.forEach(function(user) {
    dirData.push([user.name, user.email]);
  });

  // ディレクトリシートの sheetId を取得
  var metaResponse = UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/' + ssId + '?fields=sheets.properties', {
    method: 'get',
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });

  if (metaResponse.getResponseCode() !== 200) {
    throw new Error('スプレッドシート情報取得エラー: ' + metaResponse.getContentText());
  }

  var metaData = JSON.parse(metaResponse.getContentText());
  var dirSheetId = null;
  var roleSheetId = null;
  var newProductSheetId = null;
  var renewalSheetId = null;
  metaData.sheets.forEach(function(sheet) {
    if (sheet.properties.title === 'ディレクトリ') {
      dirSheetId = sheet.properties.sheetId;
    }
    if (sheet.properties.title === '担当者・ロール定義') {
      roleSheetId = sheet.properties.sheetId;
    }
    if (sheet.properties.title === '新商品') {
      newProductSheetId = sheet.properties.sheetId;
    }
    if (sheet.properties.title === 'リニューアル・軽微な変更') {
      renewalSheetId = sheet.properties.sheetId;
    }
  });

  if (dirSheetId === null) {
    throw new Error('「ディレクトリ」シートが見つかりません。');
  }

  // ディレクトリシートをクリアして書き直し
  var requests = [
    {
      updateCells: {
        range: { sheetId: dirSheetId },
        fields: 'userEnteredValue'
      }
    },
    {
      updateCells: {
        rows: sheetRowsToApi_(dirData),
        start: { sheetId: dirSheetId, rowIndex: 0, columnIndex: 0 },
        fields: 'userEnteredValue'
      }
    }
  ];

  // データバリデーションも更新（担当者・ロール定義シートのB列）
  if (roleSheetId !== null) {
    requests.push({
      setDataValidation: {
        range: {
          sheetId: roleSheetId,
          startRowIndex: 1,
          startColumnIndex: 1,
          endColumnIndex: 2
        },
        rule: {
          condition: {
            type: 'ONE_OF_RANGE',
            values: [{ userEnteredValue: '=ディレクトリ!$A$2:$A$' + dirData.length }]
          },
          showCustomUi: true,
          strict: false
        }
      }
    });
  }

  // ワークフローシートの担当者（正）・担当者（副）列のデータバリデーションも更新
  var workflowSheetIds = [];
  if (newProductSheetId !== null) workflowSheetIds.push(newProductSheetId);
  if (renewalSheetId !== null) workflowSheetIds.push(renewalSheetId);

  workflowSheetIds.forEach(function(wsId) {
    // 担当者（正）列 = F列 = index 5
    requests.push({
      setDataValidation: {
        range: {
          sheetId: wsId,
          startRowIndex: 1,
          startColumnIndex: 5,
          endColumnIndex: 6
        },
        rule: {
          condition: {
            type: 'ONE_OF_RANGE',
            values: [{ userEnteredValue: '=担当者・ロール定義!$B$2:$B$100' }]
          },
          showCustomUi: true,
          strict: false
        }
      }
    });
    // 担当者（副）列 = G列 = index 6
    requests.push({
      setDataValidation: {
        range: {
          sheetId: wsId,
          startRowIndex: 1,
          startColumnIndex: 6,
          endColumnIndex: 7
        },
        rule: {
          condition: {
            type: 'ONE_OF_RANGE',
            values: [{ userEnteredValue: '=担当者・ロール定義!$B$2:$B$100' }]
          },
          showCustomUi: true,
          strict: false
        }
      }
    });
  });

  UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/' + ssId + ':batchUpdate', {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + token },
    contentType: 'application/json',
    payload: JSON.stringify({ requests: requests }),
    muteHttpExceptions: true
  });

  Logger.log('ディレクトリを同期しました。ユーザー数: ' + directoryUsers.length);
}

/**
 * 2次元配列を Sheets API の rowData 形式に変換する。
 * @param {Array<Array>} data - 2次元配列
 * @return {Array} rowData 配列
 * @private
 */
function sheetRowsToApi_(data) {
  return data.map(function(row) {
    return {
      values: row.map(function(cell) {
        if (typeof cell === 'number') {
          return { userEnteredValue: { numberValue: cell } };
        }
        return { userEnteredValue: { stringValue: String(cell) } };
      })
    };
  });
}

// ==================================================
// ワークフロー読み取り
// ==================================================

/**
 * プロジェクト種別コードからワークフロー定義をスプレッドシートから読み込んで返す。
 *
 * @param {string} projectType - 種別コード（NEW_PRODUCT, RENEWAL など）
 * @return {Array|null} ワークフロー定義配列。該当なしの場合は null
 */
function getWorkflowByType(projectType) {
  var sheetName = WORKFLOW_SHEET_MAP[projectType];
  if (!sheetName) {
    return null;
  }
  return readWorkflowFromSheet_(sheetName);
}

/**
 * ワークフロー定義スプレッドシートから指定シートのデータを読み込む。
 *
 * @param {string} sheetName - シート名
 * @return {Array} ワークフロー定義配列（親子構造）
 * @private
 */
function readWorkflowFromSheet_(sheetName) {
  var ssId = PropertiesService.getScriptProperties().getProperty('WORKFLOW_SPREADSHEET_ID');
  if (!ssId) {
    Logger.log('WORKFLOW_SPREADSHEET_ID が未設定です。createWorkflowSheet() を実行してください。');
    return [];
  }

  var token = ScriptApp.getOAuthToken();
  var url = 'https://sheets.googleapis.com/v4/spreadsheets/' + ssId
    + '/values/' + encodeURIComponent(sheetName)
    + '?majorDimension=ROWS';

  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    Logger.log('ワークフロー読み取りエラー (' + sheetName + '): ' + response.getContentText());
    return [];
  }

  var data = JSON.parse(response.getContentText());
  var rows = data.values || [];

  if (rows.length <= 1) {
    return []; // ヘッダーのみ
  }

  // ヘッダーを除いたデータ行をパース
  return parseWorkflowRows_(rows.slice(1));
}

/**
 * スプレッドシートの行データを親子構造のワークフロー定義に変換する。
 *
 * カラム: [0]親タスク番号, [1]親タスク名, [2]子タスク番号, [3]子タスク名,
 *         [4]ロール, [5]担当者（正）, [6]担当者（副）, [7]依存関係(先行タスク),
 *         [8]備考
 *
 * @param {Array<Array>} rows - データ行の2次元配列
 * @return {Array} 親子構造のワークフロー定義配列
 * @private
 */
function parseWorkflowRows_(rows) {
  var parentMap = {};
  var parentOrder = [];

  rows.forEach(function(row) {
    var parentId = row[0] ? Number(row[0]) : 0;
    var parentName = row[1] || '';
    var childId = row[2] ? Number(row[2]) : 0;
    var childName = row[3] || '';
    var role = row[4] || '';
    var primary = row[5] || '';
    var secondary = row[6] || '';
    var dependsOn = row[7] || '';
    var notes = row[8] || '';

    // 依存関係をカンマ区切りで配列にパース
    var dependencies = dependsOn
      ? String(dependsOn).split(',').map(function(s) { return s.trim(); }).filter(Boolean)
      : [];

    if (!parentId) return;

    // 親タスクを初期化
    if (!parentMap[parentId]) {
      parentMap[parentId] = {
        parentId: parentId,
        parentName: parentName,
        role: '',
        primary: '',
        secondary: '',
        dependencies: [],
        notes: '',
        children: []
      };
      parentOrder.push(parentId);
    }

    var parent = parentMap[parentId];
    if (parentName) {
      parent.parentName = parentName;
    }

    if (childId && childName) {
      // 子タスク行
      parent.children.push({
        childId: childId,
        childName: childName,
        role: role,
        primary: primary,
        secondary: secondary,
        dependencies: dependencies,
        notes: notes
      });
    } else {
      // 親タスク行（子タスクなし）
      parent.role = role;
      parent.primary = primary;
      parent.secondary = secondary;
      parent.dependencies = dependencies;
      parent.notes = notes;
    }
  });

  // 順序通りに配列に変換
  return parentOrder.map(function(id) {
    return parentMap[id];
  });
}

// ==================================================
// 担当者・ロール定義の読み取り
// ==================================================

/**
 * ワークフロー定義スプレッドシートの「担当者・ロール定義」シートからデータを読み込む。
 *
 * @return {Array} ロールメンバー配列 [{ role, name, email, type }]
 */
function getRoleMembers() {
  var ssId = PropertiesService.getScriptProperties().getProperty('WORKFLOW_SPREADSHEET_ID');
  if (!ssId) {
    return [];
  }

  var token = ScriptApp.getOAuthToken();
  var sheetName = '担当者・ロール定義';
  var url = 'https://sheets.googleapis.com/v4/spreadsheets/' + ssId
    + '/values/' + encodeURIComponent(sheetName)
    + '?majorDimension=ROWS';

  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    Logger.log('担当者・ロール定義 読み取りエラー: ' + response.getContentText());
    return [];
  }

  var data = JSON.parse(response.getContentText());
  var rows = data.values || [];

  if (rows.length <= 1) {
    return [];
  }

  return rows.slice(1).map(function(row) {
    return {
      role: row[0] || '',
      name: row[1] || '',
      email: row[2] || '',
      type: row[3] || '正'
    };
  });
}

/**
 * ロール名から担当者一覧を取得する。
 *
 * @param {string} roleName - ロール名
 * @return {Array} 担当者配列 [{ name, email, type }]
 */
function getMembersByRole(roleName) {
  var members = getRoleMembers();
  return members.filter(function(m) {
    return m.role === roleName;
  });
}

/**
 * 全ロール名の一覧を取得する（重複なし）。
 *
 * @return {Array<string>} ロール名の配列
 */
function getRoleNames() {
  var members = getRoleMembers();
  var roles = {};
  members.forEach(function(m) {
    if (m.role) roles[m.role] = true;
  });
  return Object.keys(roles);
}

/**
 * ワークフロー定義からフラットなタスクリストを生成する。
 * 親タスク・子タスクを展開し、タスクIDを付与する。
 *
 * @param {Array} workflow - ワークフロー定義配列
 * @return {Array} フラットなタスクオブジェクト配列
 */
function flattenWorkflow(workflow) {
  var tasks = [];

  workflow.forEach(function(parent) {
    if (!parent.children || parent.children.length === 0) {
      tasks.push({
        taskId: String(parent.parentId),
        taskName: parent.parentName,
        role: parent.role,
        primary: parent.primary,
        secondary: parent.secondary,
        dependencies: parent.dependencies || [],
        notes: parent.notes || ''
      });
    } else {
      parent.children.forEach(function(child) {
        tasks.push({
          taskId: parent.parentId + '-' + child.childId,
          taskName: parent.parentName + ' / ' + child.childName,
          role: child.role || parent.role,
          primary: child.primary || parent.primary,
          secondary: child.secondary || parent.secondary,
          dependencies: child.dependencies || [],
          notes: child.notes || ''
        });
      });
    }
  });

  return tasks;
}
