from django.db import migrations, models
import core.models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_suggestion_replied_at_suggestion_replied_by_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='leadershipmember',
            name='position',
            field=models.CharField(
                choices=[
                    ('PRESIDENT', 'PRESIDENT'),
                    ('VICE PRESIDENT', 'VICE PRESIDENT'),
                    ('GENERAL SECRETARY', 'GENERAL SECRETARY'),
                    ('TREASURER', 'TREASURER'),
                    ('MEMBERSHIP CHAIR PERSON', 'MEMBERSHIP CHAIR PERSON'),
                    ('PROGRAM CHAIR PERSON', 'PROGRAM CHAIR PERSON'),
                    ('COMMUNICATIONS AND OUTREACH CHAIRPERSON', 'COMMUNICATIONS AND OUTREACH CHAIRPERSON'),
                    ('SOCIAL ACTIVITIES CHAIRPERSON', 'SOCIAL ACTIVITIES CHAIRPERSON'),
                    ('WEB MASTER', 'WEB MASTER'),
                    ('TECHNICAL OFFICER', 'TECHNICAL OFFICER'),
                    ('FACULTY ADVISOR', 'FACULTY ADVISOR'),
                ],
                max_length=60,
            ),
        ),
        migrations.AddField(
            model_name='leadershipmember',
            name='year',
            field=models.CharField(
                default=core.models.current_academic_year,
                help_text='e.g. 2025/2026',
                max_length=9,
            ),
        ),
        migrations.AlterUniqueTogether(
            name='leadershipmember',
            unique_together={('position', 'year')},
        ),
    ]
