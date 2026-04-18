from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import (
    Student, Event, EventRegistration, Announcement, EventPhoto,
    Publication, Election, Candidate, Vote, Suggestion, POSITION_CHOICES
)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Student
        fields = ['email', 'full_name', 'phone', 'year_of_study', 'password', 'confirm_password']

    def validate_email(self, value):
        if Student.objects.filter(email=value).exists():
            raise serializers.ValidationError('This email is already registered')
        return value.lower()

    def validate_year_of_study(self, value):
        if value is not None and value not in [1, 2, 3, 4]:
            raise serializers.ValidationError('Year of study must be 1, 2, 3, or 4.')
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match'})
        validate_password(data['password'])
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        return Student.objects.create_user(password=password, **validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data['email'].lower()
        user = authenticate(username=email, password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password')
        if not user.is_active:
            raise serializers.ValidationError('This account is inactive')
        data['user'] = user
        return data


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'email', 'full_name', 'phone', 'year_of_study', 'role', 'profile_picture', 'date_joined']
        read_only_fields = ['id', 'date_joined', 'role']


class StudentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['full_name', 'phone', 'year_of_study', 'profile_picture']

    def validate_year_of_study(self, value):
        if value is not None and value not in [1, 2, 3, 4]:
            raise serializers.ValidationError('Year of study must be 1, 2, 3, or 4.')
        return value


class EventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    registration_count = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()
    photos = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'location', 'date', 'status', 'cancel_reason',
                  'created_by_name', 'registration_count', 'is_registered', 'photos', 'created_at']

    def get_registration_count(self, obj):
        return obj.registrations.count()

    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.registrations.filter(student=request.user).exists()
        return False
    
    def get_photos(self, obj):
        request = self.context.get('request')
        photos = obj.photos.all()
        return [{
            'id': p.id,
            'photo': request.build_absolute_uri(p.photo.url) if request and p.photo else p.photo.url if p.photo else None,
            'caption': p.caption,
            'uploaded_by': p.uploaded_by.full_name if p.uploaded_by else None,
            'uploaded_at': p.uploaded_at.isoformat()
        } for p in photos]


class EventPhotoSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = EventPhoto
        fields = ['id', 'event', 'photo', 'photo_url', 'caption', 'uploaded_by_name', 'uploaded_at']

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo and request:
            return request.build_absolute_uri(obj.photo.url)
        return obj.photo.url if obj.photo else None


class AnnouncementSerializer(serializers.ModelSerializer):
    sent_by_name = serializers.CharField(source='sent_by.full_name', read_only=True)

    class Meta:
        model = Announcement
        fields = ['id', 'title', 'message', 'sent_by_name', 'created_at']


class PublicationSerializer(serializers.ModelSerializer):
    published_by_name = serializers.CharField(source='published_by.full_name', read_only=True)
    pub_type = serializers.CharField(source='pub_type', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Publication
        fields = ['id', 'title', 'content', 'file', 'file_url', 'pub_type', 'published_by_name', 'created_at']
        extra_kwargs = {'content': {'required': False}, 'file': {'write_only': True}}

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url


class CandidateSerializer(serializers.ModelSerializer):
    vote_count = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = ['id', 'name', 'position', 'manifesto', 'photo', 'photo_url', 'approved', 'vote_count']
        extra_kwargs = {'photo': {'write_only': True, 'required': False}}

    def get_vote_count(self, obj):
        return obj.votes_received.count()

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo and request:
            return request.build_absolute_uri(obj.photo.url)
        return ''


class ElectionSerializer(serializers.ModelSerializer):
    candidates = CandidateSerializer(many=True, read_only=True)
    total_votes = serializers.SerializerMethodField()
    positions = serializers.SerializerMethodField()

    class Meta:
        model = Election
        fields = ['id', 'title', 'description', 'status', 'start_date',
                  'end_date', 'candidates', 'total_votes', 'positions', 'created_at']

    def get_total_votes(self, obj):
        return obj.votes.count()

    def get_positions(self, obj):
        return list(obj.candidates.filter(approved=True).values_list('position', flat=True).distinct())


class SuggestionSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    replied_by_name = serializers.CharField(source='replied_by.full_name', read_only=True)

    class Meta:
        model = Suggestion
        fields = ['id', 'student_name', 'student_email', 'message', 'is_anonymous',
                  'reply', 'replied_by_name', 'replied_at', 'created_at']

    def get_student_name(self, obj):
        return 'Anonymous' if obj.is_anonymous else obj.student.full_name

    def get_student_email(self, obj):
        return '' if obj.is_anonymous else obj.student.email


class PositionChoicesSerializer(serializers.Serializer):
    positions = serializers.ListField(child=serializers.CharField())
