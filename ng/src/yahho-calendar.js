/**
 *  Yahho Calendar - Japanized (and actually multilingual) Datepicker
 *  @see       http://0-oo.net/sbox/javascript/yahho-calendar
 *  @version   0.4.7 beta 1
 *  @copyright 2008-2012 dgbadmin@gmail.com
 *  @license   http://0-oo.net/pryn/MIT_license.txt (The MIT license)
 *
 *  See also
 *  @see http://developer.yahoo.com/yui/calendar/
 *  @see http://developer.yahoo.com/yui/docs/YAHOO.widget.Calendar.html
 */

var YahhoCal = {
    /**
     *  loadYUI()で読み込むYUIのURL
     *  @see http://developer.yahoo.com/yui/articles/hosting/
     *  @see http://code.google.com/intl/en/apis/libraries/devguide.html#yui
     */
    YUI_URL: {
        SERVER: location.protocol + "//ajax.googleapis.com/ajax/libs/yui/",
        VERSION: "2.9.0",
        DIR: "/build/"
    },

    /** カレンダーの見た目の設定 */
    CAL_STYLE: {
        //幅（IE6で縮まるのを防ぐ）
        "": "width: 13em",
        //日曜日
        "td.wd0 a": "background-color: #fcf",
        //土曜日
        "td.wd6 a": "background-color: #cff",
        //祝日（要 GCalendar Holidays）
        "td.holiday0 a": "background-color: #f9f",
        //今日（デフォルトではa要素の周り1pxに背景色が見えるので黒い枠線になる）
        "td.today": "",     //デフォルトは背景色:黒
        "td.today a": "",   //デフォルトは背景色:白（ただし土日祝日の背景色が優先）
        //選択された日
        "td.selected a": "background-color: #0f0",
        //選択可能な日付の範囲外の日（今日が黒くなるのを防ぐ）
        "td.previous": "background-color: #fff"
    },
    
    /** 地域（YUI_CAL_CONFIGのどれを使うかの指定） */
    locale: "ja",

    /** YUIカレンダー設定 */
    YUI_CAL_CONFIG: {
        //英語
        en: {},
        //日本語
        ja: {
            my_label_year_position: 1,
            my_label_year_suffix: "年 ",
            my_label_month_suffix: "月",
            months_long: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
            weekdays_short: ["日", "月", "火", "水", "木", "金", "土"]
        },
        //韓国語
        ko: {
            my_label_year_position: 1,
            my_label_year_suffix: "&#xb144; ",
            my_label_month_suffix: "&#xc6d4;",
            months_long: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
            weekdays_short: [
                "&#xc77c;", "&#xc6d4;", "&#xd654;", "&#xc218;", "&#xbaa9;",
                "&#xae08;", "&#xd1a0;"
            ]
        },
        //中国語（繁体字も簡体字も同じ）
        zh: {
            my_label_year_position: 1,
            my_label_year_suffix: "年 ",
            my_label_month_suffix: "月",
            months_long: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
            weekdays_short: ["日", "一", "二", "三", "四", "五", "六"]
        },
        //スペイン語
        es: {
            months_long: [
                "enero", "febrero", "marzo", "abril", "mayo", "junio",
                "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
            ],
            weekdays_short: ["do", "lu", "ma", "mi", "ju", "vi", "sa"]
        },
        //ポルトガル語
        pt: {
            months_long: [
                "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
            ],
            weekdays_short: ["Do", "Se", "Te", "Qu", "Qu", "Se", "Sa"]
        }
    },

    //テキストボックスでの日付フォーマット
    format: {
        delimiter: "/", //区切り文字
        padZero: false  //ゼロ埋めするかどうか
    },

    //祝日（またはその他のGoogleカレンダー）のツールチップ表示
    holidays: {
        //同じ日に複数の祝日がある場合の区切り文字（改行可能なのはIEのみ）
        delimiter: "，\n",
        //祝日名の前に付ける文字列（カレンダーごとに設定可能）
        prefixes: [""]
    },

    //ポップアップ表示かどうか
    isPopup: true
};
/**
 *  カレンダーを表示する
 *  @param  String  inputId     入力要素のid or 年の入力要素のid
 *  @param  String  monthId     (optional) 月の入力要素のid
 *  @param  String  dateId      (optional) 日の入力要素のid
 *  @param  String  insertId    (optional) カレンダーを表示したい場所の要素のid
 *  @return Boolean カレンダーの表示ができたかどうか
 */
