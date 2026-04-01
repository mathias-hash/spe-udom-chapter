import React from 'react';

const Join = () => (
  <div>
    <div style={{
      background: 'linear-gradient(135deg, #003d7a, #0066cc)',
      padding: '48px 24px',
      textAlign: 'center',
      color: '#fff',
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 10 }}>
        Become a Member of SPE UDOM Chapter
      </h1>
      <p style={{ fontSize: '1rem', opacity: 0.85, maxWidth: 500, margin: '0 auto' }}>
        Join a community of passionate petroleum engineering students at the University of Dodoma.
      </p>
    </div>
    <div className="page-container">
      <p>To register, click the <strong>Register</strong> button and create your account. Membership is free and open to all UDOM students.</p>
    </div>
  </div>
);

export default Join;
