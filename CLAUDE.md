# Product Dev Bot (PDB) 開発ガイド

## プロジェクト概要
- **目的**: 商品開発の「立ち上げ」「進捗管理」「情報共有」をGoogle Chat上で自動化するボット。
- **プラットフォーム**: Google Chat, Google Sheets, Vertex AI (Gemini), Google Drive
- **開発言語/環境**: Google Apps Script (GAS)

## 主要機能
- **A. プロジェクト立ち上げ機能**: 対話型登録、スペース自動作成、メンバー自動招待など
- **B. 進捗管理・更新機能**: 自然言語によるステータス更新、スプレッドシート書き換え
- **C. 分析・照会機能**
- **D. マスタ管理機能**

## 開発ルール

- **No ES Modules**: `import` / `export` 構文は使用しない。GASはESモジュール非対応のため、グローバル関数を使用する。
- **Google Services Integration**: 各種Googleサービス（Spreadsheet, Drive, Chat, Vertex AIなど）と連携する。GAS組み込みのサービスオブジェクト（`SpreadsheetApp`, `DriveApp` など）を使用する。
- **Runtime**: V8ランタイムを使用。モダンなJavaScript構文（const, let, アロー関数, テンプレートリテラルなど）は使用可能だが、モジュール構文は不可。
- **File Structure**: ソースファイルは `src/` に配置。`appsscript.json` マニフェストはプロジェクトルートに配置。
