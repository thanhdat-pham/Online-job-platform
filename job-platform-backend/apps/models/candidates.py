from django.db import models
from cloudinary.models import CloudinaryField
from apps.models.jobs import Job
from django.conf import settings
from django.db.models import Q
class CandidateProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete= models.CASCADE,
        limit_choices_to=Q(role='CANDIDATE', candidate_profile__isnull=True),
        related_name='candidate_profile',
        primary_key=True

    )
    location = models.CharField(max_length=100, blank=True, null=True, verbose_name="Địa điểm")
    full_name = models.CharField(
        max_length=255,

    )
    title = models.CharField(
        max_length=255,
        blank=True,
        null = True,
        verbose_name="Vị trí mong muốn"
    )
    summary = models.TextField(
        max_length=500, 
        null=True, 
        blank=True, 
        verbose_name="Giới thiệu bản thân ngắn gọn"
    )
    is_looking_for_job = models.BooleanField(default=True, verbose_name="Đang tìm việc")
    cv_file = CloudinaryField(
        "Tập tin CV (PDF/Word)", 
    folder='candidate_cvs/', 
    resource_type='raw', 
    null=True, blank=True
    )
    updated_date = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = "candidate_profile"

    def __str__(self):
        return f"Hồ sơ: {self.full_name} ({self.user.email})"
class Application(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Chờ xử lý'),
        ('reviewed', 'Đã xem hồ sơ'),
        ('interviewing', 'Đang phỏng vấn'),
        ('accepted', 'Trúng tuyển'),
        ('rejected', 'Từ chối'),
    ]
    candidate = models.ForeignKey(
        CandidateProfile, 
        on_delete=models.CASCADE, 
        related_name='applications',
        verbose_name="Ứng viên"
    )
    job = models.ForeignKey(
        Job, 
        on_delete=models.CASCADE, 
        related_name='applications',
        verbose_name="Công việc ứng tuyển"
    )
    cover_letter = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Thư giới thiệu/Lời nhắn"
    )
    employers_note = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Ghi chú của nhà tuyển dụng"
    )
    rating = models.PositiveSmallIntegerField(
        blank=True, 
        null=True, 
        verbose_name="Đánh giá chất lượng (1-5 sao)",
        help_text="Nhà tuyển dụng chấm điểm sau khi xem hồ sơ hoặc phỏng vấn"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        verbose_name="Trạng thái đơn ứng tuyển"
    )
    applied_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày nộp đơn")
    class Meta:
        db_table = "applications"
        unique_together= ('candidate', 'job')
        ordering = ['-applied_at']
    def __str__(self):
        return f"{self.candidate.full_name} nộp vào {self.job.title}"
class Interview(models.Model):
    application = models.OneToOneField(
        'Application', 
        on_delete=models.CASCADE, 
        related_name='interview',
        verbose_name="Đơn ứng tuyển"
    )
    start_time = models.DateTimeField(verbose_name="Thời gian bắt đầu")
    end_time = models.DateTimeField(verbose_name="Thời gian kết thúc", null=True, blank=True)
    location = models.CharField(max_length=255, verbose_name="Địa điểm/Link họp")
    interview_note = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Ghi chú phỏng vấn"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"Phỏng vấn: {self.application.candidate.full_name} - {self.start_time.strftime('%d/%m/%Y')}"
    
class SavedJob(models.Model):
    candidate = models.ForeignKey(
        'CandidateProfile', 
        on_delete=models.CASCADE, 
        related_name='saved_jobs',
        verbose_name="Ứng viên"
    )
    job = models.ForeignKey(
        Job, 
        on_delete=models.CASCADE, 
        related_name='saved_by_candidates',
        verbose_name="Công việc"
    )
    saved_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày lưu")
    class Meta:
        unique_together = ('candidate', 'job')
        ordering = ['-saved_at']
    def __str__(self):
        return f"{self.candidate.full_name} đã lưu {self.job.title}"