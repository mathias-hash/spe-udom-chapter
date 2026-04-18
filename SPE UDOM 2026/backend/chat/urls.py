from django.urls import path
from .views import support_room, send_message

urlpatterns = [
    path('support-room/', support_room, name='support-room'),
    path('send/', send_message, name='send-message'),
]
