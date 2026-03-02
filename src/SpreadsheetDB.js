/**
 * SpreadsheetDB - スプレッドシートをデータベースとして利用するモジュール
 */

/**
 * シート定義: シート名とヘッダー行の一覧
 */
var SHEET_DEFINITIONS = [
  {
    name: 'タスクテンプレート',
    headers: [
      'テンプレートID',
      'タスク名',
      'カテゴリ',
      'フェーズ',
      '説明',
      'デフォルト担当ロール',
      '見積工数（日）',
      '依存タスクID',
      '優先度',
      '有効フラグ'
    ]
  },
  {
    name: 'プロジェクト・メンバー対応表',
    headers: [
      'プロジェクトID',
      'プロジェクト名',
      'メンバーEmail',
      'メンバー名',
      'ロール',
      'Chatスペース名',
      '参加日',
      'ステータス'
    ]
  },
  {
    name: '実行タスクリスト',
    headers: [
      'タスクID',
      'プロジェクトID',
      'テンプレートID',
      'タスク名',
      '担当者Email',
      '担当者名',
      'ステータス',
      '優先度',
      '開始日',
      '期限日',
      '完了日',
      '進捗率',
      '備考',
      '最終更新日'
    ]
  },
  {
    name: '担当者マスタ',
    headers: [
      '担当者ID',
      '担当者名',
      'メールアドレス',
      'ロール',
      'ステータス',
      '登録日'
    ]
  }
];

/** プロジェクトシートの保存先 Drive フォルダ ID */
var PROJECT_FOLDER_ID = '1YarMPRjmOgKw65UAa0HbTwd-9fyjv8Xc';

/**
 * プロジェクト用のスプレッドシートを作成し、指定フォルダに配置する。
 * ファイル名は「種別_商品名_YYMMDD」形式。
 *
 * @param {Object} projectData - プロジェクト情報
 * @param {string} projectData.projectType - 種別コード
 * @param {string} projectData.projectTypeLabel - 種別表示名
 * @param {string} projectData.productName - 商品名
 * @param {string} projectData.specification - 規格
 * @param {string} projectData.releaseDate - 発売予定日 (YYYY/MM/DD)
 * @return {Object} 作成結果 { spreadsheetId, spreadsheetUrl, fileName }
 */
function createProjectSheet(projectData) {
  var now = new Date();
  var yy = String(now.getFullYear()).slice(-2);
  var mm = ('0' + (now.getMonth() + 1)).slice(-2);
  var dd = ('0' + now.getDate()).slice(-2);
  var dateSuffix = yy + mm + dd;

  var fileName = projectData.projectTypeLabel + '_' + projectData.productName
    + (projectData.specification ? '_' + projectData.specification : '') + '_' + dateSuffix;
  var registeredDate = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');

  var token = ScriptApp.getOAuthToken();

  // 1. Drive API で指定フォルダ内にスプレッドシートを直接作成
  var driveResponse = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + token },
    contentType: 'application/json',
    payload: JSON.stringify({
      name: fileName,
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
  var ssUrl = 'https://docs.google.com/spreadsheets/d/' + ssId + '/edit';

  // 2. Sheets API でデータを書き込み
  var infoRows = [
    ['項目', '内容'],
    ['種別', projectData.projectTypeLabel],
    ['商品名', projectData.productName],
    ['規格', projectData.specification],
    ['発売予定日', projectData.releaseDate],
    ['登録日', registeredDate],
    ['ステータス', '立ち上げ']
  ];

  var rowData = infoRows.map(function(row) {
    return {
      values: row.map(function(cell) {
        return { userEnteredValue: { stringValue: String(cell) } };
      })
    };
  });

  var updatePayload = {
    requests: [
      {
        updateSheetProperties: {
          properties: { sheetId: 0, title: 'プロジェクト概要', gridProperties: { frozenRowCount: 1 } },
          fields: 'title,gridProperties.frozenRowCount'
        }
      },
      {
        updateCells: {
          rows: rowData,
          start: { sheetId: 0, rowIndex: 0, columnIndex: 0 },
          fields: 'userEnteredValue'
        }
      }
    ]
  };

  UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/' + ssId + ':batchUpdate', {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + token },
    contentType: 'application/json',
    payload: JSON.stringify(updatePayload),
    muteHttpExceptions: true
  });

  Logger.log('プロジェクトシートを作成しました: ' + fileName);

  return {
    spreadsheetId: ssId,
    spreadsheetUrl: ssUrl,
    fileName: fileName
  };
}

