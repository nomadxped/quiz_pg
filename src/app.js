/**
 * Entry point for index.html logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('studentName');
    const subjectButtons = document.querySelectorAll('.subject-card');
  
    // Name logic removed
    subjectButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const subject = btn.dataset.subject;
        
        // Save to local storage 
        localStorage.setItem('pgdca_current_subject', subject);
        
        // Navigate
        window.location.href = './quiz.html';
      });
    });
});
