import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsAPI, teamsAPI } from '../services/api';
import { FiUsers, FiClock, FiCalendar, FiArrowRight, FiLayers } from 'react-icons/fi';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_employees: 0,
    total_shifts: 0,
    rostered_employees: 0
  });
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchTeams();
      if (selectedTeam) {
        fetchStats(selectedTeam.id);
      } else {
        setLoading(false);
      }
    } else if (user) {
      fetchStats(user.team_id);
    }
  }, [user, selectedTeam]);

  const fetchStats = async (teamIdParam) => {
    try {
      setLoading(true);
      const response = await statsAPI.get(teamIdParam ? { team_id: teamIdParam } : {});
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await teamsAPI.list();
      setTeams(response.data || []);
    } catch (err) {
      console.error('Failed to load teams:', err);
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
        {user?.role === 'super_admin' ? (
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <div style={{ width:40, height:40, borderRadius:8, background:'#e3f2fd', display:'flex', alignItems:'center', justifyContent:'center', color:'#1a73e8' }}>
                  <FiLayers />
                </div>
                <div>
                  <h2 style={{ margin:0 }}>Teams</h2>
                  <p style={{ margin:0, color:'#6c757d' }}>Select a team to view actions</p>
                </div>
              </div>
              <Link to="/admin#teams" className="btn btn-outline">Manage Teams</Link>
            </div>

            {selectedTeam ? (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <h3 style={{ margin:0 }}>{selectedTeam.name}</h3>
                  <button className="btn btn-outline" onClick={()=>setSelectedTeam(null)}>Back to all teams</button>
                </div>

                <div className="stats-grid" style={{ marginBottom:16 }}>
                  <div className="stat-card">
                    <div className="stat-icon blue"><FiUsers /></div>
                    <div className="stat-content">
                      <h3>{stats.total_employees}</h3>
                      <p>Total Employees</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon green"><FiClock /></div>
                    <div className="stat-content">
                      <h3>{stats.total_shifts}</h3>
                      <p>Total Shifts</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon orange"><FiCalendar /></div>
                    <div className="stat-content">
                      <h3>{stats.rostered_employees}</h3>
                      <p>Rostered Employees</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {menuItems.map((item) => {
                    const pathWithTeam = selectedTeam && (item.path === '/employees' || item.path.startsWith('/roster'))
                      ? `${item.path}?team_id=${selectedTeam.id}`
                      : item.path;
                    return (
                    <Link key={item.path} to={pathWithTeam} style={{ textDecoration: 'none' }}>
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
                  )})}
                </div>
              </>
            ) : (
              <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
                {teams.length === 0 ? (
                  <span style={{ color:'#6c757d' }}>No teams yet</span>
                ) : (
                  teams.map(t => (
                    <button key={t.id} className="btn btn-outline" onClick={()=>setSelectedTeam(t)}>
                      {t.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
