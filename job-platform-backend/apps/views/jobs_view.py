from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from apps.models.jobs import Job, JobCategory
from apps.models.candidates import CandidateProfile, Application
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

    def get_queryset(self):
        qs = Job.objects.select_related('employer__company', 'category').order_by('-created_at')
        q          = self.request.query_params.get('q')
        category   = self.request.query_params.get('category')
        location   = self.request.query_params.get('location')
        experience = self.request.query_params.get('experience')
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q) | Q(location__icontains=q))
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
        return Response(ApplicationSerializer(application).data, status=status.HTTP_201_CREATED)