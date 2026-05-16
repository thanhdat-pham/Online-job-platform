from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.models.candidates import CandidateProfile, Application
from apps.serializers.candidate_serializer import CandidateProfileSerializer, ApplicationSerializer

class CandidateViewSet(viewsets.ViewSet):
    # Ép buộc phải đăng nhập mới sử dụng được các API này
    permission_classes = [permissions.IsAuthenticated]

    # =====================================================================
    # 1. API: Xem & Chỉnh sửa hồ sơ cá nhân (GET / PATCH)
    # URL: GET/PATCH /api/candidates/current-user/
    # =====================================================================
    @action(methods=['get', 'patch'], detail=False, url_path='current-user')
    def current_user_profile(self, request):
        try:
            # Lấy hồ sơ dựa vào related_name='candidate_profile' của Đạt
            candidate = request.user.candidate_profile  
        except AttributeError:
            return Response({"detail": "Tài khoản của bạn không có vai trò Ứng viên."}, status=status.HTTP_400_BAD_REQUEST)

        if request.method == 'PATCH':
            # partial=True giúp Frontend chỉ cần gửi lên những trường muốn sửa
            serializer = CandidateProfileSerializer(candidate, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            candidate = serializer.save()

        return Response(CandidateProfileSerializer(candidate).data, status=status.HTTP_200_OK)

    # =====================================================================
    # 2. API: Nộp đơn ứng tuyển việc làm (POST)
    # URL: POST /api/candidates/apply-job/
    # =====================================================================
    @action(methods=['post'], detail=False, url_path='apply-job')
    def apply_job(self, request):
        candidate = request.user.candidate_profile
        job_id = request.data.get('job')
        
        if not job_id:
            return Response({"detail": "Vui lòng cung cấp mã công việc (job id)."}, status=status.HTTP_400_BAD_REQUEST)

        # Logic chặn nộp trùng để tránh lỗi Unique của Database
        if Application.objects.filter(candidate=candidate, job_id=job_id).exists():
            return Response({"detail": "Bạn đã nộp đơn ứng tuyển cho công việc này rồi!"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Tự động gán người nộp là chính mình và ép status ban đầu là 'pending' (chữ thường)
        serializer.save(candidate=candidate, status='pending')
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # =====================================================================
    # 3. API: Xem danh sách việc làm đã nộp / Lịch sử ứng tuyển (GET)
    # URL: GET /api/candidates/my-applications/
    # =====================================================================
    @action(methods=['get'], detail=False, url_path='my-applications')
    def my_applications(self, request):
        candidate = request.user.candidate_profile
        
        # Lấy tất cả đơn nộp của ứng viên này, xếp đơn mới nhất lên đầu
        applications = Application.objects.filter(candidate=candidate).order_by('-applied_at')
        
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # =====================================================================
    # 4. API: Hủy đơn ứng tuyển (DELETE)
    # URL: DELETE /api/candidates/<id_của_đơn_nộp>/cancel-application/
    # =====================================================================
    @action(methods=['delete'], detail=True, url_path='cancel-application')
    def cancel_application(self, request, pk=None):
        candidate = request.user.candidate_profile
        try:
            # Chỉ cho phép tìm và hủy đơn nộp của chính mình
            application = Application.objects.get(pk=pk, candidate=candidate)
        except Application.DoesNotExist:
            return Response({"detail": "Không tìm thấy đơn ứng tuyển hợp lệ."}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra điều kiện: Chỉ cho phép hủy nếu trạng thái vẫn là 'pending' (chữ thường)
        if application.status != 'pending':
            return Response({"detail": "Không thể hủy đơn ứng tuyển đã được Nhà tuyển dụng xử lý."}, status=status.HTTP_400_BAD_REQUEST)

        application.delete()
        return Response({"detail": "Hủy đơn ứng tuyển thành công!"}, status=status.HTTP_200_OK)