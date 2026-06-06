const fs = require('fs');
const path = require('path');

const filesToFix = [
    'd:/Virtual Try-On/client/src/components/ChatWidget.jsx',
    'd:/Virtual Try-On/client/src/components/OnlinePaymentModal.jsx',
    'd:/Virtual Try-On/client/src/components/ProductRecommendations.jsx',
    'd:/Virtual Try-On/client/src/contexts/WishlistContext.jsx',
    'd:/Virtual Try-On/client/src/pages/OrderPage.jsx'
];

filesToFix.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        let newContent = content.replace(/const API_URL = 'http:\/\/localhost:3000';/g, "const API_URL = import.meta.env.VITE_API_URL || '';");
        if (newContent !== content) {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log('Fixed API_URL in', file);
        } else {
            console.log('No change needed for', file);
        }
    }
});
