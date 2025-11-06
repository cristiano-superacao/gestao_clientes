console.log("Script principal carregado.");

document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const imageInput = document.getElementById('imageInput');
    const resultSection = document.getElementById('result');
    const errorSection = document.getElementById('error');
    const uploadedImage = document.getElementById('uploadedImage');
    const imageDescription = document.getElementById('imageDescription');

    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Hide previous results
        resultSection.style.display = 'none';
        errorSection.style.display = 'none';
        
        const formData = new FormData();
        const file = imageInput.files[0];
        
        if (!file) {
            showError('Por favor, selecione uma imagem.');
            return;
        }
        
        formData.append('image', file);
        
        // Disable submit button
        const submitButton = uploadForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
        
        try {
            const response = await fetch('/upload-image', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Show the uploaded image
                uploadedImage.src = data.imageUrl;
                
                // Show the description
                imageDescription.innerHTML = formatDescription(data.description);
                
                // Show result section
                resultSection.style.display = 'block';
            } else {
                showError(data.message || 'Erro ao processar a imagem.');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Erro ao enviar a imagem. Por favor, tente novamente.');
        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar e Descrever';
        }
    });
    
    function formatDescription(description) {
        let html = '<ul>';
        for (const [key, value] of Object.entries(description)) {
            html += `<li><strong>${key}:</strong> ${value}</li>`;
        }
        html += '</ul>';
        return html;
    }
    
    function showError(message) {
        errorSection.textContent = message;
        errorSection.style.display = 'block';
    }
});
