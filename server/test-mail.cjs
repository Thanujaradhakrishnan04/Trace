require('dotenv').config({ path: __dirname + '/.env' });
const { sendEmergencyEmail } = require('./services/emailService');

async function test() {
  console.log("Testing email dispatch with verified Saveetha Nagar, Thandalam location...");
  const result = await sendEmergencyEmail(
    'thanujaradhakrishnan04@gmail.com', 
    { lat: 13.0265143, lng: 80.0159234 }, 
    'Thanujar Radhakrishnan', 
    '+919884293869'
  );
  console.log("Result:", result);
}

test();
