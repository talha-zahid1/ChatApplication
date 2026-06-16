from .views import consumers as c
from django.urls import path

websocket_urlpatterns=[
    path('chatApplication/ws/chat/<int:room_id>/',c.consumer_route.as_asgi())
]