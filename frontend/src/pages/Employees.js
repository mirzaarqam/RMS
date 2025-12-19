import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiUsers } from 'react-icons/fi';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const Employees = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const teamIdParam = searchParams.get('team_id');
  const teamId = user?.role === 'super_admin' ? teamIdParam : user?.team_id;
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!teamId && user?.role === 'super_admin') {
      setLoading(false);
      setError('Select a team from Dashboard to manage employees.');
      return;
    }
    fetchEmployees();
  }, [teamId, user]);

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll(teamId);
      setEmployees(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load employees');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (empId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      await employeeAPI.delete(empId, teamId);
      setEmployees(employees.filter(emp => emp.emp_id !== empId));
    } catch (err) {
      alert('Failed to delete employee');
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
              <FiUsers style={{ marginRight: '10px' }} />
              Employee Management
            </h2>
            <Link to={`/employees/add${teamId ? `?team_id=${teamId}` : ''}`} className="btn btn-primary">
              <FiPlus /> Add Employee
            </Link>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {employees.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FiUsers />
              </div>
              <h3>No Employees Found</h3>
              <p>Start by adding your first employee</p>
              <Link to={`/employees/add${teamId ? `?team_id=${teamId}` : ''}`} className="btn btn-primary">
                <FiPlus /> Add Employee
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.emp_id}>
                      <td>{employee.emp_id}</td>
                      <td>{employee.name}</td>
                      <td>
                        <div className="table-actions">
                          <Link
                            to={`/employees/edit/${employee.emp_id}${teamId ? `?team_id=${teamId}` : ''}`}
                            className="btn btn-sm btn-outline"
                          >
                            <FiEdit2 /> Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(employee.emp_id)}
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

export default Employees;
