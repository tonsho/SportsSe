var facilities = {
    "----- Select -----": [],
    "法典公園（グラスポ）": ["830", "1030", "1230", "1430", "1630"],
    "運動公園": ["700", "900", "1100", "1300", "1500", "1700"]
};
var storageKeyInfo = "keyInfo";
var storageKeyList = "keyList";

function ReservationInfo() {
    this.userId =  null;
    this.password = null;
    this.numOfPlayers =  null;
    this.retryInterval = null;
}

ReservationInfo.prototype = {
    update: function () {
        for (var key in this) {
            if (this.hasOwnProperty(key)) {
                this[key] = $("#" + key).val();
            }
        }
    },
    show: function () {
        for (var key in this) {
            if (this.hasOwnProperty(key)) {
                $("#" + key).val(this[key]);
            }
        }
    },
    loadFromStorage: function () {
        var obj = JSON.parse(localStorage.getItem(storageKeyInfo));
        for (var key in this) {
            if (this.hasOwnProperty(key)) {
                this[key] = obj[key];
            }
        }
        this.show();
    },
    saveToStorage: function () {
        this.update();
        localStorage.setItem(storageKeyInfo, JSON.stringify(this));
    }
};

var reservationInfo = new ReservationInfo();

function ReservationTargetList() {
    this.list = [];
    this.currentIdx = null;
    //    [
    //    {
    //        date: "2015/2/26",
    //        facility: "法典公園（グラスポ）",
    //        time: [
    //                "1030", "1430"]
    //    }
    //    ];
}

ReservationTargetList.prototype = {
    update: function () {
        this.list = [];
        this.currentIdx = 0;
        var that = this;
        $(".reservationItem").each(function () {
            var facility = $(".inputFacility option:selected", $(this)).text();
            var date = $(".inputDate", $(this)).val();
            var time = $(".inputTime:checked", $(this)).map(function () {
                return $(this).val();
            }).get();
            if (date && time.length) {
                that.list.push({
                    facility: facility,
                    date: date,
                    time: time
                })
            }
        });
    },
    show: function () {
        $(".reservationItem").remove();
        for (var i = 0; i < this.list.length; ++i) {
            $("#addReservationItem").button().click();
            var item = $(".reservationItem:last");
            $(".inputDate", item).val(this.list[i].date);
            $(".inputFacility", item).selectmenu().val(this.list[i].facility).selectmenu("refresh", true);
            displayTimeSlots.call($(".inputFacility", item));
            $(".inputTime", item).val(this.list[i].time);
        }
    },
    loadFromStorage: function () {
        this.list = JSON.parse(localStorage.getItem(storageKeyList));
        this.show();
    },
    saveToStorage: function () {
        this.update();
        localStorage.setItem(storageKeyList, JSON.stringify(this.list));
    },
    getCurrentTargetFaclity: function () {
        return (this.list[this.currentIdx] || {}).facility;
    },
    getCurrentTargetDate: function () {
        return (this.list[this.currentIdx] || {}).date;
    },
    getCurrentTargetTimeSlots: function () {
        return (this.list[this.currentIdx] || {}).time;
    },
    moveToNextTarget: function () {
        if (null === this.currentIdx) {
            this.currentIdx = 0;
        } else {
            this.currentIdx++;
        }
        if (this.currentIdx <= this.list.length - 1) {
            return true;
        } else {
            return false;
        }
    }
};

var reservationTargetList = new ReservationTargetList();

var iframeUrl;
var timerId = null;
var isStarted = false;
var isContinueingBackToHomePage = false;

function init() {
    iframeUrl = $("iframe").attr("src");
    var urlParams = getUrlVars();
    for (var key in urlParams) {
        $("#" + key).each(function () {
            $(this).val(urlParams[key]);
        });
    }
    var calendarId = 0;
    $("#addReservationItem").button().click(function () {
        $("#reservationList").append(createReservationItem(calendarId++));
    }).click().click().click();
    $("#removeReservationItem").button().click(function () {
        $(".reservationItem:last").remove();
    });
    $("#save").button().click(function () {
        reservationInfo.saveToStorage();
        reservationTargetList.saveToStorage();
    });
    $("#load").button().click(function () {
        reservationInfo.loadFromStorage();
        reservationTargetList.loadFromStorage();
    });
    $("#start").button().click(function () {
        if (timerId) {
            clearTimeout(timerId);
            timerId = null;
        }
        if (isStarted) {
            stopBrowsing();
        } else {
            startBrowsing();
        }
    });
}

