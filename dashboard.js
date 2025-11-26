// dashboard.js - Simplified Dashboard
let currentUser = null;
let messages = [];
let currentPage = 1;
const messagesPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase auth is available
    if (typeof auth === 'undefined') {
        console.error('Firebase Auth not available');
        window.location.href = 'login.html';
        return;
    }

    // Check authentication state
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('User authenticated:', user.email);
            currentUser = user;
            initializeDashboard();
        } else {
            console.log('No user authenticated, redirecting to login');
            window.location.href = 'login.html';
        }
    });

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.signOut().then(() => {
            console.log('User signed out');
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Sign out error:', error);
            showNotification('Logout failed: ' + error.message, 'error');
        });
    });

    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', loadMessages);

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function() {
        currentPage = 1;
        renderMessages();
    });

    // Filter functionality
    document.getElementById('filterStatus').addEventListener('change', function() {
        currentPage = 1;
        renderMessages();
    });

    document.getElementById('filterDate').addEventListener('change', function() {
        currentPage = 1;
        renderMessages();
    });

    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderMessages();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(getFilteredMessages().length / messagesPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderMessages();
        }
    });

    // Export functionality
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
});

function initializeDashboard() {
    // Set user info
    document.getElementById('userName').textContent = currentUser.email;
    
    // Set current date
    updateDateDisplay();
    
    // Load initial data
    loadMessages();
    loadStats();
}

function switchTab(tabName) {
    // Update active tab in sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    switch(tabName) {
        case 'dashboard':
            pageTitle.textContent = 'Dashboard Overview';
            break;
        case 'contacts':
            pageTitle.textContent = 'Contact Messages';
            break;
        case 'users':
            pageTitle.textContent = 'User Management';
            break;
    }
}

async function loadMessages() {
    try {
        console.log('Loading messages...');
        
        const snapshot = await db.collection('contactsphixxlabs')
            .orderBy('timestamp', 'desc')
            .get();
        
        console.log('Messages loaded:', snapshot.size);
        
        messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date(),
            read: doc.data().read || false
        }));
        
        renderMessages();
        updateMessageCount();
        
    } catch (error) {
        console.error('Error loading messages:', error);
        showNotification('Error loading messages: ' + error.message, 'error');
    }
}

