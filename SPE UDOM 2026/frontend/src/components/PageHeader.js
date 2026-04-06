import React from 'react';
import logo from '../assets/spe-udom-logo.png';
import './PageHeader.css';

const PageHeader = () => (
  <div className="page-header">
    <img src={logo} alt="SPE UDOM" className="page-header-logo" />
    <div className="page-header-text">
      <span className="page-header-title">SPE UDOM</span>
      <span className="page-header-sub">Student Chapter</span>
    </div>
    <span className="page-header-tagline">Solutions. People. Energy.</span>
  </div>
);

export default PageHeader;
