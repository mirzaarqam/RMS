# app.py
from flask import Flask, render_template, request, redirect, url_for, session
import sqlite3

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
            duration TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS roster (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            emp_id TEXT,
            date TEXT,
            shift TEXT,
            status TEXT  -- 'OFF', 'Half Day', or 'Full Day'
        )
    ''')

    conn.commit()
    conn.close()

init_db()

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        # Simple authentication (replace with proper auth later)
        if username == 'admin' and password == 'password':
            session['logged_in'] = True
            return redirect(url_for('dashboard'))
        else:
            return "Invalid credentials"
    return render_template('login.html')

@app.route('/add_employee', methods=['GET', 'POST'])
def add_employee():
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

@app.route('/export_roster')
def export_roster():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM roster')
    rows = cursor.fetchall()

    # Write to CSV
    import csv
    with open('roster.csv', 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['ID', 'Employee ID', 'Date', 'Shift', 'Status'])
        writer.writerows(rows)

    conn.close()

    return "Roster exported successfully!"

@app.route('/add_shift', methods=['GET', 'POST'])
def add_shift():
    if request.method == 'POST':
        shift_name = request.form['shift_name']
        shift_code = request.form['shift_code']
        duration = request.form['duration']

        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('INSERT INTO shifts (shift_name, shift_code, duration) VALUES (?, ?, ?)',
                       (shift_name, shift_code, duration))
        conn.commit()
        conn.close()

        return redirect(url_for('dashboard'))

    return render_template('add_shift.html')

@app.route('/create_roster', methods=['GET', 'POST'])
def create_roster():
    if request.method == 'POST':
        emp_id = request.form['emp_id']
        month = request.form['month']
        shift = request.form['shift']
        off_day = 'OFF' if 'off_day' in request.form else ''
        half_day = 'Half Day' if 'half_day' in request.form else ''

        status = off_day or half_day or 'Full Day'

        # Generate dates for the selected month
        from datetime import datetime
        start_date = datetime.strptime(month + '-01', '%Y-%m-%d')
        if start_date.month == 12:
            next_month = start_date.replace(year=start_date.year + 1, month=1)
        else:
            next_month = start_date.replace(month=start_date.month + 1)
        dates = [(start_date + timedelta(days=i)).strftime('%Y-%m-%d')
                 for i in range((next_month - start_date).days)]

        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        for date in dates:
            cursor.execute('INSERT INTO roster (emp_id, date, shift, status) VALUES (?, ?, ?, ?)',
                           (emp_id, date, shift, status))
        conn.commit()
        conn.close()

        return redirect(url_for('roster_view'))

    # Fetch employees and shifts for dropdowns
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT emp_id, name FROM employees')
    employees = cursor.fetchall()
    cursor.execute('SELECT id, shift_name, shift_code FROM shifts')
    shifts = cursor.fetchall()
    conn.close()

    return render_template('create_roster.html', employees=employees, shifts=shifts)

@app.route('/roster_view')
def roster_view():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # Fetch unique dates
    cursor.execute('SELECT DISTINCT date FROM roster ORDER BY date')
    dates = [row[0] for row in cursor.fetchall()]

    # Fetch roster data
    cursor.execute('''
        SELECT emp_id, GROUP_CONCAT(shift || ' (' || status || ')', ', ') AS shifts
        FROM roster
        GROUP BY emp_id
    ''')
    roster_data = cursor.fetchall()

    conn.close()

    # Format roster data into a table
    roster = []
    for row in roster_data:
        emp_id = row[0]
        shifts = row[1].split(', ')
        roster.append([emp_id] + shifts)

    return render_template('roster_view.html', dates=dates, roster=roster)

