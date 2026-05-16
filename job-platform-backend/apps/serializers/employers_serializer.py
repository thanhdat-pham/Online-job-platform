from rest_framework import serializers
from apps.models.employers import Company, Employer

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ["id", "name", "address", "created_date"]
        read_only_fields = ["id", "created_date"]

class EmployerProfileSerializer(serializers.ModelSerializer):
    company_details = CompanySerializer(source="company", read_only=True)
    class Meta:
        model = Employer
        fields = [
            "user", "company", "company_details", 
            "company_size", "position", "updated_date"
        ]
        read_only_fields = ["user", "updated_date"]
    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        if instance.user and instance.user.avatar:
            data['avatar'] = instance.user.avatar.url
        else:
            data['avatar'] = None
            
        return data