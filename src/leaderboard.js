import { db } from './firebase-config.js';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', () => {
    const subjectSelect = document.getElementById('subjectSelect');
    const loading = document.getElementById('loading');
    const list = document.getElementById('leaderboardList');

    const lastSubject = localStorage.getItem('pgdca_current_subject');
    if(lastSubject) {
        subjectSelect.value = lastSubject;
    }

    loadLeaderboard();

    subjectSelect.addEventListener('change', loadLeaderboard);

    async function loadLeaderboard() {
        list.innerHTML = '';
        loading.style.display = 'block';
        const subject = subjectSelect.value;
        
        try {
            const q = query(
                collection(db, "scores"), 
                where("subject", "==", subject)
            );
            
            const querySnapshot = await getDocs(q);
            let scores = querySnapshot.docs.map(doc => doc.data());
            
            // Sort highest score first, then earliest timestamp
            scores.sort((a, b) => b.score - a.score || a.timestamp - b.timestamp);

            loading.style.display = 'none';
            if (scores.length === 0) {
                list.innerHTML = `<li style="text-align: center; color: #94a3b8; font-style: italic;">No scores recorded yet for this subject. Be the first to play!</li>`;
                return;
            }

            scores.forEach((s, idx) => {
                const li = document.createElement('li');
                li.style.padding = '1.25rem';
                li.style.margin = '0.75rem 0';
                li.style.background = idx === 0 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.05)';
                li.style.border = idx === 0 ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(255,255,255,0.1)';
                li.style.borderRadius = '12px';
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'center';
                li.style.fontWeight = idx === 0 ? '800' : '600';
                
                let rankEmoji = `#${idx+1}`;
                if (idx === 0) rankEmoji = '🥇';
                else if (idx === 1) rankEmoji = '🥈';
                else if (idx === 2) rankEmoji = '🥉';

                li.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="font-size: 1.5rem; width: 30px; text-align: center;">${rankEmoji}</span>
                        <span style="font-size: 1.1rem;">${s.studentName}</span>
                    </div>
                    <span style="color: ${idx === 0 ? '#fbbf24' : 'var(--primary-color)'}; font-size: 1.25rem;">${s.score}/${s.total}</span>
                `;
                list.appendChild(li);
            });
        } catch(e) {
            console.error("Error loading DB: ", e);
            loading.style.display = 'none';
            alert("Error connecting to Firebase.");
        }
    }
});
