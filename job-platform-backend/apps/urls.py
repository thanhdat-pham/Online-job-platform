from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps import views

router = DefaultRouter()
router.register('users', views.UserViewSet, basename='user')
router.register('candidates', views.CandidateViewSet, basename='candidate')
router.register('applications', views.ApplicationViewSet, basename='application')
router.register('jobs', views.JobViewSet, basename='job')
router.register('employer-profile', views.EmployerProfileViewSet, basename='employer-profile')
router.register('employer/jobs', views.EmployerJobViewSet, basename='employer-job')
router.register('notifications', views.NotificationViewSet, basename='notification')
router.register('categories', views.JobCategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
]