from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('emrapi', '0010_alter_encounter_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='medicalattachment',
            name='lab_test',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='attachments',
                to='emrapi.labtest',
            ),
        ),
    ]