YahhoCal.render = function(inputId, monthId, dateId, insertId) {
    if (!window.YAHOO || !YAHOO.widget.Calendar) {  //YUIを読み込んでいない場合
        return false;
    }

    this._currentId = (insertId = (insertId || inputId));   //表示場所を特定するID

    //アダプタを取得
    this._adapters = (this._adapters || []);

    if (!this._adapters[insertId]) {
        this._adapters[insertId] = this._createAdapter(inputId, monthId, dateId);
    }

    var cal = this._cal;

    if (cal) {  //再表示の場合
        cal.hide();
        YAHOO.util.Dom.insertBefore(this._place, insertId);
        cal.show();
    } else {    //初めて表示する場合
        this._setStyle();
        cal = (this._cal = this._createCalendar(insertId));
    }

    this._place.focus();    //IEでテキストボックスのマウスカーソルが見えるのを回避

    //入力済みの日付を取得
    var val = this._adapters[insertId].getDate();
    var y = val[0], m = val[1], d = val[2];
    var shown = new Date(y, m - 1, d);

    var pagedate = "", selected = "";

    if ((shown.getFullYear() == y && shown.getMonth() + 1 == m && shown.getDate() == d)) {
        //日付として正しい場合
        pagedate = m + "/" + y;
        selected = m + "/" + d + "/" + y;
    } else {
        shown = new Date();
    }

    cal.cfg.setProperty("pagedate", pagedate);  //表示する年月
    cal.cfg.setProperty("selected", selected);  //選択状態の日付

    cal.render();

    this._showHolidays(shown);

    //カレンダーの表示が終わってからクリックイベントの捕捉を始める
    setTimeout(function() {
        YAHOO.util.Event.addListener(document, "click", YahhoCal.clickListener);
    }, 1);

    return true;
};
/**
 *  入力要素とカレンダーとのポリモフィズムなアダプタを生成する
 *  @param  String  inputId 入力要素のid or 年の入力要素のid
 *  @param  String  monthId 月の入力要素のid
 *  @param  String  dateId  日の入力要素のid
 *  @return Object  アダプタ
 */
YahhoCal._createAdapter = function(inputId, monthId, dateId) {
    var adapter = {};

    if (!monthId) {     //テキストボックス1つの場合
        var input = document.getElementById(inputId);
        var delimiter = YahhoCal.format.delimiter;

        adapter.getDate = function() {
            if (delimiter) {
                return input.value.split(delimiter);
            } else {
                var val = input.value;
                return [val.substr(0, 4), val.substr(4, 2), val.substr(6)];
            }
        };

        adapter.setDate = function(y, m, d) {
            if (YahhoCal.format.padZero) {
                m = ("0" + m).slice(-2);
                d = ("0" + d).slice(-2);
            }

            input.value = y + delimiter + m + delimiter + d;
        };

        return adapter;
    }

    //年・月・日が分かれている場合
    var ey = document.getElementById(inputId);
    var em = document.getElementById(monthId);
    var ed = document.getElementById(dateId);

    if (ey.tagName == "INPUT") {    //テキストボックスの場合
        adapter.getDate = function() { return [ey.value, em.value, ed.value]; };
        adapter.setDate = function(y, m, d) { ey.value = y; em.value = m; ed.value = d; };

        return adapter;
    }

    //選択リストの場合
    var getNumber = function(opt) { return (opt.value || opt.text).replace(/^0+/, ""); };
    var get = function(sel) { return getNumber(sel.options[sel.selectedIndex]); };
    var set = function(sel, value) {
        for (var i = 0, len = sel.length; i < len; i++) {
            if (getNumber(sel.options[i]) == value) {
                sel.options[i].selected = true;
                return;
            }
        }
    };

    adapter.getDate = function() { return [get(ey), get(em), get(ed)]; };
    adapter.setDate = function(y, m, d) { set(ey, y); set(em, m); set(ed, d); };

    return adapter;
};
/**
 *  styleを設定する
 */
YahhoCal._setStyle = function() {
    var css = "";

    for (var target in this.CAL_STYLE) {
        css += ".yui-skin-sam .yui-calcontainer .yui-calendar " + target;
        css += "{" + this.CAL_STYLE[target] + "} ";
    }

    var tmp = document.createElement("div");
    tmp.innerHTML = 'dummy<style type="text/css">' + css + "</style>";

    document.getElementsByTagName("head")[0].appendChild(tmp.lastChild);
};
/**
 *  カレンダーを生成する
 *  @param  String  insertId
 *  @return Calendar
 */
YahhoCal._createCalendar = function(insertId) {
    var yUtil = YAHOO.util, yDom = yUtil.Dom;   //ショートカット

    //YUI skinを適用
    yDom.addClass(document.body, "yui-skin-sam");

    //カレンダーの場所を作る
    var place = (this._place = document.createElement("div"));

    if (this.isPopup) {
        yDom.setStyle(place, "position", "absolute");
        yDom.setStyle(place, "z-index", 1);
    }

    yDom.insertBefore(place, insertId);

    //カレンダー設定
    var config = this.YUI_CAL_CONFIG[this.locale];
    config.close = this.isPopup;
    config.hide_blank_weeks = true;

    //カレンダー生成
    var cal = new YAHOO.widget.Calendar(place, config);

    //日付を選択された時のイベント
    cal.selectEvent.subscribe(function(eventName, selectedDate) {
        var date = selectedDate[0][0];
        YahhoCal._adapters[YahhoCal._currentId].setDate(date[0], date[1], date[2]);

        if (YahhoCal.isPopup) {
            cal.hide();
        }
    });

    //月を移動した時のイベント
    cal.changePageEvent.subscribe(function() {
        YahhoCal._showHolidays(cal.cfg.getProperty("pagedate"));
    });

    //閉じた時のイベント
    cal.hideEvent.subscribe(function() {
        yUtil.Event.removeListener(document, "click", YahhoCal.clickListener);
    });

    //Escキーでも閉じる
    (new yUtil.KeyListener(document, { keys: 27 }, function() { cal.hide(); })).enable();

    return cal;
};
/**
 *  祝日を表示する（要GCalendar Holidays）
 *  @param  Date    target  表示対象の年月
 *  @see    http://0-oo.net/sbox/javascript/google-calendar-holidays
 */
