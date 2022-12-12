from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('map/', views.map, name='map'),
    path('station/<str:id>', views.station_details, name='station_details'),
    path('visualize/', views.visualize, name='visualize'),
    path('visualize/visualize_param/', views.visualize_param, name='visualize_param'),
    path('station/addcomment/', views.addcomment, name='add_comment'),
]