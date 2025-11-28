import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI, shiftAPI, rosterAPI } from '../services/api';
import { FiSave, FiArrowLeft, FiX } from 'react-icons/fi';
import Layout from '../components/Layout';

const CreateRoster = () => {
  const [employees, setEmployees] = useState([]);
  const [fullDayShifts, setFullDayShifts] = useState([]);
  const [halfDayShifts, setHalfDayShifts] = useState([]);
  const [formData, setFormData] = useState({
    emp_id: '',
    month: '',
    shift_id: '',
  });
  const [offDates, setOffDates] = useState([]);
  const [halfDates, setHalfDates] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [empResponse, fullShiftsResponse, halfShiftsResponse] = await Promise.all([
        employeeAPI.getAll(),
        shiftAPI.getAll('full'),
        shiftAPI.getAll('half')
      ]);

      setEmployees(empResponse.data);
      setFullDayShifts(fullShiftsResponse.data);
      setHalfDayShifts(halfShiftsResponse.data);
    } catch (err) {
      setError('Failed to load data');
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

  const addOffDate = () => {
    setOffDates([...offDates, '']);
  };

  const removeOffDate = (index) => {
    setOffDates(offDates.filter((_, i) => i !== index));
  };

  const updateOffDate = (index, value) => {
    const updated = [...offDates];
    updated[index] = value;
    setOffDates(updated);
  };

  const addHalfDate = () => {
    setHalfDates([...halfDates, { date: '', shift_id: '' }]);
  };

  const removeHalfDate = (index) => {
    setHalfDates(halfDates.filter((_, i) => i !== index));
  };

  const updateHalfDate = (index, field, value) => {
    const updated = [...halfDates];
    updated[index][field] = value;
    setHalfDates(updated);
  };

  const resetForm = () => {
    setFormData({
      emp_id: '',
      month: '',
      shift_id: '',
    });
    setOffDates([]);
    setHalfDates([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const payload = {
      emp_id: formData.emp_id,
      month: formData.month,
      shift_id: parseInt(formData.shift_id),
      off_dates: offDates.filter(date => date !== ''),
      half_dates: halfDates
        .filter(hd => hd.date && hd.shift_id)
        .map(hd => ({
          date: hd.date,
          shift_id: parseInt(hd.shift_id)
        }))
    };

    try {
      await rosterAPI.create(payload);
      setSuccess('Roster Saved');
      resetForm();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create roster');
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
            <h2 className="card-title">Create Roster</h2>
            <button onClick={() => navigate('/roster')} className="btn btn-secondary">
              <FiArrowLeft /> Back
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Employee *</label>
                <select
                  name="emp_id"
                  className="form-control"
                  value={formData.emp_id}
                  onChange={handleChange}
                  required
                  disabled={saving}
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.emp_id} value={emp.emp_id}>
                      {emp.name} ({emp.emp_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Month *</label>
                <input
                  type="month"
                  name="month"
                  className="form-control"
                  value={formData.month}
                  onChange={handleChange}
                  required
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Default Full-Day Shift *</label>
              <select
                name="shift_id"
                className="form-control"
                value={formData.shift_id}
                onChange={handleChange}
                required
                disabled={saving}
              >
                <option value="">Select Shift</option>
                {fullDayShifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.shift_name} ({shift.shift_code}) - {shift.shift_timing}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">OFF Days</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {offDates.map((date, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="date"
                      className="form-control"
                      value={date}
                      onChange={(e) => updateOffDate(index, e.target.value)}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={() => removeOffDate(index)}
                      className="btn btn-danger btn-sm"
                      disabled={saving}
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOffDate}
                  className="btn btn-outline"
                  disabled={saving}
                >
                  + Add OFF Date
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Half Days</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {halfDates.map((hd, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px' }}>
                    <input
                      type="date"
                      className="form-control"
                      value={hd.date}
                      onChange={(e) => updateHalfDate(index, 'date', e.target.value)}
                      disabled={saving}
                    />
                    <select
                      className="form-control"
                      value={hd.shift_id}
                      onChange={(e) => updateHalfDate(index, 'shift_id', e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Select Half Shift</option>
                      {halfDayShifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>
                          {shift.shift_name} ({shift.shift_code})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeHalfDate(index)}
                      className="btn btn-danger btn-sm"
                      disabled={saving}
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addHalfDate}
                  className="btn btn-outline"
                  disabled={saving}
                >
                  + Add Half Day
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="submit" className="btn btn-success" disabled={saving}>
                <FiSave /> {saving ? 'Creating...' : 'Create Roster'}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/roster')} 
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

export default CreateRoster;
