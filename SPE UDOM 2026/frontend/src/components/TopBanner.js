import React from 'react';
import './TopBanner.css';

const TEXT = 'SOCIETY OF PETROLEUM ENGINEERS   UNIVERSITY OF DODOMA STUDENTS CHAPTER   e-SERVICES PORTAL   SOCIETY OF PETROLEUM ENGINEERS   UNIVERSITY OF DODOMA STUDENTS CHAPTER   e-SERVICES PORTAL   ';

const TopBanner = () => (
  <div className="top-banner">
    <div className="top-banner-track">
      <span className="top-banner-text">{TEXT}</span>
      <span className="top-banner-text" aria-hidden="true">{TEXT}</span>
    </div>
  </div>
);

export default TopBanner;
