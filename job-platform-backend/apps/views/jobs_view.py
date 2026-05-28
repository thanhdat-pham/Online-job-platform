from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from apps.models.jobs import Job, JobCategory
from apps.models.candidates import CandidateProfile, Application, SavedJob
from apps.models.notification import Notification
from apps.serializers.jobs_serializer import JobSerializer, JobCategorySerializer
from apps.serializers.candidates_serializer import ApplicationSerializer
from apps.paginators import JobPaginator


class JobCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = JobCategory.objects.all().order_by('name')
    serializer_class = JobCategorySerializer
    permission_classes = [permissions.AllowAny]


class JobViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = JobSerializer
    pagination_class = JobPaginator
    permission_classes = [permissions.AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def get_queryset(self):
        qs = Job.objects.select_related('employer__company', 'category') .prefetch_related('saved_by_candidates').order_by('-created_at')
        q = self.request.query_params.get('q')
        category = self.request.query_params.get('category')
        location = self.request.query_params.get('location')
        experience = self.request.query_params.get('experience_level')
        salary_min = self.request.query_params.get('salary_min')
        salary_max = self.request.query_params.get('salary_max')
        company = self.request.query_params.get('company_name')
        ordering = self.request.query_params.get('ordering')

        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q) | Q(location__icontains=q))
        if category:
            qs = qs.filter(category_id=category)
        if location:
            qs = qs.filter(location__icontains=location)
        if experience:
            qs = qs.filter(experience_level=experience)
        if salary_min and salary_max:
            qs = qs.filter(salary_max__gte=salary_min, salary_min__lte=salary_max)
        if company:
            qs = qs.filter(employer__company__name__icontains=company)

        ordering_map = {
            'salary_desc': '-salary_max',
            'salary_asc': 'salary_min',
            'date_desc': '-created_at',
            'date_asc': 'created_at',
        }
        if ordering and ordering in ordering_map:
            qs = qs.order_by(ordering_map[ordering])

        return qs

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        return Response(JobSerializer(instance, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='apply',
            permission_classes=[permissions.IsAuthenticated])
    def apply(self, request, pk=None):
        job = self.get_object()
        if request.user.role != 'CANDIDATE':
            return Response({'detail': 'Chỉ ứng viên mới có thể nộp hồ sơ.'}, status=status.HTTP_403_FORBIDDEN)

        profile, _ = CandidateProfile.objects.get_or_create(
            user=request.user, defaults={'full_name': request.user.username}
        )
        if Application.objects.filter(candidate=profile, job=job).exists():
            return Response({'detail': 'Bạn đã ứng tuyển vị trí này rồi.'}, status=status.HTTP_400_BAD_REQUEST)

        application = Application.objects.create(
            candidate=profile,
            job=job,
            cover_letter=request.data.get('cover_letter', ''),
        )

        try:
            employer_user = job.employer.user
            name = profile.full_name or request.user.username
            Notification.objects.create(
                user=employer_user,
                title='Ứng viên mới ứng tuyển',
                message=f'{name} vừa nộp hồ sơ cho tin "{job.title}".',
                notification_type='new_application',
            )
        except Exception:
            pass

        return Response(ApplicationSerializer(application).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='save',
            permission_classes=[permissions.IsAuthenticated])
    def save(self, request, pk=None):
        job = self.get_object()
        if request.user.role != 'CANDIDATE':
            return Response({'detail': 'Chỉ ứng viên mới có thể lưu tin.'}, status=status.HTTP_403_FORBIDDEN)

        profile = request.user.candidate_profile
        saved_job, created = SavedJob.objects.get_or_create(candidate=profile, job=job)

        if created:
            return Response({'detail': 'Đã lưu công việc.'}, status=status.HTTP_201_CREATED)
        else:
            saved_job.delete()
            return Response({'detail': 'Đã bỏ lưu công việc.'}, status=status.HTTP_200_OK)