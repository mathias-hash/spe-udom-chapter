from __future__ import annotations

from django.utils import timezone

from core.models import Election, Event, LeadershipMember, Publication
from .models import ChatFAQ


SPE_ASSISTANT_NAME = 'SPE Assistant'

CONTACT_RESPONSE = (
    'You can contact SPE UDOM at speudom@gmail.com. The chapter is based at COESE, '
    'University of Dodoma, Dodoma, Tanzania. Office hours are Monday to Friday, 8:00 AM to 5:00 PM.'
)

FALLBACK_RESPONSE = (
    'I can help with SPE UDOM chapter topics like membership, joining, leadership, events, elections, '
    'publications, and contact details. Ask a direct question such as "Who is the president?", '
    '"What events are coming?", or "How do I join?".'
)


def _contains_any(message: str, keywords: list[str]) -> bool:
    return any(keyword in message for keyword in keywords)


def _format_list(items: list[str]) -> str:
    if not items:
        return ''
    if len(items) == 1:
        return items[0]
    return ', '.join(items[:-1]) + f', and {items[-1]}'


def _find_custom_faq(message: str) -> str | None:
    faqs = ChatFAQ.objects.filter(is_active=True).order_by('-priority', 'title')
    for faq in faqs:
        keywords = [keyword.strip().lower() for keyword in faq.keywords.split(',') if keyword.strip()]
        if any(keyword in message for keyword in keywords):
            return faq.response
    return None


def _greeting_response() -> str:
    return (
        'Hello. I am the SPE UDOM chapter assistant. I can answer questions about leadership, membership, '
        'events, elections, publications, and chapter contact information.'
    )


def _about_response() -> str:
    return (
        'SPE UDOM Student Chapter is the Society of Petroleum Engineers chapter at the University of Dodoma. '
        'The chapter supports students through technical learning, professional growth, networking, and chapter activities.'
    )


def _join_response() -> str:
    return (
        'To join SPE UDOM, use the registration flow on the website. Membership helps students access chapter '
        'events, leadership opportunities, technical programs, and SPE-related updates.'
    )


def _leadership_response(message: str) -> str:
    members = list(LeadershipMember.objects.order_by('display_order', 'position'))
    if not members:
        return 'Leadership records have not been filled in yet. Please check the Leadership page later for updates.'

    if 'president' in message:
        member = next((item for item in members if item.position == 'PRESIDENT'), None)
        if member:
            return f'The current SPE UDOM President is {member.name}.'
        return 'The President position is listed, but a member has not been assigned yet.'

    if 'vice president' in message:
        member = next((item for item in members if item.position == 'VICE PRESIDENT'), None)
        if member:
            return f'The current Vice President is {member.name}.'
        return 'The Vice President position is currently not filled in the system.'

    if 'secretary' in message:
        member = next((item for item in members if item.position == 'GENERAL SECRETARY'), None)
        if member:
            return f'The current General Secretary is {member.name}.'
        return 'The General Secretary position is currently not filled in the system.'

    if 'treasurer' in message:
        member = next((item for item in members if item.position == 'TREASURER'), None)
        if member:
            return f'The current Treasurer is {member.name}.'
        return 'The Treasurer position is currently not filled in the system.'

    if 'faculty advisor' in message or 'advisor' in message:
        member = next((item for item in members if item.position == 'FACULTY ADVISOR'), None)
        if member:
            return f'The current Faculty Advisor is {member.name}.'
        return 'The Faculty Advisor position is currently not filled in the system.'

    names = [f'{member.position}: {member.name}' for member in members[:6]]
    summary = _format_list(names)
    if len(members) > 6:
        return f'Current leadership includes {summary}. You can see the full team on the Leadership page.'
    return f'Current leadership includes {summary}.'


def _events_response(message: str) -> str:
    now = timezone.now()
    upcoming = list(Event.objects.filter(status='approved', date__gte=now).order_by('date')[:3])
    if upcoming:
        items = [f'{event.title} on {event.date.strftime("%d %b %Y")}' for event in upcoming]
        return f'Upcoming SPE UDOM events include {_format_list(items)}. You can open the Events page for full details.'

    latest = list(Event.objects.order_by('-date')[:3])
    if latest:
        items = [f'{event.title} on {event.date.strftime("%d %b %Y")}' for event in latest]
        return f'I do not see approved upcoming events right now. The most recent recorded events are {_format_list(items)}.'

    return 'There are no events in the system yet. Once events are added, I can help list them here.'


def _elections_response(message: str) -> str:
    open_election = Election.objects.filter(status='open').order_by('start_date').first()
    if open_election:
        return (
            f'There is an open election right now: {open_election.title}. '
            f'It runs until {open_election.end_date.strftime("%d %b %Y %H:%M")}.'
        )

    upcoming = Election.objects.filter(status='draft').order_by('start_date').first()
    if upcoming:
        return (
            f'There is no open election at the moment. The next recorded election is {upcoming.title}, '
            f'scheduled to start on {upcoming.start_date.strftime("%d %b %Y %H:%M")}.'
        )

    latest = Election.objects.order_by('-start_date').first()
    if latest:
        return f'The most recent recorded election is {latest.title} with status {latest.status}.'

    return 'There are no chapter elections recorded in the system yet.'


def _publications_response(message: str) -> str:
    publications = list(Publication.objects.order_by('-created_at')[:3])
    if not publications:
        return 'There are no publications in the system yet. Please check the Publication page later for updates.'

    titles = [publication.title for publication in publications]
    return f'Recent publications include {_format_list(titles)}. You can view more on the Publication page.'


def _contact_response() -> str:
    return CONTACT_RESPONSE


def _mission_response() -> str:
    return (
        'The chapter mission is to strengthen student knowledge and skills through technical resources, '
        'industry exposure, and professional development. Its vision is to bridge academic learning and industry practice.'
    )


def _thanks_response() -> str:
    return 'You are welcome. If you want, ask me about SPE UDOM leadership, events, elections, membership, or contact details.'


def get_assistant_response(message: str) -> str:
    normalized = (message or '').strip().lower()
    if not normalized:
        return FALLBACK_RESPONSE

    custom_response = _find_custom_faq(normalized)
    if custom_response:
        return custom_response

    if _contains_any(normalized, ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening']):
        return _greeting_response()

    if _contains_any(normalized, ['thank you', 'thanks', 'asante']):
        return _thanks_response()

    if _contains_any(normalized, ['mission', 'vision', 'goal', 'purpose']):
        return _mission_response()

    if _contains_any(normalized, ['about', 'what is spe udom', 'who are you', 'chapter']):
        return _about_response()

    if _contains_any(normalized, ['join', 'membership', 'member', 'register', 'sign up']):
        return _join_response()

    if _contains_any(normalized, ['leader', 'leadership', 'president', 'vice president', 'secretary', 'treasurer', 'advisor']):
        return _leadership_response(normalized)

    if _contains_any(normalized, ['event', 'workshop', 'seminar', 'training', 'field trip', 'upcoming']):
        return _events_response(normalized)

    if _contains_any(normalized, ['election', 'vote', 'candidate', 'voting']):
        return _elections_response(normalized)

    if _contains_any(normalized, ['publication', 'paper', 'research', 'article']):
        return _publications_response(normalized)

    if _contains_any(normalized, ['contact', 'email', 'location', 'address', 'office', 'where']):
        return _contact_response()

    if _contains_any(normalized, ['international', 'global network', 'spe international']):
        return (
            'SPE UDOM is part of SPE International, which connects members to a global professional network, '
            'technical resources, and career development opportunities.'
        )

    return FALLBACK_RESPONSE
