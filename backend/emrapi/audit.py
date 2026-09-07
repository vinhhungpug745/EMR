
from ipaddress import ip_address

from django.db import transaction

from emrapi.models import AuditLog


ACTION_LABELS = {
    'create': 'Tạo mới', 'view': 'Xem', 'update': 'Cập nhật', 'delete': 'Xóa',
    'login': 'Đăng nhập', 'login_failed': 'Đăng nhập thất bại', 'logout': 'Đăng xuất',
}
RESOURCE_LABELS = {
    'User': 'Tài khoản', 'StaffProfile': 'Hồ sơ nhân viên',
    'Department': 'Khoa', 'Patient': 'Bệnh nhân', 'Visit': 'Lần đến khám',
    'Encounter': 'Lượt khám', 'MedicalRecord': 'Hồ sơ bệnh án',
    'VitalSign': 'Sinh hiệu', 'Medication': 'Thuốc', 'Prescription': 'Đơn thuốc',
    'LabTest': 'Xét nghiệm', 'LabTestCatalog': 'Danh mục xét nghiệm',
    'OutpatientReport': 'Báo cáo ngoại trú',
}


class AuditTrailMixin:
    def dispatch(self, request, *args, **kwargs):
        with transaction.atomic():
            response = super().dispatch(request, *args, **kwargs)
            if 200 <= response.status_code < 300:
                self.record_audit(response)
            elif response.status_code >= 400:
                transaction.set_rollback(True)
        # Failed login must survive the rolled-back authentication transaction.
        if self.audit_route == 'auth-login' and response.status_code in (400, 401, 403):
            self.record_audit(response, login_failed=True)
        return response

    @property
    def audit_route(self):
        match = self.request.resolver_match
        return match.url_name if match else ''

    def record_audit(self, response, login_failed=False):
        request = self.request
        if request.method in ('HEAD', 'OPTIONS'):
            return
        actor = request.user if request.user.is_authenticated else None
        data = response.data if isinstance(getattr(response, 'data', None), dict) else {}
        resource_id = self.kwargs.get('pk') or data.get('id')
        changes = {}
        if self.audit_route == 'auth-login':
            action = 'login_failed' if login_failed else 'login'
            actor_id = None if login_failed else data.get('user', {}).get('id')
            resource_type, resource_id = 'User', actor_id
        else:
            if actor is None:
                return
            actor_id = actor.pk
            queryset = getattr(self, 'queryset', None)
            model = queryset.model if queryset is not None else None
            if model is None and hasattr(self, 'get_serializer_class'):
                model = getattr(getattr(self.get_serializer_class(), 'Meta', None), 'model', None)
            resource_type = model.__name__ if model else 'OutpatientReport'
            action = {'GET': 'view', 'POST': 'create', 'PATCH': 'update',
                      'PUT': 'update', 'DELETE': 'delete'}.get(request.method)
            if not action:
                return
            if request.method == 'POST' and self.kwargs.get('pk'):
                action = 'update'
            if self.audit_route == 'auth-logout':
                action, resource_type, resource_id = 'logout', 'User', actor_id
            if model and request.method in ('POST', 'PUT', 'PATCH'):
                # Allow only known model field names; never copy arbitrary input keys/values.
                allowed = {field.name for field in model._meta.fields} - {'password'}
                changes = {'submitted_fields': sorted(allowed.intersection(request.data))}
        try:
            # Forwarded headers are untrusted unless a proxy policy is configured.
            remote_ip = str(ip_address(request.META.get('REMOTE_ADDR', '')))
        except ValueError:
            remote_ip = None
        label = RESOURCE_LABELS.get(resource_type, resource_type)
        description = f'{ACTION_LABELS[action]} · {label}'
        if getattr(self, 'action', '') == 'transfer_specialty':
            description = 'Chuyển chuyên khoa · Lượt khám'
        elif getattr(self, 'action', '') == 'professional_profile':
            description = f'{ACTION_LABELS[action]} · Hồ sơ chuyên môn'
        AuditLog.objects.create(
            actor_id=actor_id, action=action, resource_type=resource_type,
            resource_id=str(resource_id)[:64] if resource_id is not None else None,
            resource_repr=f'{label} #{resource_id}'[:255] if resource_id is not None else label,
            changes=changes, description=description, ip_address=remote_ip,
            request_method=request.method, request_path=request.path[:255],
        )
