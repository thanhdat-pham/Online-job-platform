from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from cloudinary.uploader import upload as cloudinary_upload

from apps.models.jobs import Job, JobCategory
from apps.models.candidates import CandidateProfile, Application
from apps.serializers.jobs_serializer import JobSerializer, JobCategorySerializer
from apps.serializers.candidates_serializer import ApplicationSerializer
from apps.paginators import JobPaginator


class JobViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public: list jobs, retrieve job detail, apply to job, list my applications, withdraw application.
    """
    serializer_class = JobSerializer
    pagination_class = JobPaginator

    def get_queryset(self):
        qs = Job.objects.select_related('employer__company', 'category').order_by('-created_at')
        q = self.request.query_params.get('q')
        job_type = self.request.query_params.get('job_type')
        category = self.request.query_params.get('category')
        location = self.request.query_params.get('location')
        experience = self.request.query_params.get('experience')

        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q) | Q(location__icontains=q))
        if job_type:
            qs = qs.filter(job_type=job_type)
        if category:
            qs = qs.filter(category_id=category)
        if location:
            qs = qs.filter(location__icontains=location)
        if experience:
            qs = qs.filter(experience_level=experience)
        return qs

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        return Response(JobSerializer(instance).data)

    @action(detail=True, methods=['post'], url_path='apply',
            permission_classes=[permissions.IsAuthenticated],
            parser_classes=[MultiPartParser, FormParser])
    def apply(self, request, pk=None):
        job = self.get_object()
        user = request.user
        if user.role != 'CANDIDATE':
            return Response({'detail': 'Chỉ ứng viên mới có thể nộp hồ sơ.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            profile = user.candidate_profile
        except Exception:
            return Response({'detail': 'Bạn chưa có hồ sơ ứng viên.'}, status=status.HTTP_400_BAD_REQUEST)

        if Application.objects.filter(candidate=profile, job=job).exists():
            return Response({'detail': 'Bạn đã ứng tuyển vị trí này rồi.'}, status=status.HTTP_400_BAD_REQUEST)

        # Handle CV file upload
        cv_file = request.FILES.get('cv')
        if cv_file:
            upload_result = cloudinary_upload(cv_file, resource_type='raw', folder='application_cvs/')
            # Update candidate profile cv
            profile.cv_file = upload_result['public_id']
            profile.save()

        application = Application.objects.create(
            candidate=profile,
            job=job,
            cover_letter=request.data.get('cover_letter', ''),
        )
        return Response(ApplicationSerializer(application).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='me',
            permission_classes=[permissions.IsAuthenticated])
    def my_applications(self, request):
        user = request.user
        try:
            profile = user.candidate_profile
        except Exception:
            return Response([])
        applications = Application.objects.filter(candidate=profile).select_related('job__employer__company').order_by('-applied_at')
        page = self.paginate_queryset(applications)
        if page is not None:
            return self.get_paginated_response(ApplicationSerializer(page, many=True).data)
        return Response(ApplicationSerializer(applications, many=True).data)

    @action(detail=True, methods=['delete'], url_path='withdraw',
            permission_classes=[permissions.IsAuthenticated])
    def withdraw(self, request, pk=None):
        try:
            profile = request.user.candidate_profile
            app = Application.objects.get(id=pk, candidate=profile)
            if app.status != 'pending':
                return Response({'detail': 'Không thể rút hồ sơ sau khi đã được xem xét.'}, status=status.HTTP_400_BAD_REQUEST)
            app.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Application.DoesNotExist:
            return Response({'detail': 'Không tìm thấy hồ sơ.'}, status=status.HTTP_404_NOT_FOUND)


class ApplicationViewSet(viewsets.ViewSet):
    """Handles withdraw by application ID"""
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['delete'], url_path='withdraw')
    def withdraw(self, request, pk=None):
        try:
            profile = request.user.candidate_profile
            app = Application.objects.get(id=pk, candidate=profile)
            if app.status != 'pending':
                return Response({'detail': 'Không thể rút hồ sơ sau khi đã được xem xét.'}, status=status.HTTP_400_BAD_REQUEST)
            app.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Application.DoesNotExist:
            return Response({'detail': 'Không tìm thấy hồ sơ.'}, status=status.HTTP_404_NOT_FOUND)
