import { db } from './firebase-config.js';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', async () => {
    const studentName = localStorage.getItem('pgdca_student_name');
    const subject = localStorage.getItem('pgdca_current_subject');

    if (!studentName || !subject) {
        window.location.href = './';
        return;
    }

    document.getElementById('subjectDisplay').textContent = `Subject: ${subject}`;
    document.getElementById('studentDisplay').textContent = `Player: ${studentName}`;

    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let wrongScore = 0;
    let currentScoreDocId = null;

    // Web Audio API for synthetic sounds
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();

    function playSound(type) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        if (type === 'right') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
        } else if (type === 'wrong') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }
    }

    try {
        const q = query(collection(db, "questions"), where("subject", "==", subject));
        const querySnapshot = await getDocs(q);
        questions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Shuffle questions
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }

        document.getElementById('loading').style.display = 'none';

        if (questions.length === 0) {
            document.getElementById('noQuestions').style.display = 'block';
            return;
        }

        // Initialize score doc for live tracking
        const docRef = await addDoc(collection(db, "scores"), {
            studentName,
            subject,
            score: 0,
            total: questions.length,
            timestamp: new Date()
        });
        currentScoreDocId = docRef.id;

        document.getElementById('quizContent').style.display = 'block';
        document.getElementById('liveScoreTracker').style.display = 'block';
        showQuestion();

    } catch (error) {
        console.error("Error details:", error);
        alert(`Firebase Error: ${error.message}\n\n(Check your browser Developer Console for more details)`);
    }

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
            
            btn.addEventListener('click', async () => {
                // Prevent multiple clicks
                if (optionsGrid.style.pointerEvents === 'none') return;
                optionsGrid.style.pointerEvents = 'none';
                
                const isCorrect = btn.dataset.correct === 'true';
                
                // Color choices KBC style
                if (isCorrect) {
                    btn.classList.add('selected');
                    btn.style.backgroundColor = '#10b981'; // Green
                    btn.style.borderColor = '#10b981';
                    playSound('right');
                    score++;
                    document.getElementById('correctPts').textContent = score;
                    if (currentScoreDocId) {
                        try {
                            await updateDoc(doc(db, "scores", currentScoreDocId), { score });
                        } catch (e) {
                            console.error("Live track error:", e);
                        }
                    }
                } else {
                    btn.classList.add('selected');
                    btn.style.backgroundColor = '#ef4444'; // Red
                    btn.style.borderColor = '#ef4444';
                    playSound('wrong');
                    wrongScore++;
                    document.getElementById('wrongPts').textContent = wrongScore;
                    
                    // Highlight actual correct answer in green
                    document.querySelectorAll('.option-btn').forEach(b => {
                        if (b.dataset.correct === 'true') {
                            b.style.backgroundColor = '#10b981';
                            b.style.borderColor = '#10b981';
                        }
                    });
                }
                
                // Wait for a few seconds before moving on
                setTimeout(async () => {
                    currentQuestionIndex++;
                    if (currentQuestionIndex < questions.length) {
                        showQuestion();
                    } else {
                        await submitScore(score, questions.length);
                    }
                }, 2000);
            });
            optionsGrid.appendChild(btn);
        });

        qContainer.appendChild(optionsGrid);
    }

    async function submitScore(finalScore, total) {
        document.getElementById('quizContent').innerHTML = `
            <div style="text-align: center; margin: 3rem 0;">
                <h2>Quiz Completed! Redirecting...</h2>
                <br/>
                <div style="width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.2); border-left-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
            <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
        `;
        setTimeout(() => { window.location.href = './leaderboard.html'; }, 1500);
    }
});
