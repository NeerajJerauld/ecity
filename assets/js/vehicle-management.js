// Vehicle Management - Add this to the end of dashboard.js

let vehicles = [];
let drivers = [];
let pendingDeleteVehicleId = null;

// Load vehicles and drivers
async function loadVehicles() {
    try {
        const response = await fetch(`${API_URL}/api/vehicles`, {
            method: 'GET',
            headers: {
                'Authorization': currentUser.token,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch vehicles');
        }

        const data = await response.json();
        vehicles = data.vehicles || [];
        renderVehicles();
        
        // Update total vehicles count
        document.getElementById('totalVehicles').textContent = vehicles.length;
    } catch (error) {
        console.error('Error loading vehicles:', error);
        showError('Failed to load vehicles');
    }
}

function renderVehicles() {
    const tbody = document.getElementById('vehiclesTableBody');
    const emptyState = document.getElementById('vehiclesEmptyState');
    const table = document.getElementById('vehiclesTable');

    if (vehicles.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    tbody.innerHTML = vehicles.map(vehicle => `
        <tr class="fade-in">
            <td><strong>${escapeHtml(vehicle.vehicle_number)}</strong></td>
            <td>${escapeHtml(vehicle.vehicle_type)}</td>
            <td>${escapeHtml(vehicle.model)}</td>
            <td>${vehicle.capacity || '-'}</td>
            <td><span class="badge badge-${vehicle.status === 'available' ? 'active' : vehicle.status === 'in-use' ? 'owner' : 'inactive'}">${vehicle.status}</span></td>
            <td>${vehicle.driver_name || 'Unassigned'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="editVehicle(${vehicle.id})" title="Edit vehicle">
                        ✏️
                    </button>
                    <button class="btn-icon danger" onclick="deleteVehicle(${vehicle.id})" title="Delete vehicle">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadDriversForDropdown() {
    try {
        const response = await fetch(`${API_URL}/api/users`, {
            method: 'GET',
            headers: {
                'Authorization': currentUser.token,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            drivers = (data.users || []).filter(u => u.role === 'driver');
            
            // Populate driver dropdown
            const select = document.getElementById('vehicleDriver');
            select.innerHTML = '<option value="">No driver assigned</option>' +
                drivers.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading drivers:', error);
    }
}

function openVehicleModal(vehicleId = null) {
    const modal = document.getElementById('vehicleModal');
    const title = document.getElementById('vehicleModalTitle');
    const form = document.getElementById('vehicleForm');

    // Reset form
    form.reset();
    document.getElementById('vehicleFormError').style.display = 'none';

    // Load drivers for dropdown
    loadDriversForDropdown();

    if (vehicleId) {
        // Edit mode
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            title.textContent = 'Edit Vehicle';
            document.getElementById('vehicleId').value = vehicle.id;
            document.getElementById('vehicleNumber').value = vehicle.vehicle_number;
            document.getElementById('vehicleType').value = vehicle.vehicle_type;
            document.getElementById('vehicleModel').value = vehicle.model;
            document.getElementById('vehicleCapacity').value = vehicle.capacity || '';
            document.getElementById('vehicleStatus').value = vehicle.status;
            setTimeout(() => {
                document.getElementById('vehicleDriver').value = vehicle.driver_id || '';
            }, 100);
        }
    } else {
        // Add mode
        title.textContent = 'Add New Vehicle';
        document.getElementById('vehicleStatus').value = 'available';
    }

    modal.classList.add('active');
}

function closeVehicleModal() {
    document.getElementById('vehicleModal').classList.remove('active');
}

async function saveVehicle() {
    const vehicleId = document.getElementById('vehicleId').value;
    const vehicle_number = document.getElementById('vehicleNumber').value.trim();
    const vehicle_type = document.getElementById('vehicleType').value;
    const model = document.getElementById('vehicleModel').value.trim();
    const capacity = document.getElementById('vehicleCapacity').value.trim();
    const status = document.getElementById('vehicleStatus').value;
    const driver_id = document.getElementById('vehicleDriver').value;

    // Validation
    if (!vehicle_number || !vehicle_type || !model) {
        showVehicleFormError('Please fill in all required fields');
        return;
    }

    const vehicleData = {
        vehicle_number,
        vehicle_type,
        model,
        capacity: capacity || null,
        status,
        driver_id: driver_id || null
    };

    try {
        const url = vehicleId 
            ? `${API_URL}/api/vehicles/${vehicleId}` 
            : `${API_URL}/api/vehicles`;
        
        const method = vehicleId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': currentUser.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vehicleData)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to save vehicle');
        }

        const data = await response.json();
        console.log('Vehicle save response:', data);
        
        if (data.success) {
            closeVehicleModal();
            await loadVehicles();
            showSuccess(vehicleId ? 'Vehicle updated successfully' : 'Vehicle created successfully');
        } else {
            throw new Error('Save operation did not return success');
        }
    } catch (error) {
        console.error('Error saving vehicle:', error);
        showVehicleFormError(error.message);
    }
}

window.editVehicle = function(vehicleId) {
    openVehicleModal(vehicleId);
};

window.deleteVehicle = function(vehicleId) {
    pendingDeleteVehicleId = vehicleId;
    document.getElementById('deleteConfirmModal').classList.add('active');
};

function showVehicleFormError(message) {
    const errorEl = document.getElementById('vehicleFormError');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

// Setup vehicle modal event listeners (add to setupEventListeners)
document.getElementById('addVehicleBtn').addEventListener('click', () => openVehicleModal());
document.getElementById('closeVehicleModal').addEventListener('click', closeVehicleModal);
document.getElementById('cancelVehicleBtn').addEventListener('click', closeVehicleModal);
document.getElementById('saveVehicleBtn').addEventListener('click', saveVehicle);

// Update switchView to load vehicles when needed
const originalSwitchView = switchView;
switchView = function(viewName) {
    originalSwitchView(viewName);
    
    if (viewName === 'vehicles' && currentUser.role === 'owner') {
        loadVehicles();
    }
};
