import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../utils/api';
import home1 from '../assets/home1.png.jpeg';
import home2 from '../assets/home2.png.jpeg';
import home3 from '../assets/home3.png.jpeg';
import home31 from '../assets/home3.1.png';
import home4 from '../assets/home4.png.jpeg';
import './Home.css';

const slides = [
  { img: home1, caption: 'SPE UDOM Networking', position: 'center center', scale: 1, fit: 'cover' },
  { img: home2, caption: 'Technical Workshop & Seminar', position: 'center center', scale: 1, fit: 'cover' },
  { img: home3, caption: 'SPE UDOM Chapter Members', position: 'center center', scale: 1, fit: 'cover' },
  { img: home31, caption: 'SPE UDOM Chapter Members', position: 'center center', scale: 1, fit: 'cover' },
  { img: home4, caption: 'SPE UDOM Networking', position: 'center center', scale: 1, fit: 'cover' },
];

const HeroSlideshow = () => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent(p => (p + 1) % slides.length), []);
  const prev = () => setCurrent(p => (p - 1 + slides.length) % slides.length);

  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next]);

  return (
    <div className="hero-slideshow">
      {slides.map((s, i) => (
        <div key={i} className={`hero-slide ${i === current ? 'active' : ''}`}>
          {s.framed ? (
            <>
              <div
                className="hero-slide-fill"
                style={{ backgroundImage: `url(${s.img})`, backgroundPosition: s.position }}
              />
              <img
                src={s.img}
                alt={s.caption}
                className="hero-slide-framed-image"
                style={{
                  objectPosition: s.position,
                  objectFit: s.fit,
                  '--slide-scale': s.scale,
                }}
              />
            </>
          ) : (
            <img
              src={s.img}
              alt={s.caption}
              style={{
                objectPosition: s.position,
                objectFit: s.fit,
                '--slide-scale': s.scale,
                width: '100%',
              }}
            />
          )}
          <div className="hero-slide-overlay" />
        </div>
      ))}

      <div className="hero-slide-content">
        <div className="hero-badge">Society of Petroleum Engineers</div>
        <h1>SPE UDOM Students Chapter</h1>
        <p>Empowering the next generation of petroleum engineers at the University of Dodoma. Join us in shaping the future of energy.</p>
        <div className="hero-actions">
          <Link to="/join" className="btn-hero-primary">Join Our Chapter</Link>
          <Link to="/events" className="btn-hero-secondary">View Events</Link>
        </div>
      </div>

      <div className="hero-caption">{slides[current].caption}</div>

      <button className="hero-arrow hero-arrow-left" onClick={prev}>&#8249;</button>
      <button className="hero-arrow hero-arrow-right" onClick={next}>&#8250;</button>

      <div className="hero-dots">
        {slides.map((_, i) => (
          <button key={i} className={`hero-dot ${i === current ? 'active' : ''}`} onClick={() => setCurrent(i)} />
        ))}
      </div>
    </div>
  );
};

const Home = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/public/events/`).then(r => r.json()).then(d => setEvents(Array.isArray(d) ? d.slice(0, 3) : [])).catch(() => {});
  }, []);

  return (
    <div className="home">
      <HeroSlideshow />

      <section className="home-section">
        <div className="section-inner two-col">
          <div className="section-text">
            <span className="section-tag">Who We Are</span>
            <h2>About SPE UDOM Chapter</h2>
            <p>The SPE UDOM Student Chapter is an affiliate of the Society of Petroleum Engineers International. We are dedicated to advancing the knowledge and skills of petroleum engineering students at the University of Dodoma through technical events, workshops, and networking opportunities.</p>
            <Link to="/about" className="btn-outline">Learn More →</Link>
          </div>
        </div>
      </section>

      <section className="home-section bg-light">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-tag">What's On</span>
            <h2>Upcoming Events</h2>
          </div>
          {events.length === 0
            ? <p style={{ color: '#888', textAlign: 'center' }}>No upcoming events at the moment.</p>
            : <div className="events-preview">
                {events.map(ev => (
                  <div key={ev.id} className="event-card">
                    <div className="event-date">
                      <span className="event-month">{new Date(ev.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="event-day">{new Date(ev.date).getDate()}</span>
                    </div>
                    <div className="event-info">
                      <h3>{ev.title}</h3>
                      <p>📍 {ev.location}</p>
                      <p style={{ color: '#888', fontSize: '0.85rem' }}>{ev.description?.substring(0, 80)}...</p>
                    </div>
                    <span className="event-reg">{ev.registration_count} registered</span>
                  </div>
                ))}
              </div>
          }
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link to="/events" className="btn-outline">View All Events →</Link>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Join SPE UDOM Chapter?</h2>
        <p>Be part of a community of passionate petroleum engineering students.</p>
        <Link to="/register" className="btn-hero-primary">Get Started Today</Link>
      </section>
    </div>
  );
};

export default Home;
