#!/bin/bash
# Generate simple Clara icons using ImageMagick
# This creates basic colored squares with "C" text

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Installing..."
    sudo apt update && sudo apt install -y imagemagick
fi

# Create icons with different sizes
sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"; do
    echo "Creating ${size}x${size} icon..."
    convert -size ${size}x${size} xc:"#6B73FF" \
        -font DejaVu-Sans-Bold -pointsize $((size/3)) \
        -fill white -gravity center \
        -annotate +0+0 "C" \
        icon-${size}x${size}.png
done

echo "✅ Icons generated successfully!"
