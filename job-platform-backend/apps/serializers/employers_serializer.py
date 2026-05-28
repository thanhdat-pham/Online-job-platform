from rest_framework import serializers
from apps.models.employers import Company, Employer


class CompanySerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=True, allow_null=True)

    class Meta:
        model = Company

        fields = ["id", "name", "address", "logo", "created_date"]
        read_only_fields = ["id", "created_date"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.logo:
            data['logo'] = instance.logo.url
        return data


class EmployerProfileSerializer(serializers.ModelSerializer):
    company_details = CompanySerializer(source="company", read_only=True)

    class Meta:
        model = Employer

        fields = [
            "full_name", "position", "bio",
            "company_details", "updated_date"
        ]
        read_only_fields = ["updated_date"]