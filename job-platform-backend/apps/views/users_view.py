from rest_framework import viewsets, generics, permissions, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.contrib.auth import logout as django_logout
from django.db import transaction
from apps.serializers.user_serializer import RegisterSerializer
from apps.serializers.employers_serializer import CompanySerializer
from apps.models.employers import Company, Employer

User = get_user_model()

class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = RegisterSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def create(self, request, *args, **kwargs):
        user_serializer = RegisterSerializer(data=request.data)
        user_serializer.is_valid(raise_exception=True)

        role = user_serializer.validated_data.get('role', '').upper()

        if role == 'EMPLOYER':
            # Validate Company trước — nếu lỗi thì báo luôn, chưa tạo gì cả
            company_serializer = CompanySerializer(data=request.data)
            company_serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                user = user_serializer.save()
                company = company_serializer.save()
                Employer.objects.create(user=user, company=company)

            return Response(
                {"detail": "Đăng ký thành công. Vui lòng chờ quản trị viên xác minh tài khoản."},
                status=status.HTTP_201_CREATED
            )

        # Candidate đăng ký bình thường
        user_serializer.save()
        return Response(
            {"detail": "Đăng ký thành công!"},
            status=status.HTTP_201_CREATED
        )

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
        return Response(
            {"detail": "Đã đăng xuất tài khoản thành công khỏi hệ thống!"},
            status=status.HTTP_200_OK
        )
    @action(
    methods=['get'],
    url_path='me',
    detail=False,
    permission_classes=[permissions.IsAuthenticated]
    )
    def me(self, request):
        from apps.serializers.user_serializer import UserSerializer
        return Response(UserSerializer(request.user).data)