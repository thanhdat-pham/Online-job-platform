from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.models.candidates import CandidateProfile, Application, SavedJob
from apps.models.jobs import Job
from apps.serializers.candidates_serializer import (
    CandidateProfileSerializer, ApplicationSerializer, ApplicationDetailSerializer,
)


class CandidateViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get', 'patch'], url_path='profile')
    def profile(self, request):
        user = request.user
        if user.role != 'CANDIDATE':
            return Response({'detail': 'Chỉ ứng viên mới có hồ sơ này.'}, status=status.HTTP_403_FORBIDDEN)

        profile, _ = CandidateProfile.objects.get_or_create(
            user=user, defaults={'full_name': user.username}
        )

        if request.method == 'GET':
            return Response(CandidateProfileSerializer(profile).data)

        ser = CandidateProfileSerializer(profile, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='me/applications')
    def my_applications(self, request):
        try:
            profile = request.user.candidate_profile
        except CandidateProfile.DoesNotExist:
            return Response([])
        apps = Application.objects.filter(candidate=profile) \
            .select_related('job__employer__company').order_by('-applied_at')
        return Response(ApplicationSerializer(apps, many=True).data)

    @action(detail=False, methods=['get'], url_path='saved-jobs')
    def saved_jobs(self, request):
        try:
            profile = request.user.candidate_profile
        except CandidateProfile.DoesNotExist:
            return Response([])
        from apps.serializers.jobs_serializer import JobSerializer
        saved = SavedJob.objects.filter(candidate=profile) \
            .select_related('job__employer__company', 'job__category').order_by('-saved_at')
        return Response([
            {'saved_id': s.id, 'saved_at': s.saved_at, 'job': JobSerializer(s.job).data}
            for s in saved
        ])

    @action(detail=False, methods=['post'], url_path='saved-jobs/toggle')
    def toggle_saved_job(self, request):
        try:
            profile = request.user.candidate_profile
        except CandidateProfile.DoesNotExist:
            return Response({'detail': 'Không tìm thấy hồ sơ ứng viên.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            job = Job.objects.get(pk=request.data.get('job_id'))
        except Job.DoesNotExist:
            return Response({'detail': 'Không tìm thấy việc làm.'}, status=status.HTTP_404_NOT_FOUND)

        saved, created = SavedJob.objects.get_or_create(candidate=profile, job=job)
        if not created:
            saved.delete()
            return Response({'saved': False, 'message': 'Đã bỏ lưu việc làm.'})
        return Response({'saved': True, 'message': 'Đã lưu việc làm.'}, status=status.HTTP_201_CREATED)


class ApplicationViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        try:
            profile = request.user.candidate_profile
        except CandidateProfile.DoesNotExist:
            return Response([])
        apps = Application.objects.filter(candidate=profile) \
            .select_related('job__employer__company').order_by('-applied_at')
        return Response(ApplicationSerializer(apps, many=True).data)

    @action(detail=True, methods=['delete'], url_path='withdraw')
    def withdraw(self, request, pk=None):
        try:
            profile = request.user.candidate_profile
        except CandidateProfile.DoesNotExist:
            return Response({'detail': 'Không tìm thấy hồ sơ.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            app = Application.objects.get(pk=pk, candidate=profile)
        except Application.DoesNotExist:
            return Response({'detail': 'Không tìm thấy đơn ứng tuyển.'}, status=status.HTTP_404_NOT_FOUND)
        if app.status != 'pending':
            return Response({'detail': 'Chỉ rút được đơn khi trạng thái là "Chờ xử lý".'}, status=status.HTTP_400_BAD_REQUEST)
        app.delete()
        return Response({'message': 'Đã rút đơn thành công.'}, status=status.HTTP_204_NO_CONTENT)