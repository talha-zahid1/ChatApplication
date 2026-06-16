from django.db import models
from django.contrib.auth.models import User
import uuid
# Create your models here.
class profile(models.Model):
    user=models.OneToOneField(User,on_delete=models.CASCADE)
    profile_pic=models.ImageField(upload_to='profiles/')
    bio=models.TextField(blank=True,null=True)
class media(models.Model):
    file=models.FileField(upload_to='profiles/')

class chat_room(models.Model):
    room_id=models.AutoField(primary_key=True)
    members=models.ManyToManyField(User)
    name = models.CharField(max_length=100, null=True, blank=True)
    group_id=models.UUIDField(default=uuid.uuid4,unique=True,null=True,blank=True)
    is_group=models.BooleanField(default=False)
    created_by=models.ForeignKey(User,on_delete=models.SET_NULL,null=True,blank=True,related_name='created_rooms')
class messages(models.Model):
    chat_id=models.AutoField(primary_key=True)
    room_id=models.ForeignKey(chat_room,on_delete=models.CASCADE)
    message=models.CharField(max_length=1000)
    is_read=models.BooleanField(default=False)
    timestamp=models.DateTimeField(auto_now_add=True)
    sender_id=models.ForeignKey(User,on_delete=models.CASCADE)