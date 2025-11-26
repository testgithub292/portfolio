// auth.js - Authentication handling
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const loginMessage = document.getElementById('loginMessage');

    // Check if user is already logged in
    auth.onAuthStateChanged((user) => {
        if (user && window.location.pathname.includes('login.html')) {
            window.location.href = 'dashboard.html';
        } else if (!user && window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'login.html';
        }
    });

    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Validate inputs
        if (!email || !password) {
            showLoginMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showLoginMessage('Please enter a valid email address', 'error');
            return;
        }
        
        // Show loading state
        setLoginButtonState(true);
        
        try {
            // Sign in with Firebase Auth
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Check if user is admin (you can add custom claims in Firebase)
            const token = await user.getIdTokenResult();
            
            showLoginMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard after successful login
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Login failed. Please try again.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No user found with this email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled.';
                    break;
            }
            
            showLoginMessage(errorMessage, 'error');
        } finally {
            setLoginButtonState(false);
        }
    });

    function setLoginButtonState(loading) {
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoading = loginBtn.querySelector('.btn-loading');
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
            loginBtn.disabled = true;
        } else {
            btnText.style.display = 'flex';
            btnLoading.style.display = 'none';
            loginBtn.disabled = false;
        }
    }

    function showLoginMessage(message, type) {
        loginMessage.textContent = message;
        loginMessage.className = `message ${type}`;
        loginMessage.style.display = 'block';
        
        setTimeout(() => {
            loginMessage.style.display = 'none';
        }, 5000);
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
});