from __future__ import annotations

from django.utils import timezone

from core.models import Election, Event, LeadershipMember, Publication
from .models import ChatFAQ


SPE_ASSISTANT_NAME = 'SPE Assistant'

CONTACT_RESPONSE = (
    'You can reach SPE UDOM at speudom@gmail.com or info@speudom.org. '
    'The chapter is based at COESE, University of Dodoma, Dodoma, Tanzania. '
    'Office hours are Monday to Friday, 8:00 AM to 5:00 PM.'
)

FALLBACK_RESPONSE = (
    'I can help with questions about SPE UDOM and SPE International — topics like membership, '
    'leadership, events, elections, publications, scholarships, technical areas, training, and contact details.\n\n'
    '**Try asking me:**\n'
    '• "How do I join?" or "What are membership benefits?"\n'
    '• "What is PetroBowl?" or "Tell me about global events"\n'
    '• "Who is the president?" or "What is the leadership?"\n'
    '• "What events are coming?" or "When is the next workshop?"\n'
    '• "What scholarships are available?" or "Career opportunities?"\n'
    '• "How can I contact SPE UDOM?" or "What is your address?"\n'
    '• "What is SPE International?" or "What do you do?"\n\n'
    'If I cannot answer your question, please email us at speudom@gmail.com or use the contact form.'
)


def _contains_any(message: str, keywords: list[str]) -> bool:
    """Check if any keyword appears in message (case-insensitive)"""
    return any(keyword.lower() in message for keyword in keywords)


def _match_score(message: str, keywords: list[str]) -> int:
    """
    Calculate match score for keywords in message.
    Returns count of matching keywords.
    Higher score = better match
    """
    count = 0
    for keyword in keywords:
        if keyword.lower() in message:
            count += 1
    return count


def _format_list(items: list[str]) -> str:
    if not items:
        return ''
    if len(items) == 1:
        return items[0]
    return ', '.join(items[:-1]) + f', and {items[-1]}'


def _find_custom_faq(message: str) -> str | None:
    """Find FAQ using intelligent keyword matching with fuzzy matching support"""
    faqs = ChatFAQ.objects.filter(is_active=True).order_by('-priority', 'title')
    
    best_match = None
    best_score = 0
    
    for faq in faqs:
        keywords = [k.strip().lower() for k in faq.keywords.split(',') if k.strip()]
        
        # Exact or substring match (highest priority)
        for keyword in keywords:
            if keyword in message:
                # Return immediately if exact match found
                if best_score < 3:
                    best_match = faq.response
                    best_score = 3
        
        # Partial word match  (medium priority)
        if best_score < 2:
            for keyword in keywords:
                words = keyword.split()
                if all(w in message for w in words):
                    best_match = faq.response
                    best_score = 2
        
        # At least one keyword word matches (low priority)
        if best_score < 1:
            for keyword in keywords:
                words = keyword.split()
                if any(w in message for w in words):
                    best_match = faq.response
                    best_score = 1
    
    return best_match


# ── Greeting ──────────────────────────────────────────────────
def _greeting_response(sender_name: str = 'there') -> str:
    first = sender_name.split()[0] if sender_name and sender_name.lower() not in ('guest', 'guest user') else 'there'
    return (
        f'Hello {first}! I am the SPE UDOM chapter assistant. '
        'How can I help you?'
    )


# ── SPE International ─────────────────────────────────────────
def _spe_international_response() -> str:
    return (
        'The Society of Petroleum Engineers (SPE) is a global nonprofit organization that supports '
        'professionals in the exploration and production of oil and gas. It provides a platform for '
        'knowledge exchange, professional development, and technical innovation in the energy sector. '
        'SPE connects over 160,000 members worldwide through publications, events, training, and networking.'
    )


def _spe_values_response() -> str:
    return (
        'SPE International is guided by core values including: professional excellence, knowledge sharing, '
        'innovation and technology, integrity and ethics, and sustainability in energy.'
    )


def _spe_technical_areas_response() -> str:
    return (
        'SPE covers a wide range of technical areas including: Drilling Engineering, Reservoir Engineering, '
        'Production Engineering, Petroleum Geology, Energy Transition and Sustainability, '
        'and Data Science in Oil & Gas. Members can access technical papers and resources in all these areas.'
    )


