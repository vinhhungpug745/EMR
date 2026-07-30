from rest_framework import serializers

from emrapi.models import AuditLog

from .user import UserSummarySerializer


class AuditLogSerializer(serializers.ModelSerializer):
    actor_detail = UserSummarySerializer(source='actor', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'actor',
            'actor_detail',
            'action',
            'action_display',
            'resource_type',
            'resource_id',
            'resource_repr',
            'changes',
            'description',
            'ip_address',
            'request_method',
            'request_path',
            'created_at',
        ]
        read_only_fields = fields
