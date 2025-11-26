# RMS Feature Flow Diagrams

## 1. Month Filtering Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     ROSTER VIEW PAGE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Filter Bar                                         │    │
│  │  ┌──────────────┐  ┌────────────────────────┐     │    │
│  │  │ Month: ▼     │  │ Complete Roster History│     │    │
│  │  │ • Last Month │  └────────────────────────┘     │    │
│  │  │ • Nov 2025   │         (Button)                │    │
│  │  │ • Oct 2025   │                                  │    │
│  │  │ • Sep 2025   │                                  │    │
│  │  └──────────────┘                                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │               Roster Grid                           │    │
│  │  [Shows data based on selected filter]             │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Flow:
1. Page loads → Shows last month by default
2. User clicks dropdown → Sees all available months
3. User selects month → Grid refreshes with that month
4. User clicks "Complete History" → Shows ALL months
```

## 2. Inline Edit Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   ROSTER CELL INTERACTION                    │
└─────────────────────────────────────────────────────────────┘

Step 1: Normal State
┌──────────────────┐
│ Morning Shift    │
│ (MS)             │
│ [Full Day]       │
└──────────────────┘

Step 2: Hover State
┌──────────────────┐
│ Morning Shift  ✏️ │  ← Edit icon appears
│ (MS)             │
│ [Full Day]       │
└──────────────────┘

Step 3: Click Edit → Modal Opens
╔════════════════════════════════════════╗
║     Edit Roster Entry                  ║
╠════════════════════════════════════════╣
║                                        ║
║  Employee: John Doe (E001)             ║
║  Date: November 26, 2025               ║
║                                        ║
║  Select Shift: ▼                       ║
║  ┌─────────────────────────────────┐  ║
║  │ Full Day Shifts                 │  ║
║  │  • Morning Shift (MS) 9-5       │  ║
║  │  • Evening Shift (ES) 2-10      │  ║
║  │ Half Day Shifts                 │  ║
║  │  • Half Day AM (HD1) 9-1        │  ║
║  │  • Half Day PM (HD2) 1-5        │  ║
║  │ Other                           │  ║
║  │  • OFF Day                      │  ║
║  └─────────────────────────────────┘  ║
║                                        ║
║  Current Selection:                    ║
║  ┌─────────────────────────────────┐  ║
║  │ Shift: Evening Shift (ES)       │  ║
║  │ Status: [Full Day]              │  ║
║  └─────────────────────────────────┘  ║
║                                        ║
║  [Cancel]              [Save Changes]  ║
║                                        ║
╚════════════════════════════════════════╝

Step 4: After Save
┌──────────────────┐
│ Evening Shift    │  ← Updated!
│ (ES)             │
│ [Full Day]       │
└──────────────────┘
```

## 3. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  RosterView.js                                               │
│  ├─ Month filter state                                       │
│  ├─ Roster data state                                        │
│  └─ Edit modal state                                         │
│      │                                                        │
│      └─► EditRosterModal.js                                  │
│          ├─ Shift selection                                  │
│          └─ Save handler                                     │
│                                                              │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   │ HTTP Requests (Axios)
                   │
┌──────────────────▼───────────────────────────────────────────┐
│                        API LAYER                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GET  /api/roster?month=2025-11                             │
│  GET  /api/roster?all=true                                  │
│  PUT  /api/roster/<emp_id>/<date>                           │
│                                                              │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   │ SQL Queries
                   │
┌──────────────────▼───────────────────────────────────────────┐
│                       DATABASE                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  roster table                                                │
│  ├─ emp_id                                                   │
│  ├─ date                                                     │
│  ├─ shift                                                    │
│  └─ status                                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 4. User Journey Map

```
USER STARTS
    │
    ├─► Login
    │   └─► Dashboard
    │       │
    │       ├─► View Stats
    │       └─► Navigate to Roster
    │           │
    │           └─► ROSTER VIEW
    │               │
    │               ├─► SCENARIO A: Filter by Month
    │               │   ├─ See dropdown with months
    │               │   ├─ Select specific month
    │               │   ├─ Grid shows filtered data
    │               │   └─ Can switch to different month
    │               │
    │               └─► SCENARIO B: Edit Entry
    │                   ├─ Hover over cell
    │                   ├─ Click edit icon
    │                   ├─ Modal opens
    │                   ├─ Select new shift
    │                   ├─ Preview updates
    │                   ├─ Click save
    │                   └─ See updated roster
    │
    └─► Create New Roster (separate flow)
```

## 5. API Request/Response Examples

### Get Roster (Filtered)
```
REQUEST:
GET /api/roster?month=2025-11

RESPONSE:
{
  "dates": ["2025-11-01", "2025-11-02", ...],
  "roster": [
    {
      "emp_id": "E001",
      "name": "John Doe",
      "shifts": [
        {
          "date": "2025-11-01",
          "shift": "Morning Shift (MS)",
          "status": "Full Day"
        },
        ...
      ]
    }
  ],
  "available_months": ["2025-11", "2025-10", "2025-09"]
}
```

### Update Roster Entry
```
REQUEST:
PUT /api/roster/E001/2025-11-26
{
  "shift": "Evening Shift (ES)",
  "status": "Full Day"
}

RESPONSE:
{
  "message": "Roster entry updated successfully"
}
```

## 6. State Management Flow

```
┌─────────────────────────────────────────────────────────┐
│                    RosterView Component                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  State Variables:                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │ rosterData: { dates, roster, available_months }│    │
│  │ selectedMonth: string                          │    │
│  │ showAllMonths: boolean                         │    │
│  │ editModal: { isOpen, employee, date, ... }    │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Effects:                                                │
│  ┌────────────────────────────────────────────────┐    │
│  │ useEffect([selectedMonth, showAllMonths])      │    │
│  │   → fetchRoster()                              │    │
│  │   → Updates rosterData                         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Event Handlers:                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ handleMonthChange()   → setSelectedMonth()     │    │
│  │ handleShowAllMonths() → setShowAllMonths()     │    │
│  │ handleEditClick()     → setEditModal()         │    │
│  │ handleSaveSuccess()   → fetchRoster()          │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 7. Component Hierarchy

```
App
└── Router
    └── ProtectedRoute
        └── Layout
            ├── Navbar
            └── RosterView
                ├── Month Filter Dropdown
                ├── Complete History Button
                ├── Roster Table
                │   └── Roster Cells (with edit buttons)
                └── EditRosterModal
                    ├── Employee/Date Display
                    ├── Shift Selector
                    ├── Preview Section
                    └── Save/Cancel Buttons
```