def _spe_publications_response() -> str:
    return (
        'SPE International publishes several key resources including the SPE Journal, '
        'Journal of Petroleum Technology (JPT), and thousands of technical papers and research reports. '
        'Members get access to these through the SPE digital library.'
    )


def _spe_training_response() -> str:
    return (
        'SPE offers extensive learning opportunities including online courses and certifications, '
        'webinars and workshops, e-learning platforms, and technical training sessions. '
        'Student members can access many of these resources for free or at reduced cost.'
    )


# ── Global Events ─────────────────────────────────────────────
def _global_events_response() -> str:
    return (
        'Major SPE global events include: the SPE Annual Technical Conference and Exhibition (ATCE), '
        'Offshore Technology Conference (OTC), SPE Africa Regional Conferences, '
        'Student Paper Contests, and the PetroBowl Competition. '
        'These events feature technical presentations, networking sessions, career fairs, '
        'industry exhibitions, and panel discussions.'
    )


def _petrobowl_response() -> str:
    return (
        'PetroBowl is an exciting SPE global competition where student teams compete in petroleum '
        'engineering knowledge. Teams from student chapters around the world participate, '
        'answering rapid-fire questions on petroleum engineering topics. '
        'It is a great opportunity to test your knowledge and represent SPE UDOM internationally.'
    )


def _atce_response() -> str:
    return (
        'The SPE Annual Technical Conference and Exhibition (ATCE) is the largest gathering of '
        'petroleum engineers in the world. It features thousands of technical presentations, '
        'an industry exhibition, networking events, and career development sessions. '
        'Student members can attend at discounted rates.'
    )


# ── Student Opportunities ─────────────────────────────────────
def _scholarships_response() -> str:
    return (
        'SPE offers scholarships and financial support for students in petroleum engineering and '
        'related fields. Opportunities include SPE scholarships, research funding, and internship '
        'connections with industry partners. Members of SPE UDOM can apply through the SPE website '
        'or get guidance from the chapter leadership.'
    )


def _career_response() -> str:
    return (
        'SPE UDOM supports your career development through CV writing workshops, interview preparation, '
        'mentorship programs, and industry exposure. Being a member connects you to a global network '
        'of professionals and opens doors to internships and job opportunities in the energy sector.'
    )


def _skills_response() -> str:
    return (
        'By joining SPE UDOM you will develop valuable skills including leadership, communication, '
        'teamwork, problem-solving, and technical knowledge in petroleum engineering. '
        'These skills are highly valued by employers in the energy industry.'
    )


# ── Chapter Activities ────────────────────────────────────────
def _activities_response() -> str:
    return (
        'SPE UDOM regularly organizes: technical talks and seminars, hands-on workshops, '
        'field trips to oil and gas facilities, industry guest lectures, hackathons and competitions, '
        'and community outreach programs. These activities help bridge the gap between academic '
        'learning and real-world industry experience.'
    )


# ── About & Mission ───────────────────────────────────────────
def _about_response() -> str:
    return (
        'SPE UDOM Student Chapter is a professional student organization at the University of Dodoma '
        'operating under SPE International. It focuses on empowering students with technical knowledge '
        'and professional skills in the energy sector. The chapter connects students to global SPE '
        'resources, competitions, and industry networks.'
    )


def _mission_response() -> str:
    return (
        'Mission: To develop competent and professional students through knowledge sharing, '
        'leadership development, and industry engagement.\n\n'
        'Vision: To become a leading student chapter in Tanzania recognized for excellence '
        'in energy education and professional development.'
    )


# ── Membership ────────────────────────────────────────────────
def _join_response() -> str:
    return (
        'To join SPE UDOM, register on the website or contact the leadership team. '
        'Requirements: you must be a registered student at UDOM with an interest in energy, '
        'engineering, or professional growth.\n\n'
        'Benefits include: access to international SPE resources, participation in competitions '
        'like PetroBowl, networking with professionals, leadership opportunities, '
        'certificates and recognition, and career growth opportunities.'
    )


