from django.db import models
from django.conf import settings
from django.db.models import Q
from apps.models.employers import Employer
from .user import User
class JobCategory(models.Model):
    name = models.CharField(max_length=100,unique=True)
    
    
    
    class Meta:
        db_table = "job_category"

    def __str__(self):
        return self.name
    

class Job(models.Model):
    EXPERIENCE_CHOICES = [
        ("no_exp", "Chưa có kinh nghiệm"),
        ("1_year", "1 năm kinh nghiệm"),
        ("2_years", "2 năm kinh nghiệm"),
        ("senior", "Trên 5 năm kinh nghiệm"),
    ]
    
    employer = models.ForeignKey(
        Employer,
        on_delete=models.CASCADE,
        related_name="jobs"
    )

    category = models.ForeignKey(
        JobCategory,
        on_delete=models.SET_NULL,
        null= True,
        related_name="jobs",
    )
    # THÔNG TIN TÌM KIẾM & SO SÁNH
    title = models.CharField(max_length=255) # Tên công việc
    description = models.TextField()         # Mô tả chi tiết
    requirements = models.TextField()        # Yêu cầu (để so sánh kinh nghiệm)
    benefits = models.TextField(blank=True)  # Phúc lợi (để so sánh đãi ngộ)
    
    # Lương: Dùng số nguyên lớn để hệ thống có thể SẮP XẾP (Sort) từ cao đến thấp
    salary_min = models.BigIntegerField(null=True, blank=True)
    salary_max = models.BigIntegerField(null=True, blank=True)
    
    location = models.CharField(max_length=200) # Địa điểm làm việc
    experience_level = models.CharField(
        max_length=20, 
        choices=EXPERIENCE_CHOICES,
        default="no_exp"
    )
    # dùng để thống kê tổng số lượt xem trên tin
    views_count = models.PositiveIntegerField(default=0, editable=False,verbose_name="Số lượt xem tin")
    # QUẢN LÝ THỜI GIAN (Phục vụ sắp xếp tin mới nhất)
    deadline = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "job"


    def __str__(self):
        return self.title