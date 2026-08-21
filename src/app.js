/**
 * Entry point for index.html logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('studentName');
    const subjectButtons = document.querySelectorAll('.subject-card');
  
    // Pre-fill name if exists
    const existingName = localStorage.getItem('pgdca_student_name');
    if(existingName) {
        nameInput.value = existingName;
    }

    subjectButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) {
          alert('Please enter your full name first!');
          nameInput.focus();
          return;
        }
        const subject = btn.dataset.subject;
        
        // Save to local storage 
        localStorage.setItem('pgdca_student_name', name);
        localStorage.setItem('pgdca_current_subject', subject);
        
        // Navigate
        window.location.href = '/quiz.html';
      });
    });
});
