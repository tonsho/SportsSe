var defaultCheckedTime = ["1030", "1230"];
var defaultDate = new Date();
defaultDate.setDate(1);
defaultDate.setMonth(defaultDate.getMonth() + 1);
var defaultDateString = (new DateFormat("yyyy/MM/dd")).format(defaultDate);

var facilities = {
    "法典公園（グラスポ）": ["830", "1030", "1230", "1430", "1630"],
    "運動公園": ["700", "900", "1100", "1300", "1500", "1700"]
};

function getDefaultFacility() {
    for (var facility in facilities) {
        return facility;
    }
}

var storageKeyInfo = "keyInfo",
    storageKeyList = "keyList";

function ReservationInfo() {
    this.userId =  null;
    this.password = null;
    this.numOfPlayers =  null;
    this.retryInterval = null;
}

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
        this.currentIdx = null;
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

function init() {
    var iframeUrl = $("iframe").attr("src");
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
        reservationTargetList.saveToStorage();
    });
    $("#load").button().click(function () {
        reservationTargetList.loadFromStorage();
    });
}

function createReservationItem(idx) {
    var tableObj = $("<table class='reservationItem'><tr></tr></table>");

    var tdLeftObj = $("<td></td>");
    var datePicker = $("<input id='inputDate" + idx + "' class='editable inputDate' type='text' name='inputDate' style='width:7em;font-size:large;text-align:center' onclick='YahhoCal.render(this.id);' />"
            + "<div id='calendar" + idx + "' ></div>");
    $(datePicker[0]).val(defaultDateString);
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
    }).val(getDefaultFacility()).selectmenu("refresh", true);
    displayTimeSlots.call(facilityPicker);
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
        var checked = null;
        if (0 <= defaultCheckedTime.indexOf(timeSlots[i])) {
            checked = " checked='checked' ";
        }
        var timeSlotObj = $("<td><input type='checkbox' class='editable inputTime' " + checked + " value='" + timeSlots[i] + "' /> " + timeSlots[i] + "</td>");
        $("tr", $(this).parent()).append(timeSlotObj);
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