from django.contrib import admin
from apps.models.jobs import Job, JobCategory

admin.site.register(JobCategory)
  

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'Employer', 'location', 'deadline', 'created_at')
    list_filter = ('experience_level', 'category')
    search_fields = ('title', 'location')
    date_hierarchy = 'created_at'