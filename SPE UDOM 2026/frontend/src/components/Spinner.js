import React from 'react';
import './Spinner.css';

const Spinner = ({ text = 'Loading...' }) => (
  <div className="spinner-wrap">
    <div className="spinner" />
    <p className="spinner-text">{text}</p>
  </div>
);

export default Spinner;
