import React from 'react';
import './About.css';

const TargetIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="about-svg-icon">
    <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="1.8" fill="currentColor" />
    <path d="m15.2 8.8 4.8-4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="m16.6 4 3.4.2-.2 3.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TelescopeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="about-svg-icon">
    <path d="m5 7 8-3 2 4-8 3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="m15 5 3-1 1 2-3 1Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M10 11.5 8 20M13 10.5 16 20M7 20h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GraduationIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="about-svg-icon">
    <path d="m3 9 9-4 9 4-9 4-9-4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M7 11.5V15c0 1.6 2.5 3 5 3s5-1.4 5-3v-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 10v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const HandshakeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="about-svg-icon">
    <path d="M8 8 5 5 2.5 7.5 6 11m10-3 3-3 2.5 2.5L18 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m8 8 3 3a2 2 0 0 0 2.8 0L16 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m6 11 3 3m1-1 2 2m1-1 2 2m1-1 1.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BulbIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="about-svg-icon">
    <path d="M12 3.5A6.5 6.5 0 0 0 8 15c.8.7 1.5 1.8 1.7 3h4.6c.2-1.2.9-2.3 1.7-3A6.5 6.5 0 0 0 12 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9.8 18h4.4M10.3 20.5h3.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="about-svg-icon">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.5 9h17M3.5 15h17M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.6-4-9s1.5-6.6 4-9Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="about-svg-icon">
    <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M8 5H5a2 2 0 0 0 2 4h1M16 5h3a2 2 0 0 1-2 4h-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 11v4M9 20h6M10 15h4v5h-4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="about-svg-icon">
    <path d="M10 14 8.2 15.8a3.3 3.3 0 0 1-4.7-4.7L7 7.6a3.3 3.3 0 0 1 4.7 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m14 10 1.8-1.8a3.3 3.3 0 0 1 4.7 4.7L17 16.4a3.3 3.3 0 0 1-4.7 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 15 15 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const values = [
  { title: 'Education', desc: 'Continuous learning through technical workshops, seminars, and access to SPE publications.', Icon: GraduationIcon },
  { title: 'Collaboration', desc: 'Building strong relationships between students, faculty, and industry professionals.', Icon: HandshakeIcon },
  { title: 'Innovation', desc: 'Encouraging creative thinking and novel approaches to energy challenges.', Icon: BulbIcon },
  { title: 'Sustainability', desc: 'Promoting responsible and sustainable energy practices for future generations.', Icon: GlobeIcon },
  { title: 'Excellence', desc: 'Striving for the highest standards in academic and professional pursuits.', Icon: TrophyIcon },
  { title: 'Networking', desc: 'Connecting members with global SPE network and career opportunities.', Icon: LinkIcon },
];

const About = () => (
  <div className="about-page">
    <section className="about-hero">
      <span className="section-tag">Who We Are</span>
      <h1>About SPE UDOM Chapter</h1>
      <p>The Society of Petroleum Engineers - University of Dodoma Student Chapter</p>
    </section>

    <section className="about-section">
      <div className="mv-grid">
        <div className="mv-card mission">
          <span className="mv-icon"><TargetIcon /></span>
          <h2>Our Mission</h2>
          <p>To advance the knowledge and skills of petroleum engineering students at UDOM by providing access to technical resources, industry connections, and professional development opportunities that prepare them for successful careers in the energy sector.</p>
        </div>
        <div className="mv-card vision">
          <span className="mv-icon"><TelescopeIcon /></span>
          <h2>Our Vision</h2>
          <p>To be the leading student chapter in East Africa that bridges the gap between academic learning and industry practice, producing world-class petroleum engineers who contribute to sustainable energy development in Tanzania and beyond.</p>
        </div>
      </div>
    </section>

    <section className="about-section bg-light">
      <div className="about-inner">
        <span className="section-tag">Our Story</span>
        <h2>Chapter History</h2>
        <p>The SPE UDOM Student Chapter was established at the University of Dodoma as part of the global Society of Petroleum Engineers network. Since its founding, the chapter has grown to become one of the most active student organizations in the Faculty of Earth Sciences, bringing together students passionate about petroleum engineering, geosciences, and energy technology.</p>
        <p style={{ marginTop: 16 }}>Over the years, the chapter has organized numerous technical workshops, field trips, guest lectures from industry professionals, and participated in regional SPE competitions, earning recognition for academic excellence and community engagement.</p>
      </div>
    </section>

    <section className="about-section">
      <div className="about-inner">
        <span className="section-tag">What We Stand For</span>
        <h2>Our Core Values</h2>
        <div className="values-grid">
          {values.map(({ title, desc, Icon }) => (
            <div key={title} className="value-card">
              <span className="value-icon"><Icon /></span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="about-section bg-blue">
      <div className="about-inner text-center">
        <h2>Part of a Global Network</h2>
        <p>As an affiliate of SPE International, our chapter connects over 160,000 engineers and scientists worldwide. Members gain access to technical papers, industry events, career resources, and a global community of energy professionals.</p>
        <a href="https://www.spe.org" target="_blank" rel="noreferrer" className="btn-white">Visit SPE International -&gt;</a>
      </div>
    </section>
  </div>
);

export default About;
