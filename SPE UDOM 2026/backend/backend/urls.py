from django.conf import settings
from django.contrib import admin
from django.urls import path, include, re_path
from django.http import JsonResponse, FileResponse, FileResponse
from django.views.static import serve
import os
import mimetypes


def api_root(request):
    return JsonResponse({'message': 'SPE UDOM API is running', 'admin': '/admin/', 'api': '/api/'})


def serve_inline(request, path, document_root=None):
    """Serve media files inline (opens in browser instead of downloading)."""
    response = serve(request, path, document_root=document_root)
    
    ext = os.path.splitext(path)[1].lower()
    
    # Content-Type mapping
    content_types = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.txt': 'text/plain',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
    
    # Set proper Content-Type
    if ext in content_types:
        response['Content-Type'] = content_types[ext]
    
    # Force inline (open in browser) for viewable files
    if ext in ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.txt']:
        response['Content-Disposition'] = f'inline; filename="{os.path.basename(path)}"'
    
    return response


urlpatterns = [
    path('', api_root),
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('api/chat/', include('chat.urls')),
]

if settings.DEBUG:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve_inline, {'document_root': settings.MEDIA_ROOT}),
        re_path(r'^api/media/(?P<path>.*)$', serve_inline, {'document_root': settings.MEDIA_ROOT}),
    ]
else:
    # In production, media files should be served by the web server (nginx/caddy)
    # or a cloud storage service (S3, Cloudinary, etc.)
    urlpatterns += [
        re_path(r'^api/media/(?P<path>.*)$', serve_inline, {'document_root': settings.MEDIA_ROOT}),
    ]
