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

/**
 * データベース用スプレッドシートを初期化する。
 * 定義された各シートが存在しない場合のみ作成し、ヘッダー行を設定する。
 * すでに同名のシートが存在する場合はスキップする。
 */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

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
