import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shiftAPI } from '../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiClock } from 'react-icons/fi';
import Layout from '../components/Layout';

const Shifts = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const response = await shiftAPI.getAll();
      setShifts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load shifts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shiftId) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) {
      return;
    }

    try {
      await shiftAPI.delete(shiftId);
      setShifts(shifts.filter(shift => shift.id !== shiftId));
    } catch (err) {
      alert('Failed to delete shift');
      console.error(err);
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
            <h2 className="card-title">
              <FiClock style={{ marginRight: '10px' }} />
              Shift Management
            </h2>
            <Link to="/shifts/add" className="btn btn-primary">
              <FiPlus /> Add Shift
            </Link>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {shifts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FiClock />
              </div>
              <h3>No Shifts Found</h3>
              <p>Start by adding your first shift</p>
              <Link to="/shifts/add" className="btn btn-primary">
                <FiPlus /> Add Shift
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Shift Name</th>
                    <th>Shift Code</th>
                    <th>Duration (hours)</th>
                    <th>Type</th>
                    <th>Timing</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((shift) => (
                    <tr key={shift.id}>
                      <td>{shift.shift_name}</td>
                      <td>
                        <span className="badge badge-info">{shift.shift_code}</span>
                      </td>
                      <td>{shift.duration}h</td>
                      <td>
                        <span className={`badge ${shift.type === 'full' ? 'badge-success' : 'badge-warning'}`}>
                          {shift.type === 'full' ? 'Full Day' : 'Half Day'}
                        </span>
                      </td>
                      <td>{shift.shift_timing}</td>
                      <td>
                        <div className="table-actions">
                          <Link
                            to={`/shifts/edit/${shift.id}`}
                            className="btn btn-sm btn-outline"
                          >
                            <FiEdit2 /> Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(shift.id)}
                            className="btn btn-sm btn-danger"
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Shifts;