YahhoCal._showHolidays = function(target) {
    if (!window.GCalHolidays) {     //GCalendar Holidaysを読み込んでいない場合
        return;
    }

    //CallbackでsetHolidays()が呼ばれる
    GCalHolidays.get(this.setHolidays, target.getFullYear(), target.getMonth() + 1);
};
/**
 *  祝日表示を設定する
 *  @param  Array   holidays    祝日情報
 *  @param  Number  calIdIndex  GCalHolidays.userIds内の何番目かを示す数
 */
YahhoCal.setHolidays = function(holidays, calIdIndex) {
    if (holidays.length === 0) {
        return;
    }

    var getEBCN = YAHOO.util.Dom.getElementsByClassName;    //ショートカット
    
    //取得した年月をまだ表示しているかチェック
    var first = holidays[0];
    var table = getEBCN("y" + first.year, "table", this._place)[0];
    var tbody = getEBCN("m" + first.month, "tbody", table)[0];

    if (!table || !tbody) {
        return;
    }

    //祝日をツールチップで表示
    var prefix = (YahhoCal.holidays.prefixes[calIdIndex] || "");

    for (var i = 0, len = holidays.length; i < len; i++) {
        var td = getEBCN("d" + holidays[i].date, "td", tbody)[0];
        YAHOO.util.Dom.addClass(td, "holiday" + calIdIndex);

        if (td.title) {
            td.title += YahhoCal.holidays.delimiter;
        }

        td.title += prefix + holidays[i].title;
    }
};
/**
 *  カレンダーの外をクリックされたらカレンダーを閉じる
 *  @param  Object  clickedPoint    クリックされた位置
 */
YahhoCal.clickListener = function(clickedPoint) {
    if (!YahhoCal.isPopup) {
        return;
    }

    var xy = YAHOO.util.Event.getXY(clickedPoint);
    var x = xy[0], y = xy[1];
    var r = YAHOO.util.Dom.getRegion(YahhoCal._cal.containerId);

    if (x < r.left || x > r.right || y < r.top || y > r.bottom) {
        YahhoCal._cal.hide();
    }
};
/**
 *  必要なYUIのJavaScriptとCSSを読み込む
 *  @param  String      yuiBase     (optional) YUIのベースとなるURL
 *  @param  Function    callback    (optional) 読み込み完了時に実行する関数
 *  @see http://developer.yahoo.com/yui/yuiloader/
 */
YahhoCal.loadYUI = function(yuiBase, callback) {
    yuiBase = yuiBase || this.YUI_URL.SERVER + this.YUI_URL.VERSION + this.YUI_URL.DIR;

    //YUI Loaderをload
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = yuiBase + "yuiloader-dom-event/yuiloader-dom-event.js";
    document.getElementsByTagName("head")[0].appendChild(script);

    var limit = 5000, interval = 50, time = 0;

    var intervalId = setInterval(function() {
        if (window.YAHOO) { //YUI Loaderがloadされたら
            clearInterval(intervalId);

            (new YAHOO.util.YUILoader({ //YUI Calendarをload
                base: yuiBase,
                require: ["calendar"],
                onSuccess: callback || null
            })).insert();
        } else if ((time += interval) > limit) {    //タイムアウト
            clearInterval(intervalId);
        }
    }, interval);
};
/**
 *  週の初めを月曜日にする
 */
YahhoCal.setMondayAs1st = function() {
    this.YUI_CAL_CONFIG[this.locale].start_weekday = 1;
};
/**
 *  選択可能な最初の日を指定する
 *  @param  Number  y   西暦4桁
 *  @param  Number  m   1～12月
 *  @param  Number  d
 */
YahhoCal.setMinDate = function(y, m, d) {
    var date = m + "/" + d + "/" + y;

    if (this._cal) {
        this._cal.configMinDate(null, [date]);
    } else {
        this.YUI_CAL_CONFIG[this.locale].mindate = date;
    }
};
/**
 *  選択可能な最後の日を指定する
 *  @param  Number  y   西暦4桁
 *  @param  Number  m   1～12月
 *  @param  Number  d
 */
YahhoCal.setMaxDate = function(y, m, d) {
    var date = m + "/" + d + "/" + y;

    if (this._cal) {
        this._cal.configMaxDate(null, [date]);
    } else {
        this.YUI_CAL_CONFIG[this.locale].maxdate = date;
    }
};
