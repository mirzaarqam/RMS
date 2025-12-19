import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { employeeAPI, teamsAPI } from '../services/api';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const AddEmployee = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [teams, setTeams] = useState([]);
  const teamIdFromParam = searchParams.get('team_id');
  const defaultTeamId = user?.role === 'super_admin' ? teamIdFromParam || '' : user?.team_id || '';
  const [formData, setFormData] = useState({
    emp_id: '',
    name: '',
    team_id: defaultTeamId,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'super_admin') {
      teamsAPI.list().then(res => setTeams(res.data || [])).catch(()=>{});
    }
  }, [user]);

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

    try {
      const payload = { ...formData };
      if (user?.role !== 'super_admin') {
        payload.team_id = user?.team_id;
      }
      if (!payload.team_id) {
        setError('Team is required');
        setLoading(false);
        return;
      }
      await employeeAPI.create(payload);
      navigate(`/employees${payload.team_id ? `?team_id=${payload.team_id}` : ''}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Add New Employee</h2>
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
                disabled={loading}
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
                disabled={loading}
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
                  disabled={loading}
                >
                  <option value="">Select Team</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="submit" className="btn btn-success" disabled={loading}>
                <FiSave /> {loading ? 'Saving...' : 'Save Employee'}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/employees')} 
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

export default AddEmployee;
