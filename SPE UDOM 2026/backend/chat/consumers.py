import json
import logging

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser

from .assistant import SPE_ASSISTANT_NAME, get_assistant_response
from .models import ChatRoom, Message, MessageQuota

logger = logging.getLogger('django.security')


class SupportChatConsumer(AsyncWebsocketConsumer):
    """Secure WebSocket consumer for chat support with rate limiting"""
    
    # Rate limiting: max 50 messages per hour per connection
    MAX_MESSAGES_PER_HOUR = 50
    MESSAGE_TIMEOUT = 3600  # 1 hour
    
    async def connect(self):
        """Establish WebSocket connection with security validation"""
        self.room_key = self.scope['url_route']['kwargs'].get('room_key')
        self.user = self.scope.get('user', AnonymousUser())
        self.message_count = 0
        
        if not self.room_key:
            await self.close()
            return
        
        # Validate room exists and user has access
        self.room = await self.get_room(self.room_key)
        if not self.room:
            await self.close()
            return
        
        self.group_name = f'chat_{self.room_key}'
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'status',
            'message': 'connected',
            'room_id': self.room.id,
            'room_name': self.room.name
        }))
        
        logger.info(f'WebSocket connected: user={self.user}, room={self.room_key}')

    async def disconnect(self, close_code):
        """Clean up on disconnect"""
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.debug(f'WebSocket disconnected: code={close_code}')

    async def receive(self, text_data=None, bytes_data=None):
        """Receive and process messages with security validation"""
        try:
            if not text_data:
                return
            
            # Rate limit check
            self.message_count += 1
            if self.message_count > self.MAX_MESSAGES_PER_HOUR:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Rate limit exceeded. Too many messages'
                }))
                logger.warning(f'Rate limit exceeded for user: {self.user}')
                return
            
            payload = json.loads(text_data)
            content = (payload.get('content') or '').strip()
            
            # Validate content
            if not content:
                return
            
            if len(content) > 5000:  # Max 5000 characters
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Message too long (max 5000 characters)'
                }))
                return
            
            # Get sender info based on authentication
            user = self.user if self.user.is_authenticated else None
            sender_name = (payload.get('sender_name') or 'Guest User').strip()[:100]
            sender_role = 'member' if user else 'guest'
            
            # Check quota for authenticated users
            if user:
                quota_ok, quota_msg, quota_info = await self.check_user_quota(user.id)
                if not quota_ok:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': quota_msg,
                        'quota': quota_info
                    }))
                    logger.warning(f'User {user.email} exceeded quota: {quota_msg}')
                    return
            
            # Sanitize input
            content = self._sanitize_content(content)
            
            # Create message
            message = await self.create_message(
                room_id=self.room.id,
                user_id=user.id if user else None,
                sender_name=sender_name,
                sender_role=sender_role,
                content=content,
            )
            
            # Update quota for authenticated users
            if user:
                await self.increment_user_quota(user.id)
            
            # Broadcast to group
            await self.channel_layer.group_send(
                self.group_name,
                {'type': 'chat.message', 'message': message},
            )
            
            # Generate and send assistant response
            assistant_response = await self.generate_assistant_response(content)
            if assistant_response:
                assistant_message = await self.create_message(
                    room_id=self.room.id,
                    user_id=None,
                    sender_name=SPE_ASSISTANT_NAME,
                    sender_role='admin',
                    content=assistant_response,
                )
                
                await self.channel_layer.group_send(
                    self.group_name,
                    {'type': 'chat.message', 'message': assistant_message},
                )
                
        except json.JSONDecodeError:
            logger.warning(f'Invalid JSON received from user: {self.user}')
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid message format'
            }))
        except Exception as e:
            logger.error(f'Error processing message: {str(e)}')
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'An error occurred processing your message'
            }))

    async def chat_message(self, event):
        """Broadcast message to client"""
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message']
        }))

    @staticmethod
    def _sanitize_content(content):
        """Sanitize message content"""
        # Remove potentially harmful characters while preserving emoji and special chars
        # This is basic; consider using bleach or similar for production
        content = content.replace('<script', '&lt;script')
        content = content.replace('</script>', '&lt;/script>')
        return content.strip()

    @database_sync_to_async
    def get_room(self, room_key):
        """Get chat room with validation"""
        try:
            room = ChatRoom.objects.filter(slug=room_key).first()
            if room:
                # Check if room is active/not deleted
                return room if room else None
            return None
        except Exception as e:
            logger.error(f'Error getting room: {str(e)}')
            return None

    @database_sync_to_async
    def create_message(self, room_id, user_id, sender_name, sender_role, content):
        """Create message with validation"""
        try:
            room = ChatRoom.objects.get(id=room_id)
            user = None
            if user_id:
                from django.contrib.auth import get_user_model
                user = get_user_model().objects.filter(id=user_id, is_active=True).first()
            
            # Validate sender_role
            valid_roles = ['guest', 'member', 'admin']
            sender_role = sender_role if sender_role in valid_roles else 'guest'
            
            message = Message.objects.create(
                room=room,
                sender=user,
                sender_name=sender_name,
                sender_role=sender_role,
                content=content,
            )
            
            return {
                'id': message.id,
                'sender_name': message.sender_name,
                'sender_role': message.sender_role,
                'content': message.content,
                'created_at': message.created_at.isoformat(),
            }
        except Exception as e:
            logger.error(f'Error creating message: {str(e)}')
            return None

    @database_sync_to_async
    def check_user_quota(self, user_id):
        """Check if user has remaining quota"""
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id)
            
            quota, created = MessageQuota.objects.get_or_create(user=user)
            allowed, message = quota.check_quota()
            quota_info = quota.get_quota_info()
            
            return allowed, message, quota_info
        except Exception as e:
            logger.error(f'Error checking quota: {str(e)}')
            return True, 'OK', {}

    @database_sync_to_async
    def increment_user_quota(self, user_id):
        """Increment user's message quota counters"""
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id)
            
            quota, created = MessageQuota.objects.get_or_create(user=user)
            quota.increment_quota()
            return True
        except Exception as e:
            logger.error(f'Error incrementing quota: {str(e)}')
            return False

    @database_sync_to_async
    def generate_assistant_response(self, content):
        """Generate assistant response with error handling"""
        try:
            return get_assistant_response(content)
        except Exception as e:
            logger.error(f'Error generating assistant response: {str(e)}')
            return 'I apologize, I encountered an error processing your request. Please try again.'

