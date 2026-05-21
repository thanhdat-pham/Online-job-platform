from rest_framework import viewsets, generics, permissions, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.contrib.auth import logout as django_logout
from django.db import transaction
from apps.serializers.user_serializer import RegisterSerializer
from apps.serializers.employers_serializer import CompanySerializer
from apps.models.employers import Company, Employer
from apps.models.candidates import CandidateProfile

from backend import settings
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
            company_id = request.data.get('company_id')

            if company_id:
                # Chọn công ty có sẵn
                try:
                    company = Company.objects.get(id=company_id)
                except Company.DoesNotExist:
                    return Response({"company_id": "Công ty không tồn tại."}, status=status.HTTP_400_BAD_REQUEST)
                with transaction.atomic():
                    user = user_serializer.save()
                    Employer.objects.create(user=user, company=company)
            else:
                # Tự nhập công ty mới
                company_data = {
                    'name': request.data.get('company_name', ''),
                    'address': request.data.get('company_address', ''),
                }
                if 'company_logo' in request.FILES:
                    company_data['logo'] = request.FILES['company_logo']

                if not company_data['name']:
                    return Response({"company_name": "Vui lòng nhập tên công ty."}, status=status.HTTP_400_BAD_REQUEST)

                company_serializer = CompanySerializer(data=company_data)
                company_serializer.is_valid(raise_exception=True)
                with transaction.atomic():
                    user = user_serializer.save()
                    company = company_serializer.save(is_preset=False)
                    Employer.objects.create(user=user, company=company)


            return Response(
                {"detail": "Đăng ký thành công. Vui lòng chờ quản trị viên xác minh tài khoản."},
                status=status.HTTP_201_CREATED
            )

        else:

            full_name = user_serializer.validated_data.get('full_name', '')
            user = user_serializer.save()
            CandidateProfile.objects.create(user=user, full_name=full_name)
            return Response(
                {"detail": "Đăng ký thành công!"},
                status=status.HTTP_201_CREATED
            )


    @action(methods=['get'], url_path='companies', detail=False, permission_classes=[permissions.AllowAny])
    def list_preset_companies(self, request):
        companies = Company.objects.filter(is_preset=True).order_by('name')
        return Response(CompanySerializer(companies, many=True).data)

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
    url_path='current-user',
    detail=False,
    permission_classes=[permissions.IsAuthenticated]
    )
    def me(self, request):
        from apps.serializers.user_serializer import UserSerializer
        return Response(UserSerializer(request.user).data)

    @action(methods=['post'], url_path='login', detail=False, permission_classes=[permissions.AllowAny],parser_classes=[parsers.JSONParser, parsers.FormParser])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({"detail": "Vui lòng nhập tài khoản và mật khẩu."}, status=status.HTTP_400_BAD_REQUEST)

        import requests as http_requests
        res = http_requests.post('http://localhost:8000/o/token/', data={
            'grant_type': 'password',
            'username': username,
            'password': password,
            'client_id': settings.CLIENT_ID,
            'client_secret': settings.CLIENT_SECRET,
        })
        return Response(res.json(), status=res.status_code)