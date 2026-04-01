import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import joinVideo from '../assets/How_to_Join_SPE(720p).mp4';
import renewVideo from '../assets/How to Renew SPE Membership (Student Member).mp4';
import './Membership.css';

const BookIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="mem-svg-icon">
    <path d="M6 5.5A2.5 2.5 0 0 1 8.5 3H19v15H8.5A2.5 2.5 0 0 0 6 20.5V5.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M6 5.5A2.5 2.5 0 0 0 3.5 8v11A2.5 2.5 0 0 1 6 16.5H19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9 7h7M9 10h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const CapIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="mem-svg-icon">
    <path d="m3 9 9-4 9 4-9 4-9-4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M7 11.5V15c0 1.6 2.5 3 5 3s5-1.4 5-3v-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 10v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="mem-svg-icon">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.5 9h17M3.5 15h17M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.6-4-9s1.5-6.6 4-9Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="mem-svg-icon">
    <rect x="3.5" y="5.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M7.5 3.5v4M16.5 3.5v4M3.5 9h17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="mem-svg-icon">
    <rect x="3.5" y="7" width="17" height="11.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 11.5h17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="mem-svg-icon">
    <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M8 5H5a2 2 0 0 0 2 4h1M16 5h3a2 2 0 0 1-2 4h-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 11v4M9 20h6M10 15h4v5h-4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RotateIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="mem-svg-icon">
    <path d="M20 12a8 8 0 1 1-2.3-5.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M20 4v6h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const VideoIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="mem-svg-icon">
    <rect x="3.5" y="6" width="12.5" height="12" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="m16 10 4.5-2v8L16 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="m9.5 10.2 3.8 1.8-3.8 1.8Z" fill="currentColor" />
  </svg>
);

const benefits = [
  { title: 'Access to SPE Publications', desc: 'Read technical papers, journals, and research from industry experts worldwide.', Icon: BookIcon },
  { title: 'Scholarships & Awards', desc: 'Eligible for SPE scholarships, fellowships, and student paper contests.', Icon: CapIcon },
  { title: 'Global Network', desc: 'Connect with 160,000+ petroleum engineers and professionals globally.', Icon: GlobeIcon },
  { title: 'Events & Conferences', desc: 'Discounted access to SPE conferences, workshops, and technical events.', Icon: CalendarIcon },
  { title: 'Career Resources', desc: 'Job board, career fairs, and mentorship programs for students.', Icon: BriefcaseIcon },
  { title: 'Chapter Activities', desc: 'Participate in UDOM chapter events, competitions, and leadership roles.', Icon: TrophyIcon },
];

const Join = () => (
  <div className="mem-section">
    <h2>Join SPE UDOM Chapter</h2>
    <p className="mem-intro">
      Becoming a member of SPE UDOM Student Chapter connects you with a global network of petroleum engineers and gives you access to exclusive resources, events, and career opportunities.
    </p>

    <div className="mem-video-wrap">
      <h3 className="mem-video-title">
        <span className="mem-video-icon"><VideoIcon /></span>
        <span>How to Join SPE - Step by Step Guide</span>
      </h3>
      <p>Watch this video to learn how to create your SPE account and join as a student member.</p>
      <video controls className="mem-video">
        <source src={joinVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>

    <div className="mem-steps">
      <div className="mem-step">
        <div className="step-num">1</div>
        <div>
          <h4>Create an Account</h4>
          <p>Register on this website with your UDOM email address and personal details.</p>
        </div>
      </div>
      <div className="mem-step">
        <div className="step-num">2</div>
        <div>
          <h4>Join SPE International</h4>
          <p>Visit <a href="https://www.spe.org/en/join/" target="_blank" rel="noreferrer">spe.org/join</a> to register as an SPE student member (free for students).</p>
        </div>
      </div>
      <div className="mem-step">
        <div className="step-num">3</div>
        <div>
          <h4>Connect with the Chapter</h4>
          <p>Attend our events, workshops, and meetings to get fully involved in chapter activities.</p>
        </div>
      </div>
    </div>

    <div className="mem-cta">
      <Link to="/register" className="mem-btn-primary">Register Now -&gt;</Link>
      <a href="https://www.spe.org/en/join/" target="_blank" rel="noreferrer" className="mem-btn-secondary">Join SPE International -&gt;</a>
    </div>
  </div>
);

const Renew = () => (
  <div className="mem-section">
    <h2>Renew Your Membership</h2>
    <p className="mem-intro">
      Keep your SPE membership active to continue enjoying all the benefits of being part of the world&apos;s largest petroleum engineering society.
    </p>

    <div className="mem-video-wrap">
      <h3 className="mem-video-title">
        <span className="mem-video-icon"><VideoIcon /></span>
        <span>How to Renew SPE Membership (Student Member)</span>
      </h3>
      <p>Watch this video for a step-by-step guide on renewing your SPE student membership.</p>
      <video controls className="mem-video">
        <source src={renewVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>

    <div className="mem-benefits">
      <h3>Benefits of Renewing</h3>
      <div className="mem-benefits-grid">
        {benefits.map(({ title, desc, Icon }) => (
          <div key={title} className="mem-benefit-card">
            <span className="benefit-icon"><Icon /></span>
            <h4>{title}</h4>
            <p>{desc}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="mem-renew-box">
      <h3>How to Renew</h3>
      <p>SPE student membership is <strong>FREE</strong>. Renew annually through the SPE website to keep your membership active.</p>
      <a href="https://www.spe.org/en/join/" target="_blank" rel="noreferrer" className="mem-btn-primary">Renew on SPE.org -&gt;</a>
    </div>
  </div>
);

const Membership = () => {
  const [tab, setTab] = useState('join');

  return (
    <div className="membership-page">
      <div className="mem-header">
        <h1>Why Become a Member of SPE and SPE UDOM Chapter?</h1>
        <p>
          SPE membership opens doors to world-class technical resources, a global professional network,
          and career-defining opportunities while being part of a vibrant student community at UDOM.
        </p>
      </div>

      <div className="mem-tabs">
        <button className={`mem-tab ${tab === 'join' ? 'active' : ''}`} onClick={() => setTab('join')}>
          <span className="mem-tab-icon"><CapIcon /></span>
          <span>Join</span>
        </button>
        <button className={`mem-tab ${tab === 'renew' ? 'active' : ''}`} onClick={() => setTab('renew')}>
          <span className="mem-tab-icon"><RotateIcon /></span>
          <span>Renew</span>
        </button>
      </div>

      <div className="mem-content">
        {tab === 'join' ? <Join /> : <Renew />}
      </div>
    </div>
  );
};

export default Membership;
