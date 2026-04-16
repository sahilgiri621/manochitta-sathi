from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("appointments", "0005_appointment_confirmed_state"),
    ]

    operations = [
        migrations.AddField(
            model_name="appointment",
            name="external_calendar_event_id",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="appointment",
            name="meeting_created_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="appointment",
            name="meeting_link",
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="appointment",
            name="meeting_provider",
            field=models.CharField(blank=True, choices=[("google_meet", "Google Meet")], max_length=30, null=True),
        ),
        migrations.AddField(
            model_name="appointment",
            name="meeting_status",
            field=models.CharField(blank=True, choices=[("pending", "Pending"), ("ready", "Ready"), ("failed", "Failed")], max_length=20, null=True),
        ),
        migrations.AddIndex(
            model_name="appointment",
            index=models.Index(fields=["meeting_status"], name="appointmen_meeting_5c0f34_idx"),
        ),
    ]
