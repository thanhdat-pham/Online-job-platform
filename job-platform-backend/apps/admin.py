from django.contrib import admin
from apps.models.candidates import CandidateProfile, Application
from apps.models.employers import Company, Employer
from apps.models.jobs import Job, JobCategory
from apps.models.user import User


admin.site.register(CandidateProfile)
admin.site.register(Application)
admin.site.register(Company)
admin.site.register(Employer)
admin.site.register(JobCategory)
  

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'Employer', 'location', 'deadline', 'created_at')
    list_filter = ('experience_level', 'category')
    search_fields = ('title', 'location')
    date_hierarchy = 'created_at'

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