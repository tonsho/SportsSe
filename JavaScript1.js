var facilities = {
    "法典公園（グラスポ）": ["830", "1030", "1230", "1430", "1630"],
    "運動公園": ["700", "900", "1100", "1300", "1500", "1700"]
};


var reservationList =
    [
    {
        facility: "法典公園（グラスポ）",
        date: "2015/2/26",
        time_slot: [
                "1030", "1430"]
    }
    ];

function getTargetFaclity() {
    return "法典公園（グラスポ）";
}

function getTargetDate() {
    return "2015/4/30";
}

function moveToNextTarget() {
    // TODO
}

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
    } else if (0 < title.indexOf("施設空き状況画面時間貸し")) {
        setTimeout(selectTimeSlot, getSleepTime(), contents);
    }
}

function disableDialog(contents) {
    var doc = contents[0];
    var disableConfirm = function () {
        window.confirm = function (message) {
            console.log("confirm '" + message + "' true");
            return true;
        }
    }
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
    var facility = getTargetFaclity();
    dispatchClick(contents, $("a:contains('" + facility + "')", contents));
}

function selectDate(contents) {
    var date = new Date(getTargetDate());
    var targetMonth = (date.getMonth() + 1);
    var displayingMonth = getDisplayingMonth(contents);
    console.log("target : " + targetMonth + ", displaying : " + displayingMonth);

    if (targetMonth < displayingMonth) {
        movePreviousMonth(contents);
        return;
    } else if (targetMonth > displayingMonth) {
        moveNextMonth(contents);
        return;
    }
    var fmt = new DateFormat("yyyy, M, d");
    var targetDateLink = $("a[href*='" + fmt.format(date) + "']");
    if (targetDateLink.length) {
        dispatchClick(contents, targetDateLink);
    } else {
        console.log("There is no space. " + fmt.format(date));
        moveToNextTarget();
    }
}

function selectTimeSlot(contents) {
    var date = new Date(getTargetDate());
    var targetMonth = (date.getMonth() + 1);
    var displayingMonth = getDisplayingMonth(contents);
    console.log("target : " + targetMonth + ", displaying : " + displayingMonth);

    if (targetMonth < displayingMonth) {
        movePreviousMonth(contents);
        return;
    } else if (targetMonth > displayingMonth) {
        moveNextMonth(contents);
        return;
    }
    var fmt = new DateFormat("yyyy, M, d");
    var targetDateLink = $("a[href*='" + fmt.format(date) + "']");
    if (targetDateLink.length) {
        dispatchClick(contents, targetDateLink);
    } else {
        console.log("There is no space. " + fmt.format(date));
        moveToNextTarget();
    }
}

function getDisplayingMonth(contents) {
    var yearMonthString = $("strong:contains('" + new Date().getFullYear() + "年')", contents).text();
    console.log("yearMonthString : " + yearMonthString);
    var fmt = new DateFormat("yyyy年M月");
    var date = fmt.parse(yearMonthString);
    return date.getMonth() + 1;
}

function movePreviousMonth(contents) {
    dispatchClick(contents, $("img[alt='前の月']", contents).parent());
}

function moveNextMonth(contents) {
    dispatchClick(contents, $("img[alt='次の月']", contents).parent());
}

function dispatchClick(contents, a) {
    var doc = contents[0];
    doc.location.href = a[0].href;
}
