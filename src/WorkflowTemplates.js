/**
 * WorkflowTemplates - ワークフロー定義モジュール
 *
 * プロジェクト種別ごとのタスクテンプレートを定義する。
 * CSVデータ構造:
 *   [空列], タスク親, [空列], タスク子, ロール, 担当者（正）, 担当者（副）, 開始時の挙動, 完了時の挙動
 *
 * データ構造:
 *   parentId   - 親タスクの番号（例: 1, 2, 3）
 *   parentName - 親タスク名
 *   role       - 担当ロール（親タスクレベル）
 *   primary    - 担当者（正）
 *   secondary  - 担当者（副）
 *   onStart    - 開始時の挙動
 *   onComplete - 完了時の挙動
 *   children   - 子タスク配列
 *     childId    - 子タスク番号（例: 1, 2, 3 → 親3の子1 = タスクID "3-1"）
 *     childName  - 子タスク名
 *     role       - 担当ロール（子タスクレベル）
 *     primary    - 担当者（正）
 *     secondary  - 担当者（副）
 *     onStart    - 開始時の挙動
 *     onComplete - 完了時の挙動
 */

/**
 * 新商品ワークフロー定義
 * プロジェクト種別「新商品」選択時に自動生成されるタスク一覧
 */
var WORKFLOW_NEW_PRODUCT = [
  {
    parentId: 1,
    parentName: '基本情報作成',
    role: 'コンセプトWG',
    primary: '川村',
    secondary: '',
    onStart: '',
    onComplete: '2開始の通知を出す。',
    children: [
      {
        childId: 1,
        childName: '基本情報入力',
        role: 'コンセプトWG',
        primary: '川村',
        secondary: '',
        onStart: '',
        onComplete: ''
      }
    ]
  },
  {
    parentId: 2,
    parentName: '承認1',
    role: '代表取締役',
    primary: '貴哉',
    secondary: '',
    onStart: '',
    onComplete: '3-1,3-2,3-3,3-4,3-5開始の通知を出す。',
    children: []
  },
  {
    parentId: 3,
    parentName: '試算確定',
    role: '',
    primary: '',
    secondary: '',
    onStart: '',
    onComplete: '',
    children: [
      {
        childId: 1,
        childName: '配合作成',
        role: '原価・配合WG',
        primary: '石原',
        secondary: '',
        onStart: '',
        onComplete: ''
      },
      {
        childId: 2,
        childName: '原価試算',
        role: '原価・配合WG',
        primary: '石原',
        secondary: '',
        onStart: '',
        onComplete: ''
      },
      {
        childId: 3,
        childName: '売価設定',
        role: '営業',
        primary: '',
        secondary: '',
        onStart: '',
        onComplete: ''
      },
      {
        childId: 4,
        childName: 'デザイン案作成',
        role: 'デザインWG',
        primary: '',
        secondary: '',
        onStart: '',
        onComplete: ''
      },
      {
        childId: 5,
        childName: '品質基準策定',
        role: '品質管理',
        primary: '',
        secondary: '',
        onStart: '',
        onComplete: ''
      }
    ]
  },
  {
    parentId: 4,
    parentName: '承認2',
    role: '代表取締役',
    primary: '貴哉',
    secondary: '',
    onStart: '',
    onComplete: '5開始の通知を出す。',
    children: []
  },
  {
    parentId: 5,
    parentName: '製造準備',
    role: '',
    primary: '',
    secondary: '',
    onStart: '',
    onComplete: '',
    children: [
      {
        childId: 1,
        childName: '製造指示書作成',
        role: '原価・配合WG',
        primary: '石原',
        secondary: '',
        onStart: '',
        onComplete: ''
      },
      {
        childId: 2,
        childName: 'パッケージ入稿',
        role: 'デザインWG',
        primary: '',
        secondary: '',
        onStart: '',
        onComplete: ''
      },
      {
        childId: 3,
        childName: '販促物作成',
        role: '営業',
        primary: '',
        secondary: '',
        onStart: '',
        onComplete: ''
      }
    ]
  },
  {
    parentId: 6,
    parentName: '最終承認',
    role: '代表取締役',
    primary: '貴哉',
    secondary: '',
    onStart: '',
    onComplete: '発売準備完了の通知を出す。',
    children: []
  }
];