/**
 * 担当者マスタにメンバーを追記する。
 * Sheets REST API を使用（Workspace Add-on 対応）。
 *
 * @param {Object} memberData - メンバー情報
 * @param {string} memberData.name - 担当者名
 * @param {string} memberData.email - メールアドレス
 * @param {string} memberData.role - ロール
 * @return {Object} 登録結果 { memberId, name, email, role }
 */
function addMember(memberData) {
  var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!ssId) {
    throw new Error('スクリプトプロパティに SPREADSHEET_ID が設定されていません。');
  }

  var token = ScriptApp.getOAuthToken();
  var now = new Date();
  var registeredDate = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');

  // 現在の担当者数を取得してIDを採番
  var sheetName = '担当者マスタ';
  var countResponse = UrlFetchApp.fetch(
    'https://sheets.googleapis.com/v4/spreadsheets/' + ssId + '/values/' + encodeURIComponent(sheetName) + '!A:A',
    {
      method: 'get',
      headers: { 'Authorization': 'Bearer ' + token },
      muteHttpExceptions: true
    }
  );

  var nextId = 1;
  if (countResponse.getResponseCode() === 200) {
    var countData = JSON.parse(countResponse.getContentText());
    if (countData.values) {
      nextId = countData.values.length; // ヘッダー行を含むのでそのまま次のID
    }
  }

  var memberId = 'M' + ('000' + nextId).slice(-4);

  // 行を追記
  var appendPayload = {
    values: [[memberId, memberData.name, memberData.email, memberData.role, '有効', registeredDate]]
  };

  var appendResponse = UrlFetchApp.fetch(
    'https://sheets.googleapis.com/v4/spreadsheets/' + ssId + '/values/' + encodeURIComponent(sheetName) + ':append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS',
    {
      method: 'post',
      headers: { 'Authorization': 'Bearer ' + token },
      contentType: 'application/json',
      payload: JSON.stringify(appendPayload),
      muteHttpExceptions: true
    }
  );

  if (appendResponse.getResponseCode() !== 200) {
    throw new Error('担当者マスタ書き込みエラー: ' + appendResponse.getContentText());
  }

  Logger.log('担当者を登録しました: ' + memberId + ' ' + memberData.name);

  return {
    memberId: memberId,
    name: memberData.name,
    email: memberData.email,
    role: memberData.role
  };
}

/**
 * OAuth スコープの認可を促すためのヘルパー関数。
 * GAS エディタから手動で実行して、Drive / Spreadsheets の認可画面を表示させる。
 * 認可完了後は Chat Bot からのリクエストでもこれらのAPIが利用可能になる。
 */
function authorizeScopes() {
  // OAuth トークンを取得（認可画面がまだなら表示される）
  var token = ScriptApp.getOAuthToken();
  Logger.log('OAuth トークン取得成功（先頭10文字）: ' + token.substring(0, 10) + '...');
  Logger.log('すべてのスコープが正常に認可されています。');
}

/**
 * スクリプトプロパティからスプレッドシートIDを取得して開く。
 * IDが未設定の場合はエラーを投げる。
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getSpreadsheet_() {
  var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!ssId) {
    throw new Error('スクリプトプロパティに SPREADSHEET_ID が設定されていません。');
  }
  return SpreadsheetApp.openById(ssId);
}

/**
 * データベース用スプレッドシートを初期化する。
 * 定義された各シートが存在しない場合のみ作成し、ヘッダー行を設定する。
 * すでに同名のシートが存在する場合はスキップする。
 */
function setupDatabase() {
  var ss = getSpreadsheet_();

  SHEET_DEFINITIONS.forEach(function(def) {
    var sheet = ss.getSheetByName(def.name);

    if (sheet) {
      Logger.log('シート "' + def.name + '" は既に存在するためスキップします。');
      return;
    }

    sheet = ss.insertSheet(def.name);
    sheet.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);

    // ヘッダー行を太字・背景色で装飾
    var headerRange = sheet.getRange(1, 1, 1, def.headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4a86e8');
    headerRange.setFontColor('#ffffff');

    // 1行目を固定
    sheet.setFrozenRows(1);

    Logger.log('シート "' + def.name + '" を作成しました。');
  });

  // デフォルトの "Sheet1"（シート1）が空なら削除
  var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('シート1');
  if (defaultSheet && ss.getSheets().length > 1) {
    var lastRow = defaultSheet.getLastRow();
    if (lastRow === 0) {
      ss.deleteSheet(defaultSheet);
      Logger.log('デフォルトシートを削除しました。');
    }
  }

  Logger.log('setupDatabase() が完了しました。');
}
