from rest_framework import serializers
from apps.models.jobs import Job, JobCategory
from apps.models.employers import Employer

class JobEmployerSerializer(serializers.ModelSerializer):

    company_name = serializers.ReadOnlyField(source='company.name')
    company_address = serializers.ReadOnlyField(source='company.address')
    class Meta:
        model = Employer
        fields = ['company_name', 'company_address' ]

class JobCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = JobCategory
        fields = ['id', 'name']

class JobSerializer(serializers.ModelSerializer):
    Employer = JobEmployerSerializer(read_only=True)
    category = JobCategorySerializer(read_only=True)
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'requirements', 'benefits', 
            'salary_min', 'salary_max', 'location', 'experience_level', 
            'views_count', 'deadline', 'created_at', 'Employer', 'category'
        ]

