from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import LeadershipMember, Student, Event, EventPhoto

@admin.register(Student)
class StudentAdmin(UserAdmin):
    list_display = ['email', 'full_name', 'year_of_study', 'is_active']
    search_fields = ['email', 'full_name']
    ordering = ['email']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'phone', 'year_of_study')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {'fields': ('email', 'full_name', 'password1', 'password2')}),
    )


@admin.register(LeadershipMember)
class LeadershipMemberAdmin(admin.ModelAdmin):
    list_display = ['position', 'name', 'display_order', 'updated_at']
    list_editable = ['display_order']
    search_fields = ['name', 'position']
    ordering = ['display_order', 'position']


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'date', 'location', 'status', 'created_by']
    list_filter = ['status', 'date', 'created_at']
    search_fields = ['title', 'location', 'description']
    fieldsets = (
        ('Event Info', {'fields': ('title', 'description', 'location', 'date')}),
        ('Status', {'fields': ('status', 'cancel_reason')}),
        ('Creator', {'fields': ('created_by',)}),
    )


@admin.register(EventPhoto)
class EventPhotoAdmin(admin.ModelAdmin):
    list_display = ['event', 'caption', 'uploaded_by', 'uploaded_at']
    list_filter = ['uploaded_at', 'event']
    search_fields = ['event__title', 'caption']
    fieldsets = (
        ('Photo Info', {'fields': ('event', 'photo', 'caption')}),
        ('Metadata', {'fields': ('uploaded_by', 'uploaded_at')}),
    )
    readonly_fields = ['uploaded_at']