function renderMessages() {
    const tbody = document.getElementById('messagesTableBody');
    const filteredMessages = getFilteredMessages();
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * messagesPerPage;
    const endIndex = startIndex + messagesPerPage;
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    
    if (paginatedMessages.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--gray);">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
                    No messages found
                </td>
            </tr>
        `;
        return;
    }
    
    paginatedMessages.forEach(message => {
        const row = document.createElement('tr');
        const messagePreview = message.message.length > 100 
            ? message.message.substring(0, 100) + '...' 
            : message.message;
        
        const statusClass = message.read ? 'status-read' : 'status-unread';
        const statusText = message.read ? 'Read' : 'Unread';
        
        row.innerHTML = `
            <td>${escapeHtml(message.name)}</td>
            <td>${escapeHtml(message.email)}</td>
            <td>${escapeHtml(message.subject || 'No Subject')}</td>
            <td>${escapeHtml(messagePreview)}</td>
            <td>${formatDate(message.timestamp)}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewMessage('${message.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="action-btn edit" onclick="editMessage('${message.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete" onclick="deleteMessage('${message.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    updatePagination();
}

function getFilteredMessages() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const dateFilter = document.getElementById('filterDate').value;
    
    return messages.filter(message => {
        // Search filter
        const matchesSearch = 
            message.name.toLowerCase().includes(searchTerm) ||
            message.email.toLowerCase().includes(searchTerm) ||
            message.subject?.toLowerCase().includes(searchTerm) ||
            message.message.toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) return false;
        
        // Status filter
        if (statusFilter === 'unread' && message.read) return false;
        if (statusFilter === 'read' && !message.read) return false;
        
        // Date filter
        if (dateFilter !== 'all') {
            const messageDate = new Date(message.timestamp);
            const today = new Date();
            
            switch(dateFilter) {
                case 'today':
                    if (!isSameDay(messageDate, today)) return false;
                    break;
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    if (messageDate < weekAgo) return false;
                    break;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    if (messageDate < monthAgo) return false;
                    break;
            }
        }
        
        return true;
    });
}

function updatePagination() {
    const filteredMessages = getFilteredMessages();
    const totalPages = Math.ceil(filteredMessages.length / messagesPerPage);
    
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || totalPages === 0;
}

async function viewMessage(messageId) {
    try {
        const message = messages.find(m => m.id === messageId);
        if (!message) return;
        
        // Mark as read if not already read
        if (!message.read) {
            try {
                await db.collection('contactsphixxlabs').doc(messageId).update({
                    read: true,
                    readAt: firebase.firestore.FieldValue.serverTimestamp(),
                    readBy: currentUser.email
                });
                
                // Update local data
                message.read = true;
                message.readBy = currentUser.email;
                message.readAt = new Date();
            } catch (error) {
                console.error('Error marking message as read:', error);
            }
        }
        
        // Show modal with message details
        const modal = document.getElementById('messageModal');
        const modalBody = document.getElementById('messageModalBody');
        
        modalBody.innerHTML = `
            <div class="message-detail">
                <div class="detail-row">
                    <label>Name:</label>
                    <span>${escapeHtml(message.name)}</span>
                </div>
                <div class="detail-row">
                    <label>Email:</label>
                    <span><a href="mailto:${escapeHtml(message.email)}">${escapeHtml(message.email)}</a></span>
                </div>
                <div class="detail-row">
                    <label>Subject:</label>
                    <span>${escapeHtml(message.subject || 'No Subject')}</span>
                </div>
                <div class="detail-row">
                    <label>Date:</label>
                    <span>${formatDate(message.timestamp)}</span>
                </div>
                <div class="detail-row">
                    <label>Status:</label>
                    <span class="status-badge ${message.read ? 'status-read' : 'status-unread'}">
                        ${message.read ? 'Read' : 'Unread'}
                    </span>
                </div>
                <div class="detail-row full-width">
                    <label>Message:</label>
                    <div class="message-content">${escapeHtml(message.message)}</div>
                </div>
                ${message.read ? `
                <div class="detail-row">
                    <label>Read By:</label>
                    <span>${escapeHtml(message.readBy || currentUser.email)}</span>
                </div>
                <div class="detail-row">
                    <label>Read At:</label>
                    <span>${message.readAt ? formatDate(message.readAt) : 'Just now'}</span>
                </div>
                ` : ''}
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // Close modal functionality
        document.querySelector('.modal-close').onclick = () => {
            modal.style.display = 'none';
        };
        
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
        
    } catch (error) {
        console.error('Error viewing message:', error);
        showNotification('Error loading message details: ' + error.message, 'error');
    }
}

async function editMessage(messageId) {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    // Show edit modal
    const modal = document.getElementById('messageModal');
    const modalBody = document.getElementById('messageModalBody');
    
    modalBody.innerHTML = `
        <div class="edit-message">
            <h3>Edit Message</h3>
            <form id="editForm">
                <div class="form-group">
                    <label>Name:</label>
                    <input type="text" id="editName" class="form-control" value="${escapeHtml(message.name)}" required>
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="editEmail" class="form-control" value="${escapeHtml(message.email)}" required>
                </div>
                <div class="form-group">
                    <label>Subject:</label>
                    <input type="text" id="editSubject" class="form-control" value="${escapeHtml(message.subject || '')}">
                </div>
                <div class="form-group">
                    <label>Message:</label>
                    <textarea id="editMessage" class="form-control" rows="6" required>${escapeHtml(message.message)}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Handle form submission
    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const updatedData = {
            name: document.getElementById('editName').value,
            email: document.getElementById('editEmail').value,
            subject: document.getElementById('editSubject').value,
            message: document.getElementById('editMessage').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUser.email
        };
        
        try {
            await db.collection('contactsphixxlabs').doc(messageId).update(updatedData);
            
            // Update local data
            Object.assign(message, updatedData);
            
            showNotification('Message updated successfully', 'success');
            renderMessages();
            closeModal();
            
        } catch (error) {
            console.error('Error updating message:', error);
            showNotification('Error updating message: ' + error.message, 'error');
        }
    });
    
    // Close modal functionality
    document.querySelector('.modal-close').onclick = closeModal;
    window.onclick = (event) => {
        if (event.target === modal) closeModal();
    };
}

async function deleteMessage(messageId) {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    if (!confirm(`Are you sure you want to delete the message from ${message.name}?`)) {
        return;
    }
    
    try {
        await db.collection('contactsphixxlabs').doc(messageId).delete();
        
        // Remove from local data
        messages = messages.filter(m => m.id !== messageId);
        
        showNotification('Message deleted successfully', 'success');
        renderMessages();
        loadStats();
        
    } catch (error) {
        console.error('Error deleting message:', error);
        showNotification('Error deleting message: ' + error.message, 'error');
    }
}

function closeModal() {
    document.getElementById('messageModal').style.display = 'none';
}

async function loadStats() {
    try {
        const snapshot = await db.collection('contactsphixxlabs').get();
        const allMessages = snapshot.docs.map(doc => ({
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date(),
            read: doc.data().read || false
        }));
        
        const today = new Date();
        const todayMessages = allMessages.filter(msg => 
            isSameDay(msg.timestamp, today)
        );
        
        const unreadMessages = allMessages.filter(msg => !msg.read);
        
        document.getElementById('totalMessages').textContent = allMessages.length;
        document.getElementById('todayMessages').textContent = todayMessages.length;
        document.getElementById('unreadMessages').textContent = unreadMessages.length;
        document.getElementById('messageCount').textContent = allMessages.length;
        
        // Calculate response rate
        const respondedMessages = allMessages.filter(msg => msg.responded).length;
        const responseRate = allMessages.length > 0 
            ? Math.round((respondedMessages / allMessages.length) * 100)
            : 0;
        document.getElementById('responseRate').textContent = responseRate + '%';
        
        // Update recent activity
        updateRecentActivity(allMessages.slice(0, 5));
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateRecentActivity(recentMessages) {
    const activityList = document.getElementById('recentActivity');
    
    if (recentMessages.length === 0) {
        activityList.innerHTML = `
            <div style="text-align: center; color: var(--gray); padding: 20px;">
                No recent activity
            </div>
        `;
        return;
    }
    
    activityList.innerHTML = recentMessages.map(message => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-envelope"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">New message from ${escapeHtml(message.name)}</div>
                <div class="activity-time">${formatTimeAgo(message.timestamp)}</div>
            </div>
        </div>
    `).join('');
}

function updateMessageCount() {
    document.getElementById('messageCount').textContent = messages.length;
}

function updateDateDisplay() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

function exportToCSV() {
    const filteredMessages = getFilteredMessages();
    
    if (filteredMessages.length === 0) {
        showNotification('No messages to export', 'warning');
        return;
    }
    
    const headers = ['Name', 'Email', 'Subject', 'Message', 'Date', 'Status'];
    const csvData = filteredMessages.map(msg => [
        `"${msg.name}"`,
        `"${msg.email}"`,
        `"${msg.subject || ''}"`,
        `"${msg.message.replace(/"/g, '""')}"`,
        `"${formatDate(msg.timestamp)}"`,
        `"${msg.read ? 'Read' : 'Unread'}"`
    ]);
    
    const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contact-messages-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('CSV exported successfully', 'success');
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return formatDate(date);
}

function isSameDay(date1, date2) {
    return date1.toDateString() === date2.toDateString();
}

function showNotification(message, type) {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(notif => notif.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        animation: slideIn 0.3s ease;
        font-weight: 500;
        box-shadow: var(--shadow-lg);
    `;
    
    if (type === 'success') {
        notification.style.background = 'var(--success)';
    } else if (type === 'error') {
        notification.style.background = 'var(--danger)';
    } else if (type === 'warning') {
        notification.style.background = 'var(--warning)';
        notification.style.color = 'var(--dark)';
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Add CSS for notification animation
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .notification button {
            background: none;
            border: none;
            color: inherit;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background 0.2s;
        }
        
        .notification button:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .action-buttons {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
        }
        
        .action-btn {
            padding: 6px 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .action-btn.view {
            background: var(--info);
            color: white;
        }
        
        .action-btn.edit {
            background: var(--warning);
            color: white;
        }
        
        .action-btn.delete {
            background: var(--danger);
            color: white;
        }
        
        .action-btn:hover {
            opacity: 0.8;
            transform: translateY(-1px);
        }
        
        .form-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        }
        
        .btn-secondary {
            background: var(--gray);
            color: white;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
        }
    `;
    document.head.appendChild(style);
}