from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import logging
import sqlite3
from datetime import datetime, timedelta
import csv
import os
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
import json

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = 'your_secret_key_change_in_production'

# Enable debug logging for diagnostics
app.logger.setLevel(logging.DEBUG)

# Session store using SQLite for persistence
def init_sessions_db():
    """Initialize sessions table"""
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                username TEXT,
                created_at TEXT,
                last_accessed TEXT
            )
        ''')
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error initializing sessions table: {e}")

def add_session(token, username):
    """Add session to database"""
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        cursor.execute('''
            INSERT OR REPLACE INTO sessions (token, username, created_at, last_accessed)
            VALUES (?, ?, ?, ?)
        ''', (token, username, now, now))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error adding session: {e}")

def get_session(token):
    """Get session from database"""
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('SELECT username FROM sessions WHERE token = ?', (token,))
        result = cursor.fetchone()
        conn.close()
        return result
    except Exception as e:
        print(f"Error getting session: {e}")
        return None

def delete_session(token):
    """Delete session from database"""
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM sessions WHERE token = ?', (token,))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error deleting session: {e}")

def delete_sessions_for_username(username):
    """Delete all sessions for a given username"""
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM sessions WHERE username = ?', (username,))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error deleting sessions for user {username}: {e}")

# Initialize sessions table
init_sessions_db()

# Initialize SQLite database
def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    def add_column_if_missing(table, column, col_def):
        cursor.execute(f"PRAGMA table_info({table})")
        cols = [row[1] for row in cursor.fetchall()]
        if column not in cols:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_def}")

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            emp_id TEXT,
            name TEXT,
            team_id INTEGER
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS shifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shift_name TEXT,
            shift_code TEXT,
            duration INTEGER,
            type TEXT CHECK(type IN ('full', 'half')),
            shift_timing TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS roster (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            emp_id TEXT,
            date TEXT,
            shift TEXT,
            status TEXT,
            team_id INTEGER
        )
    ''')

    # Users table for roles and authentication
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            role TEXT CHECK(role IN ('super_admin','admin','supervisor')),
            team_id INTEGER,
            active INTEGER DEFAULT 1,
            created_at TEXT,
            updated_at TEXT
        )
    ''')

    # Teams table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            description TEXT,
            created_at TEXT
        )
    ''')

    # Settings key-value table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')

    conn.commit()

    # Migrate columns if missing
    add_column_if_missing('employees', 'team_id', 'team_id INTEGER')
    add_column_if_missing('roster', 'team_id', 'team_id INTEGER')

    conn.commit()
    conn.close()

init_db()

# -------------------- BOOTSTRAP DATA --------------------
# Helper function to get db connection
def get_db():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def seed_initial_data():
    conn = get_db()
    cursor = conn.cursor()

    # Seed super admin if no users exist
    cursor.execute('SELECT COUNT(*) as c FROM users')
    count_users = dict(cursor.fetchone())['c']
    if count_users == 0:
        now = datetime.now().isoformat()
        # Create Helpdesk team
        cursor.execute('INSERT OR IGNORE INTO teams (name, description, created_at) VALUES (?,?,?)',
                       ('Helpdesk', 'Helpdesk Team', now))
        cursor.execute('SELECT id FROM teams WHERE name = ?', ('Helpdesk',))
        helpdesk_id = dict(cursor.fetchone())['id']

        # Create super admin
        super_username = os.getenv('SUPER_ADMIN_USERNAME', 'super_admin')
        super_password = os.getenv('SUPER_ADMIN_PASSWORD', 'admin123')
        cursor.execute('''
            INSERT INTO users (username, password_hash, role, team_id, active, created_at, updated_at)
            VALUES (?,?,?,?,1,?,?)
        ''', (
            super_username,
            generate_password_hash(super_password),
            'super_admin',
            None,
            now,
            now
        ))

        # Create supervisor faizan.ahmad in Helpdesk with password 123456
        cursor.execute('''
            INSERT OR IGNORE INTO users (username, password_hash, role, team_id, active, created_at, updated_at)
            VALUES (?,?,?,?,1,?,?)
        ''', (
            'faizan.ahmad',
            generate_password_hash('123456'),
            'supervisor',
            helpdesk_id,
            now,
            now
        ))

        # Seed feature flag
        cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)',
                       ('gpt_5_1_codex_max_preview', 'true'))

        conn.commit()

    conn.close()

seed_initial_data()

