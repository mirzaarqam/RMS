import React, { useMemo } from 'react';
import './MonthCalendar.css';

const MonthCalendar = ({ month, onDateSelect, selectedDates = [], disabled = false }) => {
  const calendar = useMemo(() => {
    if (!month) return null;

    // Parse month (format: YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number);
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Build calendar grid
    const weeks = [];
    let week = Array(startingDayOfWeek).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      week.push({
        day,
        dateStr,
        isSelected: selectedDates.includes(dateStr)
      });

      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      weeks.push(week);
    }

    return { weeks, year, monthNum };
  }, [month, selectedDates]);

  if (!calendar) return null;

  const monthName = new Date(calendar.year, calendar.monthNum - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="month-calendar">
      <h4 className="calendar-title">{monthName}</h4>
      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {weekDays.map((day) => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-days">
          {calendar.weeks.map((week, weekIdx) => (
            week.map((cell, cellIdx) => (
              <div
                key={`${weekIdx}-${cellIdx}`}
                className={`calendar-day ${!cell ? 'empty' : ''} ${cell?.isSelected ? 'selected' : ''}`}
                onClick={() => cell && !disabled && onDateSelect(cell.dateStr)}
              >
                {cell?.day}
              </div>
            ))
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonthCalendar;
