from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import ChatRoom, MessageQuota


def serialize_message(message):
    return {
        'id': message.id,
        'sender_name': message.sender_name,
        'sender_role': message.sender_role,
        'content': message.content,
        'created_at': message.created_at.isoformat(),
    }


@api_view(['GET'])
def support_room(request):
    room, _ = ChatRoom.objects.get_or_create(
        slug='spe-support',
        defaults={'name': 'SPE Support'},
    )

    if request.user.is_authenticated:
        display_name = request.user.full_name
        sender_role = 'admin' if request.user.role == 'admin' else 'member'
        
        # Get user's quota info
        quota, created = MessageQuota.objects.get_or_create(user=request.user)
        quota_info = quota.get_quota_info()
    else:
        display_name = 'Guest User'
        sender_role = 'guest'
        quota_info = None

    messages = [serialize_message(message) for message in room.messages.order_by('created_at')[:50]]
    return Response(
        {
            'room_key': room.slug,
            'room_name': room.name,
            'display_name': display_name,
            'sender_role': sender_role,
            'messages': messages,
            'quota': quota_info,
        }
    )
