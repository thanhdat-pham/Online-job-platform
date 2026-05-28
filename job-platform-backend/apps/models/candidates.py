from django.db import models
from apps.models.jobs import Job
from django.conf import settings


class CandidateProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'CANDIDATE'},
        related_name='candidate_profile',
        primary_key=True
    )
    full_name = models.CharField(max_length=255)
    is_looking_for_job = models.BooleanField(default=True, verbose_name="Đang tìm việc")
    education = models.TextField(blank=True, verbose_name="Học vấn")
    skills = models.TextField(blank=True, verbose_name="Kỹ năng")
    experience = models.TextField(blank=True, verbose_name="Kinh nghiệm")
    additional_info = models.TextField(blank=True, verbose_name="Bổ sung")
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "candidate_profile"
        verbose_name = "Hồ sơ ứng viên"
        verbose_name_plural = "Hồ sơ ứng viên"

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
        CandidateProfile, on_delete=models.CASCADE,
        related_name='applications', verbose_name="Ứng viên"
    )
    job = models.ForeignKey(
        Job, on_delete=models.CASCADE,
        related_name='applications', verbose_name="Công việc ứng tuyển"
    )
    cover_letter = models.TextField(blank=True, null=True, verbose_name="Thư giới thiệu")
    employers_note = models.TextField(blank=True, null=True, verbose_name="Ghi chú của nhà tuyển dụng")
    rating = models.PositiveSmallIntegerField(blank=True, null=True, verbose_name="Đánh giá (1-5 sao)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Trạng thái")
    applied_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày nộp đơn")

    class Meta:
        db_table = "applications"
        unique_together = ('candidate', 'job')
        ordering = ['-applied_at']
        verbose_name = "Hồ sơ ứng tuyển"
        verbose_name_plural = "Hồ sơ ứng tuyển"

    def __str__(self):
        return f"{self.candidate.full_name} nộp vào {self.job.title}"


class SavedJob(models.Model):
    candidate = models.ForeignKey(
        'CandidateProfile', on_delete=models.CASCADE,
        related_name='saved_jobs', verbose_name="Ứng viên"
    )
    job = models.ForeignKey(
        Job, on_delete=models.CASCADE,
        related_name='saved_by_candidates', verbose_name="Công việc"
    )
    saved_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày lưu")

    class Meta:
        unique_together = ('candidate', 'job')
        ordering = ['-saved_at']

    def __str__(self):
        return f"{self.candidate.full_name} đã lưu {self.job.title}"