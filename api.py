from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta
import csv
import os
from functools import wraps

app = Flask(__name__)
CORS(app)
app.secret_key = 'your_secret_key'

# Session store (in production, use Redis or similar)
sessions = {}

# Initialize SQLite database
def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            emp_id TEXT UNIQUE,
            name TEXT
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
            status TEXT
        )
    ''')

    conn.commit()
    conn.close()

init_db()

# Authentication decorator
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or token not in sessions:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Helper function to get db connection
def get_db():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

# ==================== AUTH ENDPOINTS ====================

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if username == 'admin' and password == 'password':
        token = f"token_{datetime.now().timestamp()}"
        sessions[token] = {'username': username}
        return jsonify({'token': token, 'username': username}), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
@require_auth
def logout():
    token = request.headers.get('Authorization')
    if token in sessions:
        del sessions[token]
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/validate', methods=['GET'])
@require_auth
def validate():
    return jsonify({'valid': True}), 200

# ==================== EMPLOYEE ENDPOINTS ====================

@app.route('/api/employees', methods=['GET'])
@require_auth
def get_employees():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, emp_id, name FROM employees ORDER BY name')
    employees = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(employees), 200

@app.route('/api/employees/<emp_id>', methods=['GET'])
@require_auth
def get_employee(emp_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, emp_id, name FROM employees WHERE emp_id = ?', (emp_id,))
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

    if not emp_id or not name:
        return jsonify({'error': 'Employee ID and name are required'}), 400

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute('INSERT INTO employees (emp_id, name) VALUES (?, ?)', (emp_id, name))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': new_id, 'emp_id': emp_id, 'name': name}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Employee ID already exists'}), 400

@app.route('/api/employees/<emp_id>', methods=['PUT'])
@require_auth
def update_employee(emp_id):
    data = request.json
    new_emp_id = data.get('emp_id')
    new_name = data.get('name')

    if not new_emp_id or not new_name:
        return jsonify({'error': 'Employee ID and name are required'}), 400

    conn = get_db()
    cursor = conn.cursor()

    # Check if the new emp_id already exists (excluding current employee)
    cursor.execute('SELECT COUNT(*) as count FROM employees WHERE emp_id = ? AND emp_id != ?',
                   (new_emp_id, emp_id))
    count = dict(cursor.fetchone())['count']
    if count > 0:
        conn.close()
        return jsonify({'error': 'Employee ID already exists'}), 400

    try:
        cursor.execute('UPDATE employees SET emp_id = ?, name = ? WHERE emp_id = ?',
                       (new_emp_id, new_name, emp_id))
        cursor.execute('UPDATE roster SET emp_id = ? WHERE emp_id = ?', (new_emp_id, emp_id))
        conn.commit()
        conn.close()
        return jsonify({'emp_id': new_emp_id, 'name': new_name}), 200
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Employee ID already exists'}), 400

@app.route('/api/employees/<emp_id>', methods=['DELETE'])
@require_auth
def delete_employee(emp_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM employees WHERE emp_id = ?', (emp_id,))
    cursor.execute('DELETE FROM roster WHERE emp_id = ?', (emp_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Employee deleted successfully'}), 200

@app.route('/api/employees/check/<emp_id>', methods=['GET'])
@require_auth
def check_employee_id(emp_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) as count FROM employees WHERE emp_id = ?', (emp_id,))
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
    
    conn = get_db()
    cursor = conn.cursor()

    # Get dates in roster based on filter
    if show_all:
        cursor.execute('SELECT DISTINCT date FROM roster ORDER BY date')
    elif month_filter:
        cursor.execute('''
            SELECT DISTINCT date FROM roster 
            WHERE date LIKE ? 
            ORDER BY date
        ''', (f"{month_filter}%",))
    else:
        # Default: show last month's roster
        cursor.execute('''
            SELECT DISTINCT date FROM roster 
            WHERE strftime('%Y-%m', date) = (
                SELECT strftime('%Y-%m', MAX(date)) FROM roster
            )
            ORDER BY date
        ''')
    
    dates = [row['date'] for row in cursor.fetchall()]

    if not dates:
        conn.close()
        return jsonify({'dates': [], 'roster': [], 'available_months': []}), 200

    # Get all available months for filtering
    cursor.execute('''
        SELECT DISTINCT strftime('%Y-%m', date) as month 
        FROM roster 
        ORDER BY month DESC
    ''')
    available_months = [row['month'] for row in cursor.fetchall()]

    # Get all employees
    cursor.execute('SELECT emp_id, name FROM employees ORDER BY name')
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
                WHERE emp_id = ? AND date = ?
            ''', (emp_id, date))
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

    # Generate all dates for the month
    start_date = datetime.strptime(f"{month}-01", '%Y-%m-%d')
    next_month = start_date.replace(day=28) + timedelta(days=4)
    end_date = next_month - timedelta(days=next_month.day)
    all_dates = [(start_date + timedelta(days=i)).strftime('%Y-%m-%d')
                 for i in range((end_date - start_date).days + 1)]

    # Delete existing roster for this employee and month
    cursor.execute('DELETE FROM roster WHERE emp_id = ? AND date LIKE ?', (emp_id, f"{month}%"))

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
            INSERT INTO roster (emp_id, date, shift, status)
            VALUES (?, ?, ?, ?)
        ''', (emp_id, date, shift_display, status))

    conn.commit()
    conn.close()
    return jsonify({'message': 'Roster created successfully'}), 201

@app.route('/api/roster/<emp_id>/<date>', methods=['PUT'])
@require_auth
def update_roster_entry(emp_id, date):
    data = request.json
    shift = data.get('shift')
    status = data.get('status')

    if not all([shift, status]):
        return jsonify({'error': 'Shift and status are required'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE roster 
        SET shift = ?, status = ?
        WHERE emp_id = ? AND date = ?
    ''', (shift, status, emp_id, date))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Roster entry updated successfully'}), 200

