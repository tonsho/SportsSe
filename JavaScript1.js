function load() {
    console.log("読み込み完了");
    var contents = $("iframe").contents();
    var title = $("title", contents).text();
    if (0 < title.indexOf("認証画面")) {
        console.log("-> 認証画面");
        login(contents);
    } else {
        clickTest(contents);
    }
}

function login(contents) {
    $("#userId", contents).val("123456789");
    $("#password", contents).val("password");
    dispatchClick(contents, $("img[alt='ログイン']", contents).parent());
}

function dispatchClick(contents, a) {
    var doc = contents[0];
    var e = doc.createEvent('MouseEvents');
    e.initMouseEvent(
        'click',               // イベント名
        true,                  // バブリングするか
        true,                  // デフォルトアクションが取り消し可能か
        doc.defaultView,       // イベントが発生したビュー
        1,                     // クリック回数
        500,                   // スクリーン内のマウスの X 座標
        500,                   // スクリーン内のマウスの Y 座標
        200,                   // ブラウザ表示域内のマウスの X 座標
        200,                   // ブラウザ表示域内のマウスの Y 座標
        false,                 // Ctrl キーが押されているか
        false,                 // Alt キーが押されているか
        false,                 // Shift キーが押されているか
        false,                 // Meta キーが押されているか
        0,                     // どのボタンが押されているか（左から順に 0、1、2）
        doc.body               // 関連するノード（何でも良い）
    );
    a[0].dispatchEvent(e);
}

function clickTest(contents) {
    var doc = contents[0];
    var e = doc.createEvent('MouseEvents');
    e.initMouseEvent(
        'click',               // イベント名
        true,                  // バブリングするか
        true,                  // デフォルトアクションが取り消し可能か
        doc.defaultView,       // イベントが発生したビュー
        1,                     // クリック回数
        500,                   // スクリーン内のマウスの X 座標
        500,                   // スクリーン内のマウスの Y 座標
        200,                   // ブラウザ表示域内のマウスの X 座標
        200,                   // ブラウザ表示域内のマウスの Y 座標
        false,                 // Ctrl キーが押されているか
        false,                 // Alt キーが押されているか
        false,                 // Shift キーが押されているか
        false,                 // Meta キーが押されているか
        0,                     // どのボタンが押されているか（左から順に 0、1、2）
        doc.body               // 関連するノード（何でも良い）
    );
    var a = $("a", contents).get(1);
    a.dispatchEvent(e);
}