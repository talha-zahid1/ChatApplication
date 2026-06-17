from ..models import chat_room, messages, profile,media
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated
from django.db.models import Subquery, OuterRef
import uuid
from ..serializer import chat_room_serializer
from ..pagination import MyCursorPagination
import os
from django.conf import settings



class delete_conv_view(APIView):
    permission_classes=[IsAuthenticated]
    def delete(self,req,room_id):
        chat=chat_room.objects.filter(room_id=room_id).first()
        if not chat:
            return Response({
                'status':False,
                'message':'chat Not Found'
            },status=404)
        if not chat.members.filter(id=req.user.id).exists():
            return Response({
                'status':False,
                'message':'Invalid User'
            },status=401)
        chat.delete()
        return Response({
                'status':True,
                'message':'chat Deleted'
            })
    

class search_user_view(APIView):
    def get(self,req):
        username=req.GET.get('q','')
        user=User.objects.filter(username=username).first()
        if not user:
            return Response({
                'status':False,
                'message':'user Not Found'
            },status=404)
        return Response({
            'status':True,
            'user_id':user.id,
            'username':user.username,
            'email':user.email
        })

class get_user_view(APIView):
    def get(self,req):
        name=req.GET.get('q',None)
        if name:
            user=User.objects.filter(username=name).first()
        else:
            user=req.user
        if not user:
            return Response({
                'status':False,
                'message':'user not found'
            },status=404)
        return Response({
            'status':True,
            'user_id':user.id,
            'username':user.username,
            'email':user.email
        })
class media_view(APIView):
    def post(self,req):
        media_file=req.FILES.get('media')
        if not media_file:
            return Response({
            'status':False,
            'message':'file required'
        },status=400)
        file=media.objects.create(file=media_file)
        return Response({
            'status':True,
            'file_url':file.file.url
        })

class bio_view(APIView):
    permission_classes=[IsAuthenticated]
    def get(self, req):
        pf = profile.objects.filter(user=req.user).first()
        if not pf:
            return Response(
                {"status": False, "message": "Profile Doesn't exist"}, status=404
            )
        bio = pf.bio
        if bio is None:
            return Response(
                {"status": False, "message": "Bio Doesn't exist"}, status=404
            )
        return Response({"status": True, "bio": bio})

    def put(self, req):
        pf = profile.objects.filter(user=req.user).first()
        if not pf:
            return Response(
                {"status": False, "message": "Profile Doesn't exist"}, status=404
            )
        bio = req.data.get("bio")
        if bio is None:
            return Response({"status": False, "message": "Bio Required"}, status=400)
        pf.bio = bio
        pf.save()
        return Response({"status": True, "message": "Updated bio"})

    def delete(self, req):
        pf = profile.objects.filter(user=req.user).first()
        if not pf:
            return Response(
                {"status": False, "message": "Profile Doesn't exist"}, status=404
            )
        pf.bio = None
        pf.save()
        return Response({"status": True, "message": "Bio Removed"})


class profile_view(APIView):
    permission_classes=[IsAuthenticated]
    def post(self, req):
        Profile_obj, created = profile.objects.get_or_create(user=req.user)

        Profile_obj.profile_pic = req.FILES.get("profile_pic")
        Profile_obj.save()
        url = None
        if not Profile_obj.profile_pic:
            return Response(
                {"status": False, "message": "Failed to upload Profile Pic"}
            )
        url = Profile_obj.profile_pic.url
        print(url)
        return Response(
            {
                "status": True,
                "message": "Profile Pic Uploaded",
                "url": url,
            }
        )

    def get(self, req):

        pf = profile.objects.filter(user=req.user).first()
        if (not pf) or (not pf.profile_pic):
            return Response(
                {"status": False, "message": "Profile pic Not found"}, status=404
            )
        url = pf.profile_pic.url
        print(url)
        return Response({"status": True, "profile_url": url})

    def put(self, req):
        pf = profile.objects.filter(user=req.user).first()
        if not pf:
            return Response(
                {"status": False, "message": "Profile pic Not found"}, status=404
            )
        file = req.FILES.get("profile_pic")
        if not file:
            return Response(
                {"status": False, "message": "Profile pic Required"}, status=400
            )
        pf.profile_pic = file
        pf.save()
        print(pf.profile_pic.url)
        return Response({"status": True, "message": "Profile Pic Updated Successfully",'url':pf.profile_pic.url})

    def delete(self, req):
        pf = profile.objects.filter(user=req.user).first()
        if (not pf) or (not pf.profile_pic):
            return Response(
                {"status": False, "message": "Profile pic Not found"}, status=404
            )
        pf.profile_pic.delete(save=True)
        return Response({"status": True, "message": "Profile Pic deleted Successfully"})
