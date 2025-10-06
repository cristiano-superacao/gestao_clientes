// js/upload.js - Gerenciamento de upload de comprovantes
class UploadManager {
    constructor() {
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    }

    validateFile(file) {
        if (!file) {
            throw new Error('Nenhum arquivo selecionado');
        }

        if (file.size > this.maxFileSize) {
            throw new Error('Arquivo muito grande. Máximo 5MB permitido.');
        }

        if (!this.allowedTypes.includes(file.type)) {
            throw new Error('Tipo de arquivo não suportado. Use JPG, PNG, WEBP ou PDF.');
        }

        return true;
    }

    async convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsDataURL(file);
        });
    }

    async processComprovante(file) {
        try {
            this.validateFile(file);
            
            // Para arquivos grandes de imagem, redimensionar
            if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
                const resized = await this.resizeImage(file);
                return await this.convertToBase64(resized);
            }
            
            return await this.convertToBase64(file);
        } catch (error) {
            throw error;
        }
    }

    async resizeImage(file, maxWidth = 1200, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calcular nova dimensão mantendo proporção
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Desenhar imagem redimensionada
                ctx.drawImage(img, 0, 0, width, height);
                
                // Converter para blob
                canvas.toBlob(resolve, file.type, quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    createPreview(base64Data, fileName) {
        const preview = document.createElement('div');
        preview.className = 'file-preview';
        
        if (base64Data.startsWith('data:image/')) {
            preview.innerHTML = `
                <div class="preview-image">
                    <img src="${base64Data}" alt="Preview" style="max-width: 100px; max-height: 100px; border-radius: 4px;">
                </div>
                <div class="preview-info">
                    <span class="file-name">${fileName}</span>
                    <button class="btn-remove-file" title="Remover">🗑️</button>
                </div>
            `;
        } else {
            preview.innerHTML = `
                <div class="preview-document">
                    <span class="document-icon">📄</span>
                </div>
                <div class="preview-info">
                    <span class="file-name">${fileName}</span>
                    <button class="btn-remove-file" title="Remover">🗑️</button>
                </div>
            `;
        }
        
        return preview;
    }
}

// CSS para preview de arquivos
const uploadStyles = `
.file-upload-area {
    border: 2px dashed var(--border-color);
    border-radius: var(--border-radius);
    padding: var(--spacing-lg);
    text-align: center;
    cursor: pointer;
    transition: all var(--transition-fast);
    margin-top: var(--spacing-sm);
}

.file-upload-area:hover {
    border-color: var(--primary-color);
    background-color: var(--background-color);
}

.file-upload-area.dragover {
    border-color: var(--primary-color);
    background-color: var(--primary-light);
}

.file-preview {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    margin-top: var(--spacing-sm);
    background: var(--surface-color);
}

.preview-image img {
    object-fit: cover;
}

.preview-document {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    background: var(--background-color);
    border-radius: var(--border-radius);
    font-size: 24px;
}

.preview-info {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.file-name {
    font-weight: 500;
    color: var(--text-primary);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.btn-remove-file {
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--spacing-xs);
    border-radius: var(--border-radius);
    transition: background var(--transition-fast);
}

.btn-remove-file:hover {
    background: var(--danger-color);
    color: white;
}

.upload-progress {
    width: 100%;
    height: 4px;
    background: var(--background-color);
    border-radius: 2px;
    overflow: hidden;
    margin-top: var(--spacing-sm);
}

.upload-progress-bar {
    height: 100%;
    background: var(--primary-color);
    transition: width var(--transition-normal);
}
`;

// Adicionar estilos
const uploadStyleSheet = document.createElement('style');
uploadStyleSheet.textContent = uploadStyles;
document.head.appendChild(uploadStyleSheet);

window.UploadManager = UploadManager;