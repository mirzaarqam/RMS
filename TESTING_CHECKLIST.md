# 🧪 RMS Testing Checklist

## Pre-Testing Setup
- [ ] Backend API running on http://localhost:5000
- [ ] Frontend React app running on http://localhost:3000
- [ ] Database has test data (employees, shifts, roster)
- [ ] Browser console open (F12) for debugging

---

## Feature 1: Month Filtering

### Test Case 1.1: Default View (Last Month)
- [ ] Navigate to Roster → View Roster
- [ ] Page loads without errors
- [ ] Roster shows data from the most recent month
- [ ] Filter dropdown is visible
- [ ] "Complete Roster History" button is visible

**Expected:** Last month's roster displayed by default

### Test Case 1.2: Month Selection
- [ ] Click on month dropdown
- [ ] See list of available months
- [ ] Select a different month
- [ ] Grid refreshes automatically
- [ ] Correct month data displayed
- [ ] No loading errors

**Expected:** Selected month's roster loads correctly

### Test Case 1.3: Complete History View
- [ ] Click "Complete Roster History" button
- [ ] All roster data loads
- [ ] Employees from all months visible
- [ ] Badge shows "Showing All Months"
- [ ] Month dropdown becomes disabled

**Expected:** All historical roster data displayed

### Test Case 1.4: Switch Between Views
- [ ] Start with default view
- [ ] Select specific month
- [ ] Click "Complete History"
- [ ] Select specific month again
- [ ] Data updates correctly each time

**Expected:** Smooth transitions between all filter states

---

## Feature 2: Inline Roster Editing

### Test Case 2.1: Edit Button Visibility
- [ ] Navigate to Roster View
- [ ] Hover over a cell with roster data
- [ ] Blue edit icon appears
- [ ] Move mouse away, icon disappears
- [ ] Hover again, icon reappears

**Expected:** Edit button shows/hides on hover

### Test Case 2.2: Open Edit Modal
- [ ] Hover over a roster cell
- [ ] Click the edit icon
- [ ] Modal opens smoothly
- [ ] Employee name displayed correctly
- [ ] Date displayed correctly
- [ ] Current shift information shown

**Expected:** Modal opens with correct employee and date info

### Test Case 2.3: Shift Selection
- [ ] In modal, click shift dropdown
- [ ] See grouped options (Full Day / Half Day / OFF)
- [ ] Select a Full Day shift
- [ ] Preview section updates
- [ ] Status badge shows "Full Day"

**Expected:** Shift selection updates preview correctly

### Test Case 2.4: Select Half Day Shift
- [ ] In modal, select a Half Day shift
- [ ] Preview updates
- [ ] Status badge shows "Half Day" in yellow

**Expected:** Half day selection works correctly

### Test Case 2.5: Select OFF Day
- [ ] In modal, select "OFF Day"
- [ ] Preview shows "N/A" for shift
- [ ] Status badge shows "OFF" in red

**Expected:** OFF day selection works correctly

### Test Case 2.6: Save Changes
- [ ] Select a new shift
- [ ] Click "Save Changes" button
- [ ] Modal closes
- [ ] Roster grid refreshes
- [ ] Updated shift displayed in cell
- [ ] Correct color coding applied

**Expected:** Changes save and display correctly

### Test Case 2.7: Cancel Edit
- [ ] Open edit modal
- [ ] Select a different shift
- [ ] Click "Cancel" button
- [ ] Modal closes
- [ ] No changes applied to roster

**Expected:** Cancel discards changes

### Test Case 2.8: Edit Multiple Entries
- [ ] Edit one cell, save
- [ ] Edit another cell, save
- [ ] Edit third cell, save
- [ ] All changes persist correctly

**Expected:** Multiple edits work sequentially

---

## Integration Tests

### Test Case 3.1: Edit After Filtering
- [ ] Select specific month
- [ ] Edit a roster entry
- [ ] Save changes
- [ ] Changes visible in filtered view
- [ ] Switch to different month
- [ ] Switch back to edited month
- [ ] Changes still there

**Expected:** Edits persist across filter changes

### Test Case 3.2: Filter After Editing
- [ ] Edit a roster entry
- [ ] Change month filter
- [ ] Change back to original month
- [ ] Edited data still correct

**Expected:** Filter changes don't affect saved edits

### Test Case 3.3: Export After Changes
- [ ] Edit several roster entries
- [ ] Click "Export CSV"
- [ ] Open exported file
- [ ] Verify changes are in export

**Expected:** Export includes all recent changes

---

## Error Handling Tests

### Test Case 4.1: Network Error During Edit
- [ ] Stop backend API server
- [ ] Try to edit a roster entry
- [ ] Error message displays
- [ ] Modal stays open
- [ ] Can retry or cancel

**Expected:** Graceful error handling

### Test Case 4.2: Invalid Data Handling
- [ ] Open edit modal
- [ ] Don't select any shift
- [ ] Try to save
- [ ] Save button disabled or error shown

**Expected:** Validation prevents invalid saves

---

## UI/UX Tests

### Test Case 5.1: Responsive Design
- [ ] Resize browser window
- [ ] Filter controls remain accessible
- [ ] Edit buttons still visible on hover
- [ ] Modal displays correctly
- [ ] No layout breaks

**Expected:** Works on all screen sizes

### Test Case 5.2: Loading States
- [ ] Filter changes show loading indicator
- [ ] Edit saves show loading state
- [ ] No multiple clicks allowed during save

**Expected:** Clear loading feedback

### Test Case 5.3: Visual Feedback
- [ ] Color codes match legend
- [ ] Edit button has smooth animation
- [ ] Modal has smooth open/close
- [ ] Badges display correctly

**Expected:** Professional visual experience

---

## Performance Tests

### Test Case 6.1: Large Dataset
- [ ] Create rosters for 50+ employees
- [ ] View complete history
- [ ] Page loads in reasonable time
- [ ] Scroll performance is smooth
- [ ] Edit modal opens quickly

**Expected:** Good performance with large data

### Test Case 6.2: Multiple Rapid Edits
- [ ] Edit and save 10 cells quickly
- [ ] No race conditions
- [ ] All changes save correctly
- [ ] No duplicate requests

**Expected:** Handles rapid interactions well

---

## Regression Tests

### Test Case 7.1: Existing Features Still Work
- [ ] Can create new roster
- [ ] Can add employees
- [ ] Can add shifts
- [ ] Can delete employees
- [ ] Can delete shifts
- [ ] Dashboard stats update

**Expected:** No existing features broken

### Test Case 7.2: Old Roster Data Compatible
- [ ] View existing roster data
- [ ] Data displays correctly
- [ ] Can edit old entries
- [ ] No data corruption

**Expected:** Backward compatible with existing data

---

## Browser Compatibility

### Test Case 8.1: Chrome
- [ ] All features work
- [ ] Edit button hover works
- [ ] Modal displays correctly

### Test Case 8.2: Firefox
- [ ] All features work
- [ ] Edit button hover works
- [ ] Modal displays correctly

### Test Case 8.3: Edge
- [ ] All features work
- [ ] Edit button hover works
- [ ] Modal displays correctly

---

## Security Tests

### Test Case 9.1: Authentication Required
- [ ] Logout
- [ ] Try to access /api/roster directly
- [ ] Should redirect to login
- [ ] After login, can access normally

**Expected:** Protected endpoints remain secure

### Test Case 9.2: Token Validation
- [ ] Login
- [ ] Make edits successfully
- [ ] Clear token from localStorage
- [ ] Try to edit
- [ ] Should redirect to login

**Expected:** Invalid tokens handled correctly

---

## Sign-Off

### Critical Issues (Must Fix)
- [ ] None found

### Minor Issues (Can Fix Later)
- [ ] None found

### Tested By: __________________

### Date: __________________

### Status: ☐ PASSED  ☐ FAILED  ☐ NEEDS REVIEW

### Notes:
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________

---

## Quick Bug Report Template

If you find a bug, note:
1. **What you did:** 
2. **What you expected:**
3. **What actually happened:**
4. **Browser & OS:**
5. **Console errors (if any):**
