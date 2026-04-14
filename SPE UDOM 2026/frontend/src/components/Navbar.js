import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TopBanner from './TopBanner';
import './Navbar.css';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About SPE UDOM CHAPTER' },
  { path: '/leadership', label: 'Leadership' },
  { path: '/events', label: 'Events' },
  { path: '/publication', label: 'Publication' },
  { path: '/contact', label: 'Contact' },
  { path: '/join', label: 'Membership' },
  { path: '/election', label: 'Election' },
];

const Navbar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <>
      <TopBanner />
      <nav className="desktop-nav" aria-label="Desktop menu">
        <div className="desktop-nav-inner">
          {navItems.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`desktop-nav-link ${location.pathname === path ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
      <button className="sidebar-hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
        <span /><span /><span />
      </button>
      <div className={`sidebar-overlay${open ? ' active' : ''}`} onClick={close} />
      <div className={`sidebar${open ? ' sidebar-open' : ''}`}>
        <ul className="sidebar-menu">
          {navItems.map(({ path, label }) => (
            <li key={path}>
              <Link
                to={path}
                className={`sidebar-link ${location.pathname === path ? 'active' : ''}`}
                onClick={close}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Navbar;
