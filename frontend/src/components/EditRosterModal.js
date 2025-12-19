import React, { useState, useEffect } from 'react';
import { shiftAPI, rosterAPI } from '../services/api';
import { FiX, FiSave } from 'react-icons/fi';
import './EditRosterModal.css';

const EditRosterModal = ({ isOpen, onClose, employee, date, currentShift, currentStatus, onSave, teamId }) => {
  const [shifts, setShifts] = useState([]);
  const [formData, setFormData] = useState({
    shift: '',
    status: 'Full Day'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchShifts();
      // Parse current shift and status
      setFormData({
        shift: currentShift || '',
        status: currentStatus || ''
      });
    }
  }, [isOpen, currentShift, currentStatus]);

  const fetchShifts = async () => {
    try {
      const response = await shiftAPI.getAll();
      setShifts(response.data);
    } catch (err) {
      console.error('Failed to load shifts:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await rosterAPI.update(employee.emp_id, date, { ...formData, team_id: teamId });
      onSave();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update roster');
    } finally {
      setLoading(false);
    }
  };

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

  const handleShiftChange = (e) => {
    const selectedShiftId = e.target.value;
    if (selectedShiftId === 'OFF') {
      setFormData({
        shift: 'N/A',
        status: 'OFF'
      });
    } else if (selectedShiftId) {
      const selectedShift = shifts.find(s => s.id === parseInt(selectedShiftId));
      if (selectedShift) {
        const timing = formatTiming(selectedShift.shift_timing);
        const shiftDisplay = `${selectedShift.shift_name} (${selectedShift.shift_code})${timing ? ` - ${timing}` : ''}`;
        const status = selectedShift.type === 'half' ? 'Half Day' : 'Full Day';
        setFormData({
          shift: shiftDisplay,
          status: status
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {currentShift ? 'Edit Roster Entry' : 'Assign Roster Entry'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ marginBottom: '20px', padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              <strong>Employee:</strong> {employee?.name} ({employee?.emp_id})
            </p>
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              <strong>Date:</strong> {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Select Shift *</label>
              <select
                className="form-control"
                onChange={handleShiftChange}
                required
                disabled={loading}
                defaultValue=""
              >
                <option value="">Choose a shift...</option>
                <optgroup label="Full Day Shifts">
                  {shifts.filter(s => s.type === 'full').map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.shift_name} ({shift.shift_code}) - {formatTiming(shift.shift_timing)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Half Day Shifts">
                  {shifts.filter(s => s.type === 'half').map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.shift_name} ({shift.shift_code}) - {formatTiming(shift.shift_timing)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Other">
                  <option value="OFF">OFF Day</option>
                </optgroup>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Current Selection</label>
              <div style={{ padding: '12px', background: '#e3f2fd', borderRadius: '6px', fontSize: '14px' }}>
                <p style={{ margin: '4px 0' }}><strong>Shift:</strong> {formData.shift || '-'}</p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Status:</strong> 
                  <span className={`badge ${
                    formData.status === 'OFF' ? 'badge-danger' : 
                    formData.status === 'Half Day' ? 'badge-warning' : 
                    'badge-success'
                  }`} style={{ marginLeft: '8px' }}>
                    {formData.status}
                  </span>
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                onClick={onClose} 
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-success"
                disabled={loading || !formData.shift}
              >
                <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditRosterModal;
