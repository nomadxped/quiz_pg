import { db } from './firebase-config.js';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', async () => {
    const studentName = localStorage.getItem('pgdca_student_name');
    const subject = localStorage.getItem('pgdca_current_subject');

    if (!studentName || !subject) {
        window.location.href = '/';
        return;
    }

    document.getElementById('subjectDisplay').textContent = `Subject: ${subject}`;
    document.getElementById('studentDisplay').textContent = `Player: ${studentName}`;

    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    const nextBtn = document.getElementById('nextBtn');

    try {
        const q = query(collection(db, "questions"), where("subject", "==", subject));
        const querySnapshot = await getDocs(q);
        questions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        document.getElementById('loading').style.display = 'none';

        if (questions.length === 0) {
            document.getElementById('noQuestions').style.display = 'block';
            return;
        }

        document.getElementById('quizContent').style.display = 'block';
        showQuestion();

    } catch (error) {
        console.error("Error details:", error);
        alert(`Firebase Error: ${error.message}\n\n(Check your browser Developer Console for more details)`);
    }

    nextBtn.addEventListener('click', async () => {
        const selectedOption = document.querySelector('.option-btn.selected');
        if (!selectedOption) {
            alert('Please select an option first!');
            return;
        }

        if (selectedOption.dataset.correct === 'true') {
            score++;
        }

        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
            nextBtn.style.display = 'none';
        } else {
            await submitScore(score, questions.length);
        }
    });

    function showQuestion() {
        const qContainer = document.getElementById('questionContainer');
        const q = questions[currentQuestionIndex];
        qContainer.innerHTML = '';
        
        const qText = document.createElement('h3');
        qText.textContent = `${currentQuestionIndex + 1}. ${q.questionText}`;
        qText.style.marginBottom = '1rem';
        qText.style.fontSize = '1.3rem';
        qContainer.appendChild(qText);

        const optionsGrid = document.createElement('div');
        optionsGrid.className = 'options-grid';

        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.dataset.correct = (idx === q.correctIndex) ? 'true' : 'false';
            
            btn.addEventListener('click', () => {
                document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                nextBtn.style.display = 'block';
            });
            optionsGrid.appendChild(btn);
        });

        qContainer.appendChild(optionsGrid);
        nextBtn.textContent = (currentQuestionIndex === questions.length - 1) ? 'Finish Quiz' : 'Next Question';
    }

    async function submitScore(finalScore, total) {
        try {
            document.getElementById('quizContent').innerHTML = `
                <div style="text-align: center; margin: 3rem 0;">
                    <h2>Submitting your score...</h2>
                    <br/>
                    <div style="width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.2); border-left-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>
                <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
            `;
            await addDoc(collection(db, "scores"), {
                studentName,
                subject,
                score: finalScore,
                total,
                timestamp: new Date()
            });
            window.location.href = '/leaderboard.html';
        } catch (e) {
            console.error("Error submitting score: ", e);
            alert("Error submitting score. See console.");
        }
    }
});