def _membership_benefits_response() -> str:
    return (
        'SPE UDOM membership benefits include:\n'
        '• Access to international SPE resources and publications\n'
        '• Participation in PetroBowl and student paper contests\n'
        '• Networking with industry professionals\n'
        '• Leadership and committee opportunities\n'
        '• Certificates and recognition\n'
        '• Career development workshops and mentorship\n'
        '• Scholarships and research funding opportunities'
    )


# ── Leadership Roles ──────────────────────────────────────────
def _leadership_role_response(role: str) -> str:
    roles = {
        'president': 'The President provides overall leadership, represents the chapter externally, and oversees all chapter activities and strategic direction.',
        'vice president': 'The Vice President assists the President, coordinates programs and events, and steps in when the President is unavailable.',
        'general secretary': 'The General Secretary manages communication, organizes meetings, handles records, and oversees the election process.',
        'treasurer': 'The Treasurer manages chapter finances, tracks income and expenses, and prepares financial reports for the chapter.',
        'membership chair': 'The Membership Chairperson recruits new members, manages membership records, and organizes membership drives.',
        'program chair': 'The Program Chairperson plans and coordinates chapter events, workshops, and technical programs.',
        'communications': 'The Communications and Outreach Chairperson manages social media, newsletters, and external communications.',
        'social': 'The Social Activities Chairperson organizes social events, team-building activities, and community engagement programs.',
        'web master': 'The Web Master manages the chapter website, ensures content is up to date, and handles digital platforms.',
        'technical officer': 'The Technical Officer coordinates technical activities, seminars, and ensures the chapter stays current with industry developments.',
        'faculty advisor': 'The Faculty Advisor is an academic staff member who guides the chapter, provides mentorship, and connects students with academic resources.',
    }
    return roles.get(role, '')


def _leadership_response(message: str) -> str:
    members = list(LeadershipMember.objects.order_by('display_order', 'position'))

    # Role description questions
    for role_key, description in [
        ('role of president', 'president'), ('what does president do', 'president'),
        ('role of vice president', 'vice president'), ('what does vice president do', 'vice president'),
        ('role of secretary', 'general secretary'), ('what does secretary do', 'general secretary'),
        ('role of treasurer', 'treasurer'), ('what does treasurer do', 'treasurer'),
        ('role of faculty advisor', 'faculty advisor'), ('what does advisor do', 'faculty advisor'),
    ]:
        if role_key in message:
            return _leadership_role_response(description)

    if not members:
        return 'Leadership records have not been filled in yet. Please check the Leadership page for updates.'

    if 'president' in message and 'vice' not in message:
        m = next((x for x in members if x.position == 'PRESIDENT'), None)
        return f'The current SPE UDOM President is {m.name}.' if m else 'The President position has not been assigned yet.'

    if 'vice president' in message:
        m = next((x for x in members if x.position == 'VICE PRESIDENT'), None)
        return f'The current Vice President is {m.name}.' if m else 'The Vice President position has not been assigned yet.'

    if 'secretary' in message:
        m = next((x for x in members if x.position == 'GENERAL SECRETARY'), None)
        return f'The current General Secretary is {m.name}.' if m else 'The General Secretary position has not been assigned yet.'

    if 'treasurer' in message:
        m = next((x for x in members if x.position == 'TREASURER'), None)
        return f'The current Treasurer is {m.name}.' if m else 'The Treasurer position has not been assigned yet.'

    if 'faculty advisor' in message or 'advisor' in message:
        m = next((x for x in members if x.position == 'FACULTY ADVISOR'), None)
        return f'The current Faculty Advisor is {m.name}.' if m else 'The Faculty Advisor position has not been assigned yet.'

    names = [f'{m.position.title()}: {m.name}' for m in members[:6]]
    summary = _format_list(names)
    suffix = ' Visit the Leadership page to see the full team.' if len(members) > 6 else ''
    return f'Current SPE UDOM leadership — {summary}.{suffix}'


