var facilities = {
    "法典公園（グラスポ）": ["830", "1030", "1230", "1430", "1630"],
    "運動公園": ["700", "900", "1100", "1300", "1500", "1700"]
}

function fillFacilityTable() {
    console.log("hoge!");
    var selectOption = $("<select></select>");
    for (var facility in facilities) {
        selectOption.append($("<option></option>").text(facility));
    }
    $(".timeSlot").append(selectOption);
}

function init() {
    fillFacilityTable();
}


function load() {
    var contents = $("iframe").contents();
    var title = $("title", contents).text();
    console.log("読み込み完了 [" + title + "]");
    if (0 < title.indexOf("認証画面")) {
        setTimeout(login, getSleepTime(), contents);
    } else if (0 < title.indexOf("登録メニュー画面")) {
        setTimeout(selectReservation, getSleepTime(), contents);
    } else if (0 < title.indexOf("予約申込画面")) {
        setTimeout(selectPurpose, getSleepTime(), contents);
    } else if (0 < title.indexOf("利用目的選択画面")) {
        setTimeout(selectTennis, getSleepTime(), contents);
    } else if (0 < title.indexOf("館選択画面")) {
        setTimeout(selectFacility, getSleepTime(), contents);
    }
}

function getSleepTime() {
    return getRandomInt(500, 3000);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function login(contents) {
    $("#userId", contents).val("123456789");
    $("#password", contents).val("password");
    dispatchClick(contents, $("img[alt='ログイン']", contents).parent());
}

function selectReservation(contents) {
    dispatchClick(contents, $("img[alt='予約の申込み']", contents).parent());
}

function selectPurpose(contents) {
    dispatchClick(contents, $("img[alt='利用目的から']", contents).parent());
}

function selectTennis(contents) {
    dispatchClick(contents, $("a:contains('テニス')", contents));
}

function selectTennis(contents) {
    dispatchClick(contents, $("a:contains('テニス')", contents));
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