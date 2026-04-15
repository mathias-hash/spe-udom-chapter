from django.urls import path, re_path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Public
    path('', views.home),
    path('about/', views.about),
    path('leadership/', views.leadership),
    path('leadership/years/', views.leadership_years),
    path('leadership/advance-year/', views.leadership_advance_year),
    path('leadership/delete-year/<str:year>/', views.leadership_delete_year),
    path('leadership/manage/', views.leadership_create),
    path('leadership/<int:pk>/', views.leadership_detail),
    path('contact/', views.contact),
    path('join/', views.join),
    path('public/events/', views.public_events),
    path('public/events/<int:pk>/photos/', views.public_event_photos),
    path('public/stats/', views.public_stats),
    path('public/election/', views.public_election),
    path('public/election/<int:pk>/', views.public_election_detail),
    path('public/election/<int:election_id>/results/', views.election_results),
    path('election/positions/', views.position_choices),

    # Auth
    path('auth/register/', views.register),
    path('auth/login/', views.login),
    path('auth/profile/', views.profile),
    path('auth/change-password/', views.change_password),
    path('auth/token/refresh/', TokenRefreshView.as_view()),
    path('auth/forgot-password/', views.forgot_password),
    path('auth/reset-password/<uidb64>/<token>/', views.reset_password),

    # Admin
    path('admin-dashboard/', views.admin_dashboard),
    path('users/', views.list_users),
    path('users/create/', views.create_user),
    path('users/<int:pk>/', views.manage_user),

    # Events
    path('events/', views.events),
    path('events/<int:pk>/', views.event_detail),
    path('events/<int:pk>/photos/', views.event_photos),
    path('events/<int:pk>/approve/', views.approve_event),
    path('events/<int:pk>/delete/', views.delete_event),
    path('events/<int:pk>/register/', views.register_event),

    # Announcements
    path('announcements/', views.announcements),

    # Publications
    path('publications/', views.publications),
    path('publications/<int:pk>/', views.delete_publication),

    # Elections (authenticated)
    path('elections/', views.elections),
    path('elections/<int:pk>/', views.election_detail),
    path('elections/<int:election_id>/candidates/', views.add_candidate),
    path('elections/<int:election_id>/vote/', views.cast_vote),
    path('elections/<int:election_id>/my-votes/', views.my_votes),
    path('elections/<int:election_id>/results/', views.election_results),
    path('candidates/<int:pk>/', views.manage_candidate),

    # Suggestions
    path('suggestions/', views.suggestions),
    path('suggestions/my/', views.my_suggestions),
    path('suggestions/<int:pk>/reply/', views.reply_suggestion),

    # Role Dashboards
    path('president-dashboard/', views.president_dashboard),
    path('secretary-dashboard/', views.secretary_dashboard),

    # Annual Report (use re_path to capture year format YYYY/YYYY)
    path('annual-reports/', views.annual_report_list),
    re_path(r'^annual-reports/(?P<year>\d{4}/\d{4})/$', views.annual_report_detail),
    re_path(r'^annual-reports/(?P<year>\d{4}/\d{4})/financial/$', views.annual_report_financial),
    re_path(r'^annual-reports/(?P<year>\d{4}/\d{4})/images/(?P<section>[\w_]+)/$', views.annual_report_upload_image),
    path('annual-reports/images/<int:pk>/', views.annual_report_delete_image),
]
