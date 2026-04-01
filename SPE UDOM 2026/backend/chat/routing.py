from django.urls import re_path

from .consumers import SupportChatConsumer

websocket_urlpatterns = [
    re_path(r'^ws/chat/(?P<room_key>[-\w]+)/$', SupportChatConsumer.as_asgi()),
]
