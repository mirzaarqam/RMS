import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { employeeAPI, shiftAPI, rosterAPI } from '../services/api';
import { FiSave, FiArrowLeft, FiX } from 'react-icons/fi';
import Layout from '../components/Layout';
import MonthCalendar from '../components/MonthCalendar';
import { useAuth } from '../context/AuthContext';

const CreateRoster = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const teamId = user?.role === 'super_admin' ? searchParams.get('team_id') : user?.team_id;
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

  const formatTiming = (timing) => {
    if (!timing) return '';
    const toAmPm = (t) => {
      t = t.trim();
      const ampm = t.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
      if (ampm) return `${ampm[1]}:${ampm[2]} ${ampm[3].toUpperCase()}`;
      const plain = t.match(/^(\d{1,2}):(\d{2})$/);
      if (plain) {
        let h = parseInt(plain[1], 10);
        const m = parseInt(plain[2], 10);
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = ((h + 11) % 12) + 1;
        return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
      }
      return t;
    };
    const parts = timing.split('-');
    if (parts.length === 2) return `${toAmPm(parts[0])} - ${toAmPm(parts[1])}`;
    return toAmPm(timing);
  };

  useEffect(() => {
    if (user?.role === 'super_admin' && !teamId) {
      setError('Select a team from Dashboard to create roster.');
      setLoading(false);
      return;
    }
    fetchInitialData();
  }, [teamId, user]);

  useEffect(() => {
    // Pre-fill form if coming from edit action
    const empId = searchParams.get('emp_id');
    const month = searchParams.get('month');
    const shiftId = searchParams.get('shift_id');
    
    if (empId || month || shiftId) {
      setFormData({
        emp_id: empId || '',
        month: month || '',
        shift_id: shiftId || ''
      });
    }
  }, [searchParams]);

  const fetchInitialData = async () => {
    try {
      const [empResponse, fullShiftsResponse, halfShiftsResponse] = await Promise.all([
        employeeAPI.getAll(teamId),
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
        })),
      team_id: teamId,
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
            <button onClick={() => navigate(`/roster${teamId ? `?team_id=${teamId}` : ''}`)} className="btn btn-secondary">
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
                    {shift.shift_name} ({shift.shift_code}) - {formatTiming(shift.shift_timing)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">OFF Days & Half Days Selection</label>
              {formData.month ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  {/* Half Days - Left Side */}
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#34495e', marginBottom: '8px', display: 'block' }}>
                      Half Days Calendar
                    </label>
                    <MonthCalendar
                      month={formData.month}
                      selectedDates={halfDates.map(hd => hd.date)}
                      onDateSelect={(dateStr) => {
                        const exists = halfDates.find(hd => hd.date === dateStr);
                        if (exists) {
                          setHalfDates(halfDates.filter(hd => hd.date !== dateStr));
                        } else {
                          setHalfDates([...halfDates, { date: dateStr, shift_id: '' }]);
                        }
                      }}
                      disabled={saving}
                    />
                  </div>

                  {/* OFF Days - Right Side */}
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#34495e', marginBottom: '8px', display: 'block' }}>
                      OFF Days Calendar
                    </label>
                    <MonthCalendar
                      month={formData.month}
                      selectedDates={offDates}
                      onDateSelect={(dateStr) => {
                        if (offDates.includes(dateStr)) {
                          setOffDates(offDates.filter(d => d !== dateStr));
                        } else {
                          setOffDates([...offDates, dateStr]);
                        }
                      }}
                      disabled={saving}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px', background: '#fff3cd', borderRadius: '6px', color: '#856404', fontSize: '13px' }}>
                  Please select a month first to add OFF days and Half days
                </div>
              )}
            </div>

            {/* Selected OFF Days Tags */}
            {offDates.length > 0 && (
              <div className="form-group">
                <strong style={{ fontSize: '13px', color: '#34495e' }}>Selected OFF Days:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {offDates.map((date) => (
                    <div key={date} style={{
                      background: '#f8d7da',
                      color: '#721c24',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <button
                        type="button"
                        onClick={() => setOffDates(offDates.filter(d => d !== date))}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0',
                          color: '#721c24',
                          fontSize: '16px'
                        }}
                        disabled={saving}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Half Day Shift Assignment */}
            {halfDates.length > 0 && (
              <div className="form-group">
                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                  <strong style={{ fontSize: '13px', color: '#34495e', marginBottom: '12px', display: 'block' }}>
                    Assign Shifts to Half Days:
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {halfDates.map((hd, index) => (
                          <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: '10px', alignItems: 'center' }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                              {new Date(hd.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <select
                              className="form-control"
                              value={hd.shift_id}
                              onChange={(e) => updateHalfDate(index, 'shift_id', e.target.value)}
                              disabled={saving}
                            >
                              <option value="">Select Half Shift</option>
                              {halfDayShifts.map((shift) => (
                                <option key={shift.id} value={shift.id}>
                                  {shift.shift_name} ({shift.shift_code}) - {formatTiming(shift.shift_timing)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setHalfDates(halfDates.filter((_, i) => i !== index))}
                              className="btn btn-danger btn-sm"
                              disabled={saving}
                            >
                              <FiX />
                            </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
