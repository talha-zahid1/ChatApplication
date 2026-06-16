from django.contrib import admin
from .models import chat_room,messages,media,profile
# Register your models here.

admin.site.register(chat_room)
admin.site.register(messages)
admin.site.register(media)
admin.site.register(profile)