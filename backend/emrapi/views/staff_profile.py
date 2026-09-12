from rest_framework import viewsets, filters,status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404

from emrapi.models import StaffProfile,DoctorProfile,NurseProfile,ReceptionistProfile,LabTechnicianProfile
from emrapi.serializers.staff_profile import StaffProfileSerializer,StaffProfileSummarySerializer,MyProfileSerializer
from emrapi.serializers.doctor_profile import DoctorProfileSerializer
from emrapi.serializers.nurse_profile import NurseProfileSerializer
from emrapi.serializers.receptionist_profile import ReceptionistProfileSerializer
from emrapi.serializers.lab_technician_profile import LabTechnicianProfileSerializer

from emrapi.permission import IsAnyStaff, IsEMRAdmin

PROFESSIONAL_PROFILE_MAP = {
    StaffProfile.Role.DOCTOR: {
        'attr': 'doctor_profile',
        'model': DoctorProfile,
        'serializer': DoctorProfileSerializer,
    },
    StaffProfile.Role.NURSE: {
        'attr': 'nurse_profile',
        'model': NurseProfile,
        'serializer': NurseProfileSerializer,
    },
    StaffProfile.Role.RECEPTIONIST: {
        'attr': 'receptionist_profile',
        'model': ReceptionistProfile,
        'serializer': ReceptionistProfileSerializer,
    },
    StaffProfile.Role.LAB_TECHNICIAN: {
        'attr': 'lab_technician_profile',
        'model': LabTechnicianProfile,
        'serializer': LabTechnicianProfileSerializer,
    },
}


class MyProfileView(RetrieveUpdateAPIView):
    serializer_class = MyProfileSerializer
    permission_classes = [IsAnyStaff]

    def get_object(self):
        return get_object_or_404(
            StaffProfile.objects.select_related('user', 'department'),
            user=self.request.user,
        )


class StaffProfileViewSet(viewsets.ModelViewSet):
    queryset = StaffProfile.objects.select_related('user', 'department').all()
    permission_classes = [IsEMRAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee_code', 'user__username', 'user__first_name', 'user__last_name']
    ordering_fields = ['role', 'employee_code']
    ordering = ['role', 'employee_code']

    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role')

        if role and role != 'all':
            queryset = queryset.filter(role=role)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return StaffProfileSummarySerializer
        return StaffProfileSerializer

    def create(self, request, *args, **kwargs):
        return Response(
            {'detail': 'Tao nhan vien phai thuc hien qua User API.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(methods=['get','post','patch'], detail=True,url_path='professional-profile')
    def professional_profile(self,request,pk=None):
        staff = self.get_object()
        config = PROFESSIONAL_PROFILE_MAP.get(staff.role)

        if not config:
            return Response(
                {'detail': 'Vai tro nay khong co ho so nghe nghiep.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer_class = config['serializer']

        try:
            profile = getattr(staff, config['attr'])
        except config['model'].DoesNotExist:
            profile = None

        if request.method == 'GET':
            if profile is None:
                return Response(None, status=status.HTTP_200_OK)

            serializer = serializer_class(
                profile,
                context={'request': request},
            )
            return Response(serializer.data)

        if request.method == 'POST':
            if profile is not None:
                return Response(
                    {'detail': 'Hồ sơ nghề nghiệp đã tồn tại.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = serializer_class(
                data={**request.data, 'staff': staff.id},
                context={'request': request},
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        if profile is None:
            return Response(
                {'detail': 'Hồ sơ nghề nghiệp chưa tồn tại.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = serializer_class(
            profile,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
