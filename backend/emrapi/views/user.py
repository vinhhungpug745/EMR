from django.contrib.auth.models import User
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import filters, viewsets

from emrapi.models import StaffProfile
from emrapi.audit import AuditTrailMixin
from emrapi.permission import IsEMRAdmin
from emrapi.serializers import UserSerializer


class UserViewSet(AuditTrailMixin, viewsets.ModelViewSet):
    http_method_names = ['get', 'post', 'patch', 'head', 'options']
    queryset = User.objects.select_related(
        'staff_profile__department'
    ).order_by('username')
    serializer_class = UserSerializer
    permission_classes = [IsEMRAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering_fields = ['username', 'first_name', 'last_name', 'date_joined']
    ordering = ['username']

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role')
        status = self.request.query_params.get('status')

        if role and role != 'all':
            queryset = queryset.filter(staff_profile__role=role)

        if status == 'active':
            queryset = queryset.filter(is_active=True)
        elif status == 'inactive':
            queryset = queryset.filter(is_active=False)

        return queryset

