from django.conf import settings
from django.db import models
from django.utils import timezone
from datetime import timedelta


class ChatRoom(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Message(models.Model):
    ROLE_CHOICES = [
        ('guest', 'Guest'),
        ('member', 'Member'),
        ('admin', 'Admin'),
    ]

    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chat_messages',
    )
    sender_name = models.CharField(max_length=120)
    sender_role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='guest')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender_name}: {self.content[:40]}'


class MessageQuota(models.Model):
    """Track message quotas per user (daily/weekly/monthly limits)"""
    QUOTA_PERIOD_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='message_quota'
    )
    daily_limit = models.PositiveIntegerField(default=20, help_text='Messages per day')
    weekly_limit = models.PositiveIntegerField(default=100, help_text='Messages per week')
    monthly_limit = models.PositiveIntegerField(default=300, help_text='Messages per month')
    
    daily_count = models.PositiveIntegerField(default=0)
    weekly_count = models.PositiveIntegerField(default=0)
    monthly_count = models.PositiveIntegerField(default=0)
    
    daily_reset_at = models.DateTimeField(null=True, blank=True)
    weekly_reset_at = models.DateTimeField(null=True, blank=True)
    monthly_reset_at = models.DateTimeField(null=True, blank=True)
    
    is_suspended = models.BooleanField(default=False, help_text='Prevent user from sending messages')
    suspension_reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Message Quotas'

    def __str__(self):
        return f'{self.user.email} - Quota'
    
    def check_quota(self):
        """Check if user can send a message and update counts"""
        now = timezone.now()
        
        # Check if suspended
        if self.is_suspended:
            return False, f'Account suspended: {self.suspension_reason}', self.get_quota_info()
        
        # Reset daily count if period passed
        if self.daily_reset_at and self.daily_reset_at <= now:
            self.daily_count = 0
            self.daily_reset_at = now + timedelta(days=1)
        
        # Reset weekly count if period passed
        if self.weekly_reset_at and self.weekly_reset_at <= now:
            self.weekly_count = 0
            self.weekly_reset_at = now + timedelta(weeks=1)
        
        # Reset monthly count if period passed
        if self.monthly_reset_at and self.monthly_reset_at <= now:
            self.monthly_count = 0
            self.monthly_reset_at = now + timedelta(days=30)
        
        # Check limits
        if self.daily_count >= self.daily_limit:
            return False, f'Daily quota exceeded ({self.daily_limit} messages/day)', self.get_quota_info()
        if self.weekly_count >= self.weekly_limit:
            return False, f'Weekly quota exceeded ({self.weekly_limit} messages/week)', self.get_quota_info()
        if self.monthly_count >= self.monthly_limit:
            return False, f'Monthly quota exceeded ({self.monthly_limit} messages/month)', self.get_quota_info()
        
        return True, 'OK', self.get_quota_info()
    
    def increment_quota(self):
        """Increment message counts"""
        now = timezone.now()
        
        # Initialize reset times if not set
        if not self.daily_reset_at:
            self.daily_reset_at = now + timedelta(days=1)
        if not self.weekly_reset_at:
            self.weekly_reset_at = now + timedelta(weeks=1)
        if not self.monthly_reset_at:
            self.monthly_reset_at = now + timedelta(days=30)
        
        self.daily_count += 1
        self.weekly_count += 1
        self.monthly_count += 1
        self.save()
    
    def get_quota_info(self):
        """Return user's quota status"""
        now = timezone.now()
        
        # Calculate time remaining
        daily_remaining = max(0, (self.daily_reset_at - now).total_seconds() / 3600) if self.daily_reset_at else 0
        weekly_remaining = max(0, (self.weekly_reset_at - now).total_seconds() / 3600) if self.weekly_reset_at else 0
        monthly_remaining = max(0, (self.monthly_reset_at - now).total_seconds() / 3600) if self.monthly_reset_at else 0
        
        return {
            'daily': {
                'used': self.daily_count,
                'limit': self.daily_limit,
                'remaining': max(0, self.daily_limit - self.daily_count),
                'resets_in_hours': int(daily_remaining)
            },
            'weekly': {
                'used': self.weekly_count,
                'limit': self.weekly_limit,
                'remaining': max(0, self.weekly_limit - self.weekly_count),
                'resets_in_hours': int(weekly_remaining)
            },
            'monthly': {
                'used': self.monthly_count,
                'limit': self.monthly_limit,
                'remaining': max(0, self.monthly_limit - self.monthly_count),
                'resets_in_hours': int(monthly_remaining)
            },
            'is_suspended': self.is_suspended,
            'suspension_reason': self.suspension_reason
        }


class ChatFAQ(models.Model):
    title = models.CharField(max_length=120)
    keywords = models.CharField(
        max_length=255,
        help_text='Comma-separated keywords or phrases, for example: join,membership,register',
    )
    response = models.TextField()
    priority = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-priority', 'title']

    def __str__(self):
        return self.title
