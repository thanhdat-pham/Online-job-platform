from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from apps.models.user import VerificationRequest
from apps.models.employers import Employer
from apps.models.jobs import Job
from apps.models.candidates import Application
from apps.serializers.jobs_serializer import JobSerializer
from apps.serializers.employers_serializer import EmployerProfileSerializer
from apps.serializers.candidates_serializer import ApplicationSerializer
from apps.paginators import JobPaginator
from apps.permissions import IsEmployer, IsVerifiedEmployer
from oauth2_provider.contrib.rest_framework import OAuth2Authentication
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt



@method_decorator(csrf_exempt, name='dispatch')
class EmployerProfileViewSet(viewsets.ViewSet):
    authentication_classes = [OAuth2Authentication]
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @action(detail=False, methods=['post'], url_path='request-verification')
    def request_verification(self, request):
        user = request.user

        if user.is_verified:
            return Response(
                {'detail': 'Tài khoản đã được xác minh.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        already_approved = VerificationRequest.objects.filter(
            employer=user, status='approved'
        ).exists()
        if already_approved:
            return Response(
                {'detail': 'Tài khoản đã được xác minh.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        last_request = VerificationRequest.objects.filter(employer=user).order_by('-submitted_at').first()
        if last_request and last_request.status == 'pending':
            return Response({'detail': 'Bạn đã có yêu cầu đang chờ xét duyệt.'}, status=status.HTTP_400_BAD_REQUEST)

        VerificationRequest.objects.create(employer=user, status='pending')
        return Response({'detail': 'Đã gửi yêu cầu xác minh.'}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='verification-status')
    def verification_status(self, request):
        requests_qs = VerificationRequest.objects.filter(employer=request.user)

        if requests_qs.filter(status='approved').exists():
            return Response({'status': 'approved'})

        latest = requests_qs.first()
        if not latest:
            return Response({'status': None})
        return Response({
            'status': latest.status,
            'note': latest.note,
            'submitted_at': latest.submitted_at,
        })


    @action(detail=False, methods=['get', 'patch', 'put'], url_path='profile')
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


class EmployerJobViewSet(viewsets.ModelViewSet):
    authentication_classes = [OAuth2Authentication]
    permission_classes = [permissions.IsAuthenticated, IsEmployer, IsVerifiedEmployer]
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

        status_labels = {
            'reviewed':     'Ho so cua ban da duoc xem xet',
            'interviewing': 'Ban duoc moi phong van',
            'accepted':     'Chuc mung! Ban da trung tuyen',
            'rejected':     'Ho so cua ban khong phu hop',
        }
        if new_status and new_status in status_labels:
            try:
                from apps.models.notification import Notification
                company_name = job.employer.company.name if job.employer.company else 'Nha tuyen dung'
                msg = f'{status_labels[new_status]} cho vi tri "{job.title}" tai {company_name}.'
                if rating:
                    msg += f' Diem danh gia: {rating}/5.'
                if employers_note:
                    msg += f' Ghi chu: {employers_note}'
                Notification.objects.create(
                    user=app.candidate.user,
                    title=status_labels[new_status],
                    message=msg,
                    notification_type='application_update',
                )
            except Exception:
                pass

        return Response(ApplicationSerializer(app).data)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        from django.db.models import Count, Avg, Q
        from django.db.models.functions import TruncMonth, TruncQuarter, TruncYear
        import datetime

        employer = self.get_employer(request.user)
        if not employer:
            return Response({'detail': 'Chưa có hồ sơ nhà tuyển dụng.'}, status=status.HTTP_404_NOT_FOUND)


        period = request.query_params.get('period', 'month')

        jobs = Job.objects.filter(employer=employer)
        all_apps = Application.objects.filter(job__in=jobs)


        total_jobs = jobs.count()
        total_applications = all_apps.count()
        total_views = jobs.aggregate(total=Count('views_count'))['total'] or 0
        total_views = sum(j.views_count for j in jobs)

        accepted = all_apps.filter(status='accepted').count()
        rejected = all_apps.filter(status='rejected').count()
        pending = all_apps.filter(status='pending').count()
        interviewing = all_apps.filter(status='interviewing').count()


        acceptance_rate = round(accepted / total_applications * 100, 1) if total_applications else 0


        avg_rating = all_apps.filter(rating__isnull=False).aggregate(avg=Avg('rating'))['avg']
        avg_rating = round(avg_rating, 1) if avg_rating else None


        if period == 'quarter':
            trunc_fn = TruncQuarter
            fmt = lambda d: f"Q{((d.month - 1) // 3) + 1}/{d.year}"
        elif period == 'year':
            trunc_fn = TruncYear
            fmt = lambda d: str(d.year)
        else:  # month (mặc định)
            trunc_fn = TruncMonth
            fmt = lambda d: d.strftime('%m/%Y')

        trend = (
            all_apps
            .annotate(period=trunc_fn('applied_at'))
            .values('period')
            .annotate(
                total=Count('id'),
                accepted=Count('id', filter=Q(status='accepted')),
                rejected=Count('id', filter=Q(status='rejected')),
            )
            .order_by('period')
        )


        job_performance = (
            jobs.annotate(
                app_count=Count('applications'),
                accepted_count=Count('applications', filter=Q(applications__status='accepted')),
                avg_rating=Avg('applications__rating'),
            )
            .values('id', 'title', 'views_count', 'app_count', 'accepted_count', 'avg_rating', 'deadline', 'created_at')
            .order_by('-app_count')[:10]  # top 10 tin có nhiều hồ sơ nhất
        )

        return Response({

            'total_jobs': total_jobs,
            'total_applications': total_applications,
            'total_views': total_views,
            'acceptance_rate': acceptance_rate,
            'avg_rating': avg_rating,


            'status_breakdown': {
                'pending': pending,
                'interviewing': interviewing,
                'accepted': accepted,
                'rejected': rejected,
            },


            'trend': [
                {
                    'label': fmt(t['period']),
                    'total': t['total'],
                    'accepted': t['accepted'],
                    'rejected': t['rejected'],
                }
                for t in trend
            ],


            'job_performance': [
                {
                    'id': j['id'],
                    'title': j['title'],
                    'views': j['views_count'],
                    'applications': j['app_count'],
                    'accepted': j['accepted_count'],
                    'avg_rating': round(j['avg_rating'], 1) if j['avg_rating'] else None,
                    'deadline': j['deadline'],
                }
                for j in job_performance
            ],
        })