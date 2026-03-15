const https = require('https');

const data = {
    "p1": { "name": "iPhone 15 Pro Max", "price": 32990000, "image": "iphone15.png", "category": "Apple", "updatedAt": new Date().toISOString() },
    "p2": { "name": "Samsung Galaxy S24 Ultra", "price": 30990000, "image": "s24.png", "category": "Samsung", "updatedAt": new Date().toISOString() },
    "p3": { "name": "Xiaomi 14 Pro", "price": 18990000, "image": "xiaomi14.png", "category": "Xiaomi", "updatedAt": new Date().toISOString() },
    "p4": { "name": "Oppo Find X7 Ultra", "price": 21990000, "image": "oppo.png", "category": "Oppo", "updatedAt": new Date().toISOString() }
};

const options = {
    hostname: 'cuahangdt-be96f-default-rtdb.asia-southeast1.firebasedatabase.app',
    path: '/phone_products.json',
    method: 'PATCH',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (error) => console.error(error));
req.write(JSON.stringify(data));
req.end();
