-- ============================================================
--  SPE UDOM Chapter — Full Database Schema
--  Engine: SQLite (Django ORM generated)
--  Tables: 15 (12 core + 3 M2M junction)
-- ============================================================

-- ── Students (Custom User) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS core_student (
    id               INTEGER      PRIMARY KEY AUTOINCREMENT,
    password         VARCHAR(128) NOT NULL,
    last_login       DATETIME,
    is_superuser     BOOLEAN      NOT NULL DEFAULT 0,
    email            VARCHAR(254) NOT NULL UNIQUE,
    full_name        VARCHAR(100) NOT NULL,
    phone            VARCHAR(15)  NOT NULL DEFAULT '',
    year_of_study    SMALLINT,
    role             VARCHAR(20)  NOT NULL DEFAULT 'member',
                                  -- 'admin' | 'president' | 'general_secretary' | 'member'
    profile_picture  VARCHAR(100),
    is_active        BOOLEAN      NOT NULL DEFAULT 1,
    is_staff         BOOLEAN      NOT NULL DEFAULT 0,
    date_joined      DATETIME     NOT NULL
);

-- ── Events ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core_event (
    id           INTEGER      PRIMARY KEY AUTOINCREMENT,
    title        VARCHAR(200) NOT NULL,
    description  TEXT         NOT NULL,
    location     VARCHAR(200) NOT NULL,
    date         DATETIME     NOT NULL,
    status       VARCHAR(10)  NOT NULL DEFAULT 'pending',
                              -- 'pending' | 'approved' | 'rejected' | 'cancelled'
    cancel_reason TEXT        NOT NULL DEFAULT '',
    created_at   DATETIME     NOT NULL,
    created_by_id INTEGER     REFERENCES core_student(id) ON DELETE SET NULL
);

-- ── Event Registrations ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS core_eventregistration (
    id            INTEGER  PRIMARY KEY AUTOINCREMENT,
    registered_at DATETIME NOT NULL,
    student_id    INTEGER  NOT NULL REFERENCES core_student(id) ON DELETE CASCADE,
    event_id      INTEGER  NOT NULL REFERENCES core_event(id)   ON DELETE CASCADE,
    UNIQUE (student_id, event_id)
);

-- ── Event Photos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core_eventphoto (
    id            INTEGER      PRIMARY KEY AUTOINCREMENT,
    photo         VARCHAR(100) NOT NULL,
    caption       VARCHAR(200) NOT NULL DEFAULT '',
    uploaded_at   DATETIME     NOT NULL,
    event_id      INTEGER      NOT NULL REFERENCES core_event(id)   ON DELETE CASCADE,
    uploaded_by_id INTEGER              REFERENCES core_student(id) ON DELETE SET NULL
);

-- ── Announcements ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core_announcement (
    id         INTEGER      PRIMARY KEY AUTOINCREMENT,
    title      VARCHAR(200) NOT NULL,
    message    TEXT         NOT NULL,
    created_at DATETIME     NOT NULL,
    sent_by_id INTEGER      REFERENCES core_student(id) ON DELETE SET NULL
);

-- ── Publications ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core_publication (
    id               INTEGER      PRIMARY KEY AUTOINCREMENT,
    title            VARCHAR(200) NOT NULL,
    content          TEXT         NOT NULL DEFAULT '',
    file             VARCHAR(100),
    pub_type         VARCHAR(20)  NOT NULL DEFAULT 'article',
                                  -- 'article' | 'journal' | 'document' | 'image'
    created_at       DATETIME     NOT NULL,
    published_by_id  INTEGER      REFERENCES core_student(id) ON DELETE SET NULL
);

-- ── Elections ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core_election (
    id           INTEGER      PRIMARY KEY AUTOINCREMENT,
    title        VARCHAR(200) NOT NULL,
    description  TEXT         NOT NULL DEFAULT '',
    status       VARCHAR(10)  NOT NULL DEFAULT 'draft',
                              -- 'draft' | 'open' | 'closed'
    start_date   DATETIME     NOT NULL,
    end_date     DATETIME     NOT NULL,
    created_at   DATETIME     NOT NULL,
    created_by_id INTEGER     REFERENCES core_student(id) ON DELETE SET NULL
);

-- ── Candidates ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core_candidate (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(100) NOT NULL DEFAULT '',
    position    VARCHAR(100) NOT NULL,
                             -- see POSITION_CHOICES in models.py
    manifesto   TEXT         NOT NULL DEFAULT '',
    photo       VARCHAR(100),
    approved    BOOLEAN      NOT NULL DEFAULT 0,
    election_id INTEGER      NOT NULL REFERENCES core_election(id) ON DELETE CASCADE,
    UNIQUE (election_id, name, position)
);

-- ── Votes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core_vote (
    id              INTEGER      PRIMARY KEY AUTOINCREMENT,
    position_voted  VARCHAR(100) NOT NULL DEFAULT '',
    voted_at        DATETIME     NOT NULL,
    election_id     INTEGER      NOT NULL REFERENCES core_election(id)  ON DELETE CASCADE,
    voter_id        INTEGER      NOT NULL REFERENCES core_student(id)   ON DELETE CASCADE,
    candidate_id    INTEGER      NOT NULL REFERENCES core_candidate(id) ON DELETE CASCADE,
    UNIQUE (election_id, voter_id, position_voted)
);

