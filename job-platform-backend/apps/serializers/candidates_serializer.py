from rest_framework import serializers
import cloudinary.uploader
from apps.models.candidates import CandidateProfile, Application


class CandidateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateProfile
        fields = [
            "user", "full_name",
            "is_looking_for_job", "cv_file", "updated_date"
        ]
        read_only_fields = ["user", "updated_date"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.cv_file:
            # Nếu nó là đối tượng FileField (có thuộc tính url)
            if hasattr(instance.cv_file, 'url'):
                data['cv_file'] = instance.cv_file.url
            else:
                # Nếu nó đã là một chuỗi đường dẫn sẵn rồi
                data['cv_file'] = instance.cv_file
        else:
            data['cv_file'] = None
        return data

    def update(self, instance, validated_data):
        # Xử lý upload cv_file lên Cloudinary thủ công
        request = self.context.get('request')
        cv_file = request.FILES.get('cv_file') if request else None

        if cv_file:
            # Upload lên Cloudinary với resource_type='raw' (file PDF/DOC)
            upload_result = cloudinary.uploader.upload(
                cv_file,
                folder='candidate_cvs/',
                resource_type='raw',
                public_id=f"cv_{instance.user_id}",
                overwrite=True,
            )
            # Lưu public_id vào CloudinaryField
            instance.cv_file = upload_result['public_id']

        # Cập nhật các field còn lại
        for attr, value in validated_data.items():
            if attr != 'cv_file':  # cv_file đã xử lý thủ công
                setattr(instance, attr, value)

        instance.save()
        return instance


class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = [
            "id", "candidate", "job", "cover_letter",
            "employers_note", "rating", "status", "applied_at"
        ]
        read_only_fields = ["id", "candidate", "applied_at"]