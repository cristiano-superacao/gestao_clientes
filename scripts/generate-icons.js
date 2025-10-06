// scripts/generate-icons.js
// Gera vários tamanhos de ícone usando JIMP (sem dependências nativas)
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'assets', 'icon.svg');
const outDir = path.join(__dirname, '..', 'assets');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Criar um PNG base simples se o SVG não puder ser processado
const createBasePng = async (size) => {
  const image = new Jimp(size, size, '#004aad');
  
  // Adicionar elementos visuais simples
  const white = Jimp.rgbaToInt(255, 255, 255, 255);
  const blue = Jimp.rgbaToInt(0, 74, 173, 255);
  
  // Desenhar retângulo central
  const margin = Math.floor(size * 0.15);
  for (let x = margin; x < size - margin; x++) {
    for (let y = margin; y < size - margin; y++) {
      if (x === margin || x === size - margin - 1 || y === margin || y === size - margin - 1) {
        image.setPixelColor(white, x, y);
      }
    }
  }
  
  // Adicionar linhas horizontais (simulando dados)
  const lineY1 = Math.floor(size * 0.35);
  const lineY2 = Math.floor(size * 0.50);
  const lineY3 = Math.floor(size * 0.65);
  
  for (let x = margin + 10; x < size - margin - 10; x++) {
    image.setPixelColor(blue, x, lineY1);
    image.setPixelColor(blue, x, lineY2);
    image.setPixelColor(blue, x, lineY3);
  }
  
  return image;
};

async function generate() {
  console.log('Gerando ícones PWA usando JIMP...');
  
  for (const size of sizes) {
    const out = path.join(outDir, `icon-${size}.png`);
    try {
      const image = await createBasePng(size);
      await image.writeAsync(out);
      console.log(`✓ Gerado: icon-${size}.png`);
    } catch (err) {
      console.error(`✗ Erro ao gerar icon-${size}.png:`, err.message);
    }
  }

  console.log('Geração de ícones finalizada!');
}

generate();