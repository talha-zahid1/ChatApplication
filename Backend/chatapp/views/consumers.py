import json

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from ..models import chat_room
from rest_framework.permissions import IsAuthenticated
from ..serializer import messages_serializer


class consumer_route(AsyncWebsocketConsumer):
    permission_classes=[IsAuthenticated]

    @database_sync_to_async
    def check_grp_members(self,user1,room_id):
        try:
           room_data=chat_room.objects.get(room_id=room_id)
        except Exception as e:
            print('error',e)
            return False
        if room_data.members.filter(id=user1).exists():
            return True
        return False

    async def connect(self):
        room_id=self.scope['url_route']['kwargs']['room_id']
        
        user1=self.scope['user']
        self.room_group_name=f"room_{room_id}"

        try:
            is_member=await self.check_grp_members(user1=user1.id,room_id=room_id)
        except Exception as e:
            await self.close(code=4003)
            return
        if not is_member:
            await self.close(code=4003)
            return
        await self.accept()
        try:
            await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
            )
        except Exception as e:
            await self.close()
        
        

    async def chat_message(self,event):
        await self.send(
            text_data=json.dumps(event['message'])
        )

    async def receive(self,text_data = None, bytes_data = None):
        if text_data:
            if text_data == 'ping':
                await self.send(text_data='pong')
                return

            data={
                "room_id":self.scope['url_route']['kwargs']['room_id'],
                "message":text_data,
                "sender_id":self.scope['user'].id,
            }
            serializer=messages_serializer(data=data)
            isvalid=await database_sync_to_async(serializer.is_valid)()
            if isvalid:
                message_obj=await database_sync_to_async(serializer.save)()
                payload={
                    "message_id":message_obj.chat_id,
                    "message":message_obj.message,
                    "is_read":message_obj.is_read,
                    "sender_id":message_obj.sender_id_id,
                    "sender_username":message_obj.sender_id.username,
                    "timestamp":message_obj.timestamp.isoformat(),
                    "room_id":message_obj.room_id_id
                }
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat_message",
                        "message": payload
                    }
                )
            else:
                print(serializer.errors)

    async def  disconnect(self, code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
            self.room_group_name ,
            self.channel_name
            )
        

        print('user has been dosconnected')