# Authentication decorator
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Unauthorized - No token'}), 401
        
        session = get_session(token)
        if not session:
            return jsonify({'error': 'Unauthorized - Invalid token'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    token = request.headers.get('Authorization')
    if not token:
        return None
    s = get_session(token)
    if not s:
        return None
    username = s[0] if isinstance(s, tuple) else s[0] if hasattr(s, '__getitem__') else None
    if not username:
        return None
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, role, team_id, active FROM users WHERE username = ?', (username,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def require_role(roles):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({'error': 'Unauthorized'}), 401
            if user.get('role') not in roles:
                return jsonify({'error': 'Forbidden'}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator

# ==================== AUTH ENDPOINTS ====================

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    try:
        app.logger.info(
            f"Login attempt: username={username!r}, password_len={len(password or '')}"
        )
    except Exception:
        pass

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT username, password_hash, role, active, team_id FROM users WHERE username = ?', (username,))
    row = cursor.fetchone()
    conn.close()

    try:
        app.logger.info(f"User row found: {bool(row)}")
    except Exception:
        pass

    if not row:
        return jsonify({'error': 'Invalid credentials'}), 401
    user = dict(row)
    if not user['active']:
        return jsonify({'error': 'User is deactivated'}), 403
    chk = False
    try:
        chk = check_password_hash(user['password_hash'], password or '')
        app.logger.info(f"Password check result: {chk}")
    except Exception as e:
        app.logger.error(f"Password check error: {e}")
    if not chk:
        return jsonify({'error': 'Invalid credentials'}), 401

    token = f"token_{datetime.now().timestamp()}"
    add_session(token, username)
    return jsonify({'token': token, 'username': username, 'role': user['role'], 'team_id': user['team_id']}), 200

@app.route('/api/logout', methods=['POST'])
@require_auth
def logout():
    token = request.headers.get('Authorization')
    delete_session(token)
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/validate', methods=['GET'])
@require_auth
def validate():
    user = get_current_user()
    return jsonify({'valid': True, 'user': user}), 200

# ==================== ADMIN: TEAMS ====================

@app.route('/api/teams', methods=['GET'])
@require_auth
def list_teams():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, description, created_at FROM teams ORDER BY name')
    teams = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(teams), 200

@app.route('/api/teams', methods=['POST'])
@require_role(['super_admin'])
def create_team():
    data = request.json or {}
    name = data.get('name')
    description = data.get('description', '')
    if not name:
        return jsonify({'error': 'Team name is required'}), 400
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('INSERT INTO teams (name, description, created_at) VALUES (?,?,?)',
                       (name, description, datetime.now().isoformat()))
        conn.commit()
        team_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': team_id, 'name': name, 'description': description}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Team name already exists'}), 400

@app.route('/api/teams/<int:team_id>', methods=['PUT'])
@require_role(['super_admin'])
def update_team(team_id):
    data = request.json or {}
    name = data.get('name')
    description = data.get('description', '')
    if not name:
        return jsonify({'error': 'Team name is required'}), 400
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('UPDATE teams SET name = ?, description = ? WHERE id = ?', (name, description, team_id))
        conn.commit()
        if conn.total_changes == 0:
            conn.close()
            return jsonify({'error': 'Team not found'}), 404
        conn.close()
        return jsonify({'id': team_id, 'name': name, 'description': description}), 200
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Team name already exists'}), 400

@app.route('/api/teams/<int:team_id>', methods=['DELETE'])
@require_role(['super_admin'])
def delete_team(team_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM teams WHERE id = ?', (team_id,))
    team = cursor.fetchone()
    if not team:
        conn.close()
        return jsonify({'error': 'Team not found'}), 404
    # Unassign users from this team
    cursor.execute('UPDATE users SET team_id = NULL WHERE team_id = ?', (team_id,))
    cursor.execute('DELETE FROM teams WHERE id = ?', (team_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Team deleted'}), 200

# ==================== ADMIN: USERS ====================

@app.route('/api/users', methods=['GET'])
@require_role(['super_admin'])
def list_users():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, role, team_id, active, created_at, updated_at FROM users ORDER BY username')
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(users), 200

@app.route('/api/users', methods=['POST'])
@require_role(['super_admin'])
def create_user():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')
    team_id = data.get('team_id')
    if not all([username, password, role]):
        return jsonify({'error': 'username, password, and role are required'}), 400
    if role not in ('admin', 'supervisor', 'super_admin'):
        return jsonify({'error': 'Invalid role'}), 400
    now = datetime.now().isoformat()
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO users (username, password_hash, role, team_id, active, created_at, updated_at)
            VALUES (?,?,?,?,1,?,?)
        ''', (username, generate_password_hash(password), role, team_id, now, now))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': user_id, 'username': username, 'role': role, 'team_id': team_id}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Username already exists'}), 400

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@require_role(['super_admin'])
def update_user(user_id):
    data = request.json or {}
    username = data.get('username')
    role = data.get('role')
    team_id = data.get('team_id')
    active = data.get('active', 1)

    if not username:
        return jsonify({'error': 'username is required'}), 400
    if role and role not in ('admin', 'supervisor', 'super_admin'):
        return jsonify({'error': 'Invalid role'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT username, role, team_id, active FROM users WHERE id = ?', (user_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({'error': 'User not found'}), 404

    new_role = role if role else existing['role']
    new_team_id = team_id if team_id != '' else None if team_id is None else team_id
    new_active = 1 if str(active) in ('1', 'true', 'True') else 0

    try:
        cursor.execute('''
            UPDATE users 
            SET username = ?, role = ?, team_id = ?, active = ?, updated_at = ?
            WHERE id = ?
        ''', (username, new_role, new_team_id, new_active, datetime.now().isoformat(), user_id))
        conn.commit()
        if conn.total_changes == 0:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        conn.close()
        return jsonify({'id': user_id, 'username': username, 'role': new_role, 'team_id': new_team_id, 'active': new_active}), 200
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Username already exists'}), 400

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@require_role(['super_admin'])
def delete_user(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT username FROM users WHERE id = ?', (user_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    username = row['username']
    cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
    conn.commit()
    conn.close()
    delete_sessions_for_username(username)
    return jsonify({'message': 'User deleted'}), 200

@app.route('/api/users/<username>/password', methods=['PUT'])
@require_role(['super_admin'])
def reset_password(username):
    data = request.json or {}
    new_password = data.get('password')
    if not new_password:
        return jsonify({'error': 'password is required'}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET password_hash = ?, updated_at = ? WHERE username = ?',
                   (generate_password_hash(new_password), datetime.now().isoformat(), username))
    conn.commit()
    updated = conn.total_changes
    conn.close()
    if updated == 0:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'message': 'Password updated'}), 200

# ==================== SETTINGS ====================

@app.route('/api/settings', methods=['GET'])
@require_auth
def get_settings():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT key, value FROM settings')
    settings = {row['key']: row['value'] for row in cursor.fetchall()}
    conn.close()
    return jsonify(settings), 200

@app.route('/api/settings/<key>', methods=['PUT'])
@require_role(['super_admin'])
def set_setting(key):
    data = request.json or {}
    value = data.get('value')
    if value is None:
        return jsonify({'error': 'value is required'}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)', (key, str(value)))
    conn.commit()
    conn.close()
    return jsonify({'key': key, 'value': value}), 200

# ==================== EMPLOYEE ENDPOINTS ====================

@app.route('/api/employees', methods=['GET'])
@require_auth
def get_employees():
    user = get_current_user()
    team_filter = request.args.get('team_id')

    conn = get_db()
    cursor = conn.cursor()

    if user['role'] == 'super_admin':
        if team_filter:
            cursor.execute('SELECT id, emp_id, name, team_id FROM employees WHERE team_id = ? ORDER BY name', (team_filter,))
        else:
            cursor.execute('SELECT id, emp_id, name, team_id FROM employees ORDER BY name')
    else:
        if not user.get('team_id'):
            conn.close()
            return jsonify({'error': 'User has no team assigned'}), 400
        cursor.execute('SELECT id, emp_id, name, team_id FROM employees WHERE team_id = ? ORDER BY name', (user['team_id'],))

    employees = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(employees), 200

@app.route('/api/employees/<emp_id>', methods=['GET'])
@require_auth
def get_employee(emp_id):
    user = get_current_user()
    team_filter = request.args.get('team_id')
    conn = get_db()
    cursor = conn.cursor()

    if user['role'] == 'super_admin' and team_filter:
        cursor.execute('SELECT id, emp_id, name, team_id FROM employees WHERE emp_id = ? AND team_id = ?', (emp_id, team_filter))
    else:
        if user['role'] != 'super_admin':
            if not user.get('team_id'):
                conn.close()
                return jsonify({'error': 'User has no team assigned'}), 400
            cursor.execute('SELECT id, emp_id, name, team_id FROM employees WHERE emp_id = ? AND team_id = ?', (emp_id, user['team_id']))
        else:
            cursor.execute('SELECT id, emp_id, name, team_id FROM employees WHERE emp_id = ?', (emp_id,))

    employee = cursor.fetchone()
    conn.close()
    
    if employee:
        return jsonify(dict(employee)), 200
    return jsonify({'error': 'Employee not found'}), 404

@app.route('/api/employees', methods=['POST'])
@require_auth
def add_employee():
    data = request.json
    emp_id = data.get('emp_id')
    name = data.get('name')
    team_id = data.get('team_id')

    user = get_current_user()
    if user['role'] != 'super_admin':
        team_id = user.get('team_id')
    if not team_id:
        return jsonify({'error': 'Team is required'}), 400

    if not emp_id or not name:
        return jsonify({'error': 'Employee ID and name are required'}), 400

    conn = get_db()
    cursor = conn.cursor()

    try:
        # Ensure uniqueness within team
        cursor.execute('SELECT COUNT(*) as count FROM employees WHERE emp_id = ? AND team_id = ?', (emp_id, team_id))
        if dict(cursor.fetchone())['count'] > 0:
            conn.close()
            return jsonify({'error': 'Employee ID already exists in this team'}), 400

        cursor.execute('INSERT INTO employees (emp_id, name, team_id) VALUES (?, ?, ?)', (emp_id, name, team_id))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': new_id, 'emp_id': emp_id, 'name': name, 'team_id': team_id}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Employee ID already exists'}), 400

@app.route('/api/employees/<emp_id>', methods=['PUT'])
@require_auth
def update_employee(emp_id):
    data = request.json
    new_emp_id = data.get('emp_id')
    new_name = data.get('name')
    team_id = data.get('team_id')
    user = get_current_user()

    if not new_emp_id or not new_name:
        return jsonify({'error': 'Employee ID and name are required'}), 400

    conn = get_db()
    cursor = conn.cursor()

    if user['role'] != 'super_admin':
        if not user.get('team_id'):
            conn.close()
            return jsonify({'error': 'User has no team assigned'}), 400
        team_id = user['team_id']
    elif not team_id:
        # allow super admin to keep current team if not provided
        cursor.execute('SELECT team_id FROM employees WHERE emp_id = ?', (emp_id,))
        row_team = cursor.fetchone()
        team_id = row_team['team_id'] if row_team else None

    if not team_id:
        conn.close()
        return jsonify({'error': 'Team is required'}), 400

    # Check if the new emp_id already exists (excluding current employee)
    if team_id:
        cursor.execute('SELECT COUNT(*) as count FROM employees WHERE emp_id = ? AND emp_id != ? AND team_id = ?',
                       (new_emp_id, emp_id, team_id))
    else:
        cursor.execute('SELECT COUNT(*) as count FROM employees WHERE emp_id = ? AND emp_id != ?',
                       (new_emp_id, emp_id))
    count = dict(cursor.fetchone())['count']
    if count > 0:
        conn.close()
        return jsonify({'error': 'Employee ID already exists'}), 400

    try:
        cursor.execute('UPDATE employees SET emp_id = ?, name = ?, team_id = ? WHERE emp_id = ?',
                   (new_emp_id, new_name, team_id, emp_id))
        cursor.execute('UPDATE roster SET emp_id = ?, team_id = ? WHERE emp_id = ? AND (team_id = ? OR team_id IS NULL)', (new_emp_id, team_id, emp_id, team_id))
        conn.commit()
        conn.close()
        return jsonify({'emp_id': new_emp_id, 'name': new_name}), 200
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Employee ID already exists'}), 400

@app.route('/api/employees/<emp_id>', methods=['DELETE'])
@require_auth
def delete_employee(emp_id):
    user = get_current_user()
    conn = get_db()
    cursor = conn.cursor()

    if user['role'] == 'super_admin':
        team_filter = request.args.get('team_id')
        if not team_filter:
            conn.close()
            return jsonify({'error': 'Team is required'}), 400
        cursor.execute('DELETE FROM roster WHERE emp_id = ? AND team_id = ?', (emp_id, team_filter))
        cursor.execute('DELETE FROM employees WHERE emp_id = ? AND team_id = ?', (emp_id, team_filter))
    else:
        if not user.get('team_id'):
            conn.close()
            return jsonify({'error': 'User has no team assigned'}), 400
        cursor.execute('DELETE FROM roster WHERE emp_id = ? AND team_id = ?', (emp_id, user['team_id']))
        cursor.execute('DELETE FROM employees WHERE emp_id = ? AND team_id = ?', (emp_id, user['team_id']))

    conn.commit()
    conn.close()
    return jsonify({'message': 'Employee deleted successfully'}), 200

@app.route('/api/employees/check/<emp_id>', methods=['GET'])
@require_auth
def check_employee_id(emp_id):
    user = get_current_user()
    team_filter = request.args.get('team_id')
    conn = get_db()
    cursor = conn.cursor()

    if user['role'] == 'super_admin':
        if not team_filter:
            conn.close()
            return jsonify({'error': 'Team is required'}), 400
        cursor.execute('SELECT COUNT(*) as count FROM employees WHERE emp_id = ? AND team_id = ?', (emp_id, team_filter))
    else:
        if not user.get('team_id'):
            conn.close()
            return jsonify({'error': 'User has no team assigned'}), 400
        cursor.execute('SELECT COUNT(*) as count FROM employees WHERE emp_id = ? AND team_id = ?', (emp_id, user['team_id']))

    count = dict(cursor.fetchone())['count']
    conn.close()
    return jsonify({'exists': count > 0}), 200

# ==================== SHIFT ENDPOINTS ====================

@app.route('/api/shifts', methods=['GET'])
@require_auth
def get_shifts():
    shift_type = request.args.get('type')  # 'full', 'half', or None for all
    
    conn = get_db()
    cursor = conn.cursor()
    
    if shift_type:
        cursor.execute('SELECT * FROM shifts WHERE type = ? ORDER BY shift_name', (shift_type,))
    else:
        cursor.execute('SELECT * FROM shifts ORDER BY shift_name')
    
    shifts = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(shifts), 200

@app.route('/api/shifts/<int:shift_id>', methods=['GET'])
@require_auth
def get_shift(shift_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM shifts WHERE id = ?', (shift_id,))
    shift = cursor.fetchone()
    conn.close()
    
    if shift:
        return jsonify(dict(shift)), 200
    return jsonify({'error': 'Shift not found'}), 404

@app.route('/api/shifts', methods=['POST'])
@require_auth
def add_shift():
    data = request.json
    shift_name = data.get('shift_name')
    shift_code = data.get('shift_code')
    duration = data.get('duration')
    shift_type = data.get('type')
    shift_timing = data.get('shift_timing')

    if not all([shift_name, shift_code, duration, shift_type, shift_timing]):
        return jsonify({'error': 'All fields are required'}), 400

    conn = get_db()
    cursor = conn.cursor()

    # Check if shift_code already exists
    cursor.execute('SELECT COUNT(*) as count FROM shifts WHERE shift_code = ?', (shift_code,))
    count = dict(cursor.fetchone())['count']
    if count > 0:
        conn.close()
        return jsonify({'error': 'Shift code already exists'}), 400

    try:
        cursor.execute('''
            INSERT INTO shifts (shift_name, shift_code, duration, type, shift_timing)
            VALUES (?, ?, ?, ?, ?)
        ''', (shift_name, shift_code, duration, shift_type, shift_timing))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': new_id, 'shift_name': shift_name, 'shift_code': shift_code,
                       'duration': duration, 'type': shift_type, 'shift_timing': shift_timing}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Shift code already exists'}), 400

@app.route('/api/shifts/<int:shift_id>', methods=['PUT'])
@require_auth
def update_shift(shift_id):
    data = request.json
    shift_name = data.get('shift_name')
    shift_code = data.get('shift_code')
    duration = data.get('duration')
    shift_type = data.get('type')
    shift_timing = data.get('shift_timing')

    if not all([shift_name, shift_code, duration, shift_type, shift_timing]):
        return jsonify({'error': 'All fields are required'}), 400

    conn = get_db()
    cursor = conn.cursor()

    # Check if the new shift_code already exists (excluding current shift)
    cursor.execute('SELECT COUNT(*) as count FROM shifts WHERE shift_code = ? AND id != ?',
                   (shift_code, shift_id))
    count = dict(cursor.fetchone())['count']
    if count > 0:
        conn.close()
        return jsonify({'error': 'Shift code already exists'}), 400

    try:
        cursor.execute('''
            UPDATE shifts 
            SET shift_name = ?, shift_code = ?, duration = ?, type = ?, shift_timing = ?
            WHERE id = ?
        ''', (shift_name, shift_code, duration, shift_type, shift_timing, shift_id))
        conn.commit()
        conn.close()
        return jsonify({'id': shift_id, 'shift_name': shift_name, 'shift_code': shift_code,
                       'duration': duration, 'type': shift_type, 'shift_timing': shift_timing}), 200
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Shift code already exists'}), 400

@app.route('/api/shifts/<int:shift_id>', methods=['DELETE'])
@require_auth
def delete_shift(shift_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM shifts WHERE id = ?', (shift_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Shift deleted successfully'}), 200

# ==================== ROSTER ENDPOINTS ====================

@app.route('/api/roster', methods=['GET'])
@require_auth
def get_roster():
    month_filter = request.args.get('month')  # Format: YYYY-MM
    show_all = request.args.get('all') == 'true'
    team_filter = request.args.get('team_id')
    user = get_current_user()
    if user['role'] != 'super_admin':
        team_filter = user.get('team_id')
    if not team_filter:
        return jsonify({'error': 'Team is required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()

    # Get dates in roster based on filter
    if show_all:
        cursor.execute('SELECT DISTINCT date FROM roster WHERE team_id = ? ORDER BY date', (team_filter,))
    elif month_filter:
        cursor.execute('''
            SELECT DISTINCT date FROM roster 
            WHERE date LIKE ? AND team_id = ?
            ORDER BY date
        ''', (f"{month_filter}%", team_filter))
    else:
        cursor.execute('''
            SELECT DISTINCT date FROM roster 
            WHERE team_id = ? AND strftime('%Y-%m', date) = (
                SELECT strftime('%Y-%m', MAX(date)) FROM roster WHERE team_id = ?
            )
            ORDER BY date
        ''', (team_filter, team_filter))
    
    dates = [row['date'] for row in cursor.fetchall()]

    if not dates:
        conn.close()
        return jsonify({'dates': [], 'roster': [], 'available_months': []}), 200

    # Get all available months for filtering
    cursor.execute('''
        SELECT DISTINCT strftime('%Y-%m', date) as month 
        FROM roster 
        WHERE team_id = ?
        ORDER BY month DESC
    ''', (team_filter,))
    available_months = [row['month'] for row in cursor.fetchall()]

    # Get all employees
    cursor.execute('SELECT emp_id, name FROM employees WHERE team_id = ? ORDER BY name', (team_filter,))
    employees = cursor.fetchall()

    # Create roster matrix
    roster_data = []
    for employee in employees:
        emp_id = employee['emp_id']
        emp_name = employee['name']
        shifts = []
        
        for date in dates:
            cursor.execute('''
                SELECT shift, status 
                FROM roster 
                WHERE emp_id = ? AND date = ? AND team_id = ?
            ''', (emp_id, date, team_filter))
            result = cursor.fetchone()
            if result:
                shifts.append({
                    'date': date,
                    'shift': result['shift'],
                    'status': result['status']
                })
            else:
                shifts.append({
                    'date': date,
                    'shift': '',
                    'status': ''
                })
        
        # Include all employees, even without roster entries
        roster_data.append({
            'emp_id': emp_id,
            'name': emp_name,
            'shifts': shifts
        })

    conn.close()
    return jsonify({
        'dates': dates, 
        'roster': roster_data,
        'available_months': available_months
    }), 200

@app.route('/api/roster', methods=['POST'])
@require_auth
def create_roster():
    data = request.json
    emp_id = data.get('emp_id')
    month = data.get('month')  # Format: YYYY-MM
    default_shift_id = data.get('shift_id')
    off_dates = data.get('off_dates', [])
    half_dates = data.get('half_dates', [])
    team_id = data.get('team_id')

    user = get_current_user()
    if user['role'] != 'super_admin':
        team_id = user.get('team_id')
    if not team_id:
        return jsonify({'error': 'Team is required'}), 400

    if not all([emp_id, month, default_shift_id]):
        return jsonify({'error': 'Employee ID, month, and default shift are required'}), 400

    conn = get_db()
    cursor = conn.cursor()

    # Get default shift details
    cursor.execute('SELECT shift_name, shift_code FROM shifts WHERE id = ?', (default_shift_id,))
    default_shift = cursor.fetchone()
    if not default_shift:
        conn.close()
        return jsonify({'error': 'Invalid shift ID'}), 400
    
    default_shift_display = f"{default_shift['shift_name']} ({default_shift['shift_code']})"

    # Get half shift details
    half_shift_map = {}
    for half_date in half_dates:
        shift_id = half_date.get('shift_id')
        cursor.execute('SELECT shift_name, shift_code FROM shifts WHERE id = ?', (shift_id,))
        shift = cursor.fetchone()
        if shift:
            half_shift_map[half_date['date']] = f"{shift['shift_name']} ({shift['shift_code']})"

    # Ensure employee belongs to team
    cursor.execute('SELECT emp_id, name, team_id FROM employees WHERE emp_id = ? AND team_id = ?', (emp_id, team_id))
    employee = cursor.fetchone()
    if not employee:
        conn.close()
        return jsonify({'error': 'Employee not found in team'}), 400

    # Generate all dates for the month
    start_date = datetime.strptime(f"{month}-01", '%Y-%m-%d')
    next_month = start_date.replace(day=28) + timedelta(days=4)
    end_date = next_month - timedelta(days=next_month.day)
    all_dates = [(start_date + timedelta(days=i)).strftime('%Y-%m-%d')
                 for i in range((end_date - start_date).days + 1)]

    # Delete existing roster for this employee and month within team
    cursor.execute('DELETE FROM roster WHERE emp_id = ? AND team_id = ? AND date LIKE ?', (emp_id, team_id, f"{month}%"))

    # Insert roster entries
    for date in all_dates:
        status = 'Full Day'
        shift_display = default_shift_display

        if date in off_dates:
            status = 'OFF'
            shift_display = 'N/A'
        elif date in half_shift_map:
            status = 'Half Day'
            shift_display = half_shift_map[date]

        cursor.execute('''
            INSERT INTO roster (emp_id, date, shift, status, team_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (emp_id, date, shift_display, status, team_id))

    conn.commit()
    conn.close()
    return jsonify({'message': 'Roster created successfully'}), 201

@app.route('/api/roster/<emp_id>/<date>', methods=['PUT'])
@require_auth
def update_roster_entry(emp_id, date):
    data = request.json
    shift = data.get('shift')
    status = data.get('status')
    team_id = data.get('team_id')
    user = get_current_user()
    if user['role'] != 'super_admin':
        team_id = user.get('team_id')
    if not team_id:
        return jsonify({'error': 'Team is required'}), 400

    if not all([shift, status]):
        return jsonify({'error': 'Shift and status are required'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM roster WHERE emp_id = ? AND date = ? AND team_id = ?', (emp_id, date, team_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Roster entry not found for team'}), 404
    cursor.execute('''
        UPDATE roster 
        SET shift = ?, status = ?
        WHERE emp_id = ? AND date = ? AND team_id = ?
    ''', (shift, status, emp_id, date, team_id))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Roster entry updated successfully'}), 200

@app.route('/api/roster/<emp_id>/<date>', methods=['GET'])
@require_auth
def get_roster_entry(emp_id, date):
    team_id = request.args.get('team_id')
    user = get_current_user()
    if user['role'] != 'super_admin':
        team_id = user.get('team_id')
    if not team_id:
        return jsonify({'error': 'Team is required'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT shift, status FROM roster WHERE emp_id = ? AND date = ? AND team_id = ?', (emp_id, date, team_id))
    entry = cursor.fetchone()
    conn.close()
    
    if entry:
        return jsonify(dict(entry)), 200
    return jsonify({'error': 'Roster entry not found'}), 404

@app.route('/api/roster/employee', methods=['DELETE'])
@require_auth
def delete_employee_roster():
    emp_id = request.args.get('emp_id')
    month = request.args.get('month')  # Format: YYYY-MM
    team_id = request.args.get('team_id')
    user = get_current_user()
    
    if user['role'] != 'super_admin':
        team_id = user.get('team_id')
    
    if not all([emp_id, month, team_id]):
        return jsonify({'error': 'emp_id, month, and team_id are required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Delete all roster entries for this employee in the specified month
    cursor.execute('''
        DELETE FROM roster 
        WHERE emp_id = ? AND team_id = ? AND strftime('%Y-%m', date) = ?
    ''', (emp_id, team_id, month))
    
    conn.commit()
    deleted_count = cursor.rowcount
    conn.close()
    
    return jsonify({'message': f'Deleted {deleted_count} roster entries'}), 200

@app.route('/api/roster/export', methods=['GET'])
@require_auth
def export_roster():
    month_filter = request.args.get('month')  # Format: YYYY-MM
    show_all = request.args.get('all') == 'true'
    team_filter = request.args.get('team_id')
    user = get_current_user()
    if user['role'] != 'super_admin':
        team_filter = user.get('team_id')
    if not team_filter:
        return jsonify({'error': 'Team is required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get dates based on filter (same logic as get_roster)
    if show_all:
        cursor.execute('SELECT DISTINCT date FROM roster WHERE team_id = ? ORDER BY date DESC', (team_filter,))
    elif month_filter:
        cursor.execute('''
            SELECT DISTINCT date FROM roster 
            WHERE date LIKE ? AND team_id = ?
            ORDER BY date
        ''', (f"{month_filter}%", team_filter))
    else:
        # Default: show last month's roster
        cursor.execute('''
            SELECT DISTINCT date FROM roster 
            WHERE team_id = ? AND strftime('%Y-%m', date) = (
                SELECT strftime('%Y-%m', MAX(date)) FROM roster WHERE team_id = ?
            )
            ORDER BY date
        ''', (team_filter, team_filter))
    
    dates = [row['date'] for row in cursor.fetchall()]
    
    # Get all employees
    cursor.execute('SELECT emp_id, name FROM employees WHERE team_id = ? ORDER BY name', (team_filter,))
    employees = cursor.fetchall()
    
    # Build a mapping from display text to shift CODE for lookups
    # Display format stored in roster is: "<shift_name> (<shift_code>)"
    cursor.execute('SELECT id, shift_name, shift_code FROM shifts')
    shift_rows = cursor.fetchall()
    shift_display_to_code = {
        f"{row['shift_name']} ({row['shift_code']})": row['shift_code'] for row in shift_rows
    }

    filename = 'roster_export.csv'
    with open(filename, 'w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        # Required columns:
        # 1: Emp ID
        # 2: Date (YYYY-MM-DD)
        # 3: Shift Code
        # 4: Is/OFF (1 if OFF else 0)
        writer.writerow(['Emp ID', 'Date', 'Shift Code', 'Is/OFF'])
        
        # Export data for all employees and all dates in filter
        if not dates:
            pass
        else:
            # Ensure ascending order and compute context start
            dates_sorted = sorted(dates)
            min_date = dates_sorted[0]

            for employee in employees:
                # Initialize last full-day shift code with history before range
                cursor.execute('''
                    SELECT shift FROM roster 
                    WHERE emp_id = ? AND date < ? AND status = 'Full Day' AND team_id = ?
                    ORDER BY date DESC LIMIT 1
                ''', (employee['emp_id'], min_date, team_filter))
                prev_full = cursor.fetchone()
                last_full_shift_code = ''
                if prev_full and prev_full['shift']:
                    last_full_shift_code = shift_display_to_code.get(prev_full['shift'], '')

                for date in dates_sorted:
                    cursor.execute('''
                        SELECT shift, status 
                        FROM roster 
                        WHERE emp_id = ? AND date = ? AND team_id = ?
                    ''', (employee['emp_id'], date, team_filter))
                    result = cursor.fetchone()
                    
                    emp_id_val = employee['emp_id']
                    date_val = date

                    if result:
                        status = (result['status'] or '').upper()
                        shift_text = result['shift'] or ''

                        if status == 'FULL DAY':
                            shift_code_val = shift_display_to_code.get(shift_text, '')
                            # Update last full-day shift code tracker
                            last_full_shift_code = shift_code_val or last_full_shift_code
                            is_off = 0
                        elif status == 'OFF':
                            shift_code_val = last_full_shift_code
                            is_off = 1
                        else:
                            # Half Day or other statuses
                            shift_code_val = shift_display_to_code.get(shift_text, '')
                            is_off = 0

                        writer.writerow([
                            emp_id_val,
                            date_val,
                            shift_code_val,
                            is_off
                        ])
                    else:
                        # No roster entry: shift code blank, not off
                        writer.writerow([
                            emp_id_val,
                            date_val,
                            '',
                            0
                        ])
    
    conn.close()
    return send_file(filename, as_attachment=True, download_name='roster_export.csv')

# ==================== STATS ENDPOINT ====================

@app.route('/api/stats', methods=['GET'])
@require_auth
def get_stats():
    team_filter = request.args.get('team_id')
    user = get_current_user()
    if user['role'] != 'super_admin':
        team_filter = user.get('team_id')

    conn = get_db()
    cursor = conn.cursor()
    
    if team_filter:
        cursor.execute('SELECT COUNT(*) as count FROM employees WHERE team_id = ?', (team_filter,))
        employee_count = dict(cursor.fetchone())['count']
        cursor.execute('SELECT COUNT(DISTINCT emp_id) as count FROM roster WHERE team_id = ?', (team_filter,))
        rostered_employees = dict(cursor.fetchone())['count']
    else:
        cursor.execute('SELECT COUNT(*) as count FROM employees')
        employee_count = dict(cursor.fetchone())['count']
        cursor.execute('SELECT COUNT(DISTINCT emp_id) as count FROM roster')
        rostered_employees = dict(cursor.fetchone())['count']

    cursor.execute('SELECT COUNT(*) as count FROM shifts')
    shift_count = dict(cursor.fetchone())['count']
    
    conn.close()
    
    return jsonify({
        'total_employees': employee_count,
        'total_shifts': shift_count,
        'rostered_employees': rostered_employees
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
