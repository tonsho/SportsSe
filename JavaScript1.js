var facilities = {
    "法典公園（グラスポ）": ["830", "1030", "1230", "1430", "1630"],
    "運動公園": ["700", "900", "1100", "1300", "1500", "1700"]
};

var reservationList = {
    "法典公園（グラスポ）": {
        "2015/2/26": {
            "1030": "",
            "1430": ""
        }
    }
};

function fillFacilityTable() {
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
    disableDialog(contents);
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
    } else if (0 < title.indexOf("施設空き状況１ヶ月表示画面")) {
        setTimeout(selectDate, getSleepTime(), contents);
    }
}

function disableDialog(contents) {
    var doc = contents[0];
    var disableConfirm = function() {
        window.confirm = function (message) {
            console.log("confirm '" + message + "' true");
            return true;
        }
    }
    console.log(disableConfirm.toString());
    doc.location.href = "javascript:(" + disableConfirm.toString() + "());";
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

function selectFacility(contents) {
    var facility = getNextFaclity();
    dispatchClick(contents, $("a:contains('" + facility + "')", contents));
}

function getNextFaclity() {
    return "法典公園（グラスポ）";
}

function selectDate(contents) {
    var date = new Date(getNextDate());
    var targetMonth = (date.getDate() + 1);
    var displayMonth = getDisplayMonth(contents);
    console.log("target : " + targetMonth + ", displaying : " + displayMonth);

    if (targetMonth < displayMonth) {
        movePreviousMonth();
        return;
    } else if (targetMonth > displayMonth) {
        moveNextMonth();
        return;
    }

    
}

function getNextDate() {
    return "2015/2/26";
}

function moveNextMonth(contents) {

}

function dispatchClick(contents, a) {
    var doc = contents[0];
    doc.location.href = a[0].href;
}
