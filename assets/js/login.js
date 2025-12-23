// Login Modal Injection and Logic

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'assets/css/login.css'; 
    document.head.appendChild(link);

    // 2. Inject Modal HTML
    const modalHTML = `
    <div id="login-overlay" class="login-modal-overlay">
        <div class="login-modal">
            <button id="login-close" class="login-close">&times;</button>
            <div class="login-header">
                <h2 class="login-title">Internal Login</h2>
                <span class="login-badge">Owners & Drivers Only</span>
            </div>
            
            <form id="login-form" class="login-body">
                <div id="login-error" class="login-error"></div>
                
                <div class="login-form-group">
                    <label for="username" class="login-label">Username / ID</label>
                    <input type="text" id="username" class="login-input" placeholder="Enter your ID" required>
                </div>
                
                <div class="login-form-group">
                    <label for="password" class="login-label">Password</label>
                    <input type="password" id="password" class="login-input" placeholder="••••••••" required>
                </div>
                
                <button type="submit" class="login-btn">Sign In</button>
            </form>
            
            <div class="login-footer">
                <p>Authorized access only. All activities are monitored.</p>
            </div>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 3. Logic
    const overlay = document.getElementById('login-overlay');
    const closeBtn = document.getElementById('login-close');
    const form = document.getElementById('login-form');
    const errorMsg = document.getElementById('login-error');

    // Open Modal Function (to be attached to the nav button)
    window.openLoginModal = () => {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        document.getElementById('username').focus();
    };

    // Close Logic
    const closeLoginModal = () => {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        errorMsg.style.display = 'none';
        form.reset();
    };

    closeBtn.addEventListener('click', closeLoginModal);
    
    // Close on outside click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeLoginModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeLoginModal();
        }
    });

    // Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const btn = form.querySelector('button');
        
        // Loading State
        const originalText = btn.innerText;
        btn.innerText = 'Verifying...';
        btn.disabled = true;
        errorMsg.style.display = 'none';

        try {
            // Call Worker API
            const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://127.0.0.1:8787/auth/login' 
                : 'https://ecity-enquiry-worker.deepuavm.workers.dev/auth/login';

            const response = await fetch(API_URL, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();

            if (response.ok && data.token) {
                // Success - save user data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userRole', data.role);
                localStorage.setItem('userName', data.name);
                localStorage.setItem('userId', data.id);
                localStorage.setItem('userPermissions', data.permissions);
                window.location.href = 'dashboard.html';
            } else {
                throw new Error(data.error || 'Invalid credentials');
            }

        } catch (err) {
            errorMsg.innerText = err.message;
            errorMsg.style.display = 'block';
            
            // Shake animation for error
            const modalContent = document.querySelector('.login-modal');
            modalContent.style.transform = 'scale(1) translateX(10px)';
            setTimeout(() => {
                modalContent.style.transform = 'scale(1) translateX(-10px)';
                setTimeout(() => {
                    modalContent.style.transform = 'scale(1)';
                }, 100);
            }, 100);

        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
});
