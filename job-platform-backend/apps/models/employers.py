from django.db import models
from .user import User
from cloudinary.models import CloudinaryField
from django.core.validators import FileExtensionValidator
class Company(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255,null=True, blank=True)
    logo = CloudinaryField(
        'logo',
        null=True,
        blank=True,

    )
    is_preset = models.BooleanField(default=False, verbose_name="Công ty có sẵn")
    created_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "company"
        verbose_name = "Công ty"
        verbose_name_plural = "Công ty"

    def __str__(self):
        
        return self.name
class Employer(models.Model):

    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
         limit_choices_to={'role': 'EMPLOYER'},
        related_name='employer_profile',
        primary_key=True
    )
    company_size = models.CharField(
        max_length=50, 

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
    full_name = models.CharField(max_length=255, null=True, blank=True, verbose_name="Người đại diện")
    updated_date = models.DateTimeField(auto_now=True)
    position = models.CharField(max_length=100, null=True, blank=True, verbose_name="Chức vụ")
    bio = models.TextField(null=True, blank=True, verbose_name="Giới thiệu bản thân")
    class Meta:
        db_table = "employer_profiles"
        verbose_name = "Hồ sơ Nhà tuyển dụng"

    def __str__(self):
        return f"{self.user.username} @ {self.company.name}"