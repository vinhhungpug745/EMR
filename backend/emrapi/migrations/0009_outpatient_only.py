from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('emrapi', '0008_alter_encounter_started_at_alter_encounter_status')]

    # Restrict new input without reclassifying historical clinical records.
    operations = [
        migrations.AlterField(
            model_name='visit',
            name='visit_type',
            field=models.CharField(
                choices=[('outpatient', 'Ngoại trú')], default='outpatient', max_length=20,
            ),
        ),
    ]
