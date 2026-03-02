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

  var fileName = projectData.projectTypeLabel + '_' + projectData.productName + '_' + dateSuffix;

  // スプレッドシートを新規作成
  var ss = SpreadsheetApp.create(fileName);

  // 概要シートにプロジェクト情報を書き込む
  var sheet = ss.getSheets()[0];
  sheet.setName('プロジェクト概要');

  var infoData = [
    ['項目', '内容'],
    ['種別', projectData.projectTypeLabel],
    ['商品名', projectData.productName],
    ['規格', projectData.specification],
    ['発売予定日', projectData.releaseDate],
    ['登録日', Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm')],
    ['ステータス', '立ち上げ']
  ];
  sheet.getRange(1, 1, infoData.length, 2).setValues(infoData);

  // ヘッダー行を装飾
  var headerRange = sheet.getRange(1, 1, 1, 2);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4a86e8');
  headerRange.setFontColor('#ffffff');

  // 列幅を調整
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 350);
  sheet.setFrozenRows(1);

  // 指定フォルダに移動
  var file = DriveApp.getFileById(ss.getId());
  var folder = DriveApp.getFolderById(PROJECT_FOLDER_ID);
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  Logger.log('プロジェクトシートを作成しました: ' + fileName);

  return {
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    fileName: fileName
  };
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
