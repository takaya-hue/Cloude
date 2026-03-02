/**
 * MemberManager - 担当者（メンバー）マスタ管理モジュール
 *
 * Google Chat 上で担当者を登録・管理するためのUIとロジックを提供する。
 */

// ==================================================
// 担当者登録 カード定義
// ==================================================

/**
 * 担当者登録フォームの cardsV2 配列を返す。
 *
 * @return {Array} CardWithId の配列
 */
function getMemberRegistrationFormCardsV2_() {
  return [
    {
      cardId: 'memberRegistrationForm',
      card: {
        header: {
          title: '担当者登録',
          subtitle: 'プロジェクトメンバーを登録します',
          imageUrl: 'https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/person_add/default/48px.svg',
          imageType: 'CIRCLE'
        },
        sections: [
          {
            header: '担当者情報',
            widgets: [
              {
                textInput: {
                  label: '担当者名',
                  type: 'SINGLE_LINE',
                  name: 'memberName',
                  hintText: '例: 山田太郎'
                }
              },
              {
                textInput: {
                  label: 'メールアドレス',
                  type: 'SINGLE_LINE',
                  name: 'memberEmail',
                  hintText: '例: yamada@hanagokoro.co.jp'
                }
              },
              {
                selectionInput: {
                  label: 'ロール',
                  type: 'DROPDOWN',
                  name: 'memberRole',
                  items: [
                    { text: 'コンセプトWG', value: 'コンセプトWG', selected: false },
                    { text: '原価・配合WG', value: '原価・配合WG', selected: false },
                    { text: 'デザインWG', value: 'デザインWG', selected: false },
                    { text: '品質管理', value: '品質管理', selected: false },
                    { text: '営業', value: '営業', selected: false },
                    { text: '代表取締役', value: '代表取締役', selected: false },
                    { text: 'その他', value: 'その他', selected: false }
                  ]
                }
              }
            ]
          },
          {
            widgets: [
              {
                buttonList: {
                  buttons: [
                    {
                      text: '登録する',
                      color: {
                        red: 0,
                        green: 0.5,
                        blue: 1,
                        alpha: 1
                      },
                      onClick: {
                        action: {
                          function: 'onMemberRegistrationSubmitted'
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
// 担当者登録 コールバック
// ==================================================

/**
 * 担当者登録フォーム送信時のコールバック。
 * フォームの入力値を取得し、担当者マスタに追記する。
 *
 * @param {Object} event - Google Chat からのイベントオブジェクト
 * @return {Object} Workspace Add-on 形式のレスポンス
 */
function onMemberRegistrationSubmitted(event) {
  var ceo = event.commonEventObject || event.common || {};
  var formInputs = ceo.formInputs || {};

  var memberName = getFormValue_(formInputs, 'memberName');
  var memberEmail = getFormValue_(formInputs, 'memberEmail');
  var memberRole = getSelectionValue_(formInputs, 'memberRole');

  // バリデーション
  if (!memberName) {
    return createChatCreateMessageResponse_(
      buildTextMessage_('担当者名は必須です。入力してから再度「登録する」を押してください。')
    );
  }
  if (!memberEmail) {
    return createChatCreateMessageResponse_(
      buildTextMessage_('メールアドレスは必須です。入力してから再度「登録する」を押してください。')
    );
  }

  // 担当者マスタに追記
  var result = addMember({
    name: memberName,
    email: memberEmail,
    role: memberRole || 'その他'
  });

  var summary = '担当者を登録しました\n\n'
    + 'ID: ' + result.memberId + '\n'
    + '担当者名: ' + result.name + '\n'
    + 'メール: ' + result.email + '\n'
    + 'ロール: ' + result.role;

  return createChatCreateMessageResponse_(
    buildTextMessage_(summary)
  );
}

/**
 * formInputs からセレクション入力値を取得するヘルパー。
 * @param {Object} formInputs - フォーム入力データ
 * @param {string} fieldName - フィールド名
 * @return {string} 選択値（空の場合は空文字）
 * @private
 */
function getSelectionValue_(formInputs, fieldName) {
  if (formInputs[fieldName] && formInputs[fieldName].stringInputs) {
    var values = formInputs[fieldName].stringInputs.value;
    return values && values.length > 0 ? values[0] : '';
  }
  return '';
}
