from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.models.candidates import CandidateProfile, Application
from apps.models.jobs import Job
from apps.serializers.candidates_serializer import CandidateProfileSerializer, ApplicationSerializer

class CandidateViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(methods=['get', 'patch'], detail=False, url_path='current-user')
    def current_user_profile(self, request):
        try:
            candidate = request.user.candidate_profile  
        except AttributeError:
            return Response({"detail": "Tài khoản của bạn không có vai trò Ứng viên."}, status=status.HTTP_400_BAD_REQUEST)

        if request.method == 'PATCH':
            serializer = CandidateProfileSerializer(candidate, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            candidate = serializer.save()

        return Response(CandidateProfileSerializer(candidate).data, status=status.HTTP_200_OK)

    @action(methods=['post'], detail=False, url_path='apply-job')
    def apply_job(self, request):
        if not hasattr(request.user, 'candidate_profile'):
            return Response(
                {"detail": "Chức năng này chỉ dành cho tài khoản Ứng viên."},
                status=status.HTTP_403_FORBIDDEN
        )
        candidate = request.user.candidate_profile
        job_id = request.data.get('job')
        if not Job.objects.filter(id=job_id).exists():
            return Response({"detail": "Công việc này không tồn tại hoặc đã bị xóa."}, status=status.HTTP_404_NOT_FOUND)

        if Application.objects.filter(candidate=candidate, job_id=job_id).exists():
            return Response({"detail": "Bạn đã nộp đơn ứng tuyển cho công việc này rồi!"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
    
        serializer.save(candidate=candidate, status='pending')
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(methods=['get'], detail=False, url_path='my-applications')
    def my_applications(self, request):
        if not hasattr(request.user, 'candidate_profile'):
            return Response(
                {"detail": "Chức năng này chỉ dành cho tài khoản Ứng viên."},
                status=status.HTTP_403_FORBIDDEN
            )
        candidate = request.user.candidate_profile
        
        applications = Application.objects.filter(candidate=candidate).select_related('job').order_by('-applied_at')
        
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['delete'], detail=True, url_path='cancel-application')
    def cancel_application(self, request, pk=None):
        if not hasattr(request.user, 'candidate_profile'):
            return Response(
                {"detail": "Chức năng này chỉ dành cho tài khoản Ứng viên."},
                status=status.HTTP_403_FORBIDDEN
            )
        candidate = request.user.candidate_profile
        try:
            application = Application.objects.get(pk=pk, candidate=candidate)
        except Application.DoesNotExist:
            return Response({"detail": "Không tìm thấy đơn ứng tuyển hợp lệ."}, status=status.HTTP_404_NOT_FOUND)

        if application.status != 'pending':
            return Response({"detail": "Không thể hủy đơn ứng tuyển đã được Nhà tuyển dụng xử lý."}, status=status.HTTP_400_BAD_REQUEST)
        application.delete()
        return Response({"detail": "Hủy đơn ứng tuyển thành công!"}, status=status.HTTP_200_OK)
    
