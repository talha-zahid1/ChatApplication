from .models import chat_room,messages
from rest_framework import serializers

class chat_room_serializer(serializers.ModelSerializer):
    class Meta:
        model=chat_room
        fields='__all__'
class messages_serializer(serializers.ModelSerializer):
    class Meta:
        model=messages
        fields='__all__'
class user_serializer(serializers.Serializer):
    username=serializers.CharField()
    email=serializers.EmailField()
    password=serializers.CharField(write_only=True)