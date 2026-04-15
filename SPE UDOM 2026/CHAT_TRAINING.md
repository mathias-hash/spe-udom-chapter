# Chat Bot Training Guide

Your SPE UDOM chat assistant uses AI-powered keyword matching to understand and respond to user inquiries. This guide explains how to train and improve the bot's responses.

## Overview

The chat system has two layers:

1. **Built-in Responses** - Hardcoded answers about SPE, events, leadership, etc.
2. **Custom FAQ Training** - Admin-configured Q&A pairs that you control

Custom FAQs take **highest priority** — they're checked first! This allows you to customize responses for your chapter's specific needs.

---

## How to Train the Chat Bot

### Step 1: Go to Admin Dashboard
- Login to `/admin/` with your admin credentials
- Navigate to **Chat → Chat FAQs**

### Step 2: Create a New FAQ

Click **+ Add Chat FAQ** and fill in:

#### **Title** (Required)
A descriptive name for this Q&A pair.

**Example:** `"How to Join Membership"`

#### **Keywords** (Required) 
Comma-separated phrases users might type to trigger this response. Be thorough!

**Rules:**
- Separate with commas: `keyword1, keyword2, keyword3`
- Keywords are **case-insensitive**
- Partial matches work (e.g., "join" matches "how to join")
- Think about variations users might ask

**Good Example:**
```
join, membership, register, sign up, how to join, become member, apply, 
joining spe, become a member, enroll, membership requirements
```

**Poor Example:**
```
join
```

#### **Response** (Required)
The complete answer the bot will give. Use plain text or markdown formatting.

**Example:**
```
To join SPE UDOM, simply visit our website and create an account. Registration is free and open to all UDOM students interested in petroleum engineering or energy careers.

**Requirements:**
- Be a registered UDOM student
- Have an interest in the energy sector
- Be committed to professional development

**Benefits of joining:**
- Access to international SPE resources
- Networking with industry professionals
- Career development opportunities
- Participation in competitions like PetroBowl
- Leadership and volunteering roles

Contact us at speudom@gmail.com for more information.
```

#### **Priority** (Optional)
- Higher number = checked first
- Use this if you have overlapping keywords
- Default is 0

**Example:** Set priority to 10 for your most important FAQs

#### **Is Active** (Optional)
Uncheck to temporarily disable this FAQ without deleting it.

---

## Training Examples

### Example 1: Membership Questions

**Title:** How to Join SPE UDOM

**Keywords:**
```
join, membership, register, sign up, how to join, become member, apply, 
membership requirements, enrollment, register online
```

**Response:**
```
Welcome! Joining SPE UDOM is easy:

1. Visit our website and click "Join"
2. Create your account with your student email
3. Fill in your details (name, year of study, phone)
4. Confirm your email
5. You're in! Start attending events and networking.

Membership is FREE for all UDOM students.

**What you get:**
- Access to SPE's global technical resources
- Participation in competitions (PetroBowl, Paper Contests)
- Networking with industry professionals
- Scholarships and funding opportunities
- Career mentorship programs
- Leadership roles and volunteering

Questions? Email speudom@gmail.com or message us here!
```

---

### Example 2: Event Information

**Title:** Upcoming Events and Workshops

**Keywords:**
```
upcoming events, what events, when is next event, workshop, seminar, 
what activities, schedule, upcoming, events coming, what's happening
```

**Response:**
```
SPE UDOM organizes several events throughout the year:

**Regular Activities:**
- Monthly technical talks and seminars (hosted on Wednesdays)
- Career development workshops
- Industry networking sessions
- Field trips to petroleum facilities
- PetroBowl practice sessions

**Special Events:**
- Annual General Meeting (usually in March)
- International Petroleum Day celebration
- Graduation and recognition events

Check our **Events page** or **Dashboard** for specific dates and registration.

Can't find what you're looking for? Email us at speudom@gmail.com
```

---

### Example 3: Scholarship Information

**Title:** Scholarships and Financial Support

**Keywords:**
```
scholarship, grant, funding, financial support, bursary, fund, money, 
financial aid, student grants, spei scholarships, spe funding
```

**Response:**
```
SPE offers various scholarships and financial opportunities for students:

**Through SPE International:**
- SPEI Scholarships for undergraduate/graduate students
- Student Paper Contest Prizes
- Award scholarships (usually $500-$5,000)
- Research funding for thesis projects

**Through SPE UDOM Chapter:**
- Leadership development grants
- Event sponsorship for travel

**How to Apply:**
1. Check the SPE website (www.spe.org) for active scholarships
2. Ensure you're an SPE UDOM member
3. Submit applications before deadlines (usually March-April)
4. Contact our Treasurer for chapter-specific funding

For details, contact:
- **SPE International:** www.spe.org/scholarships
- **SPE UDOM Treasurer:** Email speudom@gmail.com
```

