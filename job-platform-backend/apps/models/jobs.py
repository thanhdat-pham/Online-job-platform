from django.db import models
from apps.models.employers import Employer
class JobCategory(models.Model):
    name = models.CharField(max_length=100,unique=True)
    
    
    
    class Meta:
        db_table = "job_category"
        verbose_name = "Ngành nghề"
        verbose_name_plural = "Ngành nghề"

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

    title = models.CharField(max_length=255)
    description = models.TextField()
    requirements = models.TextField(blank=True)
    benefits = models.TextField(blank=True)
    

    salary_min = models.BigIntegerField(null=True, blank=True)
    salary_max = models.BigIntegerField(null=True, blank=True)
    
    location = models.CharField(max_length=200)
    experience_level = models.CharField(
        max_length=20, 
        choices=EXPERIENCE_CHOICES,
        default="no_exp"
    )

    views_count = models.PositiveIntegerField(default=0, editable=False,verbose_name="Số lượt xem tin")

    deadline = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "job"
        verbose_name = "công việc"
        verbose_name_plural = "công việc"

    def __str__(self):
        return self.title