# ── Elections ─────────────────────────────────────────────────
def _elections_response(message: str) -> str:
    open_el = Election.objects.filter(status='open').order_by('start_date').first()
    if open_el:
        return (
            f'There is an open election right now: {open_el.title}. '
            f'It runs until {open_el.end_date.strftime("%d %b %Y %H:%M")}. '
            'Log in to cast your vote on the Elections page.'
        )
    upcoming = Election.objects.filter(status='draft').order_by('start_date').first()
    if upcoming:
        return (
            f'No election is open right now. The next election is "{upcoming.title}", '
            f'scheduled to start on {upcoming.start_date.strftime("%d %b %Y")}.'
        )
    latest = Election.objects.order_by('-start_date').first()
    if latest:
        return f'The most recent election was "{latest.title}" with status: {latest.status}.'
    return (
        'SPE UDOM elections are conducted annually. Members vote for leaders including '
        'President, Vice President, General Secretary, and Treasurer. '
        'The process is transparent and fair. No elections are currently recorded in the system.'
    )


# ── Events ────────────────────────────────────────────────────
def _events_response(message: str) -> str:
    now = timezone.now()
    upcoming = list(Event.objects.filter(status='approved', date__gte=now).order_by('date')[:3])
    if upcoming:
        items = [f'{e.title} on {e.date.strftime("%d %b %Y")}' for e in upcoming]
        return f'Upcoming SPE UDOM events: {_format_list(items)}. Visit the Events page for full details and registration.'

    latest = list(Event.objects.order_by('-date')[:3])
    if latest:
        items = [f'{e.title} on {e.date.strftime("%d %b %Y")}' for e in latest]
        return (
            f'No upcoming events are scheduled right now. Recent past events include {_format_list(items)}. '
            'We regularly organize workshops, seminars, competitions, and networking sessions. Check back soon!'
        )
    return (
        'SPE UDOM regularly organizes workshops, seminars, field trips, competitions, and networking events. '
        'No events are currently listed. Check the Events page for updates.'
    )


# ── Publications ──────────────────────────────────────────────
def _publications_response(message: str) -> str:
    pubs = list(Publication.objects.order_by('-created_at')[:3])
    if pubs:
        titles = [p.title for p in pubs]
        return f'Recent SPE UDOM publications include {_format_list(titles)}. Visit the Publication page to read and download them.'
    return (
        'SPE UDOM shares articles, research papers, and documents through the Publication page. '
        'SPE International also publishes the SPE Journal and Journal of Petroleum Technology (JPT). '
        'No local publications are listed yet — check back soon.'
    )


# ── Contact ───────────────────────────────────────────────────
def _contact_response() -> str:
    return CONTACT_RESPONSE


# ── Thanks ────────────────────────────────────────────────────
def _thanks_response() -> str:
    return (
        'You are welcome! Feel free to ask me anything about SPE UDOM — '
        'membership, events, leadership, elections, scholarships, or contact details.'
    )


