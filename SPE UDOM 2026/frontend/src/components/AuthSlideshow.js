import React, { useState, useEffect } from 'react';
import slide1 from '../assets/slide1.jpg.jpeg';
import slide2 from '../assets/slide2.jpg.jpeg';
import slide3 from '../assets/slide3.jpg.jpeg';
import './AuthSlideshow.css';

const slides = [
  { img: slide1, caption: 'SPE UDOM Chapter Leadership Team' },
  { img: slide2, caption: 'Technical Workshop & Seminar' },
  { img: slide3, caption: 'SPE UDOM Chapter Members' },
];

const AuthSlideshow = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="slideshow-wrap">
      {slides.map((slide, i) => (
        <div key={i} className={`slide ${i === current ? 'active' : ''}`}>
          <img src={slide.img} alt={slide.caption} />
          <div className="slide-overlay">
            <div className="slide-caption">{slide.caption}</div>
          </div>
        </div>
      ))}

      {/* Dots */}
      <div className="slide-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === current ? 'active' : ''}`}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>

      {/* Branding overlay */}
      <div className="slide-brand">
        <div className="slide-brand-title">SPE UDOM STUDENTS CHAPTER</div>
        <div className="slide-brand-sub">Empowering the next generation of engineers at the University of Dodoma</div>
      </div>
    </div>
  );
};

export default AuthSlideshow;