@app.route('/api/roster/<emp_id>/<date>', methods=['GET'])
@require_auth
def get_roster_entry(emp_id, date):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT shift, status FROM roster WHERE emp_id = ? AND date = ?', (emp_id, date))
    entry = cursor.fetchone()
    conn.close()
    
    if entry:
        return jsonify(dict(entry)), 200
    return jsonify({'error': 'Roster entry not found'}), 404

@app.route('/api/roster/export', methods=['GET'])
@require_auth
def export_roster():
    month_filter = request.args.get('month')  # Format: YYYY-MM
    show_all = request.args.get('all') == 'true'
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get dates based on filter (same logic as get_roster)
    if show_all:
        cursor.execute('SELECT DISTINCT date FROM roster ORDER BY date DESC')
    elif month_filter:
        cursor.execute('''
            SELECT DISTINCT date FROM roster 
            WHERE date LIKE ? 
            ORDER BY date
        ''', (f"{month_filter}%",))
    else:
        # Default: show last month's roster
        cursor.execute('''
            SELECT DISTINCT date FROM roster 
            WHERE strftime('%Y-%m', date) = (
                SELECT strftime('%Y-%m', MAX(date)) FROM roster
            )
            ORDER BY date
        ''')
    
    dates = [row['date'] for row in cursor.fetchall()]
    
    # Get all employees
    cursor.execute('SELECT emp_id, name FROM employees ORDER BY name')
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
                    WHERE emp_id = ? AND date < ? AND status = 'Full Day'
                    ORDER BY date DESC LIMIT 1
                ''', (employee['emp_id'], min_date))
                prev_full = cursor.fetchone()
                last_full_shift_code = ''
                if prev_full and prev_full['shift']:
                    last_full_shift_code = shift_display_to_code.get(prev_full['shift'], '')

                for date in dates_sorted:
                    cursor.execute('''
                        SELECT shift, status 
                        FROM roster 
                        WHERE emp_id = ? AND date = ?
                    ''', (employee['emp_id'], date))
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
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) as count FROM employees')
    employee_count = dict(cursor.fetchone())['count']
    
    cursor.execute('SELECT COUNT(*) as count FROM shifts')
    shift_count = dict(cursor.fetchone())['count']
    
    cursor.execute('SELECT COUNT(DISTINCT emp_id) as count FROM roster')
    rostered_employees = dict(cursor.fetchone())['count']
    
    conn.close()
    
    return jsonify({
        'total_employees': employee_count,
        'total_shifts': shift_count,
        'rostered_employees': rostered_employees
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
