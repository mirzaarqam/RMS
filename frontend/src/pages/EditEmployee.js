import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { employeeAPI, teamsAPI } from '../services/api';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const EditEmployee = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [teams, setTeams] = useState([]);
  const teamIdParam = searchParams.get('team_id');
  const teamScope = user?.role === 'super_admin' ? teamIdParam || '' : user?.team_id || '';
  const [formData, setFormData] = useState({
    emp_id: '',
    name: '',
    team_id: teamScope,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { empId } = useParams();

  useEffect(() => {
    if (user?.role === 'super_admin') {
      teamsAPI.list().then(res => setTeams(res.data || [])).catch(()=>{});
    }
    fetchEmployee();
  }, [empId, teamScope, user]);

  const fetchEmployee = async () => {
    try {
      const response = await employeeAPI.getById(empId, teamScope);
      setFormData({
        emp_id: response.data.emp_id,
        name: response.data.name,
        team_id: response.data.team_id || teamScope,
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
      const payload = { ...formData };
      if (user?.role !== 'super_admin') {
        payload.team_id = user?.team_id;
      }
      if (!payload.team_id) {
        setError('Team is required');
        setSaving(false);
        return;
      }
      await employeeAPI.update(empId, payload);
      navigate(`/employees${payload.team_id ? `?team_id=${payload.team_id}` : ''}`);
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
            <button onClick={() => navigate(`/employees${formData.team_id ? `?team_id=${formData.team_id}` : ''}`)} className="btn btn-secondary">
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

            {user?.role === 'super_admin' && (
              <div className="form-group">
                <label className="form-label">Team *</label>
                <select
                  name="team_id"
                  className="form-control"
                  value={formData.team_id}
                  onChange={handleChange}
                  required
                  disabled={saving}
                >
                  <option value="">Select Team</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

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
