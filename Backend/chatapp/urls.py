from django.urls import path
from .views import authviews as av
from django.conf import settings
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView
from django.conf.urls.static import static
from .views import httpviews as hv


urlpatterns =[
    path('api/token/',TokenObtainPairView.as_view()),
    path('api/token/refresh/',TokenRefreshView.as_view()),
    path('register/',av.register_view.as_view()),
    path('private-room/',hv.private_room_view.as_view()),
    path('delete-chat/<int:room_id>/',hv.delete_conv_view.as_view()),
    path('group-room/',hv.group_view.as_view()),
    path('create-group/',hv.create_group_room_view.as_view()),
    path('upload-media/',hv.media_view.as_view()),
    path('upload-bio/',hv.bio_view.as_view()),
    path('get-bio/',hv.bio_view.as_view()),
    path('delete-bio/',hv.bio_view.as_view()),
    path('upload-profile_pic/',hv.profile_view.as_view()),
    path('update-profile_pic/',hv.profile_view.as_view()),
    path('get-profile_pic/',hv.profile_view.as_view()),
    path('delete-profile_pic/',hv.profile_view.as_view()),
    path('remove-member/',hv.rem_user_view.as_view()),
    path('delete-room/<int:room_id>/',hv.delete_view.as_view()),
    path('leave-room/<int:room_id>/',hv.leave_view.as_view()),
    path('add-room/<int:room_id>/',hv.add_view.as_view()),
    path('messages/seen/',hv.message_seen.as_view()),
    path('get-user/',hv.get_user_view.as_view()),
    path('join-group/',hv.join_group_view.as_view()),
    path('get-groups/',hv.join_group_view.as_view()),
    path('inbox/',hv.inbox_view.as_view()),
    path('room-members/<int:room_id>/',hv.see_grp_mem.as_view()),
    path('chat/<int:room_id>/',hv.get_messages.as_view()),
    path('del-messages/<int:msg_id>/',hv.message_del_view.as_view()),
    path('del-media/',hv.media_del_view.as_view()),
]+static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)