import React, { useState } from 'react';
import Toast from '../components/Toast';
import { API_BASE } from '../utils/api';
import './Contact.css';

const MailIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="info-svg">
    <path
      d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m3 8 8.1 5.4a1.6 1.6 0 0 0 1.8 0L21 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LocationIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="info-svg">
    <path
      d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="10" r="2.3" fill="currentColor" />
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="info-svg">
    <path
      d="M7 18.5 3 21V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 10h8M8 14h5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setToast({ message: 'Message sent successfully! We will get back to you soon.', type: 'success' });
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setToast({ message: data.error || 'Failed to send message.', type: 'error' });
      }
    } catch {
      setToast({ message: 'Server error. Please try again.', type: 'error' });
    }

    setLoading(false);
  };

  return (
    <div className="contact-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <section className="contact-hero">
        <span className="section-tag" style={{ color: 'rgba(255,255,255,0.7)' }}>Get In Touch</span>
        <h1>Contact SPE UDOM Chapter</h1>
        <p>Reach out for questions, collaboration, membership support, or event inquiries.</p>
      </section>

      <div className="contact-body">
        <div className="contact-grid">
          <div className="contact-info-col">
            <h2>Contact Information</h2>
            <p className="contact-copy">
              We&apos;re here to help. Reach out through any of the channels below or send us a message directly.
            </p>

            <div className="info-items">
              <div className="info-item">
                <span className="info-icon"><MailIcon /></span>
                <div>
                  <strong>Email</strong>
                  <a href="mailto:speudom@gmail.com">speudom@gmail.com</a>
                </div>
              </div>

              <div className="info-item">
                <span className="info-icon"><LocationIcon /></span>
                <div>
                  <strong>Address</strong>
                  <span>COESE - University of Dodoma<br />Dodoma, Tanzania</span>
                </div>
              </div>

              <div className="info-item">
                <span className="info-icon"><ChatIcon /></span>
                <div>
                  <strong>Live Chat</strong>
                  <span>Available via chat bubble (bottom right)</span>
                </div>
              </div>
            </div>

            <div className="social-section">
              <h3>Follow Us</h3>
              <div className="social-links">
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-btn linkedin">LinkedIn</a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-btn instagram">Instagram</a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-btn twitter">Twitter</a>
              </div>
            </div>

            <div className="map-wrap">
              <iframe
                title="University of Dodoma"
                src="https://www.google.com/maps?q=University+of+Dodoma,+Dodoma,+Tanzania&output=embed"
                width="100%"
                height="220"
                loading="lazy"
                allowFullScreen
                style={{ border: 0, borderRadius: 12 }}
              />
            </div>
          </div>

          <div className="contact-form-col">
            <h2>Send a Message</h2>
            <p className="contact-copy">
              Fill out the form below and we&apos;ll respond within 24 hours.
            </p>

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Full Name</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" required />
                </div>
              </div>

              <div className="form-group">
                <label>Subject</label>
                <input name="subject" value={form.subject} onChange={handleChange} placeholder="What is this about?" />
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea name="message" value={form.message} onChange={handleChange} rows={6} placeholder="Write your message here..." required />
              </div>

              <button type="submit" className="contact-submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
