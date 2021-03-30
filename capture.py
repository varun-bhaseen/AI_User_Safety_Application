import os
from subprocess import Popen, PIPE
from selenium import webdriver

abspath = lambda *p: os.path.abspath(os.path.join(*p))
ROOT = abspath(os.path.dirname(__file__))
DRIVER = 'C:\\Users\\bhase\\Downloads\\chromedriver.exe'

def execute_command(command):
    result = Popen(command, shell=True, stdout=PIPE).stdout.read()
    if len(result) > 0 and not result.isspace():
        raise Exception(result)


def do_screen_capturing(url, screen_path, width, height):
    print ("Capturing screen..")
    driver = webdriver.Chrome(DRIVER)
    # it save service log file in same directory
    # if you want to have log file stored else where
    # initialize the webdriver.PhantomJS() as
    # driver = webdriver.PhantomJS(service_log_path='/var/log/phantomjs/ghostdriver.log')
    # to maximize the browser window
    
    if width and height: 
        driver.set_window_size(width, height)
    driver.get(url)
    driver.maximize_window()
    driver.set_script_timeout(30)
    # driver.execute_script('document.body.style.zoom = "50%"')
    # driver.execute_script("window.scrollTo(0, document.body.scrollHeight)")
    el = driver.find_element_by_tag_name('body')
    el.screenshot(screen_path)
    driver.close()

def do_crop(params):
    print ("Croping captured image..")
    command = [
        'convert',
        params['screen_path'],
        '-crop', '%sx%s+0+0' % (params['width'], params['height']),
        params['crop_path']
    ]
    execute_command(' '.join(command))


def do_thumbnail(params):
    print ("Generating thumbnail from croped captured image..")
    command = [
        'convert',
        params['crop_path'],
        '-filter', 'Lanczos',
        '-thumbnail', '%sx%s' % (params['width'], params['height']),
        params['thumbnail_path']
    ]
    execute_command(' '.join(command))


def get_screen_shot(**kwargs):
    url = kwargs['url']
    width = int(kwargs.get('width', 1024)) # screen width to capture
    height = int(kwargs.get('height', 720)) # screen height to capture
    filename = kwargs.get('filename', 'screen.png') # file name e.g. screen.png
    path = kwargs.get('path', ROOT) # directory path to store screen

    crop = kwargs.get('crop', False) # crop the captured screen
    crop_width = int(kwargs.get('crop_width', width)) # the width of crop screen
    crop_height = int(kwargs.get('crop_height', height)) # the height of crop screen
    crop_replace = kwargs.get('crop_replace', False) # does crop image replace original screen capture?

    thumbnail = kwargs.get('thumbnail', False) # generate thumbnail from screen, requires crop=True
    thumbnail_width = int(kwargs.get('thumbnail_width', width)) # the width of thumbnail
    thumbnail_height = int(kwargs.get('thumbnail_height', height)) # the height of thumbnail
    thumbnail_replace = kwargs.get('thumbnail_replace', False) # does thumbnail image replace crop image?

    screen_path = abspath(path, filename)
    crop_path = thumbnail_path = screen_path

    if thumbnail and not crop:
        raise Exception('Thumnail generation requires crop image, set crop=True')

    do_screen_capturing(url, screen_path, width, height)

    if crop:
        if not crop_replace:
            crop_path = abspath(path, 'crop_'+filename)
        params = {
            'width': crop_width, 'height': crop_height,
            'crop_path': crop_path, 'screen_path': screen_path}
        do_crop(params)

        if thumbnail:
            if not thumbnail_replace:
                thumbnail_path = abspath(path, 'thumbnail_'+filename)
            params = {
                'width': thumbnail_width, 'height': thumbnail_height,
                'thumbnail_path': thumbnail_path, 'crop_path': crop_path}
            do_thumbnail(params)
    return screen_path, crop_path, thumbnail_path


if __name__ == '__main__':
    '''
        Requirements:
        Install NodeJS
        Using Node's package manager install phantomjs: npm -g install phantomjs
        install selenium (in your virtualenv, if you are using that)
        install imageMagick
        add phantomjs to system path (on windows)
    '''
    
    with open("C:\\Users\\bhase\\Downloads\\OneDrive - sjsu.edu\\Master Project\\Dataset\\Amazon Screenshots\\Amazon_URL_List.txt", "r") as url_list:
        url = url_list.readlines()
        i = 0
        for line in url:
            if line:
                i += 1
                screen_path, crop_path, thumbnail_path = get_screen_shot(
            url=line, filename=f'Amazon{i}.png',
            crop=False, crop_replace=False,
            thumbnail=False, thumbnail_replace=False,
            thumbnail_width=200, thumbnail_height=150,
            )

    
    # url = 'https://web.archive.org/web/20040112132207/http://www.amazon.com/'
    # screen_path, crop_path, thumbnail_path = get_screen_shot(
    #     url=url, filename='sof.png',
    #     crop=True, crop_replace=False,
    #     thumbnail=True, thumbnail_replace=False,
    #     thumbnail_width=200, thumbnail_height=150,
    # )