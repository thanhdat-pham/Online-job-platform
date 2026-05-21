from django.contrib import admin
from apps.models.candidates import CandidateProfile, Application
from apps.models.employers import Company, Employer
from apps.models.jobs import Job, JobCategory
from apps.models.user import User
from django.utils.html import format_html
import cloudinary


def get_cv_direct_url(cv_file):
    """
    Lấy URL trực tiếp của CV.
    Hỗ trợ cả 2 trường hợp: lưu dạng URL hoặc dạng public_id (legacy).
    """
    if not cv_file:
        return None
    val = str(cv_file)
    if val.startswith('http'):
        return val  # Đã là URL đầy đủ
    # Legacy: public_id → build URL
    return cloudinary.CloudinaryImage(val).build_url(resource_type='raw')


@admin.register(CandidateProfile)
class CandidateProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'is_looking_for_job', 'updated_date', 'cv_link')
    readonly_fields = ['cv_preview']

    def cv_link(self, obj):
        url = get_cv_direct_url(obj.cv_file)
        if url:
            viewer_url = f"https://docs.google.com/viewer?url={url}&embedded=true"
            return format_html('<a href="{}" target="_blank">📄 Xem CV</a>', viewer_url)
        return "Chưa có CV"
    cv_link.short_description = "CV"

    def cv_preview(self, obj):
        url = get_cv_direct_url(obj.cv_file)
        if url:
            viewer_url = f"https://docs.google.com/viewer?url={url}&embedded=true"
            return format_html(
                '''
                <div>
                    <a href="{url}" target="_blank"
                       style="display:inline-block;margin-bottom:8px;padding:6px 12px;
                              background:#1976D2;color:white;border-radius:4px;text-decoration:none;">
                        🔗 Mở CV trực tiếp
                    </a>
                    <br>
                    <iframe src="{viewer}" width="100%" height="600px"
                            style="border:1px solid #ddd;border-radius:4px;">
                    </iframe>
                </div>
                ''',
                url=url,
                viewer=viewer_url,
            )
        return "Chưa có CV"
    cv_preview.short_description = "Xem trước CV"


admin.site.register(Application)
admin.site.register(Company)
admin.site.register(Employer)
admin.site.register(JobCategory)


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'employer', 'location', 'deadline', 'created_at')
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
        ("Tài khoản", {"fields": ("username", "password")}),
        ("Thông tin cá nhân", {"fields": ("email", "phone_number", "avatar")}),
        ("Vai trò & Phê duyệt", {"fields": ("role", "is_verified", "is_active", "is_staff", "is_superuser")}),
    )