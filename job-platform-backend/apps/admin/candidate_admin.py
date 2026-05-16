from django.contrib import admin
from apps.models.candidates import CandidateProfile, Application

admin.site.register(CandidateProfile)
admin.site.register(Application)