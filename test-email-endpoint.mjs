async function testEmail() {
  try {
    const res = await fetch('http://localhost:4000/emergency/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: 'Test from script',
        location: { lat: 13.0265143, lng: 80.0159234 },
        mapsLink: 'https://maps.google.com/?q=13.0265143,80.0159234',
        contacts: [{ email: 'thanujaradhakrishnan04@gmail.com', name: 'Thanujar Contact' }],
        userName: 'Thanujar Radhakrishnan',
        userPhone: '+919884293869'
      })
    });
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

testEmail();
