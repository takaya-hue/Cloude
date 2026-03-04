/**
 * MemberManager - 担当者（メンバー）マスタ管理モジュール
 *
 * Google Chat 上で担当者を登録・管理するためのUIとロジックを提供する。
 * Google Workspace のディレクトリからユーザー情報を取得し、ドロップダウンで選択可能。
 */

// ==================================================
// ディレクトリ連携
// ==================================================

/**
 * Google Workspace ディレクトリからドメインユーザー一覧を取得する。
 * People API の listDirectoryPeople を使用。
 *
 * @return {Array} ユーザーオブジェクト配列 [{ name, email }]
 * @private
 */
function getDirectoryUsers_() {
  var token = ScriptApp.getOAuthToken();
  var users = [];
  var pageToken = '';

  do {
    var url = 'https://people.googleapis.com/v1/people:listDirectoryPeople'
      + '?readMask=names,emailAddresses'
      + '&sources=DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE'
      + '&pageSize=200';
    if (pageToken) {
      url += '&pageToken=' + pageToken;
    }

    var response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: { 'Authorization': 'Bearer ' + token },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      Logger.log('People API エラー: ' + response.getContentText());
      return users;
    }

    var data = JSON.parse(response.getContentText());
    var people = data.people || [];

    people.forEach(function(person) {
      var name = '';
      var email = '';

      if (person.names && person.names.length > 0) {
        name = person.names[0].displayName || '';
      }
      if (person.emailAddresses && person.emailAddresses.length > 0) {
        email = person.emailAddresses[0].value || '';
      }

      if (name && email) {
        users.push({ name: name, email: email });
      }
    });

    pageToken = data.nextPageToken || '';
  } while (pageToken);

  // 名前順にソート
  users.sort(function(a, b) {
    return a.name.localeCompare(b.name, 'ja');
  });

  return users;
}

// ==================================================
// 担当者登録 カード定義
// ==================================================

/**
 * 担当者登録フォームの cardsV2 配列を返す。
 * ディレクトリからユーザー一覧を取得し、ドロップダウンで選択可能にする。
 *
 * @return {Array} CardWithId の配列
 */
function getMemberRegistrationFormCardsV2_() {
  // ディレクトリからユーザー一覧を取得
  var directoryUsers = getDirectoryUsers_();

  // ユーザー選択ドロップダウンの項目を構築
  var userItems = directoryUsers.map(function(user) {
    return {
      text: user.name + ' (' + user.email + ')',
      value: JSON.stringify({ name: user.name, email: user.email }),
      selected: false
    };
  });

  var widgets = [];

  if (userItems.length > 0) {
    // ディレクトリから取得できた場合はドロップダウン
    widgets.push({
      selectionInput: {
        label: '担当者を選択',
        type: 'DROPDOWN',
        name: 'selectedUser',
        items: userItems
      }
    });
  } else {
    // 取得できなかった場合は手動入力にフォールバック
    widgets.push({
      textInput: {
        label: '担当者名',
        type: 'SINGLE_LINE',
        name: 'memberName',
        hintText: '例: 山田太郎'
      }
    });
    widgets.push({
      textInput: {
        label: 'メールアドレス',
        type: 'SINGLE_LINE',
        name: 'memberEmail',
        hintText: '例: yamada@hanagokoro.co.jp'
      }
    });
  }

  // ロール選択
  widgets.push({
    selectionInput: {
      label: 'ロール',
      type: 'DROPDOWN',
      name: 'memberRole',
      items: [
        { text: 'コンセプトWG', value: 'コンセプトWG', selected: false },
        { text: '原価・配合WG', value: '原価・配合WG', selected: false },
        { text: 'コピー・外装WG', value: 'コピー・外装WG', selected: false },
        { text: '営業', value: '営業', selected: false },
        { text: '代表取締役', value: '代表取締役', selected: false },
        { text: 'その他', value: 'その他', selected: false }
      ]
    }
  });

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
            widgets: widgets
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

  var memberName = '';
  var memberEmail = '';

  // ディレクトリ選択の場合
  var selectedUser = getSelectionValue_(formInputs, 'selectedUser');
  if (selectedUser) {
    try {
      var userData = JSON.parse(selectedUser);
      memberName = userData.name || '';
      memberEmail = userData.email || '';
    } catch (e) {
      Logger.log('ユーザーデータのパースに失敗: ' + e.message);
    }
  }

  // 手動入力フォールバック
  if (!memberName) {
    memberName = getFormValue_(formInputs, 'memberName');
  }
  if (!memberEmail) {
    memberEmail = getFormValue_(formInputs, 'memberEmail');
  }

  var memberRole = getSelectionValue_(formInputs, 'memberRole');

  // バリデーション
  if (!memberName || !memberEmail) {
    return createChatCreateMessageResponse_(
      buildTextMessage_('担当者の選択は必須です。選択してから再度「登録する」を押してください。')
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
