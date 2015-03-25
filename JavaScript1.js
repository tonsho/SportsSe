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

var numOfPlayers = 3;

function getTargetFaclity() {
    return "法典公園（グラスポ）";
}

function getTargetDate() {
    return "2015/4/14";
}

function getTargetTimeSlot() {
    return "1230";
}

function moveToNextTarget() {
    // TODO
}

function fillFacilityTable() {
    var facilitySelectObj = $("<select></select>").change(function () {
        var oldTimeSlots = $("td", $(this).parent());
        $(oldTimeSlots).each(function () {
            $(this).remove();
        });
        var selectedFacility;
        $("option:selected", $(this)).each(function () {
            selectedFacility = $(this).val();
            return false;
        });
        var timeSlots = facilities[selectedFacility];
        for (var i = 0; i < timeSlots.length; ++i) {
            var timeSlotObj = $("<td><input type='checkbox' value='" + timeSlots[i] + "' /> " + timeSlots[i] + "</td>");
            $("tr", $(this).parent()).append(timeSlotObj);
        }
    });
    var timeSlotTableObj = $("<table><tr></tr></table>");
    for (var facility in facilities) {
        var facilityObj = $("<option></option>").text(facility);
        facilitySelectObj.append(facilityObj);
    }
    $(".timeSlot").append(facilitySelectObj);
    $(".timeSlot").append(timeSlotTableObj);
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
        if ($("img[alt='選択中']", contents)) {
            setTimeout(doApply, getSleepTime(), contents);
        } else {
            setTimeout(selectTimeSlot, getSleepTime(), contents);
        }
    } else if (0 < title.indexOf("時間貸し利用開始時間選択画面")) {
        setTimeout(selectStartTime, getSleepTime(), contents);
    } else if (0 < title.indexOf("利用規約承認画面")) {
        setTimeout(confirmTOS, getSleepTime(), contents);
    } else if (0 < title.indexOf("予約内容一覧画面")) {
        setTimeout(applyReservation, getSleepTime(), contents);
    } else if (0 < title.indexOf("施設予約一覧画面")) {
        setTimeout(sendMail, getSleepTime(), contents);
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
    var targetDateLink = $("a[href*='" + fmt.format(date) + "']", contents);
    if (targetDateLink.length) {
        dispatchClick(contents, targetDateLink);
    } else {
        console.log("There is no space. " + fmt.format(date));
        moveToNextTarget();
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
}

function selectTimeSlot(contents) {
    $("img[alt='空き']").each(function () {
        var a = $(this).parent();
        var hrefScriptString = a.attr("href");
        var startTime = Number(hrefScriptString.split(",")[5]);
        var endTime = Number(hrefScriptString.split(",")[7]);
        if (startTime <= getTargetTimeSlot() && getTargetTimeSlot() < endTime) {
            dispatchClick(contents, a);
            return false;
        }
    });
    console.log("There is no time slot. " + getTargetDate() + " " + getTargetTimeSlot());
    moveToNextTarget();
}

function selectStartTime(contents) {
    var targetLink = $("a[href*='" + getTargetTimeSlot() + "']", contents);
    dispatchClick(contents, targetLink);
}

function doApply(contents) {
    dispatchClick(contents, $("img[alt='申込み']", contents));
}

function confirmTOS(contents) {
    $("input#ruleFg_1", contents).click();
    dispatchClick(contents, $("img[alt='確認']", contents));
}

function applyReservation(contents) {
    $("input[name='applyNum']", contents).val(numOfPlayers);
    dispatchClick(contents, $("img[alt='申込み']", contents));
}

function sendMail(contents) {
    dispatchClick(contents, $("img[alt='送信する']", contents));
}

function dispatchClick(contents, a) {
    var doc = contents[0];
    doc.location.href = a[0].href;
}
