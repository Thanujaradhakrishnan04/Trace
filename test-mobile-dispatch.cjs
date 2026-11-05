const http = require('http');

const body = JSON.stringify({
  emergencyId: "test_mobile_123",
  reason: "Test Mobile Distress",
  location: { lat: 13.0265143, lng: 80.0159234 },
  mapsLink: "https://maps.google.com/?q=13.0265143,80.0159234",
  contacts: [
    {
      id: "test_contact_1",
      name: "Thanujar",
      phone: "+919876543210",
      relation: "Self",
      email: "thanujaradhakrishnan04@gmail.com"
    }
  ],
  targetContactId: null,
  userName: "Mobile User",
  userPhone: "+919999999999",
  photo: null
});

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/emergency/dispatch',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock.jwt.token'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', data));
});

req.on('error', err => console.error('Req error:', err));
req.write(body);
req.end();
