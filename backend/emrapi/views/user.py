from django.contrib.auth.models import User
from rest_framework import filters, viewsets

from emrapi.permission import IsEMRAdmin
from emrapi.serializers import UserSerializer


class UserViewSet(viewsets.ModelViewSet):
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
