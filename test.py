import requests


def getCoords(advertID):
    url = 'https://www.autotrader.co.uk/json/fpa/initial/'+str(advertID)
    req = requests.get(url)
    data = req.json()
    data =  data['seller']['longitude'].split(',')
    data.reverse()
    return(data) # Returns as [longitude,latitude]

print(getCoords(201812063046726))
