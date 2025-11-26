import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rosterAPI } from '../services/api';
import { FiPlus, FiDownload, FiCalendar, FiEdit2, FiList } from 'react-icons/fi';
import Layout from '../components/Layout';
import EditRosterModal from '../components/EditRosterModal';
import './RosterView.css';

const RosterView = () => {
  const [rosterData, setRosterData] = useState({ 
    dates: [], 
    roster: [], 
    available_months: [] 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [editModal, setEditModal] = useState({
    isOpen: false,
    employee: null,
    date: '',
    currentShift: '',
    currentStatus: ''
  });

  useEffect(() => {
    fetchRoster();
  }, [selectedMonth, showAllMonths]);

  const fetchRoster = async () => {
    try {
      const params = {};
      if (showAllMonths) {
        params.all = 'true';
      } else if (selectedMonth) {
        params.month = selectedMonth;
      }
      
      const response = await rosterAPI.get(params);
      setRosterData(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load roster');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Pass the current filter parameters to export
      const params = {};
      if (showAllMonths) {
        params.all = 'true';
      } else if (selectedMonth) {
        params.month = selectedMonth;
      }
      
      const response = await rosterAPI.export(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Create filename with current filter info
      const monthName = selectedMonth 
        ? new Date(selectedMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        : showAllMonths 
          ? 'All_Months' 
          : 'Last_Month';
      link.setAttribute('download', `roster_export_${monthName.replace(/\s/g, '_')}.csv`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export roster');
      console.error(err);
    }
  };

  const getCellClass = (status) => {
    if (status.includes('OFF')) return 'roster-cell-off';
    if (status.includes('Half')) return 'roster-cell-half';
    return 'roster-cell-full';
  };

  const handleEditClick = (employee, date, shift, status) => {
    setEditModal({
      isOpen: true,
      employee: { emp_id: employee.emp_id, name: employee.name },
      date: date,
      currentShift: shift,
      currentStatus: status
    });
  };

  const handleModalClose = () => {
    setEditModal({
      isOpen: false,
      employee: null,
      date: '',
      currentShift: '',
      currentStatus: ''
    });
  };

  const handleSaveSuccess = () => {
    fetchRoster(); // Refresh roster data
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setShowAllMonths(false);
  };

  const handleShowAllMonths = () => {
    setShowAllMonths(true);
    setSelectedMonth('');
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
              <FiCalendar style={{ marginRight: '10px' }} />
              Roster View
            </h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={handleExport} className="btn btn-success">
                <FiDownload /> Export CSV
              </button>
              <Link to="/roster/create" className="btn btn-primary">
                <FiPlus /> Create Roster
              </Link>
            </div>
          </div>

          {/* Month Filter */}
          {rosterData.available_months.length > 0 && (
            <div style={{ 
              padding: '16px 24px', 
              borderBottom: '1px solid #e0e6ed',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <label style={{ fontWeight: 500, color: '#34495e' }}>Filter by Month:</label>
              <select 
                className="form-control" 
                style={{ width: 'auto', minWidth: '180px' }}
                value={selectedMonth}
                onChange={handleMonthChange}
                disabled={showAllMonths}
              >
                <option value="">Last Month</option>
                {rosterData.available_months.map((month) => (
                  <option key={month} value={month}>
                    {new Date(month + '-01').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </option>
                ))}
              </select>
              <button 
                onClick={handleShowAllMonths}
                className={`btn ${showAllMonths ? 'btn-primary' : 'btn-outline'}`}
              >
                <FiList /> Complete Roster History
              </button>
              {showAllMonths && (
                <span className="badge badge-info">Showing All Months</span>
              )}
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          {rosterData.roster.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FiCalendar />
              </div>
              <h3>No Roster Data Found</h3>
              <p>Start by creating a roster for your employees</p>
              <Link to="/roster/create" className="btn btn-primary">
                <FiPlus /> Create Roster
              </Link>
            </div>
          ) : (
            <div className="roster-container">
              <table className="roster-table">
                <thead>
                  <tr>
                    <th className="sticky-col" style={{ minWidth: '120px' }}>Employee ID</th>
                    <th className="sticky-col-2" style={{ minWidth: '150px' }}>Employee Name</th>
                    {rosterData.dates.map((date) => (
                      <th key={date} style={{ minWidth: '200px' }}>
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rosterData.roster.map((employee) => (
                    <tr key={employee.emp_id}>
                      <td className="sticky-col">{employee.emp_id}</td>
                      <td className="sticky-col-2">{employee.name}</td>
                      {employee.shifts.map((shift, index) => (
                        <td key={index} className={shift.status ? getCellClass(shift.status) : 'roster-cell-empty'}>
                          <div className="roster-cell-content">
                            <div className="shift-info">
                              {shift.shift && shift.shift !== '' ? shift.shift : '-'}
                            </div>
                            {shift.status ? (
                              <div className={`status-badge ${getCellClass(shift.status)}`}>
                                {shift.status}
                              </div>
                            ) : (
                              <div className="status-badge badge-secondary">
                                Not Assigned
                              </div>
                            )}
                            <button
                              className="edit-cell-btn"
                              onClick={() => handleEditClick(
                                employee,
                                shift.date,
                                shift.shift || '',
                                shift.status || ''
                              )}
                              title={shift.shift ? "Edit roster entry" : "Assign roster"}
                            >
                              <FiEdit2 />
                            </button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {rosterData.roster.length > 0 && (
          <div className="card" style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '12px', color: '#2c3e50' }}>Legend</h3>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '4px',
                  background: '#d4edda'
                }}></div>
                <span>Full Day</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '4px',
                  background: '#fff3cd'
                }}></div>
                <span>Half Day</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '4px',
                  background: '#f8d7da'
                }}></div>
                <span>OFF Day</span>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        <EditRosterModal
          isOpen={editModal.isOpen}
          onClose={handleModalClose}
          employee={editModal.employee}
          date={editModal.date}
          currentShift={editModal.currentShift}
          currentStatus={editModal.currentStatus}
          onSave={handleSaveSuccess}
        />
      </div>
    </Layout>
  );
};

export default RosterView;