class see_grp_mem(APIView):
    def get(self,req,room_id):
        room=chat_room.objects.filter(room_id=room_id,members=req.user.id).first()
        if not room:
            return Response({"status": False, "message": "Invalid user "}, status=401)
        return Response({
            'status':True,
            'members':list(room.members.values('id','username','email')),
            'is_group':room.is_group,
            'group_name':room.name

        })


class group_view(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, req):
        group_id = req.data.get("group_id")
        user_id=req.user.id
        gd = chat_room.objects.filter(group_id=group_id).first()
        if not gd:
            return Response({"status": False, "message": "Group Not Found"}, status=404)
        if not gd.members.filter(id=user_id).exists():
            return Response({"status": False, "message": "Invalid user "}, status=401)
        return Response(
            {
                "room_id": gd.room_id,
            }
        )

class join_group_view(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,req):
        grp_name=req.GET.get('q',None)
        grps=chat_room.objects.filter(name=grp_name)
        serializer=chat_room_serializer(grps,many=True)
        return Response({
            'status':True,
            'groups':serializer.data
        })
    def post(self,req):
        group_id=req.data.get('group_id')
        room=chat_room.objects.filter(group_id=group_id).first()
        if not room:
            return Response({
            'status':False,
            'message':'Group Not Found'
        },status=404)
        if room.members.filter(id=req.user.id).exists():
            return Response({
            'status':False,
            'message':'User Already joined'
        },status=400)
        room.members.add(req.user.id)
        return Response({
            'status':True,
            'message':'User Added',
            'room_id':room.room_id
        })




class create_group_room_view(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, req):
        data = req.data
        members = data.get("members")
        if not members:
            return Response({
                'status':False,
                'message':'Group members are required'
            },status=400)
        users=[]
        for m in members:
            try:
                user=User.objects.get(id=m)
            except User.DoesNotExist:
                return Response({
                    'status':False,
                    'message':f'{user.username} is not registered'
                },status=400)
            users.append(user)
        group_id = uuid.uuid4()
        rd= chat_room.objects.create(name=data.get('group_name'),group_id=group_id, is_group=True,created_by=req.user)
        rd.members.add(*users, req.user)
        return Response({"status": True, "group_id": group_id, "room_id": rd.room_id})


class rem_user_view(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, req):
        # remove user from a group
        user_id = int(req.data.get("user_id"))
        room_id = int(req.data.get("room_id"))
        room = chat_room.objects.filter(room_id=room_id).first()
        if not room:
            return Response(
                {"status": False, "message": "No Conversation Found"}, status=404
            )
        if not room.members.filter(id=req.user.id).exists():
            return Response(
                {
                    "status": False,
                    "message": "Invalid User",
                },
                status=403,
            )
        if not room.members.filter(id=user_id).exists():
            return Response(
                {
                    "status": False,
                    "message": "User does not exist in group",
                },
                status=404,
            )
        if  room.created_by!=req.user:
            return Response(
                {
                    "status": False,
                    "message": "Only Admin Can remove",
                },
                status=401,
            )
        user=User.objects.filter(id=user_id).first()
        room.members.remove(user_id)
        return Response(
            {"status": True, "message": f"{user.username} has been removed"}
        )


class delete_view(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, req, room_id):
        # delete a group
        room = chat_room.objects.filter(room_id=room_id).first()
        if not room:
            return Response(
                {"status": False, "message": "No Conversation Found"}, status=404
            )
        if not room.members.filter(id=req.user.id).exists():
            return Response(
                {
                    "status": False,
                    "message": "Invalid User",
                },
                status=403,
            )
        if room.created_by!=req.user:
            return Response(
                {
                    "status": False,
                    "message": "Only Admin Can Delete",
                },
                status=401,
            )
        room.delete()
        return Response(
            {"status": True, "message": f"Group with  id {room_id} has been deleted"}
        )


class add_view(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, req,room_id):
        user_id = int(req.data.get("user_id"))
        
        room = chat_room.objects.filter(room_id=room_id).first()
        if not room:
            return Response(
                {"status": False, "message": "No Conversation Found"}, status=404
            )
        if not room.members.filter(id=req.user.id).exists():
            return Response({"status": False, "message": "Invalid User"}, status=403)
        if room.members.filter(id=user_id).exists():
            return Response(
                {"status": False, "message": "User Already Exists"}, status=400
            )
        user=User.objects.filter(id=user_id).first()
        if not user:
            return Response(
                {"status": False, "message": "User is not registered"}, status=401
            )
        if room.created_by!=req.user:
            return Response(
                {
                    "status": False,
                    "message": "Only Admin Can Add",
                },
                status=401,
            )
        room.members.add(user_id)
        return Response({"status": True, "message": f"{user.username} Added to the group"})


