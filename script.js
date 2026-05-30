document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-links a');
    const contentSections = document.querySelectorAll('.content-section');

    function showSection(targetId) {
        // Remove 'active' class from all navigation links
        navLinks.forEach(link => link.classList.remove('active'));
        // Hide all content sections
        contentSections.forEach(section => section.classList.remove('active'));

        // Add 'active' class to the clicked navigation link
        const activeLink = document.querySelector(`.nav-links a[data-target="${targetId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Show the target content section
        const activeSection = document.getElementById(targetId);
        if (activeSection) {
            activeSection.classList.add('active');
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor link behavior (page jump)
            const targetId = link.dataset.target;
            showSection(targetId);
            history.pushState(null, '', `#${targetId}`); // Update URL hash without reloading
            if (window.innerWidth <= 768) {
                document.querySelector('.nav-links').classList.remove('active');
            }
        });
    });

    // Initialize view based on URL hash or default to the first tab
    const initialHash = window.location.hash.substring(1); // Remove '#'
    if (initialHash && document.getElementById(initialHash)) {
        showSection(initialHash);
    } else if (navLinks.length > 0) {
        const defaultTargetId = navLinks[0].dataset.target;
        showSection(defaultTargetId);
        history.replaceState(null, '', `#${defaultTargetId}`); // Use replaceState for initial load
    }

    // Validator Master Logic
    const modal = document.getElementById('validatorModal');
    const menuToggle = document.getElementById('menuToggle');
    const selectBtn = document.getElementById('selectValidatorBtn');
    const closeBtn = document.getElementById('closeModal');
    const validatorList = document.getElementById('validatorList');
    const modalSearch = document.getElementById('modalSearch');
    const addValidatorBtn = document.getElementById('addValidatorBtn');
    const newValidatorIdInput = document.getElementById('newValidatorId');
    const newValidatorNameInput = document.getElementById('newValidatorName');
    const userIdInput = document.getElementById('userId');
    const validatorNameInput = document.getElementById('validatorName');
    const shiftSelect = document.getElementById('shift');
    const actionSelect = document.getElementById('action');
    const scrollToTopBtn = document.getElementById('scrollToTop');
    const paginationContainer = document.getElementById('pagination');
    const attendanceLogsList = document.getElementById('attendanceLogsList');
    const attendanceSearch = document.getElementById('attendanceSearch');
    const attendancePaginationContainer = document.getElementById('attendancePagination');
    const clockInForm = document.querySelector('#attendance form');
    const exportCSVBtn = document.getElementById('exportCSVBtn');
    const shiftTabs = document.querySelectorAll('.shift-tab');
    
    // Initialize allValidators from localStorage or as an empty array
    let allValidators = JSON.parse(localStorage.getItem('validators')) || [];
    // Initialize attendanceLogs from localStorage
    let attendanceLogs = JSON.parse(localStorage.getItem('attendanceLogs')) || [];

    // Pagination State
    let currentPage = 1;
    const rowsPerPage = 5;
    let currentlyDisplayedList = [];

    // Attendance Pagination State
    let attendanceCurrentPage = 1;
    const attendanceRowsPerPage = 10;

    // Shift Filter State
    let selectedShiftFilter = 'All';

    // Initialize View
    renderAttendanceLogs(); // Render attendance logs first
    if (userIdInput.value.trim()) { // If userId is pre-filled (e.g., from browser history)
        updateActionAndShiftDropdowns(); // Update dropdowns based on it
    }

    // Mobile Menu Toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.nav-links').classList.toggle('active');
        });
    }

    // Scroll to Top Logic for Mobile
    window.addEventListener('scroll', () => {
        // Appear only on mobile (<= 768px) and after scrolling down 300px
        if (window.innerWidth <= 768 && window.scrollY > 300) {
            scrollToTopBtn.style.display = 'flex';
        } else {
            scrollToTopBtn.style.display = 'none';
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Function to save validators to localStorage
    function saveValidators() {
        localStorage.setItem('validators', JSON.stringify(allValidators));
    }

    // Helper function to get filtered list based on current search term
    function getFilteredValidators() {
        const term = modalSearch.value.toLowerCase();
        return allValidators.filter(v => 
            v.id.toLowerCase().includes(term) || v.name.toLowerCase().includes(term)
        );
    }

    // Event listener for userId input to look up name from master via ID
    userIdInput.addEventListener('input', () => {
        const val = userIdInput.value.trim();
        
        if (val === '') {
            userIdInput.readOnly = false;
            validatorNameInput.value = '';
            return;
        }

        // Lookup the validator by ID in the master list
        const found = allValidators.find(v => v.id.toLowerCase() === val.toLowerCase());
        if (found) {
            validatorNameInput.value = found.name;
        } else {
            validatorNameInput.value = '';
        }
    });
    userIdInput.addEventListener('input', updateActionAndShiftDropdowns); // Update dropdowns when user ID changes

    function renderValidators(list) {
        currentlyDisplayedList = list;
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedItems = list.slice(start, end);

        validatorList.innerHTML = paginatedItems.length ? '' : '<tr><td colspan="2" style="text-align:center">No records found</td></tr>';
        
        paginatedItems.forEach(v => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${v.id}</td><td>${v.name}</td>`;
            row.onclick = () => {
                userIdInput.value = v.id;
                userIdInput.readOnly = true; // Make read-only once selected from master
                validatorNameInput.value = v.name;
                updateActionAndShiftDropdowns(); // Manually trigger update since programmatic change won't fire 'input'
                modal.style.display = 'none';
            };
            validatorList.appendChild(row);
        });

        renderPaginationControls(list.length);
    }

    function renderPaginationControls(totalItems) {
        paginationContainer.innerHTML = '';
        const pageCount = Math.ceil(totalItems / rowsPerPage);

        if (pageCount <= 1) return;

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.innerText = 'Prev';
        prevBtn.classList.add('pagination-btn');
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            currentPage--;
            renderValidators(currentlyDisplayedList);
        });
        paginationContainer.appendChild(prevBtn);

        for (let i = 1; i <= pageCount; i++) {
            const btn = document.createElement('button');
            btn.innerText = i;
            btn.classList.add('pagination-btn');
            if (i === currentPage) btn.classList.add('active');
            
            btn.addEventListener('click', () => {
                currentPage = i;
                renderValidators(currentlyDisplayedList);
            });
            paginationContainer.appendChild(btn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.innerText = 'Next';
        nextBtn.classList.add('pagination-btn');
        nextBtn.disabled = currentPage === pageCount;
        nextBtn.addEventListener('click', () => {
            currentPage++;
            renderValidators(currentlyDisplayedList);
        });
        paginationContainer.appendChild(nextBtn);
    }

    addValidatorBtn.addEventListener('click', () => {
        const newId = newValidatorIdInput.value.trim();
        const newName = newValidatorNameInput.value.trim();

        if (!newId || !newName) {
            alert('Please enter both User ID and Name for the new validator.');
            return;
        }

        if (allValidators.some(v => v.id.toLowerCase() === newId.toLowerCase())) {
            alert('A validator with this User ID already exists.');
            return;
        }

        const newValidator = { id: newId, name: newName };
        allValidators.push(newValidator);
        saveValidators(); // Save to localStorage
        renderValidators(getFilteredValidators()); // Re-render and respect current search

        // Clear input fields
        newValidatorIdInput.value = '';
        newValidatorNameInput.value = '';
        alert(`Validator "${newName}" (${newId}) added successfully!`);
    });

    selectBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        // Ensure the search bar is cleared and all validators are shown when opening
        modalSearch.value = '';
        currentPage = 1;
        renderValidators(allValidators);
    });

    modalSearch.addEventListener('input', (e) => {
        currentPage = 1;
        renderValidators(getFilteredValidators());
    });

    // Clock In Form Submission
    clockInForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const userId = userIdInput.value.trim();
        const name = validatorNameInput.value.trim();
        const shift = document.getElementById('shift').value;
        const action = document.getElementById('action').value;

        if (!name) {
            alert('Please select a valid validator from the Master list or enter a valid User ID.');
            return;
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            userId: userId,
            name: name,
            action: action,
            shift: shift
        };

        attendanceLogs.unshift(logEntry); // Add to beginning of array
        localStorage.setItem('attendanceLogs', JSON.stringify(attendanceLogs));
        
        renderAttendanceLogs();
        
        // Reset form
        clockInForm.reset();
        validatorNameInput.value = ''; // Explicitly clear name as it's readonly
        updateActionAndShiftDropdowns(); // Refresh dropdown states after submission
        userIdInput.readOnly = false;

        alert(`${action} successful!`);
    });

    // Shift Tab Listeners
    shiftTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            shiftTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            selectedShiftFilter = tab.dataset.shift;
            attendanceCurrentPage = 1;
            renderAttendanceLogs();
        });
    });

    // Attendance Search Listener
    attendanceSearch.addEventListener('input', () => {
        attendanceCurrentPage = 1;
        // No need to call updateActionAndShiftDropdowns here, as it's for the clock-in form
        renderAttendanceLogs();
    });

    function getAttendanceSummary() {
        // Step 1: Group all raw logs by date and userId
        const dailyUserLogs = new Map(); // Key: "YYYY-MM-DD|userId", Value: Array of logs for that user on that day
        attendanceLogs.forEach(log => {
            const logDateObj = new Date(log.timestamp);
            if (isNaN(logDateObj.getTime())) return; // Skip invalid legacy dates
            const datePart = logDateObj.toLocaleDateString(); // e.g., "1/23/2024"
            const key = `${datePart}|${log.userId}`;
            if (!dailyUserLogs.has(key)) {
                dailyUserLogs.set(key, []);
            }
            dailyUserLogs.get(key).push(log);
        });
        // Step 2: Process each group to create a summary object
        const summaryList = [];
        for (const [key, logs] of dailyUserLogs.entries()) {
            // Sort logs by timestamp to ensure correct order of events
            logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            let clockInTime = 'N/A';
            let firstBreakOutTime = 'N/A';
            let firstBreakInTime = 'N/A';
            let clockOutTime = 'N/A';
            let clockInDate = null;
            let clockOutDate = null;
            let shift = logs[0].shift; // Assume shift is consistent for the day
            let hasClockedIn = false;
            let hasBrokenOut = false;
            logs.forEach(log => {
                const logDate = new Date(log.timestamp);
                const time = logDate.toLocaleTimeString(); // e.g., "1:23:45 PM"

                if (log.action === 'Clock In' && !hasClockedIn) {
                    clockInTime = time;
                    clockInDate = logDate;
                    hasClockedIn = true;
                } else if (log.action === 'Break Out' && hasClockedIn && !hasBrokenOut) {
                    firstBreakOutTime = time;
                    hasBrokenOut = true;
                } else if (log.action === 'Break In' && hasBrokenOut && firstBreakInTime === 'N/A') {
                    firstBreakInTime = time;
                } else if (log.action === 'Clock Out') {
                    clockOutTime = time; // Always take the latest clock out
                    clockOutDate = logDate;
                }
            });
            // Calculate total duration (simplified: last Clock Out - first Clock In)
            let totalDuration = 'N/A';
            if (clockInDate && clockOutDate) {
                if (clockOutDate > clockInDate) {
                    const diffMs = clockOutDate - clockInDate;
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    totalDuration = `${diffHours}h ${diffMinutes}m`;
                }
            }
            summaryList.push({
                userId: logs[0].userId,
                name: logs[0].name,
                shift: shift,
                date: new Date(logs[0].timestamp).toLocaleDateString(), // Store date for deletion
                clockIn: clockInTime,
                breakOut: firstBreakOutTime,
                breakIn: firstBreakInTime,
                clockOut: clockOutTime,
                duration: totalDuration,
            });
        }
        return summaryList;
    }

    function renderAttendanceLogs() {
        const term = attendanceSearch.value.toLowerCase();
        const summaryList = getAttendanceSummary();

        const filtered = summaryList.filter(log => {
            const matchesSearch = (log.userId || '').toLowerCase().includes(term) || 
            (log.userId || '').toLowerCase().includes(term) || 
            (log.name || '').toLowerCase().includes(term) || 
            (log.shift || '').toLowerCase().includes(term) ||
            (log.clockIn || '').toLowerCase().includes(term) ||
            (log.breakOut || '').toLowerCase().includes(term) ||
            (log.breakIn || '').toLowerCase().includes(term) ||
            (log.clockOut || '').toLowerCase().includes(term) ||
            (log.duration || '').toLowerCase().includes(term)
            
            const matchesShift = selectedShiftFilter === 'All' || log.shift === selectedShiftFilter;
            
            return matchesSearch && matchesShift;
        });

        // Ensure current page is valid after filtering or deletion
        const totalPages = Math.ceil(filtered.length / attendanceRowsPerPage);
        if (attendanceCurrentPage > totalPages && totalPages > 0) {
            attendanceCurrentPage = totalPages;
        }

        const start = (attendanceCurrentPage - 1) * attendanceRowsPerPage;
        const end = start + attendanceRowsPerPage;
        const paginated = filtered.slice(start, end);

        attendanceLogsList.innerHTML = paginated.length ? '' : '<tr><td colspan="10" style="text-align:center">No logs found.</td></tr>';
        
        paginated.forEach((log) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${log.userId}</td>
                <td>${log.name}</td>
                <td>${log.date}</td>
                <td>${log.shift}</td>
                <td>${log.clockIn}</td>
                <td>${log.breakOut}</td>
                <td>${log.breakIn}</td>
                <td>${log.clockOut}</td>
                <td>${log.duration}</td>
                <td><button class="delete-log-btn" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button></td>
            `;
            
            row.querySelector('.delete-log-btn').addEventListener('click', () => {
                if(confirm(`Delete all attendance records for ${log.name} on ${log.date}?`)) {
                    const dateToDelete = log.date;
                    // Filter out all logs for this specific user on this specific day
                    attendanceLogs = attendanceLogs.filter(item => {
                        const itemDate = new Date(item.timestamp).toLocaleDateString();
                        return !(item.userId === log.userId && itemDate === dateToDelete);
                    });
                    
                    localStorage.setItem('attendanceLogs', JSON.stringify(attendanceLogs));
                    renderAttendanceLogs();
                }
            });
            attendanceLogsList.appendChild(row);
        });
        renderAttendancePagination(filtered.length);
    }

    exportCSVBtn.addEventListener('click', () => {
        const summaryList = getAttendanceSummary();
        const term = attendanceSearch.value.toLowerCase();
        const filtered = summaryList.filter(log => {
            const matchesSearch = (log.userId || '').toLowerCase().includes(term) || 
                (log.name || '').toLowerCase().includes(term) || 
                (log.shift || '').toLowerCase().includes(term) ||
                (log.clockIn || '').toLowerCase().includes(term) ||
                (log.breakOut || '').toLowerCase().includes(term) ||
                (log.breakIn || '').toLowerCase().includes(term) ||
                (log.clockOut || '').toLowerCase().includes(term) ||
                (log.duration || '').toLowerCase().includes(term);
            
            const matchesShift = selectedShiftFilter === 'All' || log.shift === selectedShiftFilter;
            return matchesSearch && matchesShift;
        });

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "User ID,Name,Date,Shift,Clock In,Break Out,Break In,Clock Out,Duration\n";

        filtered.forEach(row => {
            const line = [row.userId, `"${row.name}"`, row.date, row.shift, row.clockIn, row.breakOut, row.breakIn, row.clockOut, row.duration].join(",");
            csvContent += line + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `attendance_summary_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    function renderAttendancePagination(totalItems) {
        attendancePaginationContainer.innerHTML = '';
        const pageCount = Math.ceil(totalItems / attendanceRowsPerPage);
        if (pageCount <= 1) return;

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.innerText = 'Prev';
        prevBtn.classList.add('pagination-btn');
        prevBtn.disabled = attendanceCurrentPage === 1;
        prevBtn.addEventListener('click', () => {
            attendanceCurrentPage--;
            renderAttendanceLogs();
        });
        attendancePaginationContainer.appendChild(prevBtn);

        for (let i = 1; i <= pageCount; i++) {
            const btn = document.createElement('button');
            btn.innerText = i;
            btn.classList.add('pagination-btn');
            if (i === attendanceCurrentPage) btn.classList.add('active');
            btn.addEventListener('click', () => {
                attendanceCurrentPage = i;
                renderAttendanceLogs();
            });
            attendancePaginationContainer.appendChild(btn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.innerText = 'Next';
        nextBtn.classList.add('pagination-btn');
        nextBtn.disabled = attendanceCurrentPage === pageCount;
        nextBtn.addEventListener('click', () => {
            attendanceCurrentPage++;
            renderAttendanceLogs();
        });
        attendancePaginationContainer.appendChild(nextBtn);
    }

    function updateActionAndShiftDropdowns() {
        const currentUserId = userIdInput.value.trim();
        const today = new Date().toLocaleDateString(); // Get today's date string

        // Reset dropdowns to default state
        shiftSelect.value = '';
        shiftSelect.disabled = false;
        Array.from(actionSelect.options).forEach(option => option.disabled = false);
        actionSelect.value = 'Clock In'; // Default to Clock In

        if (!currentUserId) {
            return; // No user ID, keep defaults
        }

        // Find all logs for this user for today
        const userTodayLogs = attendanceLogs
            .filter(log => {
                const logDate = new Date(log.timestamp);
                return !isNaN(logDate.getTime()) && 
                       log.userId === currentUserId && 
                       logDate.toLocaleDateString() === today;
            })
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // Sort by time ascending

        if (userTodayLogs.length === 0) {
            // No logs for today, only "Clock In" is allowed
            Array.from(actionSelect.options).forEach(option => {
                if (option.value !== 'Clock In') {
                    option.disabled = true;
                }
            });
            actionSelect.value = 'Clock In';
            return;
        }

        // User has logs for today, determine latest state and shift
        const latestLog = userTodayLogs[userTodayLogs.length - 1]; // Get the very last action
        
        // Remember Shift
        shiftSelect.value = latestLog.shift;
        shiftSelect.disabled = true; // Once a shift is set for the day, it's fixed

        // Disable actions based on latest state
        Array.from(actionSelect.options).forEach(option => option.disabled = true); // Disable all first

        switch (latestLog.action) {
            case 'Clock In':
            case 'Break In': // If last action was Clock In or Break In, next can be Break Out or Clock Out
                actionSelect.querySelector('option[value="Break Out"]').disabled = false;
                actionSelect.querySelector('option[value="Clock Out"]').disabled = false;
                actionSelect.value = 'Break Out'; // Suggest Break Out as next
                break;
            case 'Break Out': // If last action was Break Out, next must be Break In
                actionSelect.querySelector('option[value="Break In"]').disabled = false;
                actionSelect.value = 'Break In';
                break;
            case 'Clock Out': // If last action was Clock Out, next can only be Clock In (for a new day, or if they forgot to clock in earlier)
                actionSelect.querySelector('option[value="Clock In"]').disabled = false;
                actionSelect.value = 'Clock In';
                break;
            default:
                // Should not happen, but keep all enabled if unknown state
                Array.from(actionSelect.options).forEach(option => option.disabled = false);
                break;
        }
    }

    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };
});