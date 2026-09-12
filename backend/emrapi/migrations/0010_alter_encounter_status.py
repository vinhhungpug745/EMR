from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('emrapi', '0009_outpatient_only'),
    ]

    operations = [
        migrations.AlterField(
            model_name='encounter',
            name='status',
            field=models.CharField(
                choices=[
                    ('checked_in', 'Chờ đo sinh hiệu'),
                    ('vitals_done', 'Đã đo sinh hiệu'),
                    ('in_progress', 'Đang khám'),
                    ('vitals_recheck', 'Chờ đo lại sinh hiệu'),
                    ('completed', 'Hoàn thành'),
                    ('cancelled', 'Đã hủy'),
                ],
                default='checked_in',
                max_length=20,
            ),
        ),
    ]
