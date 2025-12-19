import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { teamsAPI, usersAPI, settingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Admin = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('teams');
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [teamForm, setTeamForm] = useState({ name: '', description: '' });
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'supervisor', team_id: '' });
  const [resetForm, setResetForm] = useState({ username: '', password: '' });
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editTeamForm, setEditTeamForm] = useState({ name: '', description: '' });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ username: '', role: 'supervisor', team_id: '', active: 1 });

  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    refreshAll();
  }, [user]);

  const refreshAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [tRes, uRes, sRes] = await Promise.all([
        teamsAPI.list(),
        usersAPI.list(),
        settingsAPI.get(),
      ]);
      setTeams(tRes.data || []);
      setUsers(uRes.data || []);
      setSettings(sRes.data || {});
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const notify = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 2500);
  };

  const createTeam = async (e) => {
    e.preventDefault();
    try {
      await teamsAPI.create(teamForm);
      setTeamForm({ name: '', description: '' });
      notify('Team created');
      refreshAll();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create team');
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...userForm };
      if (!payload.team_id) delete payload.team_id;
      await usersAPI.create(payload);
      setUserForm({ username: '', password: '', role: 'supervisor', team_id: '' });
      notify('User created');
      refreshAll();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create user');
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.resetPassword(resetForm.username, resetForm.password);
      setResetForm({ username: '', password: '' });
      notify('Password updated');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to reset password');
    }
  };

  const startEditTeam = (team) => {
    setEditingTeamId(team.id);
    setEditTeamForm({ name: team.name, description: team.description || '' });
  };

  const cancelEditTeam = () => {
    setEditingTeamId(null);
    setEditTeamForm({ name: '', description: '' });
  };

  const saveTeam = async (teamId) => {
    try {
      await teamsAPI.update(teamId, editTeamForm);
      notify('Team updated');
      cancelEditTeam();
      refreshAll();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to update team');
    }
  };

  const removeTeam = async (teamId) => {
    const ok = window.confirm('Delete this team? Users will be unassigned.');
    if (!ok) return;
    try {
      await teamsAPI.remove(teamId);
      notify('Team deleted');
      refreshAll();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to delete team');
    }
  };

  const startEditUser = (user) => {
    setEditingUserId(user.id);
    setEditUserForm({
      username: user.username,
      role: user.role,
      team_id: user.team_id || '',
      active: user.active ? 1 : 0,
    });
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditUserForm({ username: '', role: 'supervisor', team_id: '', active: 1 });
  };

  const saveUser = async (userId) => {
    const payload = { ...editUserForm };
    if (!payload.team_id) delete payload.team_id;
    try {
      await usersAPI.update(userId, payload);
      notify('User updated');
      cancelEditUser();
      refreshAll();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to update user');
    }
  };

  const removeUser = async (userId) => {
    const ok = window.confirm('Delete this user?');
    if (!ok) return;
    try {
      await usersAPI.remove(userId);
      notify('User deleted');
      refreshAll();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to delete user');
    }
  };

  const setFlag = async (key, value) => {
    try {
      await settingsAPI.set(key, value);
      notify('Setting updated');
      refreshAll();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to update setting');
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <Layout>
        <div className="container"><div className="card"><div className="card-body">Forbidden: Admins only</div></div></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Admin</h2>
            <div className="tabs">
              <button className={`btn btn-outline ${tab==='teams'?'active':''}`} onClick={()=>setTab('teams')}>Teams</button>
              <button className={`btn btn-outline ${tab==='users'?'active':''}`} onClick={()=>setTab('users')}>Users</button>
              <button className={`btn btn-outline ${tab==='settings'?'active':''}`} onClick={()=>setTab('settings')}>Settings</button>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {loading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : (
            <div className="card-body">
              {tab === 'teams' && (
                <div>
                  <h3>Create Team</h3>
                  <form onSubmit={createTeam} style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:12}}>
                    <input className="form-control" placeholder="Team name" value={teamForm.name} onChange={(e)=>setTeamForm({...teamForm,name:e.target.value})} required />
                    <input className="form-control" placeholder="Description" value={teamForm.description} onChange={(e)=>setTeamForm({...teamForm,description:e.target.value})} />
                    <button className="btn btn-success" type="submit">Create</button>
                  </form>
                  <h3 style={{marginTop:16}}>Teams</h3>
                  <div className="table" style={{display:'table', width:'100%'}}>
                    <div style={{display:'table-row', fontWeight:600}}>
                      <div style={{display:'table-cell', padding:'8px'}}>Name</div>
                      <div style={{display:'table-cell', padding:'8px'}}>Description</div>
                      <div style={{display:'table-cell', padding:'8px'}}>Actions</div>
                    </div>
                    {teams.map(t => (
                      <div key={t.id} style={{display:'table-row', borderTop:'1px solid #eee'}}>
                        <div style={{display:'table-cell', padding:'8px'}}>
                          {editingTeamId === t.id ? (
                            <input className="form-control" value={editTeamForm.name} onChange={(e)=>setEditTeamForm({...editTeamForm,name:e.target.value})} />
                          ) : t.name}
                        </div>
                        <div style={{display:'table-cell', padding:'8px'}}>
                          {editingTeamId === t.id ? (
                            <input className="form-control" value={editTeamForm.description} onChange={(e)=>setEditTeamForm({...editTeamForm,description:e.target.value})} />
                          ) : (t.description || '-')}
                        </div>
                        <div style={{display:'table-cell', padding:'8px', display:'flex', gap:8}}>
                          {editingTeamId === t.id ? (
                            <>
                              <button className="btn btn-success" onClick={()=>saveTeam(t.id)}>Save</button>
                              <button className="btn btn-outline" onClick={cancelEditTeam}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button className="btn btn-outline" onClick={()=>startEditTeam(t)}>Edit</button>
                              <button className="btn btn-danger" onClick={()=>removeTeam(t.id)}>Delete</button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'users' && (
                <div>
                  <h3>Create User</h3>
                  <form onSubmit={createUser} style={{display:'grid',gridTemplateColumns:'repeat(4,1fr) auto',gap:12}}>
                    <input className="form-control" placeholder="Username" value={userForm.username} onChange={(e)=>setUserForm({...userForm,username:e.target.value})} required />
                    <input className="form-control" placeholder="Password" type="password" value={userForm.password} onChange={(e)=>setUserForm({...userForm,password:e.target.value})} required />
                    <select className="form-control" value={userForm.role} onChange={(e)=>setUserForm({...userForm,role:e.target.value})}>
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    <select className="form-control" value={userForm.team_id} onChange={(e)=>setUserForm({...userForm,team_id:e.target.value})}>
                      <option value="">No Team</option>
                      {teams.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button className="btn btn-success" type="submit">Create</button>
                  </form>

                  <h3 style={{marginTop:16}}>Users</h3>
                  <table className="table">
                    <thead><tr><th>Username</th><th>Role</th><th>Team</th><th>Active</th><th>Actions</th></tr></thead>
                    <tbody>
                      {users.map(u=> (
                        <tr key={u.id}>
                          <td>
                            {editingUserId === u.id ? (
                              <input className="form-control" value={editUserForm.username} onChange={(e)=>setEditUserForm({...editUserForm,username:e.target.value})} />
                            ) : u.username}
                          </td>
                          <td>
                            {editingUserId === u.id ? (
                              <select className="form-control" value={editUserForm.role} onChange={(e)=>setEditUserForm({...editUserForm,role:e.target.value})}>
                                <option value="supervisor">Supervisor</option>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                              </select>
                            ) : u.role}
                          </td>
                          <td>
                            {editingUserId === u.id ? (
                              <select className="form-control" value={editUserForm.team_id} onChange={(e)=>setEditUserForm({...editUserForm,team_id:e.target.value})}>
                                <option value="">No Team</option>
                                {teams.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                            ) : (teams.find(t=>t.id===u.team_id)?.name || '-')}
                          </td>
                          <td>
                            {editingUserId === u.id ? (
                              <select className="form-control" value={editUserForm.active} onChange={(e)=>setEditUserForm({...editUserForm,active:e.target.value})}>
                                <option value={1}>Yes</option>
                                <option value={0}>No</option>
                              </select>
                            ) : (u.active ? 'Yes' : 'No')}
                          </td>
                          <td>
                            {editingUserId === u.id ? (
                              <>
                                <button className="btn btn-success" onClick={()=>saveUser(u.id)}>Save</button>
                                <button className="btn btn-outline" onClick={cancelEditUser} style={{marginLeft:8}}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn-outline" onClick={()=>startEditUser(u)}>Edit</button>
                                <button className="btn btn-danger" onClick={()=>removeUser(u.id)} style={{marginLeft:8}}>Delete</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <h3 style={{marginTop:16}}>Reset Password</h3>
                  <form onSubmit={resetPassword} style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:12}}>
                    <input className="form-control" placeholder="Username" value={resetForm.username} onChange={(e)=>setResetForm({...resetForm,username:e.target.value})} required />
                    <input className="form-control" placeholder="New Password" type="password" value={resetForm.password} onChange={(e)=>setResetForm({...resetForm,password:e.target.value})} required />
                    <button className="btn btn-success" type="submit">Update</button>
                  </form>
                </div>
              )}

              {tab === 'settings' && (
                <div>
                  <h3>Feature Flags</h3>
                  <div style={{display:'flex',gap:12,alignItems:'center'}}>
                    <label>GPT-5.1-Codex-Max (Preview)</label>
                    <select className="form-control" style={{maxWidth:160}} value={settings['gpt_5_1_codex_max_preview'] || 'false'} onChange={(e)=>setFlag('gpt_5_1_codex_max_preview', e.target.value)}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
