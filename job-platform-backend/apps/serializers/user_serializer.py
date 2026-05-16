from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from apps.models.user import User

class UserBaseSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.avatar:
            # Đảm bảo trả về URL tuyệt đối từ Cloudinary
            data['avatar'] = instance.avatar.url
        return data
    
    class Meta:
        model = User
        fields = []
class RegisterSerializer(UserBaseSerializer):
  
    password = serializers.CharField(
        write_only=True, 
        required=True,
        validators=[validate_password]
    )
    avatar = serializers.ImageField(required=True, allow_null=False)
    phone_number = serializers.CharField(required=True, allow_null=False)
    class Meta:
        model = User
        
        fields = ["username", "email", "password", "role", "phone_number", "avatar"]
    
    def validate_role(self, value):
       
        role_upper = value.upper()
        if role_upper == "ADMIN":
            raise serializers.ValidationError("Không được phép đăng ký tài khoản Quản trị viên.")
        
        # Kiểm tra xem role gửi lên có nằm trong danh sách cho phép không
        valid_roles = [choice[0] for choice in User.ROLE_CHOICES]
        if role_upper not in valid_roles:
            raise serializers.ValidationError("Vai trò không hợp lệ.")
            
        return role_upper

    def create(self, validated_data):
        user = User(**validated_data)
        user.set_password(user.password)
        user.save()

        return user
    
class UserSerializer(UserBaseSerializer):
    
    class Meta:
        model = User
       
        fields = ["id", "username", "email", "role", "phone_number", "avatar", "is_active", "date_joined"]
        read_only_fields = ["id", "username", "date_joined"]

