
from celery import shared_task
from time import sleep
from .apps import AuthHmacMetosGet
import requests



@shared_task()
def request_data_from_stations():
    from .models import MeteoStations
    """Sends an email when the feedback form has been submitted."""
    print("Starting task..")
    # Запрашиваем доступные метеостанции
    # Endpoint of the API, version for example: v1
    apiURI = 'https://api.fieldclimate.com/v2'

    # HMAC Authentication credentials
    publicKey = 'ba9c8f7415885c20da4ab8e7cd46bf2de6a49b8c1e320dea'
    privateKey = '9e9f3139bbe88c1a47475225b5991713bb1c4e8fc7a49c8f'

    # Service/Route that you wish to call
    apiRoute = '/user/stations'

    auth = AuthHmacMetosGet(apiRoute, publicKey, privateKey)
    response = requests.get(apiURI + apiRoute, headers={'Accept': 'application/json'}, auth=auth)
    res_json = response.json();
    MeteoStations.objects.all().delete()
    number = 1
    for station in res_json:
        nm = station['name']['custom']
        s_nm = station['name']['original']
        tp = station['info']['device_name']
        c_lon = station['position']['geo']['coordinates'][0]
        c_lat = station['position']['geo']['coordinates'][1]
        cur_temp = station['meta']['airTemp']
        uid = station['info']['uid']
        r_last_24 = station['meta']['rain24h']['sum']
        stat = MeteoStations(name=nm,
                             service_name=s_nm,
                             type=tp,
                             coordinate_lon=c_lon,
                             coordinate_lat=c_lat,
                             current_temp=cur_temp,
                             uid=uid,
                             rain_last_24=r_last_24,
                             id_number=number)
        number += 1
        stat.save()
        print(station['name']['custom'])
        print(station['position']['geo']['coordinates'])
    print("Task finished")
