from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from apps.models.employers import Employer
from apps.models.jobs import Job
from apps.models.candidates import Application
from apps.serializers.jobs_serializer import JobSerializer
from apps.serializers.employers_serializer import EmployerProfileSerializer
from apps.serializers.candidates_serializer import ApplicationSerializer
from apps.paginators import JobPaginator
from apps.permissions import IsEmployer


class EmployerProfileViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsEmployer]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @action(detail=False, methods=['get', 'patch'], url_path='profile')
    def profile(self, request):
        try:
            employer = request.user.employer_profile
        except Exception:
            return Response({'detail': 'Chưa có hồ sơ nhà tuyển dụng.'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            return Response(EmployerProfileSerializer(employer).data)

        ser = EmployerProfileSerializer(employer, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


class EmployerJobViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsEmployer]
    pagination_class = JobPaginator
    def get_employer(self, user):
        try:
            return user.employer_profile
        except Exception:
            return None

    def list(self, request):
        employer = self.get_employer(request.user)
        if not employer:
            return Response([])
        jobs = Job.objects.filter(employer=employer).order_by('-created_at')
        paginator = JobPaginator()
        page = paginator.paginate_queryset(jobs, request)
        if page is not None:
            return paginator.get_paginated_response(JobSerializer(page, many=True).data)
        return Response(JobSerializer(jobs, many=True).data)

    def create(self, request):
        employer = self.get_employer(request.user)
        if not employer:
            return Response({'detail': 'Chưa có hồ sơ nhà tuyển dụng.'}, status=status.HTTP_400_BAD_REQUEST)

        ser = JobSerializer(data=request.data)
        if ser.is_valid():
            ser.save(employer=employer)
            return Response(ser.data, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        employer = self.get_employer(request.user)
        try:
            job = Job.objects.get(pk=pk, employer=employer)
            return Response(JobSerializer(job).data)
        except Job.DoesNotExist:
            return Response({'detail': 'Không tìm thấy tin tuyển dụng.'}, status=status.HTTP_404_NOT_FOUND)

    def partial_update(self, request, pk=None):
        employer = self.get_employer(request.user)
        try:
            job = Job.objects.get(pk=pk, employer=employer)
        except Job.DoesNotExist:
            return Response({'detail': 'Không tìm thấy tin tuyển dụng.'}, status=status.HTTP_404_NOT_FOUND)

        ser = JobSerializer(job, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        return self.partial_update(request, pk)

    def destroy(self, request, pk=None):
        employer = self.get_employer(request.user)
        try:
            job = Job.objects.get(pk=pk, employer=employer)
            job.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Job.DoesNotExist:
            return Response({'detail': 'Không tìm thấy tin tuyển dụng.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'], url_path='applications')
    def applications(self, request, pk=None):
        employer = self.get_employer(request.user)
        try:
            job = Job.objects.get(pk=pk, employer=employer)
        except Job.DoesNotExist:
            return Response({'detail': 'Không tìm thấy tin tuyển dụng.'}, status=status.HTTP_404_NOT_FOUND)

        apps = Application.objects.filter(job=job).select_related('candidate__user').order_by('-applied_at')
        return Response(ApplicationSerializer(apps, many=True).data)

    @action(detail=True, methods=['post'], url_path='review-application')
    def review_application(self, request, pk=None):
        employer = self.get_employer(request.user)
        try:
            job = Job.objects.get(pk=pk, employer=employer)
        except Job.DoesNotExist:
            return Response({'detail': 'Không tìm thấy tin tuyển dụng.'}, status=status.HTTP_404_NOT_FOUND)

        app_id = request.data.get('application_id')
        new_status = request.data.get('status')
        rating = request.data.get('rating')
        employers_note = request.data.get('employers_note')

        valid_statuses = ['pending', 'reviewed', 'interviewing', 'accepted', 'rejected']
        if new_status and new_status not in valid_statuses:
            return Response({'detail': 'Trạng thái không hợp lệ.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            app = Application.objects.get(id=app_id, job=job)
        except Application.DoesNotExist:
            return Response({'detail': 'Không tìm thấy hồ sơ.'}, status=status.HTTP_404_NOT_FOUND)

        if new_status:
            app.status = new_status
        if rating is not None:
            app.rating = rating
        if employers_note is not None:
            app.employers_note = employers_note
        app.save()

        return Response(ApplicationSerializer(app).data)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Thống kê NTD: số hồ sơ, hiệu quả theo tháng"""
        from django.db.models import Count
        from django.db.models.functions import TruncMonth
        import datetime

        employer = self.get_employer(request.user)
        if not employer:
            return Response({'detail': 'Chưa có hồ sơ nhà tuyển dụng.'}, status=status.HTTP_404_NOT_FOUND)

        jobs = Job.objects.filter(employer=employer)
        total_jobs = jobs.count()
        total_applications = Application.objects.filter(job__in=jobs).count()
        total_views = sum(j.views_count for j in jobs)


        six_months_ago = datetime.date.today().replace(day=1)
        monthly = (
            Application.objects
            .filter(job__in=jobs)
            .annotate(month=TruncMonth('applied_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        return Response({
            'total_jobs': total_jobs,
            'total_applications': total_applications,
            'total_views': total_views,
            'monthly_applications': [
                {'month': m['month'].strftime('%Y-%m'), 'count': m['count']}
                for m in monthly
            ]
        })
