from django.contrib.admin import AdminSite
from django.contrib import admin
from django.utils import timezone
from django.urls import path, reverse
from django.utils.html import format_html
from django.db.models import Count
from django.db.models.functions import TruncMonth
from apps.models.candidates import CandidateProfile, Application
from apps.models.notification import Notification
from apps.views.dashboard_view import dashboard_view
from apps.models.employers import Company, Employer
from apps.models.jobs import Job, JobCategory
from apps.models.user import User, VerificationRequest


def _notify_verification(employer, approved, note=''):
    if approved:
        msg = 'Tài khoản nhà tuyển dụng của bạn đã được xác minh thành công. Bạn có thể đăng tin tuyển dụng ngay bây giờ.'
        if note:
            msg += f' Ghi chú từ admin: {note}'
        Notification.objects.create(
            user=employer,
            title='\u2705 Tài khoản đã được xác minh',
            message=msg,
            notification_type='employer_verify',
        )
    else:
        msg = 'Yêu cầu xác minh tài khoản của bạn đã bị từ chối. Vui lòng kiểm tra lại thông tin và gửi lại yêu cầu.'
        if note:
            msg += f' Lý do: {note}'
        Notification.objects.create(
            user=employer,
            title='\u274c Yêu cầu xác minh bị từ chối',
            message=msg,
            notification_type='employer_verify',
        )


class JobPlatformAdmin(AdminSite):
    def get_app_list(self, request, app_label=None):
        app_list = super().get_app_list(request, app_label)
        for app in app_list:
            if app["app_label"] == "apps":
                app["models"].append({
                    "name": "Báo cáo thống kê hệ thống",
                    "object_name": "Dashboard",
                    "admin_url": "/admin/dashboard/",
                    "view_only": True,
                    "add_url": None,
                    "perms": {"add": False, "change": False, "delete": False, "view": True},
                })
        return app_list


admin.site.__class__ = JobPlatformAdmin


@admin.register(VerificationRequest)
class VerificationRequestAdmin(admin.ModelAdmin):
    list_display    = ('employer', 'get_company', 'get_employer_profile', 'status', 'submitted_at', 'reviewed_by', 'reviewed_at')
    list_filter     = ('status', 'submitted_at')
    search_fields   = ('employer__email', 'employer__username')
    readonly_fields = ('employer', 'submitted_at', 'reviewed_at', 'reviewed_by', 'get_company', 'get_employer_profile')
    fields          = ('employer', 'get_employer_profile', 'get_company', 'submitted_at', 'reviewed_at', 'reviewed_by', 'status', 'note')
    actions         = ['approve_requests', 'reject_requests']

    def get_company(self, obj):
        try:
            company = obj.employer.employer_profile.company
            url = reverse('admin:apps_company_change', args=[company.id])
            return format_html('<a href="{}">{}</a>', url, company.name)
        except Exception:
            return '—'
    get_company.short_description = 'Công ty'

    def get_employer_profile(self, obj):
        try:
            url = reverse('admin:apps_employer_change', args=[obj.employer.id])
            return format_html('<a href="{}">Xem hồ sơ NTD</a>', url)
        except Exception:
            return '—'
    get_employer_profile.short_description = 'Hồ sơ NTD'

    def save_model(self, request, obj, form, change):
        if not obj.reviewed_by:
            obj.reviewed_by = request.user
        if not obj.reviewed_at:
            obj.reviewed_at = timezone.now()
        super().save_model(request, obj, form, change)

        if obj.status == 'approved':
            User.objects.filter(pk=obj.employer.pk).update(is_verified=True)
            user = obj.employer
            if hasattr(user, 'employer_profile') and user.employer_profile.company:
                company = user.employer_profile.company
                if not company.is_preset:
                    company.is_preset = True
                    company.save()
            _notify_verification(obj.employer, approved=True, note=obj.note)

        elif obj.status == 'rejected':
            User.objects.filter(pk=obj.employer.pk).update(is_verified=False)
            _notify_verification(obj.employer, approved=False, note=obj.note)

    @admin.action(description='\u2705 Duyệt các yêu cầu đã chọn')
    def approve_requests(self, request, queryset):
        for vr in queryset:
            vr.status = 'approved'
            vr.reviewed_at = timezone.now()
            vr.reviewed_by = request.user
            vr.save()
            User.objects.filter(pk=vr.employer.pk).update(is_verified=True)
            _notify_verification(vr.employer, approved=True, note=vr.note)
        self.message_user(request, f"Đã duyệt {queryset.count()} yêu cầu.")

    @admin.action(description='\u274c Từ chối các yêu cầu đã chọn')
    def reject_requests(self, request, queryset):
        for vr in queryset:
            vr.status = 'rejected'
            vr.reviewed_at = timezone.now()
            vr.reviewed_by = request.user
            vr.save()
            User.objects.filter(pk=vr.employer.pk).update(is_verified=False)
            _notify_verification(vr.employer, approved=False, note=vr.note)
        self.message_user(request, f"Đã từ chối {queryset.count()} yêu cầu.")


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display    = ('email', 'username', 'role', 'is_verified', 'is_staff')
    list_filter     = ('role', 'is_verified', 'is_active')
    search_fields   = ('email', 'username', 'phone_number')
    ordering        = ('-created_date',)
    readonly_fields = ('get_avatar',)
    fieldsets = (
        ("Tài khoản",           {"fields": ("username",)}),
        ("Thông tin cá nhân",   {"fields": ("email", "phone_number", "get_avatar")}),
        ("Vai trò & Phê duyệt", {"fields": ("role", "is_verified", "is_active", "is_staff", "is_superuser")}),
    )

    def get_avatar(self, obj):
        if obj.avatar:
            return format_html('<img src="{}" width="100" height="100" style="border-radius:50%; object-fit:cover;" />', obj.avatar.url)
        return 'Chưa có ảnh'
    get_avatar.short_description = 'Ảnh đại diện'


@admin.register(CandidateProfile)
class CandidateProfileAdmin(admin.ModelAdmin):
    list_display  = ('full_name', 'user', 'is_looking_for_job', 'updated_date')
    search_fields = ('full_name', 'user__email')


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'job', 'status', 'applied_at')
    list_filter  = ('status',)
    exclude      = ('cover_letter',)


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'is_preset', 'created_date')
    list_filter  = ('is_preset',)


@admin.register(Employer)
class EmployerAdmin(admin.ModelAdmin):
    list_display = ('user', 'company', 'position', 'full_name')


@admin.register(JobCategory)
class JobCategoryAdmin(admin.ModelAdmin):
    pass


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display   = ('title', 'employer', 'location', 'deadline', 'created_at')
    list_filter    = ('experience_level', 'category')
    search_fields  = ('title', 'location')
    date_hierarchy = 'created_at'