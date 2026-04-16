from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("therapists", "0005_therapistclinic"),
    ]

    operations = [
        migrations.RenameIndex(
            model_name="therapistclinic",
            new_name="therapists__clinic__7a8f3d_idx",
            old_name="therapists__clinic__97eba9_idx",
        ),
        migrations.RenameIndex(
            model_name="therapistclinic",
            new_name="therapists__latitud_daa3c0_idx",
            old_name="therapists__latitud_4ce11d_idx",
        ),
    ]