---

### Example 4: General Help

**Title:** I'm Confused / General Help

**Keywords:**
```
help, i don't know, confused, not sure, what do you do, 
can you help, lost, need help, what is this, explain
```

**Response:**
```
I'm here to help! I can answer questions about:

✓ **SPE UDOM Chapter** — membership, events, leadership, activity
✓ **SPE International** — what SPE is, technical areas, opportunities
✓ **Competitions** — PetroBowl, paper contests, competitions
✓ **Careers & Skills** — scholarships, internships, professional development
✓ **Contact** — how to reach us, office hours, location

**Just ask me things like:**
- "How do I join?"
- "What events are happening?"
- "Who is the president?"
- "What is PetroBowl?"
- "How do I get a scholarship?"

**Can't find an answer?**
- Email us: speudom@gmail.com
- Call/WhatsApp: [Your contact number]
- Visit the Leadership page to contact specific leaders

What would you like to know?
```

---

## Best Practices for Training

### ✅ DO:

1. **Think Like Users**
   - What questions would students actually ask?
   - What search terms would they use?
   - Include variations, typos, informal language

2. **Be Comprehensive**
   - Give at least 5-10 keywords per FAQ
   - Include abbreviations (e.g., "PB", "SPE")
   - Cover different ways to phrase the same question

3. **Keep Responses Clear**
   - Use short paragraphs
   - Include bullet points for lists
   - Include a call-to-action (email, contact, etc.)
   - Use bold for **important** points

4. **Regular Updates**
   - Review FAQs every month
   - Update with new events/leadership
   - Remove outdated information
   - Add FAQs based on frequently asked questions

5. **Priority Management**
   - Set high priority (5-10) for **most important** FAQs
   - Use low priority (0-2) for less common questions
   - Avoid priority conflicts

### ❌ DON'T:

1. **Single Keywords**
   ```
   ❌ Bad:  keywords = "join"
   ✅ Good: keywords = "join, membership, register, sign up, how to join, apply"
   ```

2. **Generic Responses**
   ```
   ❌ Bad:  "Yes, we have events."
   ✅ Good: "We organize technical talks on Wednesdays and field trips quarterly. 
            Check the Events page for this month's schedule."
   ```

3. **Outdated Information**
   - Don't mention past events in present tense
   - Update dates regularly
   - Remove superseded information

4. **Very Long Responses**
   - Keep under 300 words ideally
   - Break into sections
   - Use bullet points

---

## Testing Your Training

### Method 1: Use the Live Chat
1. Open the website in a private browser
2. Open the chat (bottom right icon)
3. Type test messages
4. Check if your FAQ is returned

### Method 2: Inspect Backend
1. Go to `/admin/chat/chatfaq/`
2. Check that your FAQ is **Active** (is_active = True)
3. Verify keywords are correctly formatted

### Common Issues

**Issue:** FAQ not appearing
- ✅ Check `is_active` is True
- ✅ Verify keywords contain user's message
- ✅ Check priority (might be overridden by higher priority FAQ)

**Issue:** Wrong FAQ appearing
- ✅ Check for keyword conflicts
- ✅ Increase priority of correct FAQ
- ✅ Remove overlapping keywords from incorrect FAQ

---

## Built-in Topic Coverage

These topics are **automatically handled** (don't need custom FAQs):

- ✅ Greetings ("Hi", "Hello", "How are you")
- ✅ Thanks ("Thanks", "Thank you", "تشكراً")
- ✅ About SPE International
- ✅ SPE values and technical areas
- ✅ Global events (ATCE, OTC, PetroBowl)
- ✅ Leadership page queries
- ✅ Event calendar (with live data)
- ✅ Elections (with live data)
- ✅ Publications (with live data)
- ✅ Contact information

You only need custom FAQs for **chapter-specific** or **unique** questions!

---

## Performance Monitoring

Track how often each FAQ is used:
1. Go to `/admin/chat/message/`
2. Filter by content to see which questions are being asked
3. If a question appears often but isn't answered well, create a new FAQ

---

## Contact & Support

For questions about chat training:
- Email: speudom@gmail.com
- Check the DEPLOYMENT.md file
- Review the QUICKSTART.md file

Happy training! 🤖
