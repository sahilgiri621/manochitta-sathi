from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("appointments", "0002_appointment_payment_fields"),
    ]

    operations = [
        migrations.RenameIndex(
            model_name="appointment",
            new_name="appointment_payment_79f9ef_idx",
            old_name="appointmen_payment_f9a69e_idx",
        ),
        migrations.RenameIndex(
            model_name="appointment",
            new_name="appointment_khalti__a186a9_idx",
            old_name="appointmen_khalti__b86152_idx",
        ),
    ]
