from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps import views

router = DefaultRouter()
router.register('users', views.UserViewSet, basename='user')
router.register('candidates', views.CandidateViewSet, basename='candidate')
router.register('applications', views.ApplicationViewSet, basename='application')
router.register('jobs', views.JobViewSet, basename='job')
router.register('employer/jobs', views.EmployerJobViewSet, basename='employer-job')
router.register('notifications', views.NotificationViewSet, basename='notification')
router.register('categories', views.JobCategoryViewSet, basename='category')

employer_profile_view = views.EmployerProfileViewSet.as_view({
    'get': 'profile',
    'patch': 'profile',
    'put': 'profile',
})

urlpatterns = [
    path('', include(router.urls)),
    path('employer-profile/', employer_profile_view, name='employer-profile'),
    path('employer-profile/request-verification/', views.EmployerProfileViewSet.as_view({'post': 'request_verification'}), name='employer-profile-request-verification'),
    path('employer-profile/verification-status/', views.EmployerProfileViewSet.as_view({'get': 'verification_status'}), name='employer-profile-verification-status'),
]