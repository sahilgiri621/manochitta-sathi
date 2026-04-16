from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("appointments", "0001_initial"),
        ("therapists", "0004_rename_therapists__start_t_bc945c_idx_therapists__start_t_b63cf4_idx_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PatientRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("notes", models.TextField()),
                ("diagnosis_notes", models.TextField(blank=True)),
                ("recommendations", models.TextField(blank=True)),
                ("session_summary", models.TextField(blank=True)),
                ("appointment", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="patient_records", to="appointments.appointment")),
                ("patient", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="patient_records", to=settings.AUTH_USER_MODEL)),
                ("therapist", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="patient_records", to="therapists.therapistprofile")),
            ],
            options={
                "ordering": ("-updated_at", "-created_at"),
            },
        ),
        migrations.AddIndex(
            model_name="patientrecord",
            index=models.Index(fields=["patient", "created_at"], name="patient_reco_patient_e5cd7d_idx"),
        ),
        migrations.AddIndex(
            model_name="patientrecord",
            index=models.Index(fields=["therapist", "created_at"], name="patient_reco_therapi_ef95aa_idx"),
        ),
    ]
