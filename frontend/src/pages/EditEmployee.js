import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import Layout from '../components/Layout';

const EditEmployee = () => {
  const [formData, setFormData] = useState({
    emp_id: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { empId } = useParams();

  useEffect(() => {
    fetchEmployee();
  }, [empId]);

  const fetchEmployee = async () => {
    try {
      const response = await employeeAPI.getById(empId);
      setFormData({
        emp_id: response.data.emp_id,
        name: response.data.name
      });
      setError('');
    } catch (err) {
      setError('Failed to load employee details');
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

    try {
      await employeeAPI.update(empId, formData);
      navigate('/employees');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update employee');
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
            <h2 className="card-title">Edit Employee</h2>
            <button onClick={() => navigate('/employees')} className="btn btn-secondary">
              <FiArrowLeft /> Back
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Employee ID *</label>
              <input
                type="text"
                name="emp_id"
                className="form-control"
                value={formData.emp_id}
                onChange={handleChange}
                placeholder="Enter employee ID"
                required
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter employee name"
                required
                disabled={saving}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="submit" className="btn btn-success" disabled={saving}>
                <FiSave /> {saving ? 'Saving...' : 'Update Employee'}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/employees')} 
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

export default EditEmployee;
