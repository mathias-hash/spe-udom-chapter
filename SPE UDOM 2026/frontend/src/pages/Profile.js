import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <h1>Profile</h1>
      <p>{user?.full_name || 'Guest User'}</p>
      <p>{user?.email || 'No email available.'}</p>
    </div>
  );
};

export default Profile;
