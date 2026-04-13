from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import re


ACADEMIC_YEAR_START = 2024
DEFAULT_VISIBLE_ACADEMIC_YEAR_END = 2026  # Current year is 2026, so max visible is 2026/2027
ACADEMIC_YEAR_PATTERN = re.compile(r'^\d{4}/\d{4}$')


class StudentManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        user = self.model(email=self.normalize_email(email), full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, full_name, password, **extra_fields)


class Student(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('president', 'President'),
        ('general_secretary', 'General Secretary'),
        ('member', 'Member'),
    ]
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, blank=True)
    year_of_study = models.PositiveSmallIntegerField(null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    profile_picture = models.FileField(upload_to='profiles/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = StudentManager()

    def __str__(self):
        return f"{self.email} - {self.full_name} ({self.role})"


class Event(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('cancelled', 'Cancelled')]
    title = models.CharField(max_length=200)
    description = models.TextField()
    location = models.CharField(max_length=200)
    date = models.DateTimeField()
    created_by = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, related_name='created_events')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    cancel_reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class EventRegistration(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='event_registrations')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'event')


class EventPhoto(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='photos')
    photo = models.ImageField(upload_to='events/photos/')
    caption = models.CharField(max_length=200, blank=True)
    uploaded_by = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"Photo for {self.event.title}"


class Announcement(models.Model):
    title = models.CharField(max_length=200)
    message = models.TextField()
    sent_by = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Publication(models.Model):
    PUB_TYPES = [('article','Article'),('journal','Journal'),('document','Document'),('image','Image')]
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True, default='')
    file = models.FileField(upload_to='publications/', blank=True, null=True)
    pub_type = models.CharField(max_length=20, choices=PUB_TYPES, default='article')
    published_by = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Election(models.Model):
    STATUS_CHOICES = [('draft', 'Draft'), ('open', 'Open'), ('closed', 'Closed')]
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    created_by = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


POSITION_CHOICES = [
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
]


class Candidate(models.Model):
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='candidates')
    name = models.CharField(max_length=100, default='')
    position = models.CharField(max_length=100, choices=POSITION_CHOICES)
    manifesto = models.TextField(blank=True)
    photo = models.ImageField(upload_to='candidates/', blank=True, null=True)
    approved = models.BooleanField(default=False)

    class Meta:
        unique_together = ('election', 'name', 'position')

    def __str__(self):
        return f"{self.name} - {self.position}"


class Vote(models.Model):
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='votes')
    voter = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='votes_cast')
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='votes_received')
    position_voted = models.CharField(max_length=100, default='')
    voted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('election', 'voter', 'position_voted')


class Suggestion(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='suggestions')
    message = models.TextField()
    is_anonymous = models.BooleanField(default=False)
    reply = models.TextField(blank=True, default='')
    replied_by = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='suggestion_replies')
    replied_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.subject}"


def current_academic_year():
    from django.utils import timezone
    now = timezone.now()
    year = now.year
    # Academic year starts in August
    if now.month >= 8:
        return f"{year}/{year + 1}"
    return f"{year - 1}/{year}"


def is_valid_academic_year_format(year):
    if not year or not ACADEMIC_YEAR_PATTERN.match(year):
        return False
    start, end = map(int, year.split('/'))
    return end == start + 1


def available_academic_years():
    # Only show base range: 2024/2025 to 2026/2027
    # Advanced years (beyond 2026/2027) are NOT shown in the dropdown until the next year button is explicitly clicked
    base = {f'{y}/{y + 1}' for y in range(ACADEMIC_YEAR_START, DEFAULT_VISIBLE_ACADEMIC_YEAR_END + 1)}
    return sorted(base)


def latest_available_academic_year():
    years = available_academic_years()
    return years[-1] if years else f'{ACADEMIC_YEAR_START}/{ACADEMIC_YEAR_START + 1}'


def is_allowed_academic_year(year):
    return is_valid_academic_year_format(year) and year in set(available_academic_years())


class LeadershipMember(models.Model):
    POSITION_CHOICES = [
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
    ]
    name = models.CharField(max_length=120)
    position = models.CharField(max_length=60, choices=POSITION_CHOICES)
    year = models.CharField(max_length=9, default=current_academic_year, help_text='e.g. 2025/2026')
    image = models.FileField(upload_to='leadership/', blank=True, null=True)
    display_order = models.PositiveSmallIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'position']
        unique_together = ('position', 'year')

    def __str__(self):
        return f'{self.position} - {self.name}'


class AnnualReport(models.Model):
    year = models.CharField(max_length=9, unique=True, help_text='e.g. 2025/2026')
    # 1. President Message
    president_message = models.TextField(blank=True, default='')
    president_image = models.ImageField(upload_to='annual_reports/president/', blank=True, null=True)
    # 2. Membership Statistics
    membership_statistics = models.TextField(blank=True, default='')
    membership_chart = models.ImageField(upload_to='annual_reports/membership/', blank=True, null=True)
    # 5. Challenges
    challenges = models.TextField(blank=True, default='')
    # 6. Recommendations
    recommendations = models.TextField(blank=True, default='')
    # Events sections
    technical_dissemination = models.TextField(blank=True, default='')
    technical_images = models.ManyToManyField('AnnualReportImage', blank=True, related_name='technical_reports')
    community_engagement = models.TextField(blank=True, default='')
    community_images = models.ManyToManyField('AnnualReportImage', blank=True, related_name='community_reports')
    member_recognition = models.TextField(blank=True, default='')
    recognition_images = models.ManyToManyField('AnnualReportImage', blank=True, related_name='recognition_reports')

    created_by = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Annual Report {self.year}'


class AnnualReportImage(models.Model):
    image = models.ImageField(upload_to='annual_reports/events/')
    caption = models.CharField(max_length=200, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Report Image {self.id}'


class FinancialItem(models.Model):
    report = models.ForeignKey(AnnualReport, on_delete=models.CASCADE, related_name='financial_items')
    item_source = models.CharField(max_length=200)
    expenditure = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_expenditure = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f'{self.item_source} — {self.report.year}'
