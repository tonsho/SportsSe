# -*- coding: utf-8 -*-

from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException, WebDriverException
import logging
import time
import random
import os
import dateutil.parser
import datetime
import urllib

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)


class ReservationTargetList(object):
    def __init__(self, rsv_list):
        self.current_idx = 0
        self.rsv_list = rsv_list

    def get_current_facility(self):
        return self.rsv_list[self.current_idx]['facility']

    def get_current_date(self):
        return dateutil.parser.parse(self.rsv_list[self.current_idx]['date']).date()

    def get_current_time_slots(self):
        return self.rsv_list[self.current_idx]['time']

    def move_to_next(self):
        if self.current_idx is None:
            self.current_idx = 0
            return True
        else:
            self.current_idx += 1
            if self.current_idx >= len(self.rsv_list):
                self.current_idx = None
                return False
            else:
                return True

    def reset(self):
        self.current_idx = 0

    def __str__(self):
        return str(self.rsv_list)


def start(rsv_info, rsv_list):
    try:
        brw = webdriver.Chrome()
    except WebDriverException:
        brw = webdriver.Firefox()
    brw.get('https://funayoyaku.city.funabashi.chiba.jp/web/')

    rsv_list = ReservationTargetList(rsv_list)

    loop(brw, rsv_info, rsv_list)


def loop(brw, rsv_info, rsv_list):
    state = {'rsv_info': rsv_info, 'is_backing_to_home_page': False}
    while True:
        time.sleep(get_sleep_sec())
        title = brw.title
        log.debug(title)
        disable_dialog(brw)

        if state['is_backing_to_home_page']:
            back_to_home_page(brw, state)
            continue

        if title.find(u'認証画面') > 0:
            login(brw, rsv_info)
        elif title.find(u'登録メニュー画面') > 0:
            click(brw, '//a[img[@alt="予約の申込み"]]')
        elif title.find(u'予約申込画面') > 0:
            click(brw, '//a[img[@alt="利用目的から"]]')
        elif title.find(u'利用目的選択画面') > 0:
            click(brw, '//a[contains(./text(),"テニス")]')
        elif title.find(u'館選択画面') > 0:
            select_facility(brw, rsv_list)
        elif title.find(u'施設空き状況１ヶ月表示画面') > 0:
            select_date(brw, rsv_list, state)
        elif title.find(u'施設空き状況画面時間貸し') > 0:
            select_time_slot(brw, rsv_list, state)
        elif title.find(u'時間貸し利用開始時間選択画面') > 0:
            select_start_time(brw, rsv_list, state)
        elif title.find(u'利用規約承認画面') > 0:
            click(brw, '//input[@id="ruleFg_1"]')
            click(brw, '//a[img[@alt="確認"]]')
        elif title.find(u'予約内容一覧画面') > 0:
            do_apply(brw, rsv_info['num_of_players'])
        elif title.find(u'施設予約一覧画面') > 0:
            click(brw, '//a[img[@alt="送信する"]]')
            break


def disable_dialog(brw):
    brw.execute_script('''
        (function(){
            window.confirm = function(message){
                console.log('confirm : ' + message);
                return true;
            }
        })();''')


def get_sleep_sec():
    return random.randint(500, 3000) / 1000.0


def login(brw, rsv_info):
    id = brw.find_element_by_id('userId')
    id.send_keys(rsv_info['id'])
    pw = brw.find_element_by_id('password')
    pw.send_keys(rsv_info['password'])
    click(brw, '//a[img[@alt="ログイン"]]')


def select_facility(brw, rsv_list):
    facility = rsv_list.get_current_facility()
    click(brw, '//a[contains(./text(),"' + facility + '")]')


def select_date(brw, rsv_list, state):
    rsv_date = rsv_list.get_current_date()
    disp_date = get_displaying_month(brw)
    log.debug('reserve: ' + rsv_date.strftime('%Y/%m') + ', displaying: ' + disp_date.strftime('%Y/%m'))

    rsv_month = rsv_date.year * 12 + rsv_date.month
    disp_month = disp_date.year * 12 + disp_date.month
    if disp_month > rsv_month:
        click(brw, '//a[img[@alt="前の月"]]')
        return
    elif rsv_month > disp_month:
        click(brw, '//a[img[@alt="次の月"]]')
        return

    try:
        rsv_link = brw.find_element_by_xpath('//a[contains(@href,"{}, {}, {})")]'.format(
                                             rsv_date.year, rsv_date.month, rsv_date.day
                                             ))
        rsv_link.click()
    except NoSuchElementException:
        log.info('There is no space. ' + str(rsv_date))
        move_to_next_rsv_and_back_to_home_page(brw, rsv_list, state)


