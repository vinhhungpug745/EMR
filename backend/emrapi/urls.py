from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
    CurrentUserView,
    DepartmentViewSet,
    LabTestCatalogViewSet,
    LabTestViewSet,
    LabTechnicianQueueView,
    LoginView,
    LogoutView,
    MedicalRecordViewSet,
    MedicationViewSet,
    MyProfileView,
    StaffProfileViewSet,
    UserViewSet,
    PatientViewSet,
    EncounterViewSet,
    VisitViewSet,
    VitalSignViewSet,
    VitalSignQueueView,
    ConsultationQueueView,
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'medications', MedicationViewSet, basename='medication')
router.register(r'medical-records', MedicalRecordViewSet, basename='medical-record')
router.register(r'lab-test-catalogs', LabTestCatalogViewSet, basename='lab-test-catalog')
router.register(r'lab-tests', LabTestViewSet, basename='lab-test')
router.register(r'users', UserViewSet, basename='user')
router.register(r'staff-profiles', StaffProfileViewSet, basename='staff-profile')
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'encounters', EncounterViewSet, basename='encounter')
router.register(r'visits', VisitViewSet, basename='visit')
router.register(r'vital-signs', VitalSignViewSet, basename='vital-sign')


urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/verify/', TokenVerifyView.as_view(), name='auth-verify'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('my-profile/', MyProfileView.as_view(), name='my-profile'),
    path('vital-sign-queue/', VitalSignQueueView.as_view(), name='vital-sign-queue'),
    path('consultation-queue/', ConsultationQueueView.as_view(), name='consultation-queue'),
    path('labtechnician-queue/',LabTechnicianQueueView.as_view(), name='labtechnician-queue'),
    path('', include(router.urls)),
]