class leave_view(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, req, room_id):

        room = chat_room.objects.filter(room_id=room_id).first()
        if not room:
            return Response(
                {"status": False, "message": "No Conversation Found"}, status=404
            )
        if not room.members.filter(id=req.user.id).exists():
            return Response({"status": False, "message": "Invalid User"}, status=403)
        room.members.remove(req.user.id)
        return Response({"status": True, "message": "Group Left Successfully"})


class private_room_view(APIView):
    permission_classes = [IsAuthenticated]

    def check_user(self, user1, user2):
        rd = chat_room.objects.filter(members=user1).filter(members=user2).first()
        if rd:
            return rd.room_id
        return None

    def post(self, req):
        user1 = User.objects.get(id=req.user.id)
        rec_id = req.data.get("rec_id")

        try:
            user2=User.objects.get(id=rec_id)
        except User.DoesNotExist:
            return Response({
                'status':False,
                'message':f'user is not registered'
            },status=400)    


        if not rec_id:
            return Response({
                'status':False,
                'message':'rec_id required'
            },status=400)
        room_id = self.check_user(user1=user1, user2=user2)
        if not room_id:
            rd = chat_room.objects.create()
            rd.members.add(user1, user2)
            room_id = rd.room_id
        return Response({"room_id": room_id})
    

class inbox_view(APIView):
    def get(self, req):
        # F.E will use this Api for Inbox/Dm where F.E will show all the conversation
        user_id = req.user.id
        latest_msg = messages.objects.filter(room_id=OuterRef("room_id")).order_by(
            "-timestamp"
        )
        rooms = chat_room.objects.filter(members=user_id).annotate(
            last_message=Subquery(latest_msg.values("message")[:1]),
            last_sender_id=Subquery(latest_msg.values("sender_id")[:1]),
        )
        latest_messages = []
        for room in rooms:
            if room.last_sender_id is None:
                continue
            elif room.last_sender_id:
                rec_id = list(
                    room.members.exclude(id=room.last_sender_id).values_list(
                        "id", flat=True
                    )
                )
            
            pic=None
            if not room.is_group and rec_id:
                prof=profile.objects.filter(user_id__in=rec_id).first()
                if prof and prof.profile_pic:
                    pic=prof.profile_pic.url

            

            latest_messages.append(
                {
                    "message": room.last_message,
                    "room_id": room.room_id,
                    "sender_id": room.last_sender_id,
                    "rec_id": rec_id,
                    "is_group": room.is_group,
                    "group_name":room.name if room.is_group else  None ,
                    "other_profile_pic":pic
                }
            )

        return Response({"status": True, "last_message": latest_messages})
    


class get_messages(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, req, room_id):
        user_id = req.user.id
        room = chat_room.objects.filter(room_id=room_id).first()
        if not room:
            return Response(
                {"status": False, "message": "No Conversation Found"}, status=404
            )
        if not room.members.filter(id=user_id).exists():
            return Response({"status": False, "message": "Invalid User"}, status=403)
        paginator = MyCursorPagination()
        # Returns all the messages of every conv of current user
        msgs = messages.objects.filter(room_id=room_id)
        result = paginator.paginate_queryset(msgs, req)

        if not result:
             result = []

        data = [
            {
                "message_id":m.chat_id,
                "message": m.message,
                "is_read": m.is_read,
                "sender_id": m.sender_id.id,
                "sender_username":m.sender_id.username,
                "timestamp": m.timestamp,
            }
            for m in result
        ]

        return paginator.get_paginated_response(data)


class message_seen(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, req):
        ids = req.data.get("message_ids")
        for msg_id in ids:
            messages.objects.filter(chat_id=msg_id).update(is_read=True)
        return Response({"status": True, "message": "Updated"})

class media_del_view(APIView):
    permission_classes=[IsAuthenticated]
    def delete(self,req):
        path=req.data.get('filepath')
        if not path:
            return Response({
            'status':False,
            'message':'file required'
        })
        file_path=os.path.join(settings.MEDIA_ROOT,path.lstrip('/media/'))
        if os.path.exists(file_path):
            os.remove(file_path)
            return Response({
                'status':True,
                'message':'file deleted'
            })
        return Response({
            'status':False,
            'message':'file Not found'
        },status=404)

        
class message_del_view(APIView):
    permission_classes=[IsAuthenticated]
    def delete(self,req,msg_id):
        msg=messages.objects.filter(chat_id=msg_id)
        if not msg:
            return Response({
                'status':False,
                'message':'message not found'
            },status=404)
        msg.delete()
        return Response({
                'status':True,
                'message':'message deleted'
            })

