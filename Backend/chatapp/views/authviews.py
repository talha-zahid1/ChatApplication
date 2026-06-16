from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny
from  rest_framework_simplejwt.tokens import RefreshToken
from ..serializer import user_serializer


class register_view(APIView):
    permission_classes=[AllowAny]
    def gen_token(self,user):
        refresh=RefreshToken.for_user(user=user)
        return {
            'access':str(refresh.access_token),
            'refresh':str(refresh),
        }


    def post(self,req):
        serializer=user_serializer(data=req.data)
        if serializer.is_valid():
            data=serializer.validated_data
            if   User.objects.filter(username=data['username']).exists():
                return Response({
                    'status':False,
                    'message':'Username Already exists'
                },status=401)
            if  User.objects.filter(email=data['email']).exists():
                return Response({
                    'status':False,
                    'message':'email Already exists'
                },status=401)
            user=User.objects.create_user(username=data['username'],email=data['email'],password=data['password'])
            tokens=self.gen_token(user=user)
            return Response({
                'status':True,
                'message':'User Registered',
                'username':data['username'],
                'user_id':user.id,
                'email':data['email'],
                'tokens':tokens,
            })
        return Response(serializer.errors)