from rest_framework import serializers

from emrapi.models import AuditLog
from emrapi.audit import ACTION_LABELS, RESOURCE_LABELS

from .user import UserSummarySerializer


class AuditLogSerializer(serializers.ModelSerializer):
    actor_detail = UserSummarySerializer(source='actor', read_only=True)
    action_display = serializers.SerializerMethodField()
    resource_type_display = serializers.SerializerMethodField()

    def get_action_display(self, obj):
        return ACTION_LABELS.get(obj.action, obj.get_action_display())

    def get_resource_type_display(self, obj):
        return RESOURCE_LABELS.get(obj.resource_type, obj.resource_type)

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'actor',
            'actor_detail',
            'action',
            'action_display',
            'resource_type',
            'resource_type_display',
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
