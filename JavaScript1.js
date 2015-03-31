var facilities = {
    "----- Select -----": [],
    "法典公園（グラスポ）": ["830", "1030", "1230", "1430", "1630"],
    "運動公園": ["700", "900", "1100", "1300", "1500", "1700"]
};

var numOfPlayers = 3;

var timerId = null;
var isStarted = false;

var reservationList = [];
var currentTargetIdx = null;
//    [
//    {
//        date: "2015/2/26",
//        facility: "法典公園（グラスポ）",
//        time: [
//                "1030", "1430"]
//    }
//    ];

function getTargetFaclity() {
    return (reservationList[currentTargetIdx] || {}).facility ;
}

function getTargetDate() {
    return (reservationList[currentTargetIdx] || {}).date;
}

function getTargetTimeSlot() {
    return (reservationList[currentTargetIdx] || {}).time;
}

function moveToNextTarget() {
    if (null === currentTargetIdx) {
        currentTargetIdx = 0;
    } else {
        currentTargetIdx++;
    }
    if (currentTargetIdx <= reservationList.length - 1) {
        return true;
    } else {
        return false;
    }
}


function init() {
    var currendarId = 0;
    $("#addTimeSlot").button().click(function() {
        $("#reservationList").append(createReservationItem(currendarId++));
    }).click();
    $("#removeTimeSlot").button().click(function () {
        $(".reservationItem:last").remove();
        updateReservationList();
    });
    $("#start").button().click(function () {
        if (timerId) {
            clearTimeout(timerId);
            timerId = null;
        }
        if (isStarted) {
            $(this).text("Start");
            $(".editable").prop("disabled", false);
            $(".selector").selectmenu("enable");
            $("#addTimeSlot").prop("disabled", false);
            $("#removeTimeSlot").prop("disabled", false);
            isStarted = false;
        } else {
            updateReservationList();
            moveToNextTarget();
            if (getTargetFaclity()) {
                $(this).text("Stop");
                $(".editable").prop("disabled", true);
                $(".selector").selectmenu("disable");
                $("#addTimeSlot").prop("disabled", true);
                $("#removeTimeSlot").prop("disabled", true);
                isStarted = true;
            }
        }
    });
}

function createReservationItem(idx) {
    var tableObj = $("<table class='reservationItem'><tr></tr></table>");

    var tdLeftObj = $("<td></td>");
    var datePicker = $("<input id='inputDate" + idx + "' class='editable inputDate' type='text' name='inputDate' style='width:7em;font-size:large' onclick='YahhoCal.render(this.id);' />"
            + "<div id='calendar" + idx + "' ></div>");
    tdLeftObj.append(datePicker);

    var tdRightObj = $("<td></td>");
    var facilityPicker = $("<select class='selector inputFacility'></select>");
    for (var facility in facilities) {
        var facilityObj = $("<option></option>").text(facility);
        facilityPicker.append(facilityObj);
    }
    tdRightObj.append(facilityPicker);
    tdRightObj.append($("<table class='timeSlot'><tr></tr></table>"));
    tableObj.append(tdLeftObj).append(tdRightObj);
    facilityPicker.selectmenu({
        width: 250,
        change: function () {
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
                var timeSlotObj = $("<td><input type='checkbox' class='editable inputTime' value='" + timeSlots[i] + "' /> " + timeSlots[i] + "</td>");
                $("tr", $(this).parent()).append(timeSlotObj);
            }
        }
    });
    return tableObj;
}

function updateReservationList() {
    reservationList = [];
    currentTargetIdx = null;
    $(".reservationItem").each(function () {
        var facility = $(".inputFacility option:selected", $(this)).text();
        var date = $(".inputDate", $(this)).val();
        var time = $(".inputTime:checked", $(this)).map(function () {
            return $(this).val();
        }).get();
        if (date && time.length) {
            reservationList.push({
                facility: facility,
                date: date,
                time: time
            })
        }
    });
}

function load() {
    var contents = $("iframe").contents();
    var title = $("title", contents).text();
    console.log("読み込み完了 [" + title + "]");
    disableDialog(contents);

    if (0 < title.indexOf("認証画面")) {
        timerId = setTimeout(login, getSleepTime(), contents);
    } else if (0 < title.indexOf("登録メニュー画面")) {
        timerId = setTimeout(selectReservation, getSleepTime(), contents);
    } else if (0 < title.indexOf("予約申込画面")) {
        timerId = setTimeout(selectPurpose, getSleepTime(), contents);
    } else if (0 < title.indexOf("利用目的選択画面")) {
        timerId = setTimeout(selectTennis, getSleepTime(), contents);
    } else if (0 < title.indexOf("館選択画面")) {
        timerId = setTimeout(selectFacility, getSleepTime(), contents);
    } else if (0 < title.indexOf("施設空き状況１ヶ月表示画面")) {
        timerId = setTimeout(selectDate, getSleepTime(), contents);
    } else if (0 < title.indexOf("施設空き状況画面時間貸し")) {
        if ($("img[alt='選択中']", contents).length) {
            timerId = setTimeout(doApply, getSleepTime(), contents);
        } else {
            timerId = setTimeout(selectTimeSlot, getSleepTime(), contents);
        }
    } else if (0 < title.indexOf("時間貸し利用開始時間選択画面")) {
        timerId = setTimeout(selectStartTime, getSleepTime(), contents);
    } else if (0 < title.indexOf("利用規約承認画面")) {
        timerId = setTimeout(confirmTOS, getSleepTime(), contents);
    } else if (0 < title.indexOf("予約内容一覧画面")) {
        timerId = setTimeout(applyReservation, getSleepTime(), contents);
    } else if (0 < title.indexOf("施設予約一覧画面")) {
        timerId = setTimeout(sendMail, getSleepTime(), contents);
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
        moveToPreviousMonth(contents);
        return;
    } else if (targetMonth > displayingMonth) {
        moveToNextMonth(contents);
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

    function moveToPreviousMonth(contents) {
        dispatchClick(contents, $("img[alt='前の月']", contents).parent());
    }

    function moveToNextMonth(contents) {
        dispatchClick(contents, $("img[alt='次の月']", contents).parent());
    }
}

function selectTimeSlot(contents) {
    $("img[alt='空き']", contents).each(function () {
        var a = $(this).parent();
        var hrefScriptString = a.attr("href");
        var startTime = Number(hrefScriptString.split(",")[5]);
        var endTime = Number(hrefScriptString.split(",")[7]);
        var targetTimes = getTargetTimeSlot();
        for (var i = 0; i < targetTimes.length; ++i) {
            if (startTime <= targetTimes[i] && targetTimes[i] < endTime) {
                dispatchClick(contents, a);
                return false;
            } else {
                console.log(targetTimes[i] + " is not in [" + startTime + " - " + endTime + "]");
            }
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
    dispatchClick(contents, $("img[alt='申込み']", contents).parent());
}

function confirmTOS(contents) {
    $("input#ruleFg_1", contents).click();
    dispatchClick(contents, $("img[alt='確認']", contents).parent());
}

function applyReservation(contents) {
    $("input[name='applyNum']", contents).val(numOfPlayers);
    dispatchClick(contents, $("img[alt='申込み']", contents).parent());
}

function sendMail(contents) {
    dispatchClick(contents, $("img[alt='送信する']", contents).parent());
}

function dispatchClick(contents, a) {
    var doc = contents[0];
    doc.location.href = a[0].href;
}
