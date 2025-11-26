import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsAPI } from '../services/api';
import { FiUsers, FiClock, FiCalendar, FiArrowRight } from 'react-icons/fi';
import Layout from '../components/Layout';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_employees: 0,
    total_shifts: 0,
    rostered_employees: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await statsAPI.get();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      title: 'Employee Management',
      description: 'Add, edit, or remove employees',
      icon: FiUsers,
      path: '/employees',
      color: 'blue'
    },
    {
      title: 'Shift Management',
      description: 'Manage shift schedules and timings',
      icon: FiClock,
      path: '/shifts',
      color: 'green'
    },
    {
      title: 'Roster Management',
      description: 'Create and view employee rosters',
      icon: FiCalendar,
      path: '/roster',
      color: 'orange'
    }
  ];

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
          <h1 style={{ fontSize: '32px', marginBottom: '8px', color: '#1a73e8' }}>
            Welcome to Roster Management System
          </h1>
          <p style={{ color: '#6c757d', fontSize: '16px' }}>
            Manage your organization's employee schedules efficiently
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <FiUsers />
            </div>
            <div className="stat-content">
              <h3>{stats.total_employees}</h3>
              <p>Total Employees</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <FiClock />
            </div>
            <div className="stat-content">
              <h3>{stats.total_shifts}</h3>
              <p>Total Shifts</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <FiCalendar />
            </div>
            <div className="stat-content">
              <h3>{stats.rostered_employees}</h3>
              <p>Rostered Employees</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ 
                height: '100%', 
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                borderLeft: `4px solid ${item.color === 'blue' ? '#1a73e8' : item.color === 'green' ? '#28a745' : '#ff9800'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    background: item.color === 'blue' ? '#e3f2fd' : item.color === 'green' ? '#e8f5e9' : '#fff3e0',
                    color: item.color === 'blue' ? '#1a73e8' : item.color === 'green' ? '#28a745' : '#ff9800'
                  }}>
                    <item.icon />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '18px', 
                      marginBottom: '8px',
                      color: '#2c3e50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      {item.title}
                      <FiArrowRight style={{ color: '#6c757d' }} />
                    </h3>
                    <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
