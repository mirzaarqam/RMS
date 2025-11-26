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
    shift_timing: ''
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
      setFormData(response.data);
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

    const payload = {
      shift_name: formData.shift_name,
      shift_code: formData.shift_code,
      duration: parseInt(formData.duration),
      type: formData.type,
      shift_timing: formData.shift_timing
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

            <div className="form-group">
              <label className="form-label">Shift Timing *</label>
              <input
                type="text"
                name="shift_timing"
                className="form-control"
                value={formData.shift_timing}
                onChange={handleChange}
                placeholder="e.g., 09:00 - 17:00"
                required
                disabled={saving}
              />
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
