import { db } from './firebase-config.js';
import { collection, addDoc } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('uploadBtn');
    const jsonFile = document.getElementById('jsonFile');
    const statusMsg = document.getElementById('statusMsg');

    uploadBtn.addEventListener('click', async () => {
        if (!jsonFile.files || jsonFile.files.length === 0) {
            showStatus('Please select a JSON file.', 'error');
            return;
        }

        const file = jsonFile.files[0];
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!Array.isArray(data)) {
                    showStatus('Invalid JSON: Must be an array of questions.', 'error');
                    return;
                }
                
                uploadBtn.disabled = true;
                uploadBtn.textContent = 'Uploading...';
                
                let successCount = 0;
                for (const q of data) {
                    if(!q.subject || !q.questionText || !q.options || q.correctIndex === undefined) {
                        console.warn('Skipping invalid question:', q);
                        continue;
                    }
                    await addDoc(collection(db, "questions"), q);
                    successCount++;
                }
                
                showStatus(`Success! Uploaded ${successCount} questions.`, 'success');

            } catch (err) {
                console.error(err);
                showStatus('Error parsing JSON or uploading: ' + err.message, 'error');
            } finally {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Upload to Firestore';
                jsonFile.value = '';
            }
        };

        reader.readAsText(file);
    });

    function showStatus(msg, type) {
        statusMsg.textContent = msg;
        statusMsg.className = `status ${type}`;
        statusMsg.style.display = 'block';
    }
});
