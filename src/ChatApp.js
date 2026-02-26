/**
 * ChatApp - Google Chat ボットのUI・イベント処理モジュール
 */

/** プロジェクト立ち上げを開始するトリガーワード */
var TRIGGER_KEYWORDS = ['登録', '立ち上げ', '新規', 'プロジェクト'];

/**
 * Google Chat Botがメッセージを受信した際のエントリポイント。
 * トリガーワードに一致した場合、プロジェクト種別選択カードを返す。
 *
 * @param {Object} event - Google Chatからのメッセージイベント
 * @return {Object} Chat応答（カードまたはテキストメッセージ）
 */
function onMessage(event) {
  var userMessage = (event.message && event.message.text) ? event.message.text.trim() : '';

  var isTriggered = TRIGGER_KEYWORDS.some(function(keyword) {
    return userMessage.indexOf(keyword) !== -1;
  });

  if (isTriggered) {
    return getProjectTypeSelectionCard();
  }

  return {
    text: 'プロジェクトを立ち上げるには「登録」または「立ち上げ」と入力してください。'
  };
}

/**
 * Google Chat Botでカードのボタンが押された際のエントリポイント。
 * actionMethodName に基づいて適切なコールバック関数にルーティングする。
 *
 * @param {Object} event - Google Chatからのカードクリックイベント
 * @return {Object} Chat応答（カードまたはテキストメッセージ）
 */
function onCardClick(event) {
  var actionName = event.common && event.common.invokedFunction
    ? event.common.invokedFunction
    : '';

  switch (actionName) {
    case 'onProjectTypeSelected':
      return onProjectTypeSelected(event);
    default:
      return {
        text: '不明なアクションです: ' + actionName
      };
  }
}

/**
 * プロジェクト種別選択カード（Card V2形式）を返す。
 * ユーザーに「新商品」「リニューアル・軽微な変更」「PB」の3種別から選択させる。
 * 各ボタンのアクションパラメータに種別を持たせ、後続の処理に繋げる。
 *
 * @return {Object} Card V2形式のカードオブジェクト
 */
function getProjectTypeSelectionCard() {
  return {
    cardsV2: [
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
    ]
  };
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

/**
 * 種別選択ボタンが押されたときのコールバック。
 * PBが選択された場合は配合種別の確認カードを返す。
 * それ以外はプロジェクト情報入力へ進む。
 *
 * @param {Object} event - Google Chatからのイベントオブジェクト
 * @return {Object} 次のカードまたはメッセージ
 */
function onProjectTypeSelected(event) {
  var projectType = event.common.parameters.projectType;

  if (projectType === 'PB') {
    return getPbFormulaTypeCard_();
  }

  return {
    text: '種別「' + getProjectTypeLabel_(projectType) + '」が選択されました。次のステップに進みます。'
  };
}

/**
 * PB選択時の配合種別確認カード（Card V2形式）を返す。
 * 「新規配合」「既存配合」を選択させる。
 *
 * @return {Object} Card V2形式のカードオブジェクト
 * @private
 */
function getPbFormulaTypeCard_() {
  return {
    cardsV2: [
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
    ]
  };
}

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
