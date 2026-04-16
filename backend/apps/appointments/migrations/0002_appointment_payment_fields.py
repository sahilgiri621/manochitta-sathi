from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("appointments", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="appointment",
            name="khalti_pidx",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="appointment",
            name="paid_amount",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="appointment",
            name="payment_initiated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="appointment",
            name="payment_provider",
            field=models.CharField(blank=True, max_length=30),
        ),
        migrations.AddField(
            model_name="appointment",
            name="payment_status",
            field=models.CharField(
                choices=[
                    ("unpaid", "Unpaid"),
                    ("pending", "Pending"),
                    ("paid", "Paid"),
                    ("failed", "Failed"),
                    ("cancelled", "Cancelled"),
                    ("expired", "Expired"),
                    ("refunded", "Refunded"),
                ],
                default="unpaid",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="appointment",
            name="payment_transaction_id",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="appointment",
            name="payment_verified_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddIndex(
            model_name="appointment",
            index=models.Index(fields=["payment_status"], name="appointmen_payment_f9a69e_idx"),
        ),
        migrations.AddIndex(
            model_name="appointment",
            index=models.Index(fields=["khalti_pidx"], name="appointmen_khalti__b86152_idx"),
        ),
    ]
