from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes

from .assistant import get_assistant_response, SPE_ASSISTANT_NAME
from .models import ChatRoom, Message, MessageQuota


def serialize_message(message):
    return {
        'id': message.id,
        'sender_name': message.sender_name,
        'sender_role': message.sender_role,
        'content': message.content,
        'created_at': message.created_at.isoformat(),
    }


@api_view(['GET'])
@permission_classes([AllowAny])
def support_room(request):
    room, _ = ChatRoom.objects.get_or_create(
        slug='spe-support',
        defaults={'name': 'SPE Support'},
    )
    messages = [serialize_message(m) for m in room.messages.order_by('created_at')[:100]]
    return Response({'room_key': room.slug, 'messages': messages})


@api_view(['POST'])
@permission_classes([AllowAny])
def send_message(request):
    content = (request.data.get('content') or '').strip()
    if not content:
        return Response({'error': 'Content is required.'}, status=400)
    if len(content) > 2000:
        return Response({'error': 'Message too long.'}, status=400)

    room, _ = ChatRoom.objects.get_or_create(
        slug='spe-support', defaults={'name': 'SPE Support'}
    )

    user = request.user if request.user.is_authenticated else None
    sender_name = (request.data.get('sender_name') or (user.full_name if user else 'Guest'))[:100]
    sender_role = request.data.get('sender_role', 'guest')
    if sender_role not in ('guest', 'member', 'admin'):
        sender_role = 'guest'

    user_msg = Message.objects.create(
        room=room, sender=user,
        sender_name=sender_name, sender_role=sender_role, content=content
    )

    assistant_text = get_assistant_response(content, sender_name=sender_name)
    bot_msg = Message.objects.create(
        room=room, sender=None,
        sender_name=SPE_ASSISTANT_NAME, sender_role='admin', content=assistant_text
    )

    return Response({
        'user_message': serialize_message(user_msg),
        'assistant_message': serialize_message(bot_msg),
    }, status=201)