# ── Main dispatcher ───────────────────────────────────────────
def get_assistant_response(message: str, sender_name: str = 'there') -> str:
    """
    Intelligently route user messages to appropriate response handlers.
    Checks core handlers first (greetings, membership, thanks), then custom FAQs, then other topics.
    """
    n = (message or '').strip().lower()
    if not n:
        return FALLBACK_RESPONSE

    # Greeting (must check early before other keywords that contain greeting words)
    if _match_score(n, ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'greetings', 'whats up', "what's up"]) >= 1:
        return _greeting_response(sender_name)

    # Thanks (check early)
    if _contains_any(n, ['thank you', 'thanks', 'asante', 'thank u', 'thx', 'much appreciated']):
        return _thanks_response()

    # Membership (CORE intent - check BEFORE custom FAQs to prevent bad FAQ entries from breaking this)
    membership_keywords = ['join', 'membership', 'member', 'register', 'sign up', 'how to join', 'requirement', 'become member', 'apply']
    if _contains_any(n, membership_keywords):
        if _contains_any(n, ['benefit', 'advantage', 'gain', 'get', 'what do i get', 'what will i']):
            return _membership_benefits_response()
        return _join_response()

    if _contains_any(n, ['benefit', 'advantage', 'what do i get', 'what will i']) and 'member' in n:
        return _membership_benefits_response()

    # Custom FAQ from DB (checked after core handlers to prevent bad FAQs from breaking key functionality)
    custom = _find_custom_faq(n)
    if custom:
        return custom

    # SPE International
    spe_keywords = ['what is spe', 'what does spe do', 'spe international', 'society of petroleum', 'about spe', 'spe purpose']
    if _contains_any(n, spe_keywords):
        return _spe_international_response()

    if _contains_any(n, ['spe value', 'core value', 'spe principle', 'spe mission', 'values']):
        return _spe_values_response()

    technical_keywords = ['technical area', 'drilling', 'reservoir', 'production engineering', 'petroleum geology', 'data science', 'energy transition', 'technical expertise']
    if _contains_any(n, technical_keywords):
        return _spe_technical_areas_response()

    if _contains_any(n, ['spe journal', 'spe publication', 'journal of petroleum', 'jpt', 'spe paper', 'research paper', 'technical paper']):
        return _spe_publications_response()

    training_keywords = ['spe training', 'spe course', 'spe certification', 'spe webinar', 'spe learning', 'e-learning', 'learn', 'education', 'training program']
    if _contains_any(n, training_keywords):
        return _spe_training_response()

    # Global events
    if _contains_any(n, ['petrobowl', 'petro bowl']):
        return _petrobowl_response()

    if _contains_any(n, ['atce', 'annual technical conference', 'otc', 'offshore technology', 'conference']):
        return _atce_response()

    if _contains_any(n, ['global event', 'spe event', 'international event', 'africa conference', 'student paper contest', 'competition']):
        return _global_events_response()

    # Scholarships & career
    scholarship_keywords = ['scholarship', 'funding', 'financial support', 'bursary', 'grant', 'fund', 'financial', 'money']
    if _contains_any(n, scholarship_keywords):
        return _scholarships_response()

    career_keywords = ['career', 'job', 'internship', 'cv', 'resume', 'interview', 'mentorship', 'employment', 'work', 'professional', 'opportunity']
    if _contains_any(n, career_keywords):
        return _career_response()

    skill_keywords = ['skill', 'what will i gain', 'what do i learn', 'benefit of joining', 'why join', 'why should i', 'learn', 'develop']
    if _contains_any(n, skill_keywords):
        return _skills_response()

    # Activities
    activity_keywords = ['activit', 'what do you do', 'chapter do', 'program', 'hackathon', 'field trip', 'outreach', 'community', 'workshop', 'seminar', 'talk', 'event', 'organize']
    if _contains_any(n, activity_keywords):
        return _activities_response()

    # Mission / Vision / About
    if _contains_any(n, ['mission', 'vision', 'goal', 'purpose', 'objective', 'what are we trying']):
        return _mission_response()

    about_keywords = ['about', 'what is spe udom', 'who are you', 'tell me about', 'what is the chapter', 'spe udom', 'this chapter']
    if _contains_any(n, about_keywords):
        return _about_response()

    # Leadership (higher specificity to avoid false matches)
    leadership_keywords = ['leader', 'leadership', 'president', 'vice president', 'secretary', 'treasurer', 'advisor', 'officer', 'chairperson', 'web master', 'who is', 'who leads', 'who runs']
    if _contains_any(n, leadership_keywords):
        return _leadership_response(n)

    # Elections
    election_keywords = ['election', 'vote', 'candidate', 'voting', 'ballot', 'elect', 'voting process', 'how to vote']
    if _contains_any(n, election_keywords):
        return _elections_response(n)

    # Events & Publications (after more specific checks)
    event_keywords = ['event', 'workshop', 'seminar', 'training', 'field trip', 'upcoming', 'competition', 'networking', 'when is', 'schedule']
    if _contains_any(n, event_keywords):
        return _events_response(n)

    publication_keywords = ['publication', 'paper', 'research', 'article', 'document', 'report', 'journal', 'read', 'download']
    if _contains_any(n, publication_keywords):
        return _publications_response(n)

    # Contact
    contact_keywords = ['contact', 'email', 'location', 'address', 'office', 'where', 'find you', 'reach', 'call', 'phone', 'how to reach']
    if _contains_any(n, contact_keywords):
        return _contact_response()

    # If nothing matched, return helpful fallback
    return FALLBACK_RESPONSE
