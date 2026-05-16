from django.db import models
from .user import User


class Notification(models.Model):
    TYPE_CHOICES = [
        ("application_update", "Cập nhật ứng tuyển"), 
        ("interview_invite",   "Mời phỏng vấn"),      
        ("job_recommendation", "Gợi ý việc làm"),     
        ("employer_verify",    "Xác minh NTD"),       
        ("new_application",    "Ứng tuyển mới"),      
        ("system",             "Hệ thống"),               ]
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notifications',
        verbose_name="Người nhận"
    )
    title = models.CharField(max_length=255, verbose_name="Tiêu đề")
    message = models.TextField(verbose_name="Nội dung thông báo")
    notification_type = models.CharField(
        max_length=25, 
        choices=TYPE_CHOICES, 
        default="system"
    )
    link = models.CharField(max_length=255, blank=True, null=True)
    
    is_read = models.BooleanField(default=False, verbose_name="Đã đọc")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-created_at']
    def __str__(self):
        return f"{self.user.username} - {self.title}"
