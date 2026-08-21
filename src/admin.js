import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const uploadSection = document.getElementById('uploadSection');
    
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const jsonFile = document.getElementById('jsonFile');
    const jsonEditor = document.getElementById('jsonEditor');
    const statusMsg = document.getElementById('statusMsg');

    // Monitor Auth State
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            loginSection.style.display = 'none';
            uploadSection.style.display = 'block';
            await loadCurrentDatabase();
        } else {
            loginSection.style.display = 'block';
            uploadSection.style.display = 'none';
            statusMsg.style.display = 'none';
        }
    });

    async function loadCurrentDatabase() {
        showStatus('Fetching current database...', 'success');
        try {
            const querySnapshot = await getDocs(collection(db, "questions"));
            let questions = [];
            querySnapshot.forEach((d) => {
                const data = d.data();
                questions.push({
                    subject: data.subject,
                    questionText: data.questionText,
                    options: data.options,
                    correctIndex: data.correctIndex
                });
            });
            
            if (questions.length === 0) {
               jsonEditor.value = "[\n  \n]";
            } else {
               jsonEditor.value = JSON.stringify(questions, null, 2);
            }
            statusMsg.style.display = 'none';
        } catch(e) {
            showStatus('Error loading database: ' + e.message, 'error');
        }
    }

    // Login Action
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('adminEmail').value;
        const pass = document.getElementById('adminPassword').value;
        if(!email || !pass) return;

        loginBtn.textContent = 'Logging in...';
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch(e) {
            showStatus('Login Failed: Check your credentials.', 'error');
            loginBtn.textContent = 'Login as Admin';
        }
    });

    // Logout Action
    logoutBtn.addEventListener('click', () => {
        signOut(auth);
    });

    // File loading into editor
    jsonFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            jsonEditor.value = e.target.result;
            showStatus('Loaded from file. Do not forget to hit Save.', 'success');
        };
        reader.readAsText(file);
    });

    // Upload/Replace Action
    uploadBtn.addEventListener('click', async () => {
        const rawJson = jsonEditor.value;
        let data;
        try {
            data = JSON.parse(rawJson);
            if (!Array.isArray(data)) {
                showStatus('Invalid JSON: Must be an array of questions.', 'error');
                return;
            }
        } catch (err) {
            showStatus('JSON Syntax Error. Please fix your formatting.', 'error');
            return;
        }
        
        const confirmCheck = confirm(`Are you sure? This will DELETE all existing questions in the database and replace them exactly with these ${data.length} questions.`);
        if(!confirmCheck) return;
        
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Replacing Database...';
        showStatus('Deleting old questions...', 'success');
        
        try {
            const querySnapshot = await getDocs(collection(db, "questions"));
            const deletePromises = querySnapshot.docs.map(docObj => deleteDoc(doc(db, "questions", docObj.id)));
            await Promise.all(deletePromises);
            
            showStatus('Saving new questions...', 'success');
            
            let successCount = 0;
            const addPromises = [];
            for (const q of data) {
                if(!q.subject || !q.questionText || !q.options || q.correctIndex === undefined) {
                    continue;
                }
                addPromises.push(addDoc(collection(db, "questions"), q));
                successCount++;
            }
            await Promise.all(addPromises);
            
            showStatus(`Success! Database replaced with ${successCount} questions.`, 'success');

        } catch (err) {
            console.error(err);
            showStatus('Upload Blocked: ' + err.message, 'error');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Save & Replace Database';
            jsonFile.value = '';
        }
    });

    function showStatus(msg, type) {
        statusMsg.textContent = msg;
        statusMsg.className = `status ${type}`;
        statusMsg.style.display = 'block';
    }
});
