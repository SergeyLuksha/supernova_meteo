from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from django.template import loader
from django.utils import timezone

from .models import MeteoStations
from .models import CommentsToStation
import requests
from requests.auth import AuthBase
from Crypto.Hash import HMAC
from Crypto.Hash import SHA256
from datetime import datetime

from django.shortcuts import render
from json import dumps
from .apps import AuthHmacMetosGet
from .tasks import request_data_from_stations
import json
import pytz



def index(request):
  stations = MeteoStations.objects.all().values()
  template = loader.get_template('index_t.html')
  context = {
      'stations': stations,
  }
  # send_feedback_email_task.delay(
  # )
  return HttpResponse(template.render(context, request))

def map(request):

  stations = MeteoStations.objects.all().values()
  dicts = {}
  i = 0
  for st in stations:
    # # coordinate = [station.coordinate_lon, station.coordinate_lat]
    # print(st['name'])
    dicts[i] = [st['coordinate_lon'], st['coordinate_lat'] ]
    i += 1
    # dicts[i] = st['coordinate_lat']
    # i += 1
      # dicts[i] = station['position']['geo']['coordinates'][1]
      # i+=1

  # dump data
  dataJSON = dumps(dicts)
  return render(request, 'map.html', {'data': dataJSON, 'stations': stations})

def station_details(request, id):
  station = MeteoStations.objects.get(uid=id)
  #Делаем запрос к станции для получения актуальной информации
  # Endpoint of the API, version for example: v1
  apiURI = 'https://api.fieldclimate.com/v2'

  # HMAC Authentication credentials
  publicKey = 'ba9c8f7415885c20da4ab8e7cd46bf2de6a49b8c1e320dea'
  privateKey = '9e9f3139bbe88c1a47475225b5991713bb1c4e8fc7a49c8f'

  # Service/Route that you wish to call
  apiRoute = '/station/' + station.service_name

  auth = AuthHmacMetosGet(apiRoute, publicKey, privateKey)
  response = requests.get(apiURI + apiRoute, headers={'Accept': 'application/json'}, auth=auth)
  response_station_json = response.json();
  # print(res_json)
  # with open('station_detail.json', 'w', encoding='utf-8') as f:
  #     json.dump(response.json(), f, ensure_ascii=False, indent=4)

  # Выполняем запрос метеоданных за последние 24 часа
  apiRoute = '/data/' + station.service_name + '/hourly/last/1h'

  auth = AuthHmacMetosGet(apiRoute, publicKey, privateKey)
  response = requests.get(apiURI + apiRoute, headers={'Accept': 'application/json'}, auth=auth)
  response_data_json = response.json();
  # print(response_data_json)
  # with open('station_data.json', 'w', encoding='utf-8') as f:
  #     json.dump(response.json(), f, ensure_ascii=False, indent=4)

  template = loader.get_template('station_details.html')
  param_data = []
  for param in response_data_json['data']:
    if "aggr" in param:
      for p_type in param['aggr']:
        current_param = {}
        isName = False
        if p_type == 'avg':
          current_param['name'] = param['name'] + ' (среднее)'
          isName = True
        if p_type == 'sum':
          current_param['name'] = param['name'] + ' (суммарно)'
          isName = True
        if p_type == 'max':
          current_param['name'] = param['name'] + ' (максимум)'
          isName = True
        if p_type == 'last':
          current_param['name'] = param['name'] + ' (последнее значение)'
          isName = True

        if isName:
          current_param['unit'] = param['unit']
          current_param['value'] = param['values'][p_type][-1]
          param_data.append(current_param)


  # print(param_data)
  print("UID: "+station.uid)
  comments = CommentsToStation.objects.filter(station_uid=station.uid).values()
  # Преобразовываем даты
  comments_data = []
  tz = timezone.get_default_timezone()
  for com in comments:
    mod_com = com;
    # print(mod_com)
    mod_com['date_time'] = mod_com['date_time'].astimezone(tz).strftime('%d.%m.%Y %H:%M')
    comments_data.append(mod_com)
  # print(comments_data)
  context = {
    'station': station,
    'st_detail': response_station_json,
    'st_data': param_data,
    'comments' : comments_data,
  }
  return HttpResponse(template.render(context, request))

