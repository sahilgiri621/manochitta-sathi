from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("therapists", "0004_rename_therapists__start_t_bc945c_idx_therapists__start_t_b63cf4_idx_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="TherapistClinic",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("clinic_name", models.CharField(max_length=255)),
                ("clinic_address", models.TextField()),
                ("latitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("longitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("phone", models.CharField(blank=True, max_length=30)),
                ("opening_hours", models.CharField(blank=True, max_length=255)),
                ("notes", models.TextField(blank=True)),
                (
                    "therapist",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="clinic",
                        to="therapists.therapistprofile",
                    ),
                ),
            ],
        ),
        migrations.AddIndex(
            model_name="therapistclinic",
            index=models.Index(fields=["clinic_name"], name="therapists__clinic__97eba9_idx"),
        ),
        migrations.AddIndex(
            model_name="therapistclinic",
            index=models.Index(fields=["latitude", "longitude"], name="therapists__latitud_4ce11d_idx"),
        ),
    ]