def get_displaying_month(brw):
    displaying_ele = brw.find_element_by_xpath('//strong[contains(./text(),"年") and contains(./text(),"月")]')
    log.debug("displaying : " + displaying_ele.text)
    displaying_datetime = datetime.datetime.strptime(displaying_ele.text.encode('utf-8'), '%Y年%m月')
    return displaying_datetime.date()


def select_time_slot(brw, rsv_list, state):
    if brw.find_elements_by_xpath('//img[@alt="選択中"]'):
        click(brw, '//a[img[@alt="申込み"]]')
        return

    vacancies = brw.find_elements_by_xpath('//a[img[@alt="空き"]]')
    for a in vacancies:
        href_script = urllib.unquote(a.get_attribute('href'))
        start = int(href_script.split(',')[5])
        end = int(href_script.split(',')[7])
        targets = rsv_list.get_current_time_slots()
        for target in targets:
            if start <= int(target) < end:
                a.click()
                return
            else:
                log.debug(target + ' is not in [' + str(start) + ' - ' + str(end) + ']')

    log.debug('There is no time slot. ' + str(targets))
    move_to_next_rsv_and_back_to_home_page(brw, rsv_list, state)


def select_start_time(brw, rsv_list, state):
    targets = rsv_list.get_current_time_slots()
    for target in targets:
        try:
            rsv_link = brw.find_element_by_xpath('//a[contains(@href,"{}")]'.format(target))
            rsv_link.click()
            return
        except NoSuchElementException:
            pass

    log.debug('There is no time slot. ' + str(targets))
    move_to_next_rsv_and_back_to_home_page(brw, rsv_list, state)


def do_apply(brw, num_of_players):
    apply_num =  brw.find_element_by_name('applyNum')
    apply_num.send_keys(num_of_players)
    click(brw, '//a[img[@alt="申込み"]]')


def move_to_next_rsv_and_back_to_home_page(brw, rsv_list, state):
    if rsv_list.move_to_next():
        back_to_home_page(brw, state)

    else:
        log.info('There is no empty. ' + str(rsv_list))
        log.info('Sleep ' + str(state['rsv_info']['retry_interval_in_min']) + '[min]')
        time.sleep(state['rsv_info']['retry_interval_in_min'] * 60)
        rsv_list.reset()
        back_to_home_page(brw, state)


def back_to_home_page(brw, state):
    title = brw.title
    if title.find(u"登録メニュー画面") > 0:
        state['is_backing_to_home_page'] = False
        return

    try:
        go_to_menu = brw.find_element_by_xpath('//a[img[@alt="メニューへ"]]')
        state['is_backing_to_home_page'] = False
        go_to_menu.click()
        return
    except NoSuchElementException:
        pass

    try:
        back_button = brw.find_element_by_xpath('//a[img[@alt="もどる"]]')
        state['is_backing_to_home_page'] = True
        back_button.click()
        return
    except NoSuchElementException:
        pass

    try:
        exit_button = brw.find_element_by_xpath('//a[img[@alt="終了"]]')
        state['is_backing_to_home_page'] = False
        exit_button.click()
    except NoSuchElementException:
        pass

    log.error('No way to back to home.')


def click(brw, xpath):
    a = brw.find_element_by_xpath(xpath)
    a.click()


if __name__ == '__main__':
    import argparse
    import json
    parser = argparse.ArgumentParser()
    parser.add_argument('rsv_info', type=argparse.FileType('r'),
                        help='Reservation information file')
    parser.add_argument('rsv_list', type=argparse.FileType('r'),
                        help='Reservation target list file')
    args = parser.parse_args()

    rsv_info = json.load(args.rsv_info)
    rsv_info['num_of_players'] = rsv_info.get('retry_interval_in_min') or 3
    rsv_info['retry_interval_in_min'] = rsv_info.get('retry_interval_in_min') or 3
    rsv_list = json.load(args.rsv_list)
    start(rsv_info, rsv_list)
