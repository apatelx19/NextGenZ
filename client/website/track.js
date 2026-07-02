document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('trackForm');
    const trackBtn = document.getElementById('trackBtn');
    const btnText = document.querySelector('.btn-text');
    const loader = document.querySelector('.loader');
    const errorMsg = document.getElementById('errorMessage');
    const resultsContainer = document.getElementById('trackerResults');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset UI
        errorMsg.style.display = 'none';
        resultsContainer.style.display = 'none';
        btnText.style.display = 'none';
        loader.style.display = 'block';
        trackBtn.disabled = true;

        const email = document.getElementById('trackEmail').value;
        const phone = document.getElementById('trackPhone').value;

        try {
            const response = await fetch('/api/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, phone })
            });

            const data = await response.json();

            if (data.success) {
                // Populate results
                const app = data.application;
                document.getElementById('resName').textContent = app.fullName;
                document.getElementById('resDomain').textContent = app.domain;
                document.getElementById('resPayment').textContent = app.paymentId || 'N/A';
                document.getElementById('resDate').textContent = new Date(app.createdAt).toLocaleDateString();
                
                const badge = document.getElementById('statusBadge');
                badge.textContent = app.status;
                
                // Clear old classes
                badge.className = 'status-badge';
                // Sanitize class name by replacing spaces with hyphens
                const sanitizedStatus = app.status.toLowerCase().replace(/\s+/g, '-');
                badge.classList.add(`status-${sanitizedStatus}`);
                
                // Add status-specific colors dynamically
                if (app.status === 'Pending' || app.status.startsWith('Pending')) {
                    badge.style.backgroundColor = 'rgba(210, 153, 34, 0.2)';
                    badge.style.color = '#d29922';
                } else if (app.status === 'Under Review') {
                    badge.style.backgroundColor = 'rgba(108, 99, 255, 0.2)';
                    badge.style.color = '#6c63ff';
                } else if (app.status === 'Selected' || app.status === 'Shortlisted' || app.status === 'Verified') {
                    badge.style.backgroundColor = 'rgba(46, 160, 67, 0.2)';
                    badge.style.color = '#2ea043';
                } else if (app.status === 'Rejected') {
                    badge.style.backgroundColor = 'rgba(248, 81, 73, 0.2)';
                    badge.style.color = '#f85149';
                }

                // Show results
                resultsContainer.style.display = 'block';
            } else {
                showError(data.message || 'No application found with these details.');
            }
        } catch (error) {
            console.error('Error tracking application:', error);
            showError('Network error. Please try again later.');
        } finally {
            // Restore button
            btnText.style.display = 'block';
            loader.style.display = 'none';
            trackBtn.disabled = false;
        }
    });

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
    }
});