function startBrowsing() {
    reservationInfo.update();
    reservationTargetList.update();
    reservationTargetList.moveToNextTarget();
    if (reservationTargetList.getCurrentTargetFaclity()) {
        $("#start").text("Stop");
        $(".editable").prop("disabled", true);
        $(".selector").selectmenu().selectmenu("disable");
        isStarted = true;
        backToHomePage($("iframe").contents());
    }
}

function stopBrowsing() {
    $("#start").text("Start");
    $(".editable").prop("disabled", false);
    $(".selector").selectmenu().selectmenu("enable");
    isStarted = false;
}


function createReservationItem(idx) {
    var tableObj = $("<table class='reservationItem'><tr></tr></table>");

    var tdLeftObj = $("<td></td>");
    var datePicker = $("<input id='inputDate" + idx + "' class='editable inputDate' type='text' name='inputDate' style='width:7em;font-size:large;text-align:center' onclick='YahhoCal.render(this.id);' />"
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
        change: displayTimeSlots
    });
    return tableObj;
}

function displayTimeSlots() {
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

function load() {
    if (!isStarted) {
        console.log("Not started");
        return;
    }

    var contents = $("iframe").contents();
    var title = $("title", contents).text();
    console.log("読み込み完了 [" + title + "]");
    disableDialog(contents);

    if (isContinueingBackToHomePage) {
        timerId = setTimeout(backToHomePage, getSleepTime(), contents);
        return;
    }

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
    } else {
        var now = new Date();
        if (isInOutOfService(now)) {
            console.log("Out of service. " + now);
            var sleepTime = getTimeToStartService(now) + getSleepTime();
            timerId = setTimeout(backToHomePage, sleepTime, contents);
        } else if (" " == title) {
            timerId = setTimeout(backToHomePage, getSleepTime(), contents);
        } else {
            console.log("Return to initial url. " + iframeUrl);
            timerId = setTimeout(returnToInitialUrl, getSleepTime(), contents);
        }
    }

    function isInOutOfService(now) {
        return (0 <= now.getHours() && now.getHours() < 6);
    }

    function getTimeToStartService(now) {
        var currentTime = now.getTime();
        var wakeUpDate = now;
        if (6 <= now.getHours()) {
            wakeUpDate.setDate(now.getDate() + 1);
        }
        wakeUpDate.setHours(6);
        wakeUpDate.setMinutes(0);
        wakeUpDate.setSeconds(0);
        var sleepTime = wakeUpDate.getTime() - currentTime;
        console.log("Sleep until " + wakeUpDate + " (" + sleepTime + "[ms])");
        return sleepTime;
    }

    function returnToInitialUrl(contents) {
        var doc = contents[0];
        doc.location.href = iframeUrl;
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
    $("#userId", contents).val(reservationInfo.userId);
    $("#password", contents).val(reservationInfo.password);
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
    var facility = reservationTargetList.getCurrentTargetFaclity();
    dispatchClick(contents, $("a:contains('" + facility + "')", contents));
}

function selectDate(contents) {
    var targetDate = new Date(reservationTargetList.getCurrentTargetDate());
    var displayingDate = getDisplayingDate(contents);
    console.log("target : " + (new DateFormat("yyyy/M")).format(targetDate) + ", displaying : " + (new DateFormat("yyyy/M")).format(displayingDate));

    var targetYearMonth = targetDate.getYear() * 12 + targetDate.getMonth() + 1;
    var displayingYearMonth = displayingDate.getYear() * 12 + displayingDate.getMonth() + 1
    if (targetYearMonth < displayingYearMonth) {
        moveToPreviousMonth(contents);
        return;
    } else if (targetYearMonth > displayingYearMonth) {
        moveToNextMonth(contents);
        return;
    }

    var fmt = new DateFormat("yyyy, M, d");
    var targetDateLink = $("a[href*='" + fmt.format(targetDate) + "']", contents);
    if (targetDateLink.length) {
        dispatchClick(contents, targetDateLink);
    } else {
        console.log("There is no space. " + fmt.format(targetDate));
        moveToNextTargetAndBackToHomePage(contents);
    }

    function getDisplayingDate(contents) {
        var yearMonthString = $("strong:contains('" + new Date().getFullYear() + "年')", contents).text();
        console.log("yearMonthString : " + yearMonthString);
        var fmt = new DateFormat("yyyy年M月");
        return fmt.parse(yearMonthString);
    }

    function moveToPreviousMonth(contents) {
        dispatchClick(contents, $("img[alt='前の月']", contents).parent());
    }

    function moveToNextMonth(contents) {
        dispatchClick(contents, $("img[alt='次の月']", contents).parent());
    }
}

function selectTimeSlot(contents) {
    var isNotFound = true;
    $("img[alt='空き']", contents).each(function () {
        var a = $(this).parent();
        var hrefScriptString = a.attr("href");
        var startTime = Number(hrefScriptString.split(",")[5]);
        var endTime = Number(hrefScriptString.split(",")[7]);
        var targetTimeSlots = reservationTargetList.getCurrentTargetTimeSlots();
        for (var i = 0; i < targetTimeSlots.length; ++i) {
            if (startTime <= targetTimeSlots[i] && targetTimeSlots[i] < endTime) {
                isNotFound = false;
                dispatchClick(contents, a);
                return false;
            } else {
                console.log(targetTimeSlots[i] + " is not in [" + startTime + " - " + endTime + "]");
            }
        }
    });

    if (isNotFound) {
        console.log("There is no time slot. " + reservationTargetList.getCurrentTargetDate() + " " + JSON.stringify(reservationTargetList.getCurrentTargetTimeSlots()));
        moveToNextTargetAndBackToHomePage(contents);
    }
}

function selectStartTime(contents) {
    var targetTimeSlots = reservationTargetList.getCurrentTargetTimeSlots();
    for (var i = 0; i < targetTimeSlots.length; ++i) {
        var targetLink = $("a[href*='" + targetTimeSlots[i] + "']", contents);
        if (targetLink.length) {
            dispatchClick(contents, targetLink);
            return false;
        }
    }
    console.log("There is no time slot. " + reservationTargetList.getCurrentTargetDate() + " " + JSON.stringify(reservationTargetList.getCurrentTargetTimeSlots()));
    moveToNextTargetAndBackToHomePage(contents);
}

function doApply(contents) {
    dispatchClick(contents, $("img[alt='申込み']", contents).parent());
}

function confirmTOS(contents) {
    $("input#ruleFg_1", contents).click();
    dispatchClick(contents, $("img[alt='確認']", contents).parent());
}

function applyReservation(contents) {
    $("input[name='applyNum']", contents).val(reservationInfo.numOfPlayers);
    dispatchClick(contents, $("img[alt='申込み']", contents).parent());
}

function sendMail(contents) {
    dispatchClick(contents, $("img[alt='送信する']", contents).parent());
    stopBrowsing();
}

function moveToNextTargetAndBackToHomePage(contents) {
    if (reservationTargetList.moveToNextTarget()) {
        timerId = setTimeout(backToHomePage, getSleepTime(), contents);
    } else {
        reservationTargetList.currentIdx = 0;
        var retryIntervalInMin = reservationInfo.retryInterval;
        console.log("There is no empty. " + JSON.stringify(reservationTargetList.list));
        console.log("Sleep " + retryIntervalInMin + "[min] (" + (new DateFormat("yyyy/MM/dd HH:mm:ss")).format(new Date()) + ")");
        timerId = setTimeout(backToHomePage, retryIntervalInMin * 60 * 1000, contents);
    }
}

function backToHomePage(contents) {
    var title = $("title", contents).text();
    if (0 < title.indexOf("登録メニュー画面")) {
        isContinueingBackToHomePage = false;
        load();
        return;
    }

    var goToMenuButton = $("img[alt='メニューへ']", contents);
    if (goToMenuButton.length) {
        isContinueingBackToHomePage = false;
        dispatchClick(contents, goToMenuButton.parent());
        return;
    }

    var backButton = $("img[alt='もどる']", contents);
    if (backButton.length) {
        isContinueingBackToHomePage = true;
        dispatchClick(contents, backButton.parent());
        return;
    }

    var exitButton = $("img[alt='終了']", contents);
    if (exitButton.length) {
        isContinueingBackToHomePage = false;
        dispatchClick(contents, exitButton.parent());
        return;
    }

    load();
}

function dispatchClick(contents, a) {
    var doc = contents[0];
    if (a[0] && a[0].href) {
        doc.location.href = a[0].href;
    } else {
        alert("Invalid link !!! " + a);
    }
}

function getUrlVars() {
    if (window.location.href.indexOf("?") < 0) {
        return {};
    }
    var vars = {}, hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}