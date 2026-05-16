from rest_framework import viewsets, generics, permissions, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.contrib.auth import logout as django_logout
from apps.serializers.user_serializer import RegisterSerializer


User = get_user_model()
class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = RegisterSerializer 
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    @action(
        methods=['post'], 
        url_path='change-password', 
        detail=False, 
        permission_classes=[permissions.IsAuthenticated]
    )
    def change_password(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        if not old_password or not new_password:
            return Response({"detail": "Vui lòng nhập đầy đủ mật khẩu cũ và mới."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.check_password(old_password):
            return Response({"detail": "Mật khẩu cũ không chính xác."}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        return Response({"detail": "Đổi mật khẩu thành công!"}, status=status.HTTP_200_OK)
    
    @action(
        methods=['post'], 
        url_path='logout', 
        detail=False, 
        permission_classes=[permissions.IsAuthenticated]
    )
    
    def logout_account(self, request):
        token = request.auth
        if token:
            token.delete()

        django_logout(request)


        # 3. Phản hồi thành công về cho App Mobile chuyển màn hình
        return Response(
            {"detail": "Đã đăng xuất tài khoản thành công khỏi hệ thống!"}, 
            status=status.HTTP_200_OK
        )
        
        
    