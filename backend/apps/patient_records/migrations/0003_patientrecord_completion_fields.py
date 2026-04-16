from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("patient_records", "0002_rename_patient_reco_patient_e5cd7d_idx_patient_rec_patient_898680_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="patientrecord",
            name="completed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="patientrecord",
            name="next_steps",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="patientrecord",
            name="patient_progress",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="patientrecord",
            name="risk_flag",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
