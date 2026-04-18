import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import { api } from '../utils/api';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    year_of_study: '',
    profile_picture: null
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        year_of_study: user.year_of_study || '',
        profile_picture: null
      });
      if (user.profile_picture) {
        setPhotoPreview(user.profile_picture);
      }
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profile_picture: 'Please select a valid image file' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profile_picture: 'Image size must be less than 5MB' }));
        return;
      }
      setFormData(prev => ({ ...prev, profile_picture: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, profile_picture: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const body = new FormData();
      body.append('full_name', formData.full_name);
      body.append('phone', formData.phone);
      if (formData.year_of_study) {
        body.append('year_of_study', formData.year_of_study);
      }
      if (formData.profile_picture) {
        body.append('profile_picture', formData.profile_picture);
      }

      const res = await api('/auth/profile/', {
        method: 'PUT',
        body: body
      });

      if (res.ok) {
        updateUser(res.data);
        setFormData(prev => ({ ...prev, profile_picture: null }));
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setToast({ message: 'Profile updated successfully! 🎉', type: 'success' });
      } else {
        const data = res.data || {};
        setErrors(data);
        setToast({ message: 'Failed to update profile', type: 'error' });
      }
    } catch (error) {
      setErrors({ non_field_errors: ['Cannot reach the server'] });
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div className="profile-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="profile-card">
        <h2>Your Profile</h2>
        
        <form onSubmit={handleSubmit} className="profile-form">
          {/* Photo Section */}
          <div className="profile-photo-section">
            <div className="photo-display">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="profile-photo" />
              ) : (
                <div className="photo-placeholder">
                  <span className="photo-initials">
                    {user?.full_name
                      ?.split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(word => word[0].toUpperCase())
                      .join('') || '?'}
                  </span>
                </div>
              )}
            </div>
            <div className="photo-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="photo-input"
                id="profile-photo-input"
              />
              <label htmlFor="profile-photo-input" className="photo-button">
                Change Photo
              </label>
              {errors.profile_picture && (
                <span className="error-message">{errors.profile_picture}</span>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="form-group">
            <label htmlFor="full_name">Full Name</label>
            <input
              id="full_name"
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              required
            />
            {errors.full_name && (
              <span className="error-message">{errors.full_name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
            />
            {errors.phone && (
              <span className="error-message">{errors.phone}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="year_of_study">Year of Study</label>
            <select
              id="year_of_study"
              name="year_of_study"
              value={formData.year_of_study}
              onChange={handleInputChange}
            >
              <option value="">Not specified</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
            {errors.year_of_study && (
              <span className="error-message">{errors.year_of_study}</span>
            )}
          </div>

          {errors.non_field_errors && (
            <div className="error-banner">{errors.non_field_errors}</div>
          )}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
