import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { shiftAPI } from '../services/api';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import Layout from '../components/Layout';

const EditShift = () => {
  const [formData, setFormData] = useState({
    shift_name: '',
    shift_code: '',
    duration: '',
    type: 'full',
    shift_start: '',
    shift_end: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { shiftId } = useParams();

  useEffect(() => {
    fetchShift();
  }, [shiftId]);

  const fetchShift = async () => {
    try {
      const response = await shiftAPI.getById(shiftId);
      const data = response.data;
      const parseTo24h = (timeStr) => {
        if (!timeStr) return '';
        // Supports "HH:MM" or "h:mm AM/PM"
        const ampmMatch = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
        if (ampmMatch) {
          let h = parseInt(ampmMatch[1], 10);
          const m = parseInt(ampmMatch[2], 10);
          const mer = ampmMatch[3].toUpperCase();
          if (mer === 'PM' && h !== 12) h += 12;
          if (mer === 'AM' && h === 12) h = 0;
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
        // Fallback for 24h "HH:MM"
        const plain = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
        if (plain) {
          const h = parseInt(plain[1], 10);
          const m = parseInt(plain[2], 10);
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
        return '';
      };

      let start = '', end = '';
      if (data.shift_timing && typeof data.shift_timing === 'string') {
        const parts = data.shift_timing.split('-');
        if (parts.length === 2) {
          start = parseTo24h(parts[0]);
          end = parseTo24h(parts[1]);
        }
      }

      setFormData({
        shift_name: data.shift_name || '',
        shift_code: data.shift_code || '',
        duration: data.duration || '',
        type: data.type || 'full',
        shift_start: start,
        shift_end: end
      });
      setError('');
    } catch (err) {
      setError('Failed to load shift details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const toAmPm = (t) => {
      if (!t) return '';
      const [h, m] = t.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = ((h + 11) % 12) + 1;
      return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
    };
    const payload = {
      shift_name: formData.shift_name,
      shift_code: formData.shift_code,
      duration: parseInt(formData.duration),
      type: formData.type,
      shift_timing: `${toAmPm(formData.shift_start)} - ${toAmPm(formData.shift_end)}`
    };

    try {
      await shiftAPI.update(shiftId, payload);
      navigate('/shifts');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update shift');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Edit Shift</h2>
            <button onClick={() => navigate('/shifts')} className="btn btn-secondary">
              <FiArrowLeft /> Back
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Shift Name *</label>
                <input
                  type="text"
                  name="shift_name"
                  className="form-control"
                  value={formData.shift_name}
                  onChange={handleChange}
                  required
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Shift Code *</label>
                <input
                  type="text"
                  name="shift_code"
                  className="form-control"
                  value={formData.shift_code}
                  onChange={handleChange}
                  required
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duration (hours) *</label>
                <input
                  type="number"
                  name="duration"
                  className="form-control"
                  value={formData.duration}
                  onChange={handleChange}
                  min="1"
                  max="24"
                  required
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Type *</label>
                <select
                  name="type"
                  className="form-control"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  disabled={saving}
                >
                  <option value="full">Full Day</option>
                  <option value="half">Half Day</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input
                  type="time"
                  name="shift_start"
                  className="form-control"
                  value={formData.shift_start}
                  onChange={handleChange}
                  required
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time *</label>
                <input
                  type="time"
                  name="shift_end"
                  className="form-control"
                  value={formData.shift_end}
                  onChange={handleChange}
                  required
                  disabled={saving}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="submit" className="btn btn-success" disabled={saving}>
                <FiSave /> {saving ? 'Saving...' : 'Update Shift'}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/shifts')} 
                className="btn btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditShift;
