from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
    CurrentUserView,
    DepartmentViewSet,
    LabTestCatalogViewSet,
    LoginView,
    LogoutView,
    MedicationViewSet,
    MyProfileView,
    StaffProfileViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'medications', MedicationViewSet, basename='medication')
router.register(r'lab-test-catalogs', LabTestCatalogViewSet, basename='lab-test-catalog')
router.register(r'users', UserViewSet, basename='user')
router.register(r'staff-profiles', StaffProfileViewSet, basename='staff-profile')


urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/verify/', TokenVerifyView.as_view(), name='auth-verify'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('my-profile/', MyProfileView.as_view(), name='my-profile'),
    path('', include(router.urls)),
]
