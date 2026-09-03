import { db } from './firebase-config.js';
import { collection, query, where, getDocs } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', async () => {
    const subject = localStorage.getItem('pgdca_current_subject');

    if (!subject) {
        window.location.href = './';
        return;
    }

    document.getElementById('subjectDisplay').textContent = `Subject: ${subject}`;

    const genericMotivations = [
        "You've got this! Keep pushing forward! 🚀",
        "Believe in yourself! Every question is a new opportunity. ✨",
        "Success is a journey, not a destination. Enjoy the process! 🎯",
        "Stay focused and stay sharp! 🧠",
        "You are capable of amazing things! 🌟"
    ];

    const mistakeMotivations = [
        "Keep going, mistakes happen! That's how we learn. 💪",
        "Don't worry! Every mistake is a stepping stone to success. 🧗‍♂️",
        "Dust it off and try the next one. You can do it! 🌈",
        "It's just a small bump in the road. Keep moving forward! 🛣️",
        "Learning is about making mistakes and growing from them. 🌱"
    ];

    const motivationalLineEl = document.getElementById('motivationalLine');
    function setRandomMotivation(type = 'generic') {
        const arr = type === 'mistake' ? mistakeMotivations : genericMotivations;
        const randomQuote = arr[Math.floor(Math.random() * arr.length)];
        motivationalLineEl.textContent = randomQuote;
    }


    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let wrongScore = 0;
    let userAnswers = []; // stores { selectedIndex: Number, isCorrect: Boolean }
    
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentQuestionIndex === questions.length - 1) {
            submitScore(score, questions.length);
            return;
        }
        currentQuestionIndex++;
        showQuestion();
    });

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

        document.getElementById('quizContent').style.display = 'block';
        document.getElementById('liveScoreTracker').style.display = 'block';
        setRandomMotivation('generic');
        showQuestion();

    } catch (error) {
        console.error("Error details:", error);
        alert(`Firebase Error: ${error.message}\n\n(Check your browser Developer Console for more details)`);
    }

    function showQuestion() {
        const qContainer = document.getElementById('questionContainer');
        const q = questions[currentQuestionIndex];
        qContainer.innerHTML = '';
        
        // Update Nav Buttons
        prevBtn.disabled = currentQuestionIndex === 0;
        prevBtn.style.opacity = currentQuestionIndex === 0 ? '0.5' : '1';
        
        if (currentQuestionIndex === questions.length - 1) {
            nextBtn.textContent = 'Finish Quiz';
            nextBtn.style.backgroundColor = 'var(--primary-color)';
        } else {
            nextBtn.textContent = userAnswers[currentQuestionIndex] !== undefined ? 'Next' : 'Skip';
            nextBtn.style.backgroundColor = userAnswers[currentQuestionIndex] !== undefined ? 'var(--primary-color)' : '#475569';
        }
        
        const qText = document.createElement('h3');
        qText.textContent = `${currentQuestionIndex + 1}. ${q.questionText}`;
        qText.style.marginBottom = '1rem';
        qText.style.fontSize = '1.3rem';
        qContainer.appendChild(qText);

        const optionsGrid = document.createElement('div');
        optionsGrid.className = 'options-grid';

        const existingAnswer = userAnswers[currentQuestionIndex];

        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.dataset.correct = (idx === q.correctIndex) ? 'true' : 'false';
            
            if (existingAnswer !== undefined) {
                // Already answered -> Read-only mode
                optionsGrid.style.pointerEvents = 'none';
                
                if (idx === existingAnswer.selectedIndex) {
                    btn.classList.add('selected');
                    if (existingAnswer.isCorrect) {
                        btn.style.backgroundColor = '#10b981'; 
                        btn.style.borderColor = '#10b981';
                    } else {
                        btn.style.backgroundColor = '#ef4444'; 
                        btn.style.borderColor = '#ef4444';
                    }
                }
                
                if (idx === q.correctIndex) {
                    btn.style.backgroundColor = '#10b981';
                    btn.style.borderColor = '#10b981';
                }
            } else {
                btn.addEventListener('click', () => {
                    if (optionsGrid.style.pointerEvents === 'none') return;
                    optionsGrid.style.pointerEvents = 'none';
                    
                    const isCorrect = btn.dataset.correct === 'true';
                    
                    userAnswers[currentQuestionIndex] = {
                        selectedIndex: idx,
                        isCorrect: isCorrect
                    };
                    
                    if (isCorrect) {
                        btn.classList.add('selected');
                        btn.style.backgroundColor = '#10b981';
                        btn.style.borderColor = '#10b981';
                        playSound('right');
                        score++;
                        document.getElementById('correctPts').textContent = score;
                        setRandomMotivation('generic');
                    } else {
                        btn.classList.add('selected');
                        btn.style.backgroundColor = '#ef4444';
                        btn.style.borderColor = '#ef4444';
                        playSound('wrong');
                        wrongScore++;
                        document.getElementById('wrongPts').textContent = wrongScore;
                        setRandomMotivation('mistake');
                        
                        document.querySelectorAll('.option-btn').forEach(b => {
                            if (b.dataset.correct === 'true') {
                                b.style.backgroundColor = '#10b981';
                                b.style.borderColor = '#10b981';
                            }
                        });
                    }
                    
                    // Update Next button visually to indicate they should proceed
                    if (currentQuestionIndex !== questions.length - 1) {
                        nextBtn.textContent = 'Next';
                        nextBtn.style.backgroundColor = 'var(--primary-color)';
                    }
                    
                    // Auto-advance
                    setTimeout(() => {
                        if (currentQuestionIndex < questions.length - 1) {
                            currentQuestionIndex++;
                            showQuestion();
                        } else {
                            submitScore(score, questions.length);
                        }
                    }, 2000);
                });
            }
            optionsGrid.appendChild(btn);
        });

        qContainer.appendChild(optionsGrid);
    }

    function submitScore(finalScore, total) {
        document.getElementById('quizContent').innerHTML = `
            <div style="text-align: center; margin: 3rem 0;">
                <h2>Quiz Completed!</h2>
                <p style="font-size: 1.2rem; margin-top: 1rem; color: #a5b4fc;">You scored ${finalScore} out of ${total}.</p>
                <div style="margin-top: 2rem;">
                    <a href="./" class="nav-link" style="background: rgba(255,255,255,0.1); padding: 0.75rem 1.5rem; border-radius: 8px;">Go Home</a>
                </div>
            </div>
        `;
    }
});
