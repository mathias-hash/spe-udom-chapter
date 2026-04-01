import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/spe-udom-logo.png';
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

  return (
    <>
      <TopBanner />
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt="SPE UDOM" className="sidebar-logo-image" />
          <div className="sidebar-logo-divider" />
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">SPE UDOM</span>
            <span className="sidebar-logo-sub">Student Chapter</span>
          </div>
        </div>
        <ul className="sidebar-menu">
          {navItems.map(({ path, label }) => (
            <li key={path}>
              <Link
                to={path}
                className={`sidebar-link ${location.pathname === path ? 'active' : ''}`}
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
