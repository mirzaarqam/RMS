import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiCalendar, FiPlus, FiEye } from 'react-icons/fi';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const Roster = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const teamId = user?.role === 'super_admin' ? searchParams.get('team_id') : user?.team_id;

  if (user?.role === 'super_admin' && !teamId) {
    return (
      <Layout>
        <div className="container">
          <div className="card">
            <div className="card-header"><h2 className="card-title">Roster Management</h2></div>
            <div className="card-body">Select a team from Dashboard to manage roster.</div>
          </div>
        </div>
      </Layout>
    );
  }

  const teamQuery = teamId ? `?team_id=${teamId}` : '';
  return (
    <Layout>
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <FiCalendar style={{ marginRight: '10px' }} />
              Roster Management
            </h2>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px',
            marginTop: '20px'
          }}>
            <Link to={`/roster/create${teamQuery}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ 
                height: '100%',
                borderLeft: '4px solid #28a745',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    background: '#e8f5e9',
                    color: '#28a745'
                  }}>
                    <FiPlus />
                  </div>
                  <div>
                    <h3 style={{ 
                      fontSize: '20px', 
                      marginBottom: '8px',
                      color: '#2c3e50'
                    }}>
                      Create Roster
                    </h3>
                    <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
                      Create a new monthly roster for an employee with shifts and off days
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link to={`/roster/view${teamQuery}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ 
                height: '100%',
                borderLeft: '4px solid #1a73e8',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    background: '#e3f2fd',
                    color: '#1a73e8'
                  }}>
                    <FiEye />
                  </div>
                  <div>
                    <h3 style={{ 
                      fontSize: '20px', 
                      marginBottom: '8px',
                      color: '#2c3e50'
                    }}>
                      View Roster
                    </h3>
                    <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
                      View and export the complete roster schedule for all employees
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Roster;
