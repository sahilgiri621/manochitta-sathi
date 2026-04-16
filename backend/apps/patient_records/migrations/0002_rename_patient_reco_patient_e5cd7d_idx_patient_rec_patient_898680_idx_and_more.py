from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("patient_records", "0001_initial"),
    ]

    operations = [
        migrations.RenameIndex(
            model_name="patientrecord",
            new_name="patient_rec_patient_898680_idx",
            old_name="patient_reco_patient_e5cd7d_idx",
        ),
        migrations.RenameIndex(
            model_name="patientrecord",
            new_name="patient_rec_therapi_d93110_idx",
            old_name="patient_reco_therapi_ef95aa_idx",
        ),
    ]
