const { sendEmergencyEmail } = require('./services/emailService');

(async () => {
    console.log("Testing emailService.js local mock mailer...");
    const result = await sendEmergencyEmail('Abrahm@gmail.com', {lat: 13.0265143, lng: 80.0159234}, 'Test User', '+1234567890');
    console.log("Result:", result);
})();
