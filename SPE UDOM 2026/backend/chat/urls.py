from django.urls import path

from .views import support_room

urlpatterns = [
    path('support-room/', support_room, name='support-room'),
]
