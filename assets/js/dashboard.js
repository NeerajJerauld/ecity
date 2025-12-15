// Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function checkAuth() {
    const authData = localStorage.getItem('ecity_auth');
    if (!authData) {
        window.location.href = '/';
        return;
    }
    
    // Show container after auth check
    document.getElementById('app-container').style.display = 'flex';
    
    const user = JSON.parse(authData);
    initDashboard(user);
}

function logout() {
    localStorage.removeItem('ecity_auth');
    window.location.href = '/';
}

function initDashboard(user) {
    // Set Profile Info
    document.getElementById('user-name').innerText = user.name || 'User';
    document.getElementById('user-role').innerText = user.role ? user.role.toUpperCase() : 'GUEST';
    document.getElementById('user-avatar').innerText = (user.name || 'U').charAt(0).toUpperCase();

    // Render Navigation
    renderNav(user.role);

    // Fetch and Render Data
    fetchDashboardData(user);
}

function renderNav(role) {
    const nav = document.getElementById('sidebar-nav');
    let html = '';

    if (role === 'owner' || role === 'admin') {
        html += `
            <a href="#" class="nav-item active" onclick="switchView('overview')"><span class="nav-icon">📊</span> Overview</a>
            <a href="#" class="nav-item" onclick="switchView('vehicles')"><span class="nav-icon">🚚</span> Vehicles</a>
            <a href="#" class="nav-item" onclick="switchView('drivers')"><span class="nav-icon">🧑‍✈️</span> Drivers</a>
            <a href="#" class="nav-item" onclick="switchView('trips')"><span class="nav-icon">📍</span> Live Trips</a>
            <a href="#" class="nav-item" onclick="switchView('finance')"><span class="nav-icon">💰</span> Income</a>
        `;
    } else if (role === 'driver') {
        html += `
            <a href="#" class="nav-item active"><span class="nav-icon">📅</span> Today's Trips</a>
            <a href="#" class="nav-item"><span class="nav-icon">📝</span> History</a>
            <a href="#" class="nav-item"><span class="nav-icon">👤</span> Profile</a>
        `;
    } else {
        // Customer
        html += `
            <a href="#" class="nav-item active"><span class="nav-icon">📦</span> My Shipments</a>
        `;
    }

    nav.innerHTML = html;
}

async function fetchDashboardData(user) {
    const contentDiv = document.getElementById('dashboard-content');
    
    try {
        // MOCK DATA FETCH (Replace with real API call later)
        // const response = await fetch('/api/dashboard', { ... });
        // Simulating network delay
        await new Promise(r => setTimeout(r, 800));

        let data;
        
        if (user.role === 'owner' || user.role === 'admin') {
            data = mockOwnerData;
            renderOwnerDashboard(data);
        } else if (user.role === 'driver') {
            data = mockDriverData;
            renderDriverDashboard(data);
        } else {
            contentDiv.innerHTML = '<p>Customer dashboard coming soon.</p>';
        }

    } catch (err) {
        contentDiv.innerHTML = `<p style="color:red">Error loading data: ${err.message}</p>`;
    }
}

// RENDER FUNCTIONS

function renderOwnerDashboard(data) {
    const content = document.getElementById('dashboard-content');
    
    const statsHtml = `
        <div class="grid-stats">
            <div class="stat-card">
                <div class="stat-label">Total Revenue (Month)</div>
                <div class="stat-value">₹${data.revenue.toLocaleString()}</div>
                <div class="stat-trend">▲ 12% vs last month</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Active Trips</div>
                <div class="stat-value">${data.activeTrips}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Vehicles</div>
                <div class="stat-value">${data.totalVehicles}</div>
                <div class="stat-trend">${data.idleVehicles} Idle</div>
            </div>
        </div>
    `;

    const tripsTable = `
        <div class="table-card">
            <div class="table-header">
                <h3 class="table-title">Live Trips Status</h3>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Vehicle</th>
                        <th>Driver</th>
                        <th>Route</th>
                        <th>Status</th>
                        <th>ETA</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.trips.map(trip => `
                        <tr>
                            <td><strong>${trip.vehicle}</strong></td>
                            <td>${trip.driver}</td>
                            <td>${trip.route}</td>
                            <td><span class="status-badge status-${trip.statusClass}">${trip.status}</span></td>
                            <td>${trip.eta}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    const driverTable = `
    <div class="table-card">
        <div class="table-header">
            <h3 class="table-title">Driver Overview</h3>
        </div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Assigned Vehicle</th>
                    <th>Salary Status</th>
                </tr>
            </thead>
            <tbody>
                ${data.drivers.map(d => `
                    <tr>
                        <td>${d.name}</td>
                        <td>${d.phone}</td>
                        <td>${d.vehicle}</td>
                        <td><span style="color:${d.salaryPaid ? 'green' : 'red'}">${d.salaryPaid ? 'Paid' : 'Pending'}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    `;

    content.innerHTML = statsHtml + tripsTable + driverTable;
}

function renderDriverDashboard(data) {
    const content = document.getElementById('dashboard-content');
    
    content.innerHTML = `
        <div class="stat-card" style="margin-bottom:20px;">
            <div class="stat-label">Current Assignment</div>
            <div class="stat-value" style="font-size:1.5rem">${data.currentJob.vehicle}</div>
            <p>Route: <strong>${data.currentJob.route}</strong></p>
        </div>
        
        <div class="table-card">
            <div class="table-header">
                <h3 class="table-title">My Schedule</h3>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Route</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.history.map(h => `
                        <tr>
                            <td>${h.date}</td>
                            <td>${h.route}</td>
                            <td>${h.status}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}


// MOCK DATA STORE
const mockOwnerData = {
    revenue: 450000,
    activeTrips: 4,
    totalVehicles: 12,
    idleVehicles: 2,
    trips: [
        { vehicle: 'KA-01-AJ-1234', driver: 'Ramesh Kumar', route: 'E-City ⮕ Hosur', status: 'In Transit', statusClass: 'transit', eta: '14:30' },
        { vehicle: 'KA-51-MD-9988', driver: 'Suresh B', route: 'Bommasandra ⮕ Chennai', status: 'In Transit', statusClass: 'transit', eta: '19:00' },
        { vehicle: 'TN-70-X-4455', driver: 'Manjunath', route: 'Local', status: 'Loading', statusClass: 'active', eta: '--' },
        { vehicle: 'KA-05-ZZ-1122', driver: 'Arun', route: 'E-City ⮕ Peenya', status: 'Delivered', statusClass: 'idle', eta: 'Done' }
    ],
    drivers: [
        { name: 'Ramesh Kumar', phone: '9876543210', vehicle: 'KA-01-AJ-1234', salaryPaid: true },
        { name: 'Suresh B', phone: '9876543211', vehicle: 'KA-51-MD-9988', salaryPaid: true },
        { name: 'Manjunath', phone: '9876543212', vehicle: 'TN-70-X-4455', salaryPaid: false },
    ]
};

const mockDriverData = {
    currentJob: {
        vehicle: 'KA-01-AJ-1234',
        route: 'Electronics City to Hosur SIPCOT'
    },
    history: [
        { date: 'Today', route: 'E-City -> Hosur', status: 'In Progress' },
        { date: 'Yesterday', route: 'E-City -> Peenya', status: 'Completed' },
    ]
};
