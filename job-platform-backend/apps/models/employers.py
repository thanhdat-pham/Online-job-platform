from django.db import models
from django.conf import settings
from django.db.models import Q
from .user import User
class Company(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    created_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "company"
        verbose_name = "Công ty"
        verbose_name_plural = "Công ty"

    def __str__(self):
        
        return self.name
class Employer(models.Model):
    # Kết nối 1-1 với User định danh
    COMPANY_SIZE_CHOICES = [
        ("1-10", "1-10"),
        ("11-50", "11-50"),
        ("51-200", "51-200"),
        ("201-500", "201-500"),
        ("500+", "500+"),
    ]
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        limit_choices_to=Q(role='EMPLOYER', employer_profile__isnull=True),
        related_name='employer_profile',
        primary_key=True
    )
    company_size = models.CharField(
        max_length=50, 
        choices=COMPANY_SIZE_CHOICES, 
        null=True, 
        blank=True
    )
   
    company = models.ForeignKey(
        Company, 
        on_delete=models.CASCADE, 
        related_name='employers',
       
    )
   
       
   
    # có thể có position
    position = models.CharField(
        max_length=100, 
        null=True, 
        blank=True, 
        verbose_name="Chức vụ"
    )
    
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "employer_profiles"
        verbose_name = "Hồ sơ Nhà tuyển dụng"

    def __str__(self):
        return f"{self.user.username} @ {self.company.name}"