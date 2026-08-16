import datetime

import django.db.models.deletion
import emrapi.models
from django.db import migrations, models


def migrate_encounters_to_visits(apps, schema_editor):
    Appointment = apps.get_model('emrapi', 'Appointment')
    Encounter = apps.get_model('emrapi', 'Encounter')
    Visit = apps.get_model('emrapi', 'Visit')

    appointments = {
        appointment.pk: appointment
        for appointment in Appointment.objects.all()
    }

    for encounter in Encounter.objects.all().iterator():
        appointment = appointments.get(encounter.appointment_id)
        created_by_id = encounter.created_by_id
        if appointment:
            created_by_id = appointment.checked_in_by_id or appointment.created_by_id or created_by_id

        completed_at = None
        if encounter.status == 'completed':
            completed_at = encounter.visit_date + datetime.timedelta(minutes=30)

        visit = Visit.objects.create(
            medical_record_id=encounter.medical_record_id,
            visit_number=f'VIS-MIG-{encounter.pk:08d}',
            visit_type=encounter.encounter_type,
            arrived_at=encounter.visit_date,
            completed_at=completed_at,
            reason=encounter.chief_complaint,
            status=encounter.status,
            note=appointment.note if appointment else None,
            created_by_id=created_by_id,
            active=encounter.active,
        )

        department_id = None
        if encounter.doctor_id:
            doctor = encounter.doctor
            department_id = doctor.staff.department_id

        Encounter.objects.filter(pk=encounter.pk).update(
            visit_id=visit.pk,
            department_id=department_id,
            completed_at=completed_at,
        )


class Migration(migrations.Migration):

    dependencies = [
        ('emrapi', '0005_staffprofile_gender_alter_patient_gender'),
    ]

    operations = [
        migrations.CreateModel(
            name='Visit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('visit_number', models.CharField(default=emrapi.models.generate_visit_number, editable=False, max_length=32, unique=True)),
                ('visit_type', models.CharField(choices=[('outpatient', 'Ngoai tru'), ('inpatient', 'Noi tru'), ('emergency', 'Cap cuu')], default='outpatient', max_length=20)),
                ('arrived_at', models.DateTimeField()),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('reason', models.CharField(max_length=255)),
                ('status', models.CharField(choices=[('checked_in', 'Da tiep nhan'), ('in_progress', 'Dang kham'), ('completed', 'Hoan thanh'), ('cancelled', 'Da huy')], default='checked_in', max_length=20)),
                ('note', models.TextField(blank=True, null=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_visits', to='emrapi.staffprofile')),
                ('medical_record', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='visits', to='emrapi.medicalrecord')),
            ],
            options={
                'ordering': ['-arrived_at'],
                'indexes': [
                    models.Index(fields=['arrived_at'], name='emrapi_vis_arrived_35a117_idx'),
                    models.Index(fields=['status'], name='emrapi_vis_status_4cbf6d_idx'),
                    models.Index(fields=['medical_record', 'arrived_at'], name='emrapi_vis_record_32d17d_idx'),
                ],
            },
        ),
        migrations.AddField(
            model_name='encounter',
            name='completed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='encounter',
            name='department',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='encounters', to='emrapi.department'),
        ),
        migrations.AddField(
            model_name='encounter',
            name='parent_encounter',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='referred_encounters', to='emrapi.encounter'),
        ),
        migrations.AddField(
            model_name='encounter',
            name='visit',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='encounters', to='emrapi.visit'),
        ),
        migrations.RunPython(migrate_encounters_to_visits, migrations.RunPython.noop),
        migrations.RemoveIndex(
            model_name='encounter',
            name='emrapi_enco_visit_d_0ae65e_idx',
        ),
        migrations.RemoveIndex(
            model_name='encounter',
            name='emrapi_enco_medical_ffb804_idx',
        ),
        migrations.RemoveField(
            model_name='encounter',
            name='appointment',
        ),
        migrations.RemoveField(
            model_name='encounter',
            name='medical_record',
        ),
        migrations.RemoveField(
            model_name='encounter',
            name='encounter_type',
        ),
        migrations.RenameField(
            model_name='encounter',
            old_name='visit_date',
            new_name='started_at',
        ),
        migrations.AlterField(
            model_name='encounter',
            name='visit',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='encounters', to='emrapi.visit'),
        ),
        migrations.AlterModelOptions(
            name='encounter',
            options={'ordering': ['-started_at']},
        ),
        migrations.AddIndex(
            model_name='encounter',
            index=models.Index(fields=['started_at'], name='emrapi_enc_started_6a2558_idx'),
        ),
        migrations.AddIndex(
            model_name='encounter',
            index=models.Index(fields=['visit', 'started_at'], name='emrapi_enc_visit_46bb1f_idx'),
        ),
        migrations.AddIndex(
            model_name='encounter',
            index=models.Index(fields=['department', 'status'], name='emrapi_enc_dept_8acc95_idx'),
        ),
        migrations.DeleteModel(
            name='Appointment',
        ),
    ]
