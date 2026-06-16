"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application() 
from channels.routing import URLRouter,ProtocolTypeRouter
from chatapp.middleware import JWTAuthMiddleware
from chatapp.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    'http':django_asgi_app,
    'websocket':JWTAuthMiddleware(
        URLRouter(websocket_urlpatterns)
    )
})
