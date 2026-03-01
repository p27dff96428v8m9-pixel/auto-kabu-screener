import urllib.request
import re
import json

try:
    url = "https://docs.google.com/spreadsheets/d/1C8UzXEeRYIuw4mMoYEB1Di3WdRyIhRsOmL0LVvPGNiQ/htmlview"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    matches = re.findall(r'name\\x22:\\x22(.*?)\\x22,\\x22gid\\x22:\\x22(\d+)\\x22', html)
    if matches:
        print("Sheets found:", matches)
    else:
        print("No matches. Trying alternate regex.")
        matches2 = re.findall(r'gid=(\d+)', html)
        print("Gids found:", set(matches2))
except Exception as e:
    print('Error:', e)
