import React from 'react';
import instagramLogo from '../assets/instagram-logo.jpg';
import emailLogo from '../assets/email-logo.png';
import linkedinLogo from '../assets/linkedin-logo.png';
import './SiteFooter.css';

const footerLinks = [
  { href: 'https://www.instagram.com/speudomstudentchapter', label: 'Instagram', icon: instagramLogo },
  { href: 'mailto:speudomstudentchapter@gmail.com', label: 'Email', icon: emailLogo },
  { href: 'https://www.linkedin.com/in/speudomstudentchapter', label: 'LinkedIn', icon: linkedinLogo },
];

const SiteFooter = () => (
  <footer className="site-footer">
    <div className="site-footer-inner">
      <p className="sf-label">Follow Us</p>
      <div className="sf-links">
        {footerLinks.map(item => (
          <a
            key={item.href}
            href={item.href}
            target={item.href.startsWith('mailto:') ? undefined : '_blank'}
            rel={item.href.startsWith('mailto:') ? undefined : 'noreferrer'}
            className="sf-item"
          >
            <img src={item.icon} alt={item.label} className="sf-icon" />
            <span>{item.label}</span>
          </a>
        ))}
      </div>
      <p className="sf-copy">© {new Date().getFullYear()} SPE UDOM Student Chapter. All rights reserved.</p>
    </div>
  </footer>
);

export default SiteFooter;
