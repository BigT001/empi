const fs = require('fs');
const path = require('path');

// Use sharp to resize and convert the logo to ico format
try {
  const sharp = require('sharp');
  
  sharp('public/logo/EMPI-2k24-LOGO-1.PNG')
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .toFile('public/favicon.ico')
    .then(() => {
      console.log('✅ favicon.ico created successfully');
    })
    .catch(err => {
      console.error('Error creating favicon:', err);
    });
} catch (error) {
  console.error('Sharp not available, trying alternative method');
  
  // Fallback: Copy PNG as a simple solution
  fs.copyFileSync(
    'public/logo/EMPI-2k24-LOGO-1.PNG',
    'public/favicon.png'
  );
  console.log('✅ favicon.png created as fallback');
}
