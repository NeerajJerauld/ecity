const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'assets/images');

// List of large files to convert to JPEG
const filesToConvert = [
    'hero_bolero.png',
    'outstandingloads.png',
    'marketdeliveris.png',
    'industrialgoods.png',
    'map1.png',
    'map2.png',
    'whatsapp-icon.png', // Keep PNG ideally but for size... maybe exclude if transparency needed?
    'whatsapp.png'
];

// WhatsApp icons need transparency, keep them PNG but resize small
const keepPng = ['whatsapp-icon.png', 'whatsapp.png', 'ecitylogo.png', 'bollero_logo1.png', 'bollero_logo2.png'];

async function processImage(filename) {
    const filePath = path.join(directoryPath, filename);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`Skipping ${filename}`);
            return;
        }

        console.log(`Processing ${filename}...`);
        const image = await Jimp.read(filePath);
        
        // Resize
        if (image.bitmap.width > 800) { // Aggressive resize for mobile/speed
            image.resize(800, Jimp.AUTO);
        }

        if (keepPng.includes(filename)) {
            // Just compress PNG
            await image.writeAsync(filePath);
            console.log(`Optimized PNG: ${filename}`);
        } else {
            // Convert to JPEG
            const newFilename = filename.replace('.png', '.jpg');
            const newFilePath = path.join(directoryPath, newFilename);
            
            // Set white background for transparency handling if any
            image.background(0xFFFFFFFF);
            image.quality(60);
            
            await image.writeAsync(newFilePath);
            
            const stats = fs.statSync(newFilePath);
            console.log(`Converted to JPEG: ${newFilename} (${(stats.size/1024).toFixed(2)} KB)`);
        }
        
    } catch (error) {
        console.error(`Error processing ${filename}:`, error.message);
    }
}

async function run() {
    console.log('Starting conversion...');
    for (const file of filesToConvert) {
        await processImage(file);
    }
    console.log('Conversion complete!');
}

run();
