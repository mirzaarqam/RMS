import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { rosterAPI } from '../services/api';
import { FiPlus, FiDownload, FiCalendar, FiEdit2, FiList, FiEye, FiTrash2 } from 'react-icons/fi';
import Layout from '../components/Layout';
import EditRosterModal from '../components/EditRosterModal';
import ViewRosterModal from '../components/ViewRosterModal';
import './RosterView.css';
import { useAuth } from '../context/AuthContext';

const RosterView = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamId = user?.role === 'super_admin' ? searchParams.get('team_id') : user?.team_id;
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
  const [viewRosterModal, setViewRosterModal] = useState({
    isOpen: false,
    employee: null,
    data: []
  });

  useEffect(() => {
    if (user?.role === 'super_admin' && !teamId) {
      setLoading(false);
      setError('Select a team from Dashboard to view roster.');
      return;
    }
    fetchRoster();
  }, [selectedMonth, showAllMonths, teamId, user]);

  const fetchRoster = async () => {
    try {
      const params = {};
      if (showAllMonths) {
        params.all = 'true';
      } else if (selectedMonth) {
        params.month = selectedMonth;
      }
      
      if (teamId) params.team_id = teamId;
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
      if (teamId) params.team_id = teamId;
      
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

  const handleViewRoster = (employee) => {
    // Flatten roster data for the modal
    const flatData = [];
    rosterData.roster.forEach((emp) => {
      if (emp.emp_id === employee.emp_id) {
        emp.shifts.forEach((shift) => {
          flatData.push({
            emp_id: emp.emp_id,
            shift: shift.shift || '-',
            date: shift.date,
            status: shift.status || '-',
            timing: shift.timing || ''
          });
        });
      }
    });
    setViewRosterModal({
      isOpen: true,
      employee: employee,
      data: flatData
    });
  };

  const handleCloseViewModal = () => {
    setViewRosterModal({
      isOpen: false,
      employee: null,
      data: []
    });
  };

  const handleDeleteEmployeeRoster = async (empId) => {
    if (!window.confirm(`Delete roster for employee ${empId}?`)) {
      return;
    }
    try {
      const month = selectedMonth || new Date().toISOString().slice(0, 7);
      await rosterAPI.deleteEmployeeRoster(empId, month, teamId);
      fetchRoster();
    } catch (err) {
      alert('Failed to delete roster: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditEmployeeRoster = (employee) => {
    // Collect existing roster data for this employee
    const month = selectedMonth || new Date().toISOString().slice(0, 7);
    const empRosterData = rosterData.roster.find((emp) => emp.emp_id === employee.emp_id);

    if (!empRosterData) {
      alert('No roster data found for this employee');
      return;
    }

    // Extract off dates and half dates from shifts
    const offDates = [];
    const halfDates = [];
    let defaultShiftId = null;

    empRosterData.shifts.forEach((shift) => {
      if (shift.status === 'OFF') {
        offDates.push(shift.date);
      } else if (shift.status === 'Half Day') {
        halfDates.push({
          date: shift.date,
          shift_id: shift.shift_id || ''
        });
      } else if (!defaultShiftId) {
        defaultShiftId = shift.shift_id;
      }
    });

    // Navigate to CreateRoster with pre-filled data
    const params = new URLSearchParams({
      emp_id: employee.emp_id,
      month: month,
      shift_id: defaultShiftId || '',
      team_id: teamId,
      edit: 'true'
    });
    navigate(`/roster/create?${params.toString()}`);
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
              <Link to={`/roster/create${teamId ? `?team_id=${teamId}` : ''}`} className="btn btn-primary">
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
              {!showAllMonths ? (
                <button 
                  onClick={handleShowAllMonths}
                  className="btn btn-outline"
                >
                  <FiList /> Complete Roster History
                </button>
              ) : (
                <>
                  <span className="badge badge-info">Showing All Months</span>
                  <button 
                    onClick={() => {
                      setShowAllMonths(false);
                      setSelectedMonth('');
                    }}
                    className="btn btn-secondary"
                  >
                    Back to Current Month
                  </button>
                </>
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
                    <th className="sticky-col-actions" style={{ minWidth: '140px' }}>Actions</th>
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
                      <td className="sticky-col-actions">
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handleViewRoster(employee)}
                            title="View roster"
                            style={{ padding: '4px 6px' }}
                          >
                            <FiEye size={14} />
                          </button>
                          {!showAllMonths && (
                            <>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => handleEditEmployeeRoster(employee)}
                                title="Edit roster"
                                style={{ padding: '4px 6px' }}
                              >
                                <FiEdit2 size={14} />
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteEmployeeRoster(employee.emp_id)}
                                title="Delete roster"
                                style={{ padding: '4px 6px' }}
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
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
          teamId={teamId}
        />

        {/* View Roster Modal */}
        <ViewRosterModal
          isOpen={viewRosterModal.isOpen}
          onClose={handleCloseViewModal}
          employee={viewRosterModal.employee}
          rosterData={viewRosterModal.data}
          selectedMonth={selectedMonth}
          showAllMonths={showAllMonths}
        />
      </div>
    </Layout>
  );
};

export default RosterView;
