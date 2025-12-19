import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { shiftAPI } from '../services/api';
import './ViewRosterModal.css';

const ViewRosterModal = ({ isOpen, onClose, employee, rosterData, selectedMonth, showAllMonths }) => {
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchShifts();
    }
  }, [isOpen]);

  const fetchShifts = async () => {
    try {
      const response = await shiftAPI.getAll();
      setShifts(response.data);
    } catch (err) {
      console.error('Failed to load shifts:', err);
    }
  };

  if (!isOpen || !employee || !rosterData) return null;

  const getShiftTiming = (shiftName) => {
    if (!shiftName || shiftName === '-' || shiftName === 'N/A') return { from: '-', to: '-' };
    
    // Extract shift code from display name like "General (4)"
    const codeMatch = shiftName.match(/\(([^)]+)\)$/);
    if (!codeMatch) return { from: '-', to: '-' };
    
    const shiftCode = codeMatch[1];
    const shift = shifts.find(s => s.shift_code === shiftCode);
    
    if (!shift || !shift.shift_timing) return { from: '-', to: '-' };
    
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
    
    const parts = shift.shift_timing.split('-');
    return {
      from: toAmPm(parts[0] || ''),
      to: toAmPm(parts[1] || '')
    };
  };

  // Get the month display name
  const getMonthName = () => {
    if (showAllMonths) return 'Complete History';
    if (selectedMonth) {
      const date = new Date(selectedMonth + '-01');
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
    // Current month
    const today = new Date();
    return today.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal view-roster-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            Roster View: {employee.name} ({employee.emp_id})
          </h3>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <div className="roster-info-header">
            <p><strong>Employee:</strong> {employee.name} ({employee.emp_id})</p>
            <p><strong>Period:</strong> {getMonthName()}</p>
          </div>

          <div className="roster-table-wrapper">
            {rosterData.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                No roster data found for this employee
              </div>
            ) : (
              <table className="roster-view-table">
                <thead>
                  <tr>
                    <th>Shift</th>
                    <th>Date</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterData.map((row, index) => {
                    const timing = getShiftTiming(row.shift);
                    return (
                      <tr key={index}>
                        <td><strong>{row.shift}</strong></td>
                        <td>{new Date(row.date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric'
                        })}</td>
                        <td>{timing.from}</td>
                        <td>{timing.to}</td>
                        <td>
                          <span className={`badge ${
                            row.status === 'OFF' ? 'badge-danger' :
                            row.status === 'Half Day' ? 'badge-warning' :
                            'badge-success'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewRosterModal;
