# Development Rules

## Project Overview
This project is a **Google Apps Script (GAS)** application.

## Rules

- **No ES Modules**: Do not use `import` / `export` syntax. GAS does not support ES Modules. Use global functions instead.
- **Google Services Integration**: This project integrates with various Google services (Spreadsheet, Drive, Gmail, Calendar, etc.). Use the built-in GAS service objects (e.g., `SpreadsheetApp`, `DriveApp`, `GmailApp`).
- **Runtime**: V8 runtime is enabled. Modern JavaScript syntax (const, let, arrow functions, template literals, etc.) is available, but module syntax is not.
- **File Structure**: Source files are in `src/`. The `appsscript.json` manifest is at the project root.
