/**
 * ChatApp - Google Chat ボットのUI・イベント処理モジュール
 *
 * このプロジェクトは Google Workspace Add-on としてデプロイされるため、
 * すべてのレスポンスは hostAppDataAction.chatDataAction でラップする必要がある。
 */

/** プロジェクト立ち上げを開始するトリガーワード */
var TRIGGER_KEYWORDS = ['登録', '立ち上げ', '新規', 'プロジェクト'];

// ==================================================
// Workspace Add-on レスポンスヘルパー
// ==================================================

/**
 * Workspace Add-on 用: 新規メッセージ作成レスポンスを返す。
 * onMessage / onCardClick の両方で使用可能。
 *
 * @param {Object} message - text や cardsV2 を含む Message オブジェクト
 * @return {Object} hostAppDataAction でラップされたレスポンス
 * @private
 */
function createChatCreateMessageResponse_(message) {
  return {
    hostAppDataAction: {
      chatDataAction: {
        createMessageAction: {
          message: message
        }
      }
    }
  };
}

/**
 * Workspace Add-on 用: 既存メッセージ更新レスポンスを返す。
 * onCardClick で既存カードを差し替える際に使用。
 *
 * @param {Object} message - cardsV2 を含む Message オブジェクト
 * @return {Object} hostAppDataAction でラップされたレスポンス
 * @private
 */
function createChatUpdateMessageResponse_(message) {
  return {
    hostAppDataAction: {
      chatDataAction: {
        updateMessageAction: {
          message: message
        }
      }
    }
  };
}

/**
 * テキストメッセージ用の Message オブジェクトを生成する。
 *
 * @param {string} text - 表示するテキスト
 * @return {Object} Message オブジェクト
 * @private
 */
function buildTextMessage_(text) {
  return { text: text };
}

/**
 * Card V2 メッセージ用の Message オブジェクトを生成する。
 *
 * @param {Array} cardsV2 - CardWithId の配列
 * @return {Object} Message オブジェクト
 * @private
 */
function buildCardMessage_(cardsV2) {
  return { cardsV2: cardsV2 };
}

// ==================================================
// イベントユーティリティ
// ==================================================

/**
 * Workspace Add-on / Classic Chat App 両対応でメッセージテキストを取得する。
 *
 * - Workspace Add-on: event.chat.messagePayload.message.argumentText (or .text)
 * - Classic Chat App:  event.message.argumentText (or .text)
 *
 * argumentText はBot宛メンション部分を除いた本文のみを返す。
 *
 * @param {Object} event - Google Chatからのイベントオブジェクト
 * @return {string} ユーザーが入力したメッセージテキスト
 * @private
 */
function getMessageText_(event) {
  // Workspace Add-on 形式
  if (event.chat && event.chat.messagePayload && event.chat.messagePayload.message) {
    var msg = event.chat.messagePayload.message;
    return (msg.argumentText || msg.text || '').trim();
  }
  // Classic Chat App 形式
  if (event.message) {
    return (event.message.argumentText || event.message.text || '').trim();
  }
  return '';
}

// ==================================================
// イベントハンドラ（エントリポイント）
// ==================================================

/**
 * Google Chat Botがメッセージを受信した際のエントリポイント。
 * トリガーワードに一致した場合、プロジェクト種別選択カードを返す。
 *
 * @param {Object} event - Google Chatからのメッセージイベント
 * @return {Object} Workspace Add-on 形式のレスポンス
 */
function onMessage(event) {
  var userMessage = getMessageText_(event);

  var isTriggered = TRIGGER_KEYWORDS.some(function(keyword) {
    return userMessage.indexOf(keyword) !== -1;
  });

  if (isTriggered) {
    return createChatCreateMessageResponse_(
      buildCardMessage_(getProjectTypeSelectionCardsV2_())
    );
  }

  return createChatCreateMessageResponse_(
    buildTextMessage_('プロジェクトを立ち上げるには「登録」または「立ち上げ」と入力してください。')
  );
}

/**
 * Google Chat Botでカードのボタンが押された際のエントリポイント。
 * invokedFunction に基づいて適切なコールバック関数にルーティングする。
 *
 * @param {Object} event - Google Chatからのカードクリックイベント
 * @return {Object} Workspace Add-on 形式のレスポンス
 */
function onCardClick(event) {
  var ceo = event.commonEventObject || event.common || {};
  var actionName = ceo.invokedFunction || '';

  switch (actionName) {
    case 'onProjectTypeSelected':
      return onProjectTypeSelected(event);
    default:
      return createChatCreateMessageResponse_(
        buildTextMessage_('不明なアクションです: ' + actionName)
      );
  }
}

