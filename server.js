require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Servir arquivos estáticos da pasta 'public'
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
        }
        cb(null, true);
    }
});

// Configuração do Pool de Conexão com o Banco de Dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Rota principal que serve o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota de exemplo para testar a conexão com o banco de dados
app.get('/test-db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    res.json({ success: true, data: result.rows[0] });
    client.release();
  } catch (err) {
    console.error('Erro de conexão com o banco de dados:', err);
    res.status(500).json({ success: false, message: 'Erro ao conectar ao banco de dados.' });
  }
});

// Image upload and description endpoint
app.post('/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nenhum arquivo foi enviado.' 
            });
        }

        // Get file information
        const fileInfo = {
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            filename: req.file.filename
        };

        // Generate image description based on metadata
        const description = generateImageDescription(fileInfo);

        // Return the image URL and description
        res.json({
            success: true,
            imageUrl: `/uploads/${req.file.filename}`,
            description: description
        });
    } catch (error) {
        console.error('Erro ao processar upload:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao processar a imagem.' 
        });
    }
});

// Function to generate image description
function generateImageDescription(fileInfo) {
    const sizeInKB = (fileInfo.size / 1024).toFixed(2);
    const sizeInMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
    
    let imageType = 'Imagem';
    if (fileInfo.mimeType.includes('jpeg') || fileInfo.mimeType.includes('jpg')) {
        imageType = 'Imagem JPEG';
    } else if (fileInfo.mimeType.includes('png')) {
        imageType = 'Imagem PNG';
    } else if (fileInfo.mimeType.includes('gif')) {
        imageType = 'Imagem GIF';
    } else if (fileInfo.mimeType.includes('webp')) {
        imageType = 'Imagem WebP';
    }

    return {
        'Tipo': imageType,
        'Nome Original': fileInfo.originalName,
        'Formato': fileInfo.mimeType,
        'Tamanho': sizeInMB > 1 ? `${sizeInMB} MB` : `${sizeInKB} KB`,
        'Nome do Arquivo': fileInfo.filename
    };
}

// Error handling middleware for multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'O arquivo é muito grande. Tamanho máximo: 5MB.'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Erro no upload: ' + error.message
        });
    }
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    next();
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});


