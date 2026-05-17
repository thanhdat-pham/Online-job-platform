from rest_framework import viewsets, permissions, status, parsers   
from rest_framework.response import Response
from rest_framework.decorators import action
from apps.models import Employer, Company
from apps.serializers.employers_serializer import EmployerProfileSerializer, CompanySerializer 
class EmployerProfileViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    def get_object(self):
        user = self.request.user
        if hasattr(user, 'employer_profile'):
            return user.employer_profile
        return None
    
    @action(methods=['get', 'put', 'patch'], detail=False, url_path='profile')
    def manage_profile(self, request):
        employer = self.get_object()
        if not employer:
            return Response(
                {"detail": "Chức năng này chỉ dành cho tài khoản Nhà tuyển dụng."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        if request.method == 'GET':
            return Response(EmployerProfileSerializer(employer).data)
        
        serializer = EmployerProfileSerializer(employer, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Cập nhật hồ sơ thành công.", "data": serializer.data})
    
    @action(methods=['get', 'put', 'patch'], detail=False, url_path='company')
    def manage_company(self, request):
        employer = self.get_object()
        if not employer:
            return Response(
                {"detail": "Chức năng này chỉ dành cho tài khoản Nhà tuyển dụng."},
                status=status.HTTP_403_FORBIDDEN
            )

        company = employer.company
        if not company:
            return Response(
                {"detail": "Tài khoản của bạn chưa liên kết với công ty nào."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.method == 'GET':
            return Response({
                "has_company": True,
                "data": CompanySerializer(company).data
            })
        serializer = CompanySerializer(company, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            "detail": "Cập nhật thông tin công ty thành công.",
            "data": serializer.data
        })
    
    @action(methods=['post'], detail=False, url_path='select-company')
    def select_company(self, request):
        employer = self.get_object()
        company_id = request.data.get('company_id')
        try:
            chosen_company = Company.objects.get(id=company_id)
            employer.company = chosen_company
            employer.save()
            return Response({
                "detail": "Liên kết công ty thành công!",
                "data": CompanySerializer(chosen_company).data
            }, status=status.HTTP_200_OK)
        except Company.DoesNotExist:
            return Response({"detail": "Công ty không tồn tại!"}, status=status.HTTP_404_NOT_FOUND)