// ==================================================
// カード定義
// ==================================================

/**
 * プロジェクト種別選択カードの cardsV2 配列を返す。
 *
 * @return {Array} CardWithId の配列
 * @private
 */
function getProjectTypeSelectionCardsV2_() {
  return [
    {
      cardId: 'projectTypeSelection',
      card: {
        header: {
          title: 'プロジェクト立ち上げ',
          subtitle: '商品開発の種別を選択してください',
          imageUrl: 'https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/rocket_launch/default/48px.svg',
          imageType: 'CIRCLE'
        },
        sections: [
          {
            header: '種別選択',
            widgets: [
              {
                buttonList: {
                  buttons: [
                    createProjectTypeButton_('新商品', 'NEW_PRODUCT'),
                    createProjectTypeButton_('リニューアル・軽微な変更', 'RENEWAL'),
                    createProjectTypeButton_('PB（プライベートブランド）', 'PB')
                  ]
                }
              }
            ]
          }
        ]
      }
    }
  ];
}

/**
 * 後方互換用: getProjectTypeSelectionCard() のラッパー。
 * 他のモジュールから呼ばれる可能性があるため残す。
 *
 * @return {Object} Workspace Add-on 形式のレスポンス
 */
function getProjectTypeSelectionCard() {
  return createChatCreateMessageResponse_(
    buildCardMessage_(getProjectTypeSelectionCardsV2_())
  );
}

/**
 * 種別選択ボタンを生成するヘルパー関数。
 * @param {string} label - ボタンに表示するテキスト
 * @param {string} typeValue - アクションパラメータに渡す種別値
 * @return {Object} Card V2形式のボタンオブジェクト
 * @private
 */
function createProjectTypeButton_(label, typeValue) {
  return {
    text: label,
    onClick: {
      action: {
        function: 'onProjectTypeSelected',
        parameters: [
          {
            key: 'projectType',
            value: typeValue
          }
        ]
      }
    }
  };
}

// ==================================================
// カードクリック コールバック
// ==================================================

/**
 * 種別選択ボタンが押されたときのコールバック。
 * PBが選択された場合は配合種別の確認カードに更新する。
 * それ以外はプロジェクト情報入力へ進む。
 *
 * @param {Object} event - Google Chatからのイベントオブジェクト
 * @return {Object} Workspace Add-on 形式のレスポンス
 */
function onProjectTypeSelected(event) {
  var ceo = event.commonEventObject || event.common || {};
  var params = ceo.parameters || {};
  var projectType = params.projectType;

  if (projectType === 'PB') {
    return createChatUpdateMessageResponse_(
      buildCardMessage_(getPbFormulaTypeCardsV2_())
    );
  }

  var message = '種別「' + getProjectTypeLabel_(projectType) + '」が選択されました。次のステップに進みます。';
  return createChatCreateMessageResponse_(
    buildTextMessage_(message)
  );
}

/**
 * PB選択時の配合種別確認カードの cardsV2 配列を返す。
 *
 * @return {Array} CardWithId の配列
 * @private
 */
function getPbFormulaTypeCardsV2_() {
  return [
    {
      cardId: 'pbFormulaTypeSelection',
      card: {
        header: {
          title: 'PB（プライベートブランド）',
          subtitle: '配合種別を選択してください'
        },
        sections: [
          {
            widgets: [
              {
                buttonList: {
                  buttons: [
                    {
                      text: '新規配合',
                      onClick: {
                        action: {
                          function: 'onProjectTypeSelected',
                          parameters: [
                            { key: 'projectType', value: 'PB_NEW_FORMULA' }
                          ]
                        }
                      }
                    },
                    {
                      text: '既存配合',
                      onClick: {
                        action: {
                          function: 'onProjectTypeSelected',
                          parameters: [
                            { key: 'projectType', value: 'PB_EXISTING_FORMULA' }
                          ]
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        ]
      }
    }
  ];
}

// ==================================================
// ユーティリティ
// ==================================================

/**
 * 種別コードから表示ラベルを返すヘルパー関数。
 * @param {string} typeValue - 種別コード
 * @return {string} 表示用ラベル
 * @private
 */
function getProjectTypeLabel_(typeValue) {
  var labels = {
    'NEW_PRODUCT': '新商品',
    'RENEWAL': 'リニューアル・軽微な変更',
    'PB': 'PB（プライベートブランド）',
    'PB_NEW_FORMULA': 'PB - 新規配合',
    'PB_EXISTING_FORMULA': 'PB - 既存配合'
  };
  return labels[typeValue] || typeValue;
}
