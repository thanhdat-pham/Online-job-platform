from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from apps.models.candidates import CandidateProfile, Application, SavedJob
from apps.models.jobs import Job
from apps.serializers.candidates_serializer import CandidateProfileSerializer, ApplicationSerializer


class CandidateViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get', 'patch'], url_path='profile',
            parser_classes=[MultiPartParser, FormParser])
    def profile(self, request):
        user = request.user
        if user.role != 'CANDIDATE':
            return Response({'detail': 'Chỉ ứng viên mới có hồ sơ này.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            profile = user.candidate_profile
        except CandidateProfile.DoesNotExist:
            # Auto-create profile if missing
            profile = CandidateProfile.objects.create(user=user, full_name=user.username)

        if request.method == 'GET':
            return Response(CandidateProfileSerializer(profile).data)
        ser = CandidateProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='me/applications')
    def my_applications(self, request):
        try:
            profile = request.user.candidate_profile
        except Exception:
            return Response([])
        apps = Application.objects.filter(candidate=profile).select_related(
            'job__employer__company'
        ).order_by('-applied_at')
        return Response(ApplicationSerializer(apps, many=True).data)

    # --- SavedJob (Lưu việc yêu thích) ---

    @action(detail=False, methods=['get'], url_path='saved-jobs')
    def saved_jobs(self, request):
        try:
            profile = request.user.candidate_profile
        except Exception:
            return Response([])
        from apps.serializers.jobs_serializer import JobSerializer
        saved = SavedJob.objects.filter(candidate=profile).select_related('job__employer__company', 'job__category').order_by('-saved_at')
        return Response([
            {
                'saved_id': s.id,
                'saved_at': s.saved_at,
                'job': JobSerializer(s.job).data
            }
            for s in saved
        ])

    @action(detail=False, methods=['post'], url_path='saved-jobs/toggle')
    def toggle_saved_job(self, request):
        try:
            profile = request.user.candidate_profile
        except Exception:
            return Response({'detail': 'Không tìm thấy hồ sơ ứng viên.'}, status=status.HTTP_400_BAD_REQUEST)

        job_id = request.data.get('job_id')
        try:
            job = Job.objects.get(pk=job_id)
        except Job.DoesNotExist:
            return Response({'detail': 'Không tìm thấy việc làm.'}, status=status.HTTP_404_NOT_FOUND)

        saved, created = SavedJob.objects.get_or_create(candidate=profile, job=job)
        if not created:
            saved.delete()
            return Response({'saved': False, 'message': 'Đã bỏ lưu việc làm.'})
        return Response({'saved': True, 'message': 'Đã lưu việc làm.'}, status=status.HTTP_201_CREATED)
