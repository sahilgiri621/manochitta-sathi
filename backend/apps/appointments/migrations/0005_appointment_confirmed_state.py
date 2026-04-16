from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("appointments", "0004_appointment_pending_payment_state"),
    ]

    operations = [
        migrations.AlterField(
            model_name="appointment",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending_payment", "Pending payment"),
                    ("pending", "Pending"),
                    ("confirmed", "Confirmed"),
                    ("accepted", "Accepted"),
                    ("rejected", "Rejected"),
                    ("cancelled", "Cancelled"),
                    ("completed", "Completed"),
                    ("rescheduled", "Rescheduled"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="appointmentevent",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending_payment", "Pending payment"),
                    ("pending", "Pending"),
                    ("confirmed", "Confirmed"),
                    ("accepted", "Accepted"),
                    ("rejected", "Rejected"),
                    ("cancelled", "Cancelled"),
                    ("completed", "Completed"),
                    ("rescheduled", "Rescheduled"),
                ],
                max_length=20,
            ),
        ),
    ]
