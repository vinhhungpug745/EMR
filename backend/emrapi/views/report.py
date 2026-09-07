from datetime import datetime, time, timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from emrapi.models import Department, Encounter, Visit
from emrapi.permission import IsEMRAdmin


class ReportFilterSerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)

    def validate(self, attrs):
        today = timezone.localdate()
        start = attrs.setdefault('start_date', today.replace(day=1))
        end = attrs.setdefault('end_date', today)
        if start > end:
            raise serializers.ValidationError({'end_date': 'Ngày kết thúc phải từ ngày bắt đầu trở đi.'})
        if (end - start).days > 365:
            raise serializers.ValidationError({'end_date': 'Vui lòng chọn tối đa 366 ngày.'})
        if end.year == 9999:
            raise serializers.ValidationError({'end_date': 'Ngày kết thúc nằm ngoài phạm vi hỗ trợ.'})
        return attrs


class OutpatientReportView(APIView):
    permission_classes = [IsEMRAdmin]

    def get(self, request):
        filters = ReportFilterSerializer(data=request.query_params)
        filters.is_valid(raise_exception=True)
        start_date = filters.validated_data['start_date']
        end_date = filters.validated_data['end_date']
        start = timezone.make_aware(datetime.combine(start_date, time.min))
        end = timezone.make_aware(datetime.combine(end_date + timedelta(days=1), time.min))

        # Every metric uses the same cohort: visits arriving in the selected period.
        visits = Visit.objects.filter(
            active=True, visit_type=Visit.VisitType.OUTPATIENT,
            arrived_at__gte=start, arrived_at__lt=end,
        ).exclude(status=Visit.Status.CANCELLED)
        encounters = Encounter.objects.filter(
            active=True, visit__in=visits,
        ).exclude(status=Encounter.Status.CANCELLED)
        summary = visits.aggregate(
            total_visits=Count('id'),
            total_patients=Count('medical_record__patient_id', distinct=True),
            completed_visits=Count('id', filter=Q(status=Visit.Status.COMPLETED)),
        )
        summary['total_encounters'] = encounters.count()

        grouped = encounters.order_by().values('department_id').annotate(
            total_encounters=Count('id'),
            total_visits=Count('visit_id', distinct=True),
            waiting=Count('id', filter=Q(status__in=[
                Encounter.Status.CHECKED_IN, Encounter.Status.VITALS_DONE,
            ])),
            in_progress=Count('id', filter=Q(status=Encounter.Status.IN_PROGRESS)),
            completed=Count('id', filter=Q(status=Encounter.Status.COMPLETED)),
        )
        by_department = {row['department_id']: row for row in grouped}
        departments = []
        # Include active departments with zero activity and historical inactive departments.
        for department in Department.objects.filter(
            Q(active=True) | Q(pk__in=[key for key in by_department if key is not None])
        ).order_by('name', 'id'):
            row = by_department.get(department.pk, {
                'department_id': department.pk, 'total_encounters': 0,
                'total_visits': 0, 'waiting': 0, 'in_progress': 0, 'completed': 0,
            })
            departments.append({**row, 'department_name': department.name})
        if None in by_department:
            departments.append({**by_department[None], 'department_name': 'Chưa phân khoa'})

        return Response({
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'timezone': timezone.get_current_timezone_name(),
            'summary': summary,
            'departments': departments,
        })
