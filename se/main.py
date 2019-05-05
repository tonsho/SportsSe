# -*- coding: utf-8 -*-

import json
import logging
import os
import random
import time
import urllib
import urllib.parse
import urllib.request
from datetime import datetime
from datetime import timedelta

import dateutil.parser
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException

DEFAULT_RETRY_MINUTES = 30
DEFAULT_NUM_OF_PLAYERS = 3
DEFAULT_RETRY_INTERVAL_IN_MIN = 3

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


class ReservationTargetList(object):
    def __init__(self, info):
        self.current_idx = 0
        self.target = self._trim_current_target(info.get('target'))
        self.preferred = info.get('preferred', [])

    @staticmethod
    def _trim_current_target(target):
        cancel_limit = datetime.now().date() + timedelta(days=3)
        reservable_limit = make_datetime(datetime.now().year, datetime.now().month + 1 + 1, 0).date()
        current_target = []
        for t in target:
            target_date = dateutil.parser.parse(t['date']).date()
            if cancel_limit < target_date <= reservable_limit:
                current_target.append(t)
        return current_target

    def get_current_facility(self):
        return self.target[self.current_idx]['facility']

    def get_preferred_list(self):
        facility = self.get_current_facility()
        for p in self.preferred:
            if p['facility'] == facility:
                return p['place']

    def get_current_date(self):
        return dateutil.parser.parse(self.target[self.current_idx]['date']).date()

    def get_current_time_slots(self):
        return self.target[self.current_idx]['time']

    def move_to_next(self):
        if self.current_idx is None:
            self.current_idx = 0
            return True
        else:
            self.current_idx += 1
            if self.current_idx >= len(self.target):
                self.current_idx = None
                return False
            else:
                return True

    def reset(self):
        self.current_idx = 0

    def __str__(self):
        return json.dumps(self.target)


def make_datetime(year, month, day, hour=0, minute=0, sec=0):
    return datetime.fromtimestamp(time.mktime((year, month, day, hour, minute, sec, 0, 0, 0)))


def start(conf, target_inf):
    # Check target date
    rsv_list = ReservationTargetList(target_inf)

    today = datetime.now().date()
    target_date = rsv_list.get_current_date()
    start_date = make_datetime(target_date.year, target_date.month - 1, 10).date()
    if today <= start_date:
        start_time = time.mktime(make_datetime(start_date.year, start_date.month, start_date.day, 6).timetuple())
        now = time.time()
        if now < start_time:
            log.info('Sleep until {} ({}[sec])'.format(datetime.fromtimestamp(start_time), start_time - now))
            time.sleep(start_time - now)

    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    brw = webdriver.Chrome(options=options)
    brw.get(conf['site_url'])

    loop(brw, conf, rsv_list)


def loop(brw, conf, rsv_list):
    retry_minutes = conf['retry_minutes']
    end_time = time.time() + retry_minutes * 60
    log.info('Retry until {}'.format(datetime.fromtimestamp(end_time)))

    state = {'conf': conf, 'is_backing_to_home_page': False}
    while time.time() < end_time:
        time.sleep(get_sleep_sec())
        title = brw.title
        log.info(title)
        disable_dialog(brw)

        if state['is_backing_to_home_page']:
            back_to_home_page(brw, state)
            continue

        if title.find('認証画面') > 0:
            login(brw, conf)
        elif title.find('登録メニュー画面') > 0:
            click(brw, '//a[img[@alt="予約の申込み"]]')
        elif title.find('予約申込画面') > 0:
            click(brw, '//a[img[@alt="利用目的から"]]')
        elif title.find('利用目的選択画面') > 0:
            click(brw, '//a[contains(./text(),"テニス")]')
        elif title.find('館選択画面') > 0:
            select_facility(brw, rsv_list)
        elif title.find('施設空き状況１ヶ月表示画面') > 0:
            select_date(brw, rsv_list, state)
        elif title.find('施設空き状況画面時間貸し') > 0:
            select_time_slot(brw, rsv_list, state)
        elif title.find('時間貸し利用開始時間選択画面') > 0:
            select_start_time(brw, rsv_list, state)
        elif title.find('利用規約承認画面') > 0:
            click(brw, '//input[@id="ruleFg_1"]')
            click(brw, '//a[img[@alt="確認"]]')
        elif title.find('予約内容一覧画面') > 0:
            do_apply(brw, conf['num_of_players'])
        elif title.find('施設予約一覧画面') > 0:
            click(brw, '//a[img[@alt="送信する"]]')
            break

    log.info('Retry finished')


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


def login(brw, conf):
    user_id = brw.find_element_by_id('userId')
    user_id.send_keys(conf['user_id'])
    pw = brw.find_element_by_id('password')
    pw.send_keys(conf['password'])
    click(brw, '//a[img[@alt="ログイン"]]')


def select_facility(brw, rsv_list):
    facility = rsv_list.get_current_facility()
    click(brw, '//a[contains(./text(),"' + facility + '")]')


