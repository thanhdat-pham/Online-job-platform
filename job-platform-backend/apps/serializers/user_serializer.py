from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from apps.models.user import User
from apps.serializers.candidates_serializer import CandidateProfileSerializer
from apps.serializers.employers_serializer import EmployerProfileSerializer
class UserBaseSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.avatar:

            data['avatar'] = instance.avatar.url
        return data
    

    class Meta:
        model = User
        fields = []
class RegisterSerializer(UserBaseSerializer):
    full_name = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(
        write_only=True, 
        required=True,
        validators=[validate_password]
    )
    avatar = serializers.ImageField(required=True, allow_null=False)
    phone_number = serializers.CharField(required=True, allow_null=False)
    class Meta:
        model = User
        
        fields = ["username", "email", "password", "role", "phone_number", "avatar", "full_name"]
    
    def validate_role(self, value):
       
        role_upper = value.upper()
        if role_upper == "ADMIN":
            raise serializers.ValidationError("Không được phép đăng ký tài khoản Quản trị viên.")

        valid_roles = [choice[0] for choice in User.ROLE_CHOICES]
        if role_upper not in valid_roles:
            raise serializers.ValidationError("Vai trò không hợp lệ.")
            
        return role_upper
    def validate(self, attrs):
        role = attrs.get('role', '').upper()
        avatar = attrs.get('avatar')
        if role == 'CANDIDATE' and not avatar:
            raise serializers.ValidationError({"avatar": "Ứng viên phải cung cấp ảnh đại diện."})
        if role == 'EMPLOYER' and not avatar:
            raise serializers.ValidationError({"avatar": "Nhà tuyển dụng phải cung cấp ảnh người đại diện."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        full_name = validated_data.pop('full_name', '')
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        return user
    
class UserSerializer(UserBaseSerializer):

    full_name = serializers.SerializerMethodField()
    company_name = serializers.CharField(source='employer_profile.company.name', read_only=True)
    position = serializers.CharField(source='employer_profile.position', read_only=True)
    candidate_profile = serializers.SerializerMethodField()
    employer_profile = serializers.SerializerMethodField()
    class Meta:
        model = User

        fields = [
             "id", "username", "email", "role", "phone_number",
            "avatar", "is_active", "date_joined", "full_name",
            "company_name", "position", "candidate_profile", "employer_profile" , "is_verified",
        ]
        read_only_fields = ["id", "username", "date_joined"]

    def get_full_name(self, obj):
        if obj.role == 'CANDIDATE':

            profile = getattr(obj, 'candidate_profile', None)
            return profile.full_name if profile else None
        elif obj.role == 'EMPLOYER':
            profile = getattr(obj, 'employer_profile', None)
            return profile.full_name if profile else None
        return None

    def get_candidate_profile(self, obj):
        if obj.role == 'CANDIDATE':
            profile = getattr(obj, 'candidate_profile', None)
            if profile:
                return CandidateProfileSerializer(profile).data
        return None

    def get_employer_profile(self, obj):
        if obj.role == 'EMPLOYER':
            profile = getattr(obj, 'employer_profile', None)
            if profile:
                return EmployerProfileSerializer(profile).data  
        return None