/**
 * リニューアル・軽微な変更ワークフロー定義
 * プロジェクト種別「リニューアル・軽微な変更」選択時に自動生成されるタスク一覧
 */
var WORKFLOW_RENEWAL = [
  {
    parentId: 1,
    parentName: '変更内容整理',
    role: 'コンセプトWG',
    primary: '川村',
    secondary: '',
    onStart: '',
    onComplete: '2開始の通知を出す。',
    children: [
      {
        childId: 1,
        childName: '変更箇所の特定',
        role: 'コンセプトWG',
        primary: '川村',
        secondary: '',
        onStart: '',
        onComplete: ''
      },
      {
        childId: 2,
        childName: '影響範囲の確認',
        role: 'コンセプトWG',
        primary: '川村',
        secondary: '',
        onStart: '',
        onComplete: ''
      }
    ]
  },
  {
    parentId: 2,
    parentName: '承認',
    role: '代表取締役',
    primary: '貴哉',
    secondary: '',
    onStart: '',
    onComplete: '3-1,3-2開始の通知を出す。',
    children: []
  },
  {
    parentId: 3,
    parentName: '変更実施',
    role: '',
    primary: '',
    secondary: '',
    onStart: '',
    onComplete: '',
    children: [
      {
        childId: 1,
        childName: '配合・原価修正',
        role: '原価・配合WG',
        primary: '石原',
        secondary: '',
        onStart: '',
        onComplete: ''
      },
      {
        childId: 2,
        childName: 'デザイン修正',
        role: 'デザインWG',
        primary: '',
        secondary: '',
        onStart: '',
        onComplete: ''
      }
    ]
  },
  {
    parentId: 4,
    parentName: '最終確認',
    role: '代表取締役',
    primary: '貴哉',
    secondary: '',
    onStart: '',
    onComplete: '変更完了の通知を出す。',
    children: []
  }
];

/**
 * プロジェクト種別コードからワークフロー定義を返す。
 *
 * @param {string} projectType - 種別コード（NEW_PRODUCT, RENEWAL など）
 * @return {Array|null} ワークフロー定義配列。該当なしの場合は null
 */
function getWorkflowByType(projectType) {
  switch (projectType) {
    case 'NEW_PRODUCT':
      return WORKFLOW_NEW_PRODUCT;
    case 'RENEWAL':
      return WORKFLOW_RENEWAL;
    case 'PB_NEW_FORMULA':
      return WORKFLOW_NEW_PRODUCT; // PB新規配合は新商品と同じフロー
    case 'PB_EXISTING_FORMULA':
      return WORKFLOW_RENEWAL; // PB既存配合はリニューアルと同じフロー
    default:
      return null;
  }
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
    // 子タスクがない場合は親タスク自体をタスクとして追加
    if (!parent.children || parent.children.length === 0) {
      tasks.push({
        taskId: String(parent.parentId),
        taskName: parent.parentName,
        role: parent.role,
        primary: parent.primary,
        secondary: parent.secondary,
        onStart: parent.onStart,
        onComplete: parent.onComplete
      });
    } else {
      // 子タスクがある場合は子タスクを個別に追加
      parent.children.forEach(function(child) {
        tasks.push({
          taskId: parent.parentId + '-' + child.childId,
          taskName: parent.parentName + ' / ' + child.childName,
          role: child.role || parent.role,
          primary: child.primary || parent.primary,
          secondary: child.secondary || parent.secondary,
          onStart: child.onStart || '',
          onComplete: child.onComplete || ''
        });
      });
    }
  });

  return tasks;
}
