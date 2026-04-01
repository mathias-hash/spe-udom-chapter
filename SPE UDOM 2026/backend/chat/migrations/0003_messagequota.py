"""
Django database migration for MessageQuota model
Run: python manage.py migrate
"""

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0002_chatfaq'),
    ]

    operations = [
        migrations.CreateModel(
            name='MessageQuota',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('daily_limit', models.PositiveIntegerField(default=20, help_text='Messages per day')),
                ('weekly_limit', models.PositiveIntegerField(default=100, help_text='Messages per week')),
                ('monthly_limit', models.PositiveIntegerField(default=300, help_text='Messages per month')),
                ('daily_count', models.PositiveIntegerField(default=0)),
                ('weekly_count', models.PositiveIntegerField(default=0)),
                ('monthly_count', models.PositiveIntegerField(default=0)),
                ('daily_reset_at', models.DateTimeField(blank=True, null=True)),
                ('weekly_reset_at', models.DateTimeField(blank=True, null=True)),
                ('monthly_reset_at', models.DateTimeField(blank=True, null=True)),
                ('is_suspended', models.BooleanField(default=False, help_text='Prevent user from sending messages')),
                ('suspension_reason', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='message_quota', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name_plural': 'Message Quotas',
            },
        ),
    ]
