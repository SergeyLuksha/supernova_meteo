from django.db import models

class MeteoStations(models.Model):
  name = models.CharField(max_length=255)
  service_name = models.CharField(max_length=255)
  type = models.CharField(max_length=255)
  id_number = models.BigIntegerField(default=0)
  coordinate_lon = models.FloatField(default=0)
  coordinate_lat = models.FloatField(default=0)
  current_temp = models.FloatField(default=0)
  uid = models.CharField(max_length=255, default="0")
  rain_last_24 = models.FloatField(default=0)

class CommentsToStation(models.Model):
  station_uid = models.CharField(max_length=255)
  date_time = models.DateTimeField(auto_now=True)
  comment_text = models.TextField()