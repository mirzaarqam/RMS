import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shiftAPI } from '../services/api';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import Layout from '../components/Layout';

const AddShift = () => {
  const [formData, setFormData] = useState({
    shift_name: '',
    shift_code: '',
    duration: '',
    type: 'full',
    shift_start: '',
    shift_end: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const shift_timing = `${formData.shift_start} - ${formData.shift_end}`;
    const payload = {
      shift_name: formData.shift_name,
      shift_code: formData.shift_code,
      duration: parseInt(formData.duration),
      type: formData.type,
      shift_timing: shift_timing
    };

    try {
      await shiftAPI.create(payload);
      navigate('/shifts');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Add New Shift</h2>
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
                  placeholder="e.g., Morning Shift"
                  required
                  disabled={loading}
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
                  placeholder="e.g., MS"
                  required
                  disabled={loading}
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
                  placeholder="e.g., 8"
                  min="1"
                  max="24"
                  required
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="submit" className="btn btn-success" disabled={loading}>
                <FiSave /> {loading ? 'Saving...' : 'Save Shift'}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/shifts')} 
                className="btn btn-secondary"
                disabled={loading}
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

export default AddShift;
