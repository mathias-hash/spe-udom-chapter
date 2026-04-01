from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_eventphoto'),
    ]

    operations = [
        migrations.CreateModel(
            name='AnnualReportImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='annual_reports/events/')),
                ('caption', models.CharField(blank=True, max_length=200)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='AnnualReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.CharField(help_text='e.g. 2025/2026', max_length=9, unique=True)),
                ('president_message', models.TextField(blank=True, default='')),
                ('president_image', models.ImageField(blank=True, null=True, upload_to='annual_reports/president/')),
                ('membership_statistics', models.TextField(blank=True, default='')),
                ('membership_chart', models.ImageField(blank=True, null=True, upload_to='annual_reports/membership/')),
                ('challenges', models.TextField(blank=True, default='')),
                ('recommendations', models.TextField(blank=True, default='')),
                ('technical_dissemination', models.TextField(blank=True, default='')),
                ('community_engagement', models.TextField(blank=True, default='')),
                ('member_recognition', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('technical_images', models.ManyToManyField(blank=True, related_name='technical_reports', to='core.annualreportimage')),
                ('community_images', models.ManyToManyField(blank=True, related_name='community_reports', to='core.annualreportimage')),
                ('recognition_images', models.ManyToManyField(blank=True, related_name='recognition_reports', to='core.annualreportimage')),
            ],
        ),
        migrations.CreateModel(
            name='FinancialItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('item_source', models.CharField(max_length=200)),
                ('expenditure', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('total_expenditure', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('outstanding_balance', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('balance', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('report', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='financial_items', to='core.annualreport')),
            ],
        ),
    ]
