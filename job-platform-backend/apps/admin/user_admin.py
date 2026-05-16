from django.contrib import admin
from apps.models.user import User
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'role', 'is_verified', 'is_staff')
    list_filter = ('role', 'is_verified', 'is_active')
    search_fields = ('email', 'username', 'phone_number')
    ordering = ('-created_date',)

    fieldsets = (
       ("Tài khoản", {
            "fields": ("username", "password")
        }),
        ("Thông tin cá nhân", {
            # Đã loại bỏ first_name và last_name ở đây
            "fields": ("email", "phone_number", "avatar") 
        }),
        ("Vai trò & Phê duyệt", {
            "fields": ("role", "is_verified", "is_active", "is_staff", "is_superuser")
        }),
    )