def select_date(brw, rsv_list, state):
    rsv_date = rsv_list.get_current_date()
    disp_date = get_displaying_month(brw)
    log.info('reserve: ' + rsv_date.strftime('%Y/%m') + ', displaying: ' + disp_date.strftime('%Y/%m'))

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
    log.info("displaying : " + displaying_ele.text)
    displaying_datetime = datetime.strptime(displaying_ele.text, '%Y年%m月')
    return displaying_datetime.date()


def select_time_slot(brw, rsv_list, state):
    if brw.find_elements_by_xpath('//img[@alt="選択中"]'):
        click(brw, '//a[img[@alt="申込み"]]')
        return

    vacancies = brw.find_elements_by_xpath('//a[img[@alt="空き"]]')
    vacancies = sort_by_preferred(vacancies, rsv_list.get_preferred_list())
    target_slots = rsv_list.get_current_time_slots()
    for a in vacancies:
        href_script = urllib.parse.unquote(a.get_attribute('href'))
        start_slot = int(href_script.split(',')[5])
        end_slot = int(href_script.split(',')[7])
        for slot in target_slots:
            if start_slot <= int(slot) < end_slot:
                a.click()
                return
            else:
                log.info(slot + ' is not in [' + str(start_slot) + ' - ' + str(end_slot) + ']')

    log.info('There is no time slot. ' + str(target_slots))
    move_to_next_rsv_and_back_to_home_page(brw, rsv_list, state)


def sort_by_preferred(vacancies, preferred_list, preferred_only=False):
    if preferred_list is None:
        return vacancies

    ret = []
    for preferred in preferred_list:
        for a in vacancies:
            pp = a.find_element_by_xpath('../..')
            if pp.text == preferred:
                ret.append(a)
    if preferred_only:
        return ret

    # preferredではない残り
    for a in vacancies:
        if a not in ret:
            ret.append(a)

    return ret


def select_start_time(brw, rsv_list, state):
    targets = rsv_list.get_current_time_slots()
    for target in targets:
        try:
            rsv_link = brw.find_element_by_xpath('//a[contains(@href,"{}")]'.format(target))
            rsv_link.click()
            return
        except NoSuchElementException:
            pass

    log.info('There is no time slot. ' + str(targets))
    move_to_next_rsv_and_back_to_home_page(brw, rsv_list, state)


def do_apply(brw, num_of_players):
    apply_num = brw.find_element_by_name('applyNum')
    apply_num.send_keys(num_of_players)
    click(brw, '//a[img[@alt="申込み"]]')


def move_to_next_rsv_and_back_to_home_page(brw, rsv_list, state):
    if rsv_list.move_to_next():
        back_to_home_page(brw, state)

    else:
        log.info('There is no empty. ' + str(rsv_list))
        log.info('Sleep ' + str(state['conf']['retry_interval_in_min']) + '[min]')
        time.sleep(state['conf']['retry_interval_in_min'] * 60)
        rsv_list.reset()
        back_to_home_page(brw, state)


def back_to_home_page(brw, state):
    title = brw.title
    if title.find('登録メニュー画面') > 0:
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

    parser = argparse.ArgumentParser()
    parser.add_argument('--config', type=argparse.FileType('r', encoding='utf-8'),
                        help='Reservation config file')
    parser.add_argument('--target', type=argparse.FileType('r', encoding='utf-8'),
                        help='Reservation target list file')
    args = parser.parse_args()

    # config
    config = {}
    required_keys = {'user_id', 'password', 'site_url'}
    if args.config:
        config = json.load(args.config)
    if 'USER_ID' in os.environ:
        config['user_id'] = os.environ['USER_ID']
    if 'PASSWORD' in os.environ:
        config['password'] = os.environ['PASSWORD']
    if 'SITE_URL' in os.environ:
        config['site_url'] = os.environ['SITE_URL']
    if not set(config.keys()).issuperset(required_keys):
        log.error('Missing required parameters. ' + str(required_keys - set(config.keys())))
        exit(-1)

    if 'NUM_OF_PLAYERS' in os.environ:
        config['num_of_players'] = int(os.environ['NUM_OF_PLAYERS'])
    else:
        config['num_of_players'] = config.get('num_of_players', DEFAULT_NUM_OF_PLAYERS)
    if 'RETRY_MINUTES' in os.environ:
        config['retry_minutes'] = int(os.environ['RETRY_MINUTES'])
    else:
        config['retry_minutes'] = config.get('retry_minutes', DEFAULT_RETRY_MINUTES)
    if 'RETRY_INTERVAL_IN_MIN' in os.environ:
        config['retry_interval_in_min'] = int(os.environ['RETRY_INTERVAL_IN_MIN'])
    else:
        config['retry_interval_in_min'] = config.get('retry_interval_in_min', DEFAULT_RETRY_INTERVAL_IN_MIN)

    # target_info
    target_info = {}
    if args.target:
        target_info = json.load(args.target)
    if 'TARGET_INFO_URL' in os.environ:
        req = urllib.request.Request(os.environ['TARGET_INFO_URL'])
        with urllib.request.urlopen(req) as res:
            target_info = json.load(res)

    start(config, target_info)
