from rest_framework import serializers
from apps.models.candidates import CandidateProfile, Application
from apps.models.jobs import Job


class ApplicationJobSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    location = serializers.CharField()
    company_name = serializers.SerializerMethodField()

    def get_company_name(self, obj):
        try:
            return obj.employer.company.name
        except Exception:
            return None


class CandidateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateProfile
        fields = [
            "full_name", "is_looking_for_job",
            "education", "skills", "experience", "additional_info",
            "updated_date",
        ]
        read_only_fields = ["updated_date"]


class ApplicationSerializer(serializers.ModelSerializer):
    job = ApplicationJobSerializer(read_only=True)
    job_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(), source='job', write_only=True
    )
    candidate_name = serializers.ReadOnlyField(source='candidate.full_name')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Application
        fields = [
            "id", "candidate_name",
            "job", "job_id",
            "cover_letter", "employers_note", "rating",
            "status", "status_display", "applied_at",
        ]
        read_only_fields = [
            "id", "candidate_name",
            "status", "status_display", "applied_at",
        ]


class ApplicationDetailSerializer(serializers.ModelSerializer):
    job = ApplicationJobSerializer(read_only=True)
    candidate_name = serializers.ReadOnlyField(source='candidate.full_name')
    candidate_email = serializers.ReadOnlyField(source='candidate.user.email')
    candidate_user_id = serializers.ReadOnlyField(source='candidate.user.id')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Application
        fields = [
            "id", "candidate_name", "candidate_email", "candidate_user_id",
            "job", "cover_letter", "employers_note", "rating",
            "status", "status_display", "applied_at",
        ]
        read_only_fields = [
            "id", "candidate_name", "candidate_email", "candidate_user_id",
            "job", "cover_letter", "applied_at", "status_display",
        ]