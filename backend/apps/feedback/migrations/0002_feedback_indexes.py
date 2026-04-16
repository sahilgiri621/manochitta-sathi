from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("feedback", "0001_initial"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="feedback",
            index=models.Index(fields=["therapist", "created_at"], name="feedback_fe_therapi_5bec02_idx"),
        ),
        migrations.AddIndex(
            model_name="feedback",
            index=models.Index(fields=["user", "created_at"], name="feedback_fe_user_id_9bf57f_idx"),
        ),
    ]
