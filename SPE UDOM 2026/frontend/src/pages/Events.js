import React, { useEffect, useState } from 'react';
import { FiCalendar, FiImage, FiPlus, FiEdit2, FiTrash2, FiMapPin, FiClock, FiX, FiAlertCircle, FiUpload } from 'react-icons/fi';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import { API_BASE, api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Events.css';

const ITEMS_PER_PAGE = 6;

const EmptyCalendarIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="empty-icon-svg">
    <rect x="3.5" y="5.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M7.5 3.5v4M16.5 3.5v4M3.5 9h17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 12.5h3M13 12.5h3M8 16h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const Events = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('upcoming');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', location: '', date: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [showPhotos, setShowPhotos] = useState(false);
  const [eventPhotos, setEventPhotos] = useState([]);
  const [toast, setToast] = useState(null);

  const isGeneralSecretary = user?.role === 'general_secretary' || user?.role === 'admin' || user?.role === 'president';

  const showToast = React.useCallback((message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchEvents = React.useCallback(() => {
    setLoading(true);
    const now = new Date().toISOString();
    const params = new URLSearchParams({ search: query, page, page_size: ITEMS_PER_PAGE });
    let url = `${API_BASE}/public/events/?${params}`;
    if (tab === 'past') {
      url += '&date_before=' + now;
    } else {
      url += '&date_after=' + now;
    }
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        const evs = Array.isArray(d) ? d : (d.results || []);
        setEvents(evs);
        setTotal(d.count || evs.length);
      })
      .catch(() => {
        setEvents([]);
        showToast('Error loading events', 'error');
      })
      .finally(() => setLoading(false));
  }, [query, page, tab, showToast]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const fetchEventPhotos = (eventId) => {
    fetch(`${API_BASE}/public/events/${eventId}/photos/`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setEventPhotos(Array.isArray(d) ? d : (d.results || []));
        setShowPhotos(true);
      })
      .catch((err) => {
        console.error('Error fetching photos:', err);
        showToast('Error loading photos', 'error');
      });
  };

  const handleCreateEvent = async () => {
    if (!formData.title || !formData.date || !formData.location) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      date: formData.date,
      status: 'pending'
    };

    try {
      const response = await api('/events/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!response.ok || !response.data?.id) {
        throw new Error(response.data?.error || 'Failed to create event');
      }
      showToast('Event created successfully (pending approval)', 'success');
      setShowModal(false);
      setFormData({ title: '', description: '', location: '', date: '' });
      fetchEvents();
    } catch (err) {
      console.error('Error creating event:', err);
      showToast('Error creating event', 'error');
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent || !formData.title || !formData.date || !formData.location) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      date: formData.date
    };

    try {
      const response = await api(`/events/${selectedEvent.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!response.ok || !response.data?.id) {
        throw new Error(response.data?.error || 'Failed to update event');
      }
      showToast('Event updated successfully', 'success');
      setShowModal(false);
      setSelectedEvent(null);
      setFormData({ title: '', description: '', location: '', date: '' });
      fetchEvents();
    } catch (err) {
      console.error('Error updating event:', err);
      showToast('Error updating event', 'error');
    }
  };

  const handleCancelEvent = async () => {
    if (!selectedEvent || !cancelReason.trim()) {
      showToast('Please provide a cancellation reason', 'error');
      return;
    }

    try {
      const response = await api(`/events/${selectedEvent.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled', cancel_reason: cancelReason })
      });
      if (!response.ok || !response.data?.id) {
        throw new Error(response.data?.error || 'Failed to cancel event');
      }
      showToast('Event cancelled successfully', 'success');
      setShowModal(false);
      setCancelReason('');
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      console.error('Error cancelling event:', err);
      showToast('Error cancelling event', 'error');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await api(`/events/${eventId}/`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) {
        throw new Error(response.data?.error || 'Failed to delete event');
      }
      showToast('Event deleted successfully', 'success');
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      showToast('Error deleting event', 'error');
    }
  };

  const handleUploadPhoto = (eventId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formDataPhoto = new FormData();
      formDataPhoto.append('photo', file);
      formDataPhoto.append('event', eventId);
      formDataPhoto.append('caption', '');

      fetch(`${API_BASE}/events/${eventId}/photos/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('spe_access') || ''}`,
        },
        body: formDataPhoto
      })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((d) => {
          if (d.id) {
            showToast('Photo uploaded successfully', 'success');
            fetchEventPhotos(eventId);
          }
        })
        .catch((err) => {
          console.error('Error uploading photo:', err);
          showToast('Error uploading photo', 'error');
        });
    };
    input.click();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(search);
    setPage(1);
  };

  const onEditEvent = (ev) => {
    setSelectedEvent(ev);
    setFormData({
      title: ev.title,
      description: ev.description,
      location: ev.location,
      date: ev.date
    });
    setModalType('edit');
    setShowModal(true);
  };

  const onCancelEvent = (ev) => {
    setSelectedEvent(ev);
    setModalType('cancel');
    setShowModal(true);
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="events-page">
      <section className="events-hero">
        <span className="section-tag">What&apos;s Happening</span>
        <h1>Events</h1>
        <p>Upcoming and past events organized by SPE UDOM Chapter</p>
      </section>

      <div className="events-body">
        <div className="events-tabs">
          <button 
            className={`tab ${tab === 'upcoming' ? 'active' : ''}`}
            onClick={() => { setTab('upcoming'); setPage(1); }}
          >
            <FiCalendar /> Upcoming Events
          </button>
          <button 
            className={`tab ${tab === 'past' ? 'active' : ''}`}
            onClick={() => { setTab('past'); setPage(1); }}
          >
            <FiImage /> Past Events
          </button>
          {isGeneralSecretary && (
            <button 
              className="btn-create-event"
              onClick={() => {
                setModalType('create');
                setFormData({ title: '', description: '', location: '', date: '' });
                setShowModal(true);
              }}
            >
              <FiPlus /> Create Event
            </button>
          )}
        </div>

        <form className="search-bar" onSubmit={handleSearch}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title or location..."
          />
          <button type="submit">Search</button>
          {query && <button type="button" onClick={() => { setSearch(''); setQuery(''); setPage(1); }}>Clear</button>}
        </form>

        {loading ? (
          <Spinner text="Loading events..." />
        ) : events.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon"><EmptyCalendarIcon /></span>
            <p>No {tab} events found{query ? ` for "${query}"` : ''}.</p>
          </div>
        ) : (
          <>
            <div className="events-grid">
              {events.map((ev) => (
                <div key={ev.id} className="ev-card">
                  <div className="ev-date-badge">
                    <span>{new Date(ev.date).toLocaleString('default', { month: 'short' })}</span>
                    <strong>{new Date(ev.date).getDate()}</strong>
                    <span>{new Date(ev.date).getFullYear()}</span>
                  </div>
                  <div className="ev-body">
                    <h3>{ev.title}</h3>
                    <p className="ev-location"><FiMapPin /> {ev.location}</p>
                    <p className="ev-time"><FiClock /> {new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="ev-desc">{ev.description?.substring(0, 80)}...</p>
                    <div className="ev-footer">
                      <span className="ev-reg">{ev.registration_count || ev.registrations?.length || 0} registered</span>
                    </div>
                    <div className="ev-actions">
                      {tab === 'past' && (
                        <button 
                          className="btn-photos"
                          onClick={() => fetchEventPhotos(ev.id)}
                          title="View photo gallery"
                        >
                          <FiImage /> Gallery
                        </button>
                      )}
                      {isGeneralSecretary && (
                        <>
                          <button 
                            className="btn-edit"
                            onClick={() => onEditEvent(ev)}
                            title="Edit event"
                          >
                            <FiEdit2 /> Edit
                          </button>
                          {tab === 'upcoming' && (
                            <button 
                              className="btn-cancel"
                              onClick={() => onCancelEvent(ev)}
                              title="Cancel event"
                            >
                              <FiAlertCircle /> Cancel
                            </button>
                          )}
                          <button 
                            className="btn-delete"
                            onClick={() => handleDeleteEvent(ev.id)}
                            title="Delete event"
                          >
                            <FiTrash2 /> Delete
                          </button>
                          {tab === 'past' && (
                            <button 
                              className="btn-upload"
                              onClick={() => handleUploadPhoto(ev.id)}
                              title="Upload photo"
                            >
                              <FiUpload /> Photo
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    {ev.status === 'cancelled' && (
                      <div className="event-cancelled-banner">
                        <strong>Cancelled:</strong> {ev.cancel_reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalType === 'create' && <><FiPlus /> Create Event</>}
                {modalType === 'edit' && <><FiEdit2 /> Edit Event</>}
                {modalType === 'cancel' && <><FiAlertCircle /> Cancel Event</>}
              </h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            
            {modalType === 'cancel' ? (
              <div className="modal-body">
                <div className="form-group">
                  <label>Cancellation Reason *</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Why is this event being cancelled?"
                    rows="4"
                  />
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                  <button className="btn-danger" onClick={handleCancelEvent}><FiAlertCircle /> Cancel Event</button>
                </div>
              </div>
            ) : (
              <div className="modal-body">
                <div className="form-group">
                  <label>Event Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter event title"
                  />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter event location"
                  />
                </div>
                <div className="form-group">
                  <label>Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter event description"
                    rows="4"
                  />
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                  <button 
                    className="btn-primary"
                    onClick={modalType === 'create' ? handleCreateEvent : handleUpdateEvent}
                  >
                    {modalType === 'create' ? <><FiPlus /> Create Event</> : <><FiEdit2 /> Update Event</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showPhotos && (
        <div className="modal-overlay" onClick={() => setShowPhotos(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiImage /> Event Photo Gallery</h2>
              <button className="close-btn" onClick={() => setShowPhotos(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              {eventPhotos.length === 0 ? (
                <p className="no-photos">No photos yet</p>
              ) : (
                <div className="photo-gallery">
                  {eventPhotos.map((photo) => (
                    <div key={photo.id} className="photo-item">
                      <img src={photo.photo} alt={photo.caption} />
                      {photo.caption && <p>{photo.caption}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

export default Events;