-- ── Suggestions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core_suggestion (
    id             INTEGER  PRIMARY KEY AUTOINCREMENT,
    message        TEXT     NOT NULL,
    is_anonymous   BOOLEAN  NOT NULL DEFAULT 0,
    reply          TEXT     NOT NULL DEFAULT '',
    replied_at     DATETIME,
    created_at     DATETIME NOT NULL,
    student_id     INTEGER  NOT NULL REFERENCES core_student(id) ON DELETE CASCADE,
    replied_by_id  INTEGER           REFERENCES core_student(id) ON DELETE SET NULL
);

-- ── Contact Messages ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core_contactmessage (
    id         INTEGER      PRIMARY KEY AUTOINCREMENT,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(254) NOT NULL,
    subject    VARCHAR(200) NOT NULL DEFAULT '',
    message    TEXT         NOT NULL,
    is_read    BOOLEAN      NOT NULL DEFAULT 0,
    created_at DATETIME     NOT NULL
);

-- ── Leadership Members ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core_leadershipmember (
    id            INTEGER      PRIMARY KEY AUTOINCREMENT,
    name          VARCHAR(120) NOT NULL,
    position      VARCHAR(60)  NOT NULL,
                               -- see POSITION_CHOICES in models.py
    year          VARCHAR(9)   NOT NULL,   -- e.g. '2025/2026'
    image         VARCHAR(100),
    display_order SMALLINT     NOT NULL DEFAULT 0,
    updated_at    DATETIME     NOT NULL,
    UNIQUE (position, year)
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_event_status        ON core_event(status);
CREATE INDEX IF NOT EXISTS idx_event_date          ON core_event(date);
CREATE INDEX IF NOT EXISTS idx_election_status     ON core_election(status);
CREATE INDEX IF NOT EXISTS idx_candidate_election  ON core_candidate(election_id);
CREATE INDEX IF NOT EXISTS idx_vote_election       ON core_vote(election_id);
CREATE INDEX IF NOT EXISTS idx_vote_voter          ON core_vote(voter_id);
CREATE INDEX IF NOT EXISTS idx_leadership_year     ON core_leadershipmember(year);
CREATE INDEX IF NOT EXISTS idx_suggestion_student  ON core_suggestion(student_id);
CREATE INDEX IF NOT EXISTS idx_publication_type    ON core_publication(pub_type);

-- ── Annual Report ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core_annualreport (
    id                      INTEGER      PRIMARY KEY AUTOINCREMENT,
    year                    VARCHAR(9)   NOT NULL UNIQUE,  -- e.g. '2025/2026'
    president_message       TEXT         NOT NULL DEFAULT '',
    president_image         VARCHAR(100),
    membership_statistics   TEXT         NOT NULL DEFAULT '',
    membership_chart        VARCHAR(100),
    technical_dissemination TEXT         NOT NULL DEFAULT '',
    community_engagement    TEXT         NOT NULL DEFAULT '',
    member_recognition      TEXT         NOT NULL DEFAULT '',
    challenges              TEXT         NOT NULL DEFAULT '',
    recommendations         TEXT         NOT NULL DEFAULT '',
    created_at              DATETIME     NOT NULL,
    updated_at              DATETIME     NOT NULL,
    created_by_id           INTEGER      REFERENCES core_student(id) ON DELETE SET NULL
);

-- ── Annual Report Images ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS core_annualreportimage (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    image       VARCHAR(100) NOT NULL,
    caption     VARCHAR(200) NOT NULL DEFAULT '',
    uploaded_at DATETIME     NOT NULL
);

-- ── M2M: Annual Report ↔ Technical Images ────────────────────
CREATE TABLE IF NOT EXISTS core_annualreport_technical_images (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    annualreport_id      INTEGER NOT NULL REFERENCES core_annualreport(id)      ON DELETE CASCADE,
    annualreportimage_id INTEGER NOT NULL REFERENCES core_annualreportimage(id) ON DELETE CASCADE,
    UNIQUE (annualreport_id, annualreportimage_id)
);

-- ── M2M: Annual Report ↔ Community Images ────────────────────
CREATE TABLE IF NOT EXISTS core_annualreport_community_images (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    annualreport_id      INTEGER NOT NULL REFERENCES core_annualreport(id)      ON DELETE CASCADE,
    annualreportimage_id INTEGER NOT NULL REFERENCES core_annualreportimage(id) ON DELETE CASCADE,
    UNIQUE (annualreport_id, annualreportimage_id)
);

-- ── M2M: Annual Report ↔ Recognition Images ──────────────────
CREATE TABLE IF NOT EXISTS core_annualreport_recognition_images (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    annualreport_id      INTEGER NOT NULL REFERENCES core_annualreport(id)      ON DELETE CASCADE,
    annualreportimage_id INTEGER NOT NULL REFERENCES core_annualreportimage(id) ON DELETE CASCADE,
    UNIQUE (annualreport_id, annualreportimage_id)
);

-- ── Financial Items ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core_financialitem (
    id                  INTEGER        PRIMARY KEY AUTOINCREMENT,
    item_source         VARCHAR(200)   NOT NULL,
    expenditure         DECIMAL(12,2)  NOT NULL DEFAULT 0,
    total_expenditure   DECIMAL(12,2)  NOT NULL DEFAULT 0,
    outstanding_balance DECIMAL(12,2)  NOT NULL DEFAULT 0,
    balance             DECIMAL(12,2)  NOT NULL DEFAULT 0,
    report_id           INTEGER        NOT NULL REFERENCES core_annualreport(id) ON DELETE CASCADE
);

-- ── Additional Indexes ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_annualreport_year      ON core_annualreport(year);
CREATE INDEX IF NOT EXISTS idx_financialitem_report   ON core_financialitem(report_id);
CREATE INDEX IF NOT EXISTS idx_reportimage_uploaded   ON core_annualreportimage(uploaded_at);
