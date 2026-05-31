from rest_framework import serializers
from apps.models.jobs import Job, JobCategory
from apps.models.employers import Employer

class JobEmployerSerializer(serializers.ModelSerializer):

    company_name = serializers.ReadOnlyField(source='company.name')
    company_address = serializers.ReadOnlyField(source='company.address')
    company_logo = serializers.SerializerMethodField()
    class Meta:
        model = Employer
        fields = ['company_name', 'company_address', 'company_logo' ]

    def get_company_logo(self, obj):
        if obj.company and obj.company.logo:
            return obj.company.logo.url
        return None

class JobCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = JobCategory
        fields = ['id', 'name']

class JobSerializer(serializers.ModelSerializer):
    employer = JobEmployerSerializer(read_only=True)
    category = JobCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=JobCategory.objects.all(),
        source='category',
        write_only=True,
        required=True,
        allow_null=True
    )
    is_saved = serializers.SerializerMethodField()
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'requirements', 'benefits', 
            'salary_min', 'salary_max', 'location', 'experience_level',
            'views_count', 'deadline', 'created_at', 'employer', 'category', 'category_id','is_saved'
        ]

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and hasattr(request.user, 'candidate_profile'):
            profile = request.user.candidate_profile

            return any(s.candidate_id == profile.pk for s in obj.saved_by_candidates.all())
        return False
