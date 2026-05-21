from rest_framework import serializers
from apps.models.candidates import CandidateProfile, Application

class CandidateProfileSerializer(serializers.ModelSerializer):
        class Meta:
            model = CandidateProfile
            fields = [
                "user", "full_name",
                 "is_looking_for_job", "cv_file", "updated_date"
            ]
            read_only_fields = ["user", "updated_date"]

        def to_representation(self , instance):
            data = super().to_representation(instance)
            if  instance.user and instance.user.avatar:
                data['avatar'] = instance.user.avatar.url

            if instance.cv_file:
                data['cv_file'] = instance.cv_file.url
            return data
class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields =[
            "id", "candidate", "job", "cover_letter", 
            "employers_note", "rating", "status", "applied_at"
        ]
        read_only_fields = ["id", "candidate", "applied_at"]
