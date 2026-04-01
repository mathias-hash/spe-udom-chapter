from django.contrib import admin

from .models import ChatFAQ, ChatRoom, Message, MessageQuota


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'updated_at']
    search_fields = ['name', 'slug']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['room', 'sender_name', 'sender_role', 'created_at']
    list_filter = ['room', 'sender_role', 'created_at']
    search_fields = ['sender_name', 'content']


@admin.register(MessageQuota)
class MessageQuotaAdmin(admin.ModelAdmin):
    list_display = ['user', 'daily_count', 'daily_limit', 'is_suspended', 'updated_at']
    list_filter = ['is_suspended', 'updated_at']
    search_fields = ['user__email', 'user__full_name', 'suspension_reason']
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Daily Quota', {'fields': ('daily_limit', 'daily_count', 'daily_reset_at')}),
        ('Weekly Quota', {'fields': ('weekly_limit', 'weekly_count', 'weekly_reset_at')}),
        ('Monthly Quota', {'fields': ('monthly_limit', 'monthly_count', 'monthly_reset_at')}),
        ('Suspension', {'fields': ('is_suspended', 'suspension_reason')}),
    )
    readonly_fields = ['daily_count', 'weekly_count', 'monthly_count', 'daily_reset_at', 'weekly_reset_at', 'monthly_reset_at']


@admin.register(ChatFAQ)
class ChatFAQAdmin(admin.ModelAdmin):
    list_display = ['title', 'priority', 'is_active', 'updated_at']
    list_filter = ['is_active', 'updated_at']
    search_fields = ['title', 'keywords', 'response']
