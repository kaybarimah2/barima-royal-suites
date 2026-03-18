const http = require('http');

const data = JSON.stringify({
  full_name: "Test User",
  email: "test@example.com",
  phone_number: "1234567890",
  national_id: "12345"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/guests',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS:`, res.headers);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('RESPONSE:', responseData);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
  process.exit(1);
});

req.write(data);
req.end();