def visualize(request):

  stations = MeteoStations.objects.all().values()

  # dump data
  mode = 'select'
  timePeriod = {'24 часа',
                '48 часов',
                '7 дней',
                '1 месяц',}
  param = {'Солнечная радиация',
           "Осадки",
           "Скорость ветра",
           "Заряд АКБ",
           "Влажность листа",
           "Температура воздуха",
           "Влажность воздуха",
           "Точка росы"}
  return render(request, 'visualizer.html', {'stations': stations, 'mode': mode, 'timePeriod': timePeriod, 'param': param })

def visualize_param(request):
  station_name = request.POST['station']
  param_name = request.POST['param']
  period_name = request.POST['period']
  print(station_name)
  print(param_name)
  print(period_name)
  station = MeteoStations.objects.get(name=station_name)
  #Делаем запрос к станции для получения актуальной информации
  # Endpoint of the API, version for example: v1
  apiURI = 'https://api.fieldclimate.com/v2'

  # HMAC Authentication credentials
  publicKey = 'ba9c8f7415885c20da4ab8e7cd46bf2de6a49b8c1e320dea'
  privateKey = '9e9f3139bbe88c1a47475225b5991713bb1c4e8fc7a49c8f'

  # Выбираем режим отображения
  period_mode = '24h'
  period_interval = 'hourly'

  timePeriod = {'24 часа',
                '48 часов',
                '7 дней',
                '1 месяц',}
  if period_name == '24 часа':
    period_mode = '24h'
    period_interval = 'hourly'
  if period_name == '48 часов':
    period_mode = '48h'
    period_interval = 'hourly'
  if period_name == '7 дней':
    period_mode = '7d'
    period_interval = 'daily'
  if period_name == '1 месяц':
    period_mode = '1m'
    period_interval = 'daily'

  # Выполняем запрос метеоданных за последние 24 часа
  apiRoute = '/data/' + station.service_name + '/' + period_interval + '/last/' + period_mode

  auth = AuthHmacMetosGet(apiRoute, publicKey, privateKey)
  response = requests.get(apiURI + apiRoute, headers={'Accept': 'application/json'}, auth=auth)
  response_data_json = response.json();
  print(response_data_json)
  with open('station_data.json', 'w', encoding='utf-8') as f:
      json.dump(response.json(), f, ensure_ascii=False, indent=4)

  template = loader.get_template('visualize_param.html')
  param_data = []

  parameter_units = ''
  for param in response_data_json['data']:
    print(param['name'])
    if param['name'] == param_name:
      if "aggr" in param:
        parameter_units = param['unit']
        for p_type in param['aggr']:
          current_param = {}
          isName = False
          if p_type == 'avg':
            current_param['name'] = 'среднее'
            isName = True
          if p_type == 'sum':
            current_param['name'] = 'суммарно'
            isName = True
          if p_type == 'max':
            current_param['name'] = 'максимум'
            isName = True
          if p_type == 'last':
            current_param['name'] = 'последнее значение'
            isName = True

          if isName:
            current_param['unit'] = param['unit']
            current_param['values'] = [0 if i is None else i for i in param['values'][p_type]]
            param_data.append(current_param)


  print(param_data)
  mode = 'visualize'
  context = {
    'station': station,
    'st_data': param_data,
    'mode' : mode,
    'timestamp': response_data_json['dates'],
    'parameter_name': param_name,
    'parameter_units': parameter_units,
  }

  return HttpResponse(template.render(context, request))

def addcomment(request):
  text = request.POST['comment']
  id = request.POST['station_service_name']
  comment = CommentsToStation(station_uid=id, comment_text=text)
  comment.save()
  return HttpResponseRedirect(reverse('station_details', args=(id,)))