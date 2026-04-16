from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("feedback", "0002_feedback_indexes"),
    ]

    operations = [
        migrations.RenameIndex(
            model_name="feedback",
            new_name="feedback_fe_therapi_bfa0b3_idx",
            old_name="feedback_fe_therapi_5bec02_idx",
        ),
        migrations.RenameIndex(
            model_name="feedback",
            new_name="feedback_fe_user_id_be0124_idx",
            old_name="feedback_fe_user_id_9bf57f_idx",
        ),
    ]
