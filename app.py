from flask import Flask, render_template, request, redirect, url_for, session, send_file
import sqlite3
from datetime import datetime, timedelta
import csv
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key'


# Initialize SQLite database
def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # Create tables
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
            type TEXT CHECK(type IN ('full', 'half'))
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


@app.route('/')
def index():
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if username == 'admin' and password == 'password':
            session['logged_in'] = True
            return redirect(url_for('dashboard'))
        else:
            return "Invalid credentials"
    return render_template('login.html')


@app.route('/dashboard')
def dashboard():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('dashboard.html')


@app.route('/add_employee', methods=['GET', 'POST'])
def add_employee():
    if not session.get('logged_in'):
        return redirect(url_for('login'))

    if request.method == 'POST':
        emp_id = request.form['emp_id']
        name = request.form['name']

        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('INSERT INTO employees (emp_id, name) VALUES (?, ?)', (emp_id, name))
        conn.commit()
        conn.close()
        return redirect(url_for('dashboard'))
    return render_template('add_employee.html')


@app.route('/add_shift', methods=['GET', 'POST'])
def add_shift():
    if not session.get('logged_in'):
        return redirect(url_for('login'))

    if request.method == 'POST':
        shift_type = request.form['type']
        duration = int(request.form['duration'])
        shift_name = request.form['shift_name']
        shift_code = request.form['shift_code']

        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO shifts (shift_name, shift_code, duration, type)
            VALUES (?, ?, ?, ?)
        ''', (shift_name, shift_code, duration, shift_type))
        conn.commit()
        conn.close()
        return redirect(url_for('dashboard'))
    return render_template('add_shift.html')


@app.route('/create_roster', methods=['GET', 'POST'])
def create_roster():
    if not session.get('logged_in'):
        return redirect(url_for('login'))

    if request.method == 'POST':
        emp_id = request.form['emp_id']
        month = request.form['month']
        default_shift_id = request.form['shift']
        total_off = int(request.form['total_off'])
        total_half = int(request.form['total_half'])

        off_dates = request.form.getlist('off_dates')
        half_dates = request.form.getlist('half_dates')
        half_shifts = request.form.getlist('half_shifts')

        # Validation
        if len(off_dates) != total_off or len(half_dates) != total_half:
            return "Date count mismatch"

        # Get default shift details
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('SELECT shift_name, shift_code FROM shifts WHERE id = ?', (default_shift_id,))
        default_shift = cursor.fetchone()
        default_shift_display = f"{default_shift[0]} ({default_shift[1]})" if default_shift else ''

        # Get half shift details
        half_shift_details = {}
        for shift_id in half_shifts:
            cursor.execute('SELECT shift_name, shift_code FROM shifts WHERE id = ?', (shift_id,))
            half_shift_details[shift_id] = cursor.fetchone()

        # Generate all dates
        start_date = datetime.strptime(f"{month}-01", '%Y-%m-%d')
        next_month = start_date.replace(day=28) + timedelta(days=4)
        end_date = next_month - timedelta(days=next_month.day)
        all_dates = [(start_date + timedelta(days=i)).strftime('%Y-%m-%d')
                     for i in range((end_date - start_date).days + 1)]

        # Insert roster entries
        for date in all_dates:
            status = 'Full Day'
            shift_display = default_shift_display

            if date in off_dates:
                status = 'OFF'
                shift_display = 'N/A'
            elif date in half_dates:
                status = 'Half Day'
                idx = half_dates.index(date)
                shift_id = half_shifts[idx]
                shift = half_shift_details.get(shift_id, ('N/A', 'N/A'))
                shift_display = f"{shift[0]} ({shift[1]})"

            cursor.execute('''
                INSERT INTO roster (emp_id, date, shift, status)
                VALUES (?, ?, ?, ?)
            ''', (emp_id, date, shift_display, status))

        conn.commit()
        conn.close()
        return redirect(url_for('roster_view'))

    # Get employees and shifts for dropdowns
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT emp_id, name FROM employees')
    employees = cursor.fetchall()

    # Separate full and half day shifts
    cursor.execute('SELECT * FROM shifts WHERE type = "full"')
    full_day_shifts = cursor.fetchall()
    cursor.execute('SELECT * FROM shifts WHERE type = "half"')
    half_day_shifts = cursor.fetchall()

    conn.close()

    return render_template('create_roster.html',
                           employees=employees,
                           full_day_shifts=full_day_shifts,
                           half_day_shifts=half_day_shifts)

@app.route('/roster_view')
def roster_view():
    if not session.get('logged_in'):
        return redirect(url_for('login'))

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # Get all dates in roster
    cursor.execute('SELECT DISTINCT date FROM roster ORDER BY date')
    dates = [row[0] for row in cursor.fetchall()]

    # Get all employees
    cursor.execute('SELECT emp_id FROM employees')
    employees = [row[0] for row in cursor.fetchall()]

    # Create roster matrix
    roster = []
    for emp_id in employees:
        row = [emp_id]
        for date in dates:
            cursor.execute('''
                SELECT shift || ' (' || status || ')' 
                FROM roster 
                WHERE emp_id = ? AND date = ?
            ''', (emp_id, date))
            result = cursor.fetchone()
            row.append(result[0] if result else '')
        roster.append(row)

    conn.close()
    return render_template('roster_view.html', dates=dates, roster=roster)


@app.route('/export_roster')
def export_roster():
    if not session.get('logged_in'):
        return redirect(url_for('login'))

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT e.name, r.emp_id, r.date, r.shift, r.status 
        FROM roster r
        JOIN employees e ON r.emp_id = e.emp_id
        ORDER BY e.name, r.date
    ''')
    rows = cursor.fetchall()
    conn.close()

    filename = 'roster.csv'
    with open(filename, 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['Employee Name', 'Employee ID', 'Date', 'Shift', 'Status'])
        writer.writerows(rows)

    return send_file(filename, as_attachment=True)


@app.route('/edit_shift/<emp_id>/<date>', methods=['GET', 'POST'])
def edit_shift(emp_id, date):
    if not session.get('logged_in'):
        return redirect(url_for('login'))

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    if request.method == 'POST':
        new_shift = request.form['shift']
        new_status = request.form['status']

        cursor.execute('''
            UPDATE roster 
            SET shift = ?, status = ?
            WHERE emp_id = ? AND date = ?
        ''', (new_shift, new_status, emp_id, date))

        conn.commit()
        conn.close()
        return redirect(url_for('roster_view'))

    # Get current shift data
    cursor.execute('''
        SELECT shift, status 
        FROM roster 
        WHERE emp_id = ? AND date = ?
    ''', (emp_id, date))
    current_data = cursor.fetchone()

    # Get available shifts
    cursor.execute('SELECT * FROM shifts')
    shifts = cursor.fetchall()

    conn.close()

    return render_template('edit_shift.html',
                           emp_id=emp_id,
                           date=date,
                           current_data=current_data,
                           shifts=shifts)

if __name__ == '__main__':
    #app.run(debug=True)
    app.run(host='0.0.0.0', port=5000, debug=True)