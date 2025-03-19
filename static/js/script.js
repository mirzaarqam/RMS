// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', function () {
    // 1. Dynamic Date Selection (Generate Dates for Selected Month)
    const monthInput = document.getElementById('month');
    const dateContainer = document.getElementById('date-container');

    if (monthInput && dateContainer) {
        monthInput.addEventListener('change', function () {
            const selectedMonth = new Date(this.value + '-01'); // Get the first day of the selected month
            const year = selectedMonth.getFullYear();
            const month = selectedMonth.getMonth();

            // Clear previous dates
            dateContainer.innerHTML = '';

            // Generate all dates for the selected month
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const dateDiv = document.createElement('div');
                const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                dateDiv.textContent = formattedDate;
                dateContainer.appendChild(dateDiv);
            }
        });
    }

    // 2. Form Validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function (event) {
            const inputs = form.querySelectorAll('input[required], select[required]');
            let isValid = true;

            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = 'red'; // Highlight invalid fields
                } else {
                    input.style.borderColor = ''; // Reset border color
                }
            });

            if (!isValid) {
                event.preventDefault(); // Prevent form submission if validation fails
                alert('Please fill in all required fields.');
            }
        });
    });

    // 3. Checkbox Behavior (Mutual Exclusivity)
    const offDayCheckbox = document.getElementById('off_day');
    const halfDayCheckbox = document.getElementById('half_day');

    if (offDayCheckbox && halfDayCheckbox) {
        offDayCheckbox.addEventListener('change', function () {
            if (this.checked) {
                halfDayCheckbox.checked = false; // Uncheck Half Day if OFF Day is selected
            }
        });

        halfDayCheckbox.addEventListener('change', function () {
            if (this.checked) {
                offDayCheckbox.checked = false; // Uncheck OFF Day if Half Day is selected
            }
        });
    }

    // 4. Export Confirmation
    const exportButton = document.getElementById('export-roster');
    if (exportButton) {
        exportButton.addEventListener('click', function (event) {
            const confirmExport = confirm('Are you sure you want to export the roster?');
            if (!confirmExport) {
                event.preventDefault(); // Prevent export if user cancels
            }
        });
    }
});