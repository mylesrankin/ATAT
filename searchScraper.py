from bs4 import BeautifulSoup
from urllib.request import Request, urlopen
import time
import re
from html.parser import HTMLParser
import json
import pymysql
import requests
import hashlib
import sys


#url = "https://www.autotrader.co.uk/car-search?sort=sponsored&radius=90&postcode=b904uh&onesearchad=Used&onesearchad=Nearly%20New&onesearchad=New&make=BMW&model=M2"
url = sys.argv[1]

def getTotalPages(pageUrl):
    req = Request(pageUrl, headers={'User-Agent': 'Mozilla/5.0'})
    page = urlopen(req)
    soup = BeautifulSoup(page,"html.parser")
    data = soup.find('var',attrs={ "id" : "fpa-navigation"})
    jsonData = json.loads(data['fpa-navigation'])
    return jsonData['totalPages']

def getCoords(advertID):
    url = 'https://www.autotrader.co.uk/json/fpa/initial/'+str(advertID)
    req = requests.get(url)
    data = req.json()
    data =  data['seller']['longitude'].split(',')
    data.reverse()
    return(data) # Returns as [longitude,latitude]

def pageScraper(pageUrl, globUrl):
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
                    loc = getCoords(m.group(0))
                    url = {
                            "advertID": m.group(0),
                            "advertName": a.text,
                            "advertURL": a['href'],
                            "searchHash": globUrl,
                            "longitude": loc[0],
                            "latitude": loc[1]
                            }
                    urls.append(url)
                #print(url)
                #print('_________')
            except:
                #print('Skipping New Car Ad')
                #print('________')
                pass
    return urls

def cleanUrl(url):
    m = re.search('(.*)(?=&page)', url)
    try:#
        return m.group(0)
    except:
        return url
    
def scrapeSearchParameter(url):
    url = cleanUrl(url)
    globUrl = url
    totalPages = getTotalPages(url)
    advertsData = []
    for i in range(1, totalPages+1):
        advertsData = advertsData + (pageScraper(url + "&page=" + str(i), globUrl))
    #print('Found '+str(len(advertsData))+' new adverts within the filter parameters')
    return advertsData

def updateWatchlistDB(data):
    try:
        mydb = pymysql.connect(host='localhost',
        user='root',
        db='carswatchlist')
        cursor = mydb.cursor()
        for row in data:
            cursor.execute("INSERT INTO watchlist(advertID, advertName, advertURL, searchHash, longitude, latitude) VALUES (%s,%s,%s,%s,%s,%s) ON DUPLICATE KEY UPDATE advertID = %s, advertName = %s, advertURL = %s, searchHash = %s, longitude = %s, latitude = %s", (int(row['advertID']), row['advertName'], row['advertURL'], row['searchHash'], float(row['longitude']), float(row['latitude']),int(row['advertID']), row['advertName'], row['advertURL'],row['searchHash'], float(row['longitude']), float(row['latitude'])))                    
        mydb.commit()
        cursor.close()
        print('true')
    except:
        print('false')

if __name__ == "__main__":
    updateWatchlistDB(scrapeSearchParameter(url))

