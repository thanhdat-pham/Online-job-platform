
from django.contrib.auth.models import AbstractUser
from django.db import models
from cloudinary.models import CloudinaryField
from django.core.validators import FileExtensionValidator


class BaseModel(models.Model):
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True  

class User(AbstractUser, BaseModel):
    ROLE_CHOICES = (
        ('ADMIN', 'Quản trị viên'),
        ('EMPLOYER', 'Nhà tuyển dụng'),
        ('CANDIDATE', 'Ứng viên'),
    )

    email = models.EmailField(unique=True)
    avatar = CloudinaryField('image', 
        null=True, 
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])])
    
    phone_number = models.CharField(
        max_length=15, 
        unique=True, 
        null=True, 
        blank=True, 
        verbose_name="Số điện thoại"
    )

    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='CANDIDATE', 
        verbose_name="Vai trò người dùng"
    )

    is_verified = models.BooleanField(
        default=False, 
        verbose_name="Trạng thái xác minh (Admin duyệt)"
    )
    
    rejection_reason = models.TextField(
        null=True, 
        blank=True, 
        verbose_name="Lý do từ chối duyệt"
    )

    def save(self, *args, **kwargs):
        if self.role == 'CANDIDATE':
            self.is_verified = True
        super().save(*args, **kwargs)

    class Meta:
        db_table = "users"

    def __str__(self):
        return f"{self.email} - {self.get_role_display()}"

class VerificationRequest(models.Model):
    STATUS_CHOICES = [
        ('pending',  'Chờ duyệt'),
        ('approved', 'Đã duyệt'),
        ('rejected', 'Từ chối'),
    ]
    employer = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'EMPLOYER'},
        related_name='verification_requests',
        verbose_name="Nhà tuyển dụng"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES,
        default='pending', verbose_name="Trạng thái"
    )
    note = models.TextField(blank=True, verbose_name="Lý do từ chối")
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        'User', on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reviewed_requests'
    )

    class Meta:
        db_table = "verification_requests"
        verbose_name = "Yêu cầu xác minh NTD"
        verbose_name_plural = "Yêu cầu xác minh NTD"
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.employer.email} — {self.get_status_display()}"

