from bs4 import BeautifulSoup
from urllib.request import Request, urlopen
import time
import re
from html.parser import HTMLParser
import json
import pymysql

url = "https://www.autotrader.co.uk/car-search?sort=sponsored&radius=90&postcode=b904uh&onesearchad=Used&onesearchad=Nearly%20New&onesearchad=New&make=BMW&model=M2"

def getTotalPages(pageUrl):
    req = Request(pageUrl, headers={'User-Agent': 'Mozilla/5.0'})
    page = urlopen(req)
    soup = BeautifulSoup(page,"html.parser")
    data = soup.find('var',attrs={ "id" : "fpa-navigation"})
    jsonData = json.loads(data['fpa-navigation'])
    return jsonData['totalPages']

def pageScraper(pageUrl):
    # Request stuff
    req = Request(pageUrl, headers={'User-Agent': 'Mozilla/5.0'})
    page = urlopen(req)
    soup = BeautifulSoup(page,"html.parser")
    data = soup.findAll('h2',attrs={ "class" : "listing-title title-wrap"})
    urls = []
    for each in data:
        anchors = each.findAll('a')
        for a in anchors:
            try:
                m = re.search('(?<=/classified/advert/)(.*)(?=[?])', a['href'])
                #print(m.group(0))
                #print(a.text)
                #print(a['href'])
                if(m.group(0)[:3] != 'new'):
                    url = {
                            "advertID": m.group(0),
                            "advertName": a.text,
                            "advertURL": a['href']
                            }
                    urls.append(url)
                #print('_________')
            except:
                print('Skipping New Car Ad')
                print('________')
    return urls

def cleanUrl(url):
    m = re.search('(.*)(?=&page)', url)
    try:#
        return m.group(0)
    except:
        return url
    
def scrapeSearchParameter(url):
    url = cleanUrl(url)
    totalPages = getTotalPages(url)
    advertsData = []
    for i in range(1, totalPages+1):
        advertsData = advertsData + (pageScraper(url + "&page=" + str(i)))
    print('Found '+str(len(advertsData))+' new adverts within the filter parameters')
    return advertsData

def updateWatchlistDB(data):
    mydb = pymysql.connect(host='localhost',
    user='root',
    db='carswatchlist')
    cursor = mydb.cursor()

    for row in data:
        cursor.execute("INSERT INTO watchlist(advertID, advertName, advertURL) VALUES (%s,%s,%s) ON DUPLICATE KEY UPDATE advertID = %s, advertName = %s, advertURL = %s", (int(row['advertID']), row['advertName'], row['advertURL'], int(row['advertID']), row['advertName'], row['advertURL']))
        
    mydb.commit()
    cursor.close()

if __name__ == "__main__":
    updateWatchlistDB(scrapeSearchParameter(url))
