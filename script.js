document.addEventListener('DOMContentLoaded', () => {
    const startTimeInput = document.getElementById('startTimeInput');
    const startFastBtn = document.getElementById('startFastBtn');
    const setStartTimeBtn = document.getElementById('setStartTimeBtn');
    const stopFastBtn = document.getElementById('stopFastBtn');
    const fastingInfoDiv = document.getElementById('fastingInfo');
    const fastStartTimeDisplay = document.getElementById('fastStartTimeDisplay');
    const fastDurationDisplay = document.getElementById('fastDurationDisplay');
    const benefitsList = document.getElementById('benefitsList');
    const pastFastsSection = document.getElementById('pastFastsSection');
    const pastFastsList = document.getElementById('pastFastsList');

    let fastInterval;
    let fastStartDate; // This will be a Date object

    // These timings are general estimates and can vary significantly.
    // Consider adding a disclaimer in your app.
    const benefits = [
        { name: "Glucose Burning", hours: 0.1, description: "Body primarily uses recently consumed glucose." }, // Example: immediate
        { name: "Blood Sugar Drop & Insulin Decline", hours: 4, description: "Blood sugar levels begin to fall, insulin secretion reduces." },
        { name: "Glycogen Depletion", hours: 10, description: "Liver glycogen stores are significantly depleted." },
        { name: "Ketosis Begins", hours: 14, description: "Body starts producing ketones from fat as primary energy source." },
        { name: "Fat Burning Ramps Up", hours: 18, description: "Significant fat oxidation for energy (deep ketosis)." },
        { name: "Autophagy Initiated", hours: 24, description: "Cellular cleanup (autophagy) processes are stimulated." },
        { name: "Growth Hormone Increase", hours: 48, description: "Growth hormone levels may significantly increase, aiding in repair." },
        { name: "Potential Immune Cell Rejuvenation", hours: 72, description: "Studies suggest possible regeneration of immune cells." }
    ];

    function formatDateTime(date) {
        if (!date || !(date instanceof Date)) return 'N/A';
        return date.toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    }

    function updateTimerAndBenefits() {
        if (!fastStartDate) return;

        const now = new Date();
        const diffMs = now.getTime() - fastStartDate.getTime();

        if (diffMs < 0) { // If start time is in the future
            fastDurationDisplay.textContent = "Starts in future";
            benefitsList.innerHTML = '<li>Fasting has not started yet.</li>';
            return;
        }

        const diffHours = diffMs / (1000 * 60 * 60);

        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        fastDurationDisplay.textContent =
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Update benefits
        benefitsList.innerHTML = ''; // Clear previous list
        let anyBenefitAchieved = false;
        benefits.forEach(benefit => {
            const li = document.createElement('li');
            let timeString;
            if (benefit.hours < 1) {
                const minutes = Math.round(benefit.hours * 60);
                timeString = `approx. ${minutes} min${minutes === 1 ? '' : 's'}`;
            } else {
                timeString = `approx. ${benefit.hours} hr${benefit.hours === 1 ? '' : 's'}`;
            }
            li.innerHTML = `<strong>${benefit.name}</strong> (${timeString}): ${benefit.description}`;
            if (diffHours >= benefit.hours) {
                li.classList.add('achieved');
                anyBenefitAchieved = true;
            }
            benefitsList.appendChild(li);
        });
    }

    function startFast(startTimeDate) {
        fastStartDate = startTimeDate;
        localStorage.setItem('fastStartTime', fastStartDate.toISOString());

        fastStartTimeDisplay.textContent = formatDateTime(fastStartDate);
        fastingInfoDiv.style.display = 'block';
        startFastBtn.style.display = 'none';
        setStartTimeBtn.style.display = 'none';
        startTimeInput.style.display = 'none';
        document.querySelector('.controls label[for="startTimeInput"]').style.display = 'none';
        stopFastBtn.style.display = 'inline-block';

        updateTimerAndBenefits(); // Initial call
        if (fastInterval) clearInterval(fastInterval); // Clear any existing interval
        fastInterval = setInterval(updateTimerAndBenefits, 1000);
    }

    startFastBtn.addEventListener('click', () => {
        startFast(new Date()); // Start from now
    });

    setStartTimeBtn.addEventListener('click', () => {
        const selectedTimeValue = startTimeInput.value;
        if (selectedTimeValue) {
            const selectedDate = new Date(selectedTimeValue);
            if (isNaN(selectedDate.getTime())) {
                alert('Invalid date/time selected. Please check the format.');
                return;
            }
            startFast(selectedDate);
        } else {
            alert('Please select a start time using the picker.');
        }
    });

    stopFastBtn.addEventListener('click', () => {
        if (fastInterval) clearInterval(fastInterval);
        const fastEndTime = new Date();
        let loggedDuration = "00:00:00"; // Default duration if something goes wrong

        if (fastStartDate) {
            const durationMs = fastEndTime.getTime() - fastStartDate.getTime();
            const durationHours = durationMs / (1000 * 60 * 60);
            loggedDuration = fastDurationDisplay.textContent; // Capture the final displayed duration

            // Log to console (optional, can be removed)
            console.log(`Fast stopped. Started: ${formatDateTime(fastStartDate)}, Ended: ${formatDateTime(fastEndTime)}, Duration: ${durationHours.toFixed(2)} hours.`);

            // Create log entry
            const logEntry = {
                id: Date.now(), // Unique ID for the log
                startTime: fastStartDate.toISOString(),
                endTime: fastEndTime.toISOString(),
                durationText: loggedDuration
            };

            let existingLogs = JSON.parse(localStorage.getItem('pastFastsLog')) || [];
            existingLogs.unshift(logEntry); // Add new log to the beginning (newest first)
            localStorage.setItem('pastFastsLog', JSON.stringify(existingLogs));
        }

        localStorage.removeItem('fastStartTime');
        fastStartDate = null;

        fastingInfoDiv.style.display = 'none';
        fastDurationDisplay.textContent = '00:00:00';
        benefitsList.innerHTML = '<li>Start a new fast to see benefits.</li>';
        startFastBtn.style.display = 'inline-block';
        setStartTimeBtn.style.display = 'inline-block';
        startTimeInput.style.display = 'block';
        document.querySelector('.controls label[for="startTimeInput"]').style.display = 'block';
        startTimeInput.value = ''; // Clear the input
        stopFastBtn.style.display = 'none';

        displayPastFasts(); // Refresh the displayed log
    });

    function loadExistingFast() {
        const storedStartTimeISO = localStorage.getItem('fastStartTime');
        if (storedStartTimeISO) {
            const storedStartDate = new Date(storedStartTimeISO);
            if (!isNaN(storedStartDate.getTime())) {
                startFast(storedStartDate);
            } else {
                localStorage.removeItem('fastStartTime'); // Clear invalid stored time
                initializeUIForNewFast();
            }
        } else {
            initializeUIForNewFast();
        }
        displayPastFasts(); // Display any existing logs on load
    }

    function initializeUIForNewFast() {
        startFastBtn.style.display = 'inline-block';
        setStartTimeBtn.style.display = 'inline-block';
        startTimeInput.style.display = 'block';
        document.querySelector('.controls label[for="startTimeInput"]').style.display = 'block';
        stopFastBtn.style.display = 'none';
        fastingInfoDiv.style.display = 'none';
        benefitsList.innerHTML = '<li>Start a fast to see potential benefits.</li>';
        // No need to call displayPastFasts here as loadExistingFast will call it
    }

    function displayPastFasts() {
        const logs = JSON.parse(localStorage.getItem('pastFastsLog')) || [];
        pastFastsList.innerHTML = ''; // Clear existing list items

        if (logs.length > 0) {
            pastFastsSection.style.display = 'block';
            logs.forEach(log => {
                const li = document.createElement('li');
                const startDate = new Date(log.startTime);
                const endDate = new Date(log.endTime);

                // Create buttons container
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'log-actions';

                // Create edit button
                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.classList.add('edit-log-btn');
                editButton.addEventListener('click', () => showEditForm(log.id, log));

                // Create delete button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('delete-log-btn');
                deleteButton.addEventListener('click', () => deleteLogEntry(log.id));

                // Add buttons to container
                buttonContainer.appendChild(editButton);
                buttonContainer.appendChild(deleteButton);

                li.innerHTML = `
                    <strong>Started:</strong> ${formatDateTime(startDate)}<br>
                    <strong>Ended:</strong> ${formatDateTime(endDate)}<br>
                    <strong>Duration:</strong> ${log.durationText}
                    <div class="edit-form" id="edit-form-${log.id}" style="display: none; margin-top: 10px;">
                        <label>Start Time:</label>
                        <input type="datetime-local" id="edit-start-${log.id}" value="${startDate.toISOString().slice(0, 16)}">
                        <label>End Time:</label>
                        <input type="datetime-local" id="edit-end-${log.id}" value="${endDate.toISOString().slice(0, 16)}">
                        <button class="save-edit-btn" data-id="${log.id}">Save</button>
                        <button class="cancel-edit-btn" data-id="${log.id}">Cancel</button>
                    </div>
                `;
                li.appendChild(buttonContainer);
                pastFastsList.appendChild(li);
            });

            // Add event listeners for save and cancel buttons
            document.querySelectorAll('.save-edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => saveEdit(e.target.dataset.id));
            });
            document.querySelectorAll('.cancel-edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => cancelEdit(e.target.dataset.id));
            });
        } else {
            pastFastsSection.style.display = 'none';
        }
    }

    function showEditForm(logId, logData) {
        const editForm = document.getElementById(`edit-form-${logId}`);
        if (editForm) {
            editForm.style.display = editForm.style.display === 'none' ? 'block' : 'none';
        }
    }

    function saveEdit(logId) {
        const startTimeInput = document.getElementById(`edit-start-${logId}`);
        const endTimeInput = document.getElementById(`edit-end-${logId}`);
        
        const newStartTime = new Date(startTimeInput.value);
        const newEndTime = new Date(endTimeInput.value);
        
        if (isNaN(newStartTime.getTime()) || isNaN(newEndTime.getTime()) || newStartTime >= newEndTime) {
            alert('Please enter valid start and end times. End time must be after start time.');
            return;
        }
        
        // Calculate new duration
        const durationMs = newEndTime - newStartTime;
        const totalSeconds = Math.floor(durationMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const durationText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Update the log entry
        let logs = JSON.parse(localStorage.getItem('pastFastsLog')) || [];
        logs = logs.map(log => {
            if (log.id === Number(logId)) {
                return {
                    ...log,
                    startTime: newStartTime.toISOString(),
                    endTime: newEndTime.toISOString(),
                    durationText: durationText
                };
            }
            return log;
        });
        
        localStorage.setItem('pastFastsLog', JSON.stringify(logs));
        displayPastFasts(); // Refresh the display
    }
    
    function cancelEdit(logId) {
        const editForm = document.getElementById(`edit-form-${logId}`);
        if (editForm) {
            editForm.style.display = 'none';
        }
    }

    function deleteLogEntry(logId) {
        let logs = JSON.parse(localStorage.getItem('pastFastsLog')) || [];
        logs = logs.filter(log => log.id !== logId); // Keep logs that don't match the id
        localStorage.setItem('pastFastsLog', JSON.stringify(logs));
        displayPastFasts(); // Re-render the list
    }

    loadExistingFast();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js') // Adjusted for relative path
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.error('ServiceWorker registration failed: ', err);
                });
        });
    }
});