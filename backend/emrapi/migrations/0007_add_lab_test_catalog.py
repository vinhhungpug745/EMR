import django.db.models.deletion
from django.db import migrations, models


def populate_lab_test_catalog(apps, schema_editor):
    LabTest = apps.get_model('emrapi', 'LabTest')
    LabTestCatalog = apps.get_model('emrapi', 'LabTestCatalog')

    names = sorted(
        LabTest.objects.exclude(test_name='')
        .values_list('test_name', flat=True)
        .distinct()
    )
    catalogs = {}
    for index, name in enumerate(names, start=1):
        catalogs[name] = LabTestCatalog.objects.create(
            code=f'LEGACY-XN-{index:04d}',
            name=name,
            active=True,
        )

    for lab_test in LabTest.objects.all().iterator():
        catalog = catalogs.get(lab_test.test_name)
        if catalog:
            LabTest.objects.filter(pk=lab_test.pk).update(
                test_catalog_id=catalog.pk
            )


def restore_test_names(apps, schema_editor):
    LabTest = apps.get_model('emrapi', 'LabTest')

    for lab_test in LabTest.objects.select_related('test_catalog').iterator():
        LabTest.objects.filter(pk=lab_test.pk).update(
            test_name=lab_test.test_catalog.name
        )


class Migration(migrations.Migration):

    dependencies = [
        ('emrapi', '0006_replace_appointment_with_visit'),
    ]

    operations = [
        migrations.CreateModel(
            name='LabTestCatalog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('code', models.CharField(max_length=40, unique=True)),
                ('name', models.CharField(max_length=160, unique=True)),
                ('category', models.CharField(blank=True, max_length=120, null=True)),
                ('specimen_type', models.CharField(blank=True, max_length=120, null=True)),
                ('description', models.TextField(blank=True, null=True)),
            ],
            options={
                'ordering': ['name'],
                'indexes': [
                    models.Index(fields=['name'], name='emrapi_labcat_name_565115_idx'),
                    models.Index(fields=['category'], name='emrapi_labcat_cat_55b04e_idx'),
                ],
            },
        ),
        migrations.AddField(
            model_name='labtest',
            name='test_catalog',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='lab_tests', to='emrapi.labtestcatalog'),
        ),
        migrations.RunPython(
            populate_lab_test_catalog,
            restore_test_names,
        ),
        migrations.AlterField(
            model_name='labtest',
            name='test_name',
            field=models.CharField(blank=True, max_length=160, null=True),
        ),
        migrations.RemoveField(
            model_name='labtest',
            name='test_name',
        ),
        migrations.AlterField(
            model_name='labtest',
            name='test_catalog',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='lab_tests', to='emrapi.labtestcatalog'),
        ),
    ]
