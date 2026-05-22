from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps import views

router = DefaultRouter()
router.register('users', views.UserViewSet, basename='user')
router.register('candidates', views.CandidateViewSet, basename='candidate')
router.register('applications', views.ApplicationViewSet, basename='application')
router.register('jobs', views.JobViewSet, basename='job')
router.register('employer', views.EmployerProfileViewSet, basename='employer')
router.register('employer-jobs', views.EmployerProfileViewSet, basename='employer-job')
router.register('notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]