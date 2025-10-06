#!/bin/bash
# Script para gerar ícones PWA em diferentes tamanhos
# Este script usa ImageMagick (convert) para gerar os ícones

# Verificar se ImageMagick está instalado
if ! command -v convert &> /dev/null; then
    echo "ImageMagick não encontrado. Por favor, instale o ImageMagick para gerar os ícones."
    echo "Visite: https://imagemagick.org/script/download.php"
    exit 1
fi

# Tamanhos necessários para PWA
sizes=(72 96 128 144 152 192 384 512)

echo "Gerando ícones PWA..."

# Gerar ícones a partir do SVG
for size in "${sizes[@]}"; do
    echo "Gerando ícone ${size}x${size}..."
    convert -background none -size ${size}x${size} assets/icon.svg assets/icon-${size}.png
done

echo "Ícones gerados com sucesso!"
echo "Arquivos criados:"
for size in "${sizes[@]}"; do
    echo "  - assets/icon-${size}.png"
done