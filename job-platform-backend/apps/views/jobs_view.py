from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from apps.models.jobs import Job
from apps.serializers.jobs_serializer import JobSerializer
from apps.models.candidates import Application
from apps.serializers.employers_serializer import EmployerProfileSerializer, CompanySerializer
from apps.serializers.candidates_serializer import ApplicationSerializer
from apps.permissions import IsVerifiedEmployer
from apps.paginators import JobPaginator

class EmployerJobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    permission_classes = [IsVerifiedEmployer]
    def get_employer(self):
        user = self.request.user
        if hasattr(user, 'employer_profile'):
            return user.employer_profile
        return None
    def get_queryset(self):
        employer = self.get_employer()
        if not employer:
            return Job.objects.none()
        return Job.objects.filter(employer=employer).order_by('-created_at')
    def perform_create(self, serializer):
        employer = self.get_employer()
        serializer.save(employer=employer)

    @action(methods=['get'], detail=True, url_path='applications')
    def get_job_applications(self, request, pk=None):
        employer = self.get_employer()
        if not employer:
            return Response({"detail": "Chức năng này chỉ dành cho Nhà tuyển dụng."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            job = Job.objects.get(pk=pk, employer=employer)
        except Job.DoesNotExist:
            return Response({"detail": "Không tìm thấy bài tuyển dụng hợp lệ của bạn."}, status=status.HTTP_404_NOT_FOUND)
        applications = Application.objects.filter(job=job).select_related('candidate').order_by('-applied_at')
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(methods=['post'], detail=True, url_path='review-application')
    def review_application(self, request, pk=None):
        employer = self.get_employer()
        if not employer:
            return Response({"detail": "Chức năng này chỉ dành cho Nhà tuyển dụng."}, status=status.HTTP_403_FORBIDDEN)
        new_status = request.data.get('status')
        if new_status not in ['reviewed', 'interviewing', 'accepted', 'rejected']:
            return Response({"detail": "Trạng thái không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)
        
        application_id = request.data.get('application_id')
        if not application_id:
            return Response({"detail": "Thiếu application_id."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            application = Application.objects.get(pk=application_id, job__employer=employer)
        except Application.DoesNotExist:
            return Response({"detail": "Không tìm thấy đơn ứng tuyển hợp lệ thuộc quyền quản lý."}, status=status.HTTP_404_NOT_FOUND)
        application.status = new_status
        application.save()
        return Response({
            "detail": f"Đã cập nhật trạng thái đơn ứng tuyển thành: {new_status}!",
            "application_id": application.id,
            "status": application.status
        }, status=status.HTTP_200_OK)
    
class JobViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Job.objects.all().order_by('-created_at')
    serializer_class = JobSerializer    
    pagination_class = JobPaginator
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        if not hasattr(request.user, 'candidate_profile'):
            return Response(
                {"detail": "Chức năng này chỉ dành cho tài khoản Ứng viên."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        search_query = request.query_params.get('search', '').strip()  
        category_id = request.query_params.get('category', '')        
        location = request.query_params.get('location', '').strip()    
        salary = request.query_params.get('salary', None)              

        queryset = self.get_queryset()
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) | Q(employer__company__name__icontains=search_query)
            )

        if category_id:
            queryset = queryset.filter(category_id=category_id)

        if location:
            queryset = queryset.filter(location__icontains=location)

        if salary:
            queryset = queryset.filter(salary_min__lte=salary, salary_max__gte=salary)

            
        ordering = request.query_params.get('ordering', '-created_at')
        ALLOWED_ORDERING = ['salary_min', '-salary_min', 'created_at', '-created_at']
        if ordering in ALLOWED_ORDERING:
            queryset = queryset.order_by(ordering)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(methods=['get'], detail=False, url_path='compare')
    def compare_jobs(self, request):
        if not hasattr(request.user, 'candidate_profile'):
            return Response(
                {"detail": "Chức năng này chỉ dành cho tài khoản Ứng viên."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        job_ids = [int(x) for x in request.query_params.get('ids', '').split(',') if x.strip().isdigit()]
        queryset = Job.objects.filter(id__in=job_ids)
        if not queryset.exists() or len(set(queryset.values_list('category_id', flat=True))) > 1:
            return Response({"detail": "Danh sách ID không hợp lệ hoặc các công việc không cùng lĩnh vực."}, status=400)
            
        return Response(self.get_serializer(queryset, many=True).data)
