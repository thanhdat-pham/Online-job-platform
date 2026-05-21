from django.contrib import admin
from apps.models.candidates import CandidateProfile, Application
from apps.models.employers import Company, Employer
from apps.models.jobs import Job, JobCategory
from apps.models.user import User
from django.utils.html import format_html
import cloudinary


admin.site.register(CandidateProfile)
admin.site.register(Application)
admin.site.register(Company)
admin.site.register(Employer)
admin.site.register(JobCategory)
  

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'employer', 'location', 'deadline', 'created_at')  # Employer → employer
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

    class CandidateProfileAdmin(admin.ModelAdmin):
        readonly_fields = ['cv_link']

        def cv_link(self, obj):
            if obj.cv_file:
                raw_url = cloudinary.CloudinaryImage(str(obj.cv_file)).build_url(resource_type='raw')

                # 2. Nhúng qua Google Docs Viewer để xem trực tiếp
                viewer_url = f"https://docs.google.com/viewer?url={raw_url}&embedded=true"

                return format_html(
                    '<a href="{}" target="_blank" style="padding: 5px; background: #eee; border: 1px solid #ccc;">Xem CV (Google Viewer)</a>',
                    viewer_url
                )
            return "Chưa có CV"