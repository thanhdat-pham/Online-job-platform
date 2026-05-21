from rest_framework import serializers
import cloudinary
import cloudinary.uploader
from apps.models.candidates import CandidateProfile, Application


def build_cv_url(cv_file):
    """
    Trả về URL xem PDF trực tiếp.
    - Nếu cv_file đã là URL đầy đủ (https://...) → dùng luôn
    - Nếu là public_id → build URL qua Cloudinary SDK
    """
    if not cv_file:
        return None

    val = str(cv_file)

    # Đã là URL đầy đủ → trả về luôn
    if val.startswith('http'):
        return val

    # Là public_id → build URL (resource_type=raw, KHÔNG dùng fl_attachment)
    return cloudinary.CloudinaryImage(val).build_url(resource_type='raw')


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
        data['cv_file'] = build_cv_url(instance.cv_file)
        return data

    def update(self, instance, validated_data):
        request = self.context.get('request')

        # Kiểm tra xem có file gửi lên không
        if request and 'cv_file' in request.FILES:
            cv_file = request.FILES['cv_file']

            # Upload với tham số format để Cloudinary trả về link có đuôi .pdf chuẩn
            upload_result = cloudinary.uploader.upload(
                cv_file,
                folder='candidate_cvs/',
                resource_type='raw',
                public_id=f"cv_{instance.user_id}",
                overwrite=True,
                format='pdf'  # <--- THÊM DÒNG NÀY ĐỂ ÉP ĐUÔI PDF
            )

            # Lưu secure_url vào database (instance.cv_file)
            instance.cv_file = upload_result['secure_url']

        # Cập nhật các thông tin còn lại (full_name, is_looking_for_job, v.v.)
        for attr, value in validated_data.items():
            if attr != 'cv_file':
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