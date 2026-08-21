// Global Top Navigation Handler
document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-subject-btn');
    
    // Highlight active subject
    const lastSubject = localStorage.getItem('pgdca_current_subject');
    if (lastSubject) {
        navButtons.forEach(btn => {
            if (btn.dataset.subject === lastSubject) {
                btn.style.background = 'var(--primary-color)';
                btn.style.color = 'white';
                btn.style.borderColor = 'var(--primary-color)';
            }
        });
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const subject = btn.dataset.subject;
            const currentName = localStorage.getItem('pgdca_student_name');
            
            // If they haven't set a name yet, redirect home to set it
            if (!currentName) {
                localStorage.setItem('pgdca_current_subject', subject);
                window.location.href = './';
                return;
            }
            
            localStorage.setItem('pgdca_current_subject', subject);
            
            if (window.location.pathname.includes('leaderboard.html')) {
                window.location.reload();
            } 
            else if (!window.location.pathname.includes('quiz.html')) {
                window.location.href = './quiz.html';
            } 
            else {
                window.location.reload();
            }
        });
    });
});
