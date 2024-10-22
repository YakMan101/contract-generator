const fs = require('fs');
const https = require('https');
const { URLSearchParams } = require('url');

const authDetails = JSON.parse(fs.readFileSync('neat-chain-test.json', 'utf8'));

// Function to convert a PEM-formatted private key into a format usable by the Web Crypto API
async function importPrivateKey(pem) {
  // Remove the "BEGIN" and "END" lines, as well as newlines
  const keyData = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
  // Decode the Base64 PEM data to a Buffer
  const binaryDer = Buffer.from(keyData, 'base64');

  return await crypto.subtle.importKey(
    'pkcs8', 
    binaryDer, 
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    true, 
    ['sign']
  );
}

// Helper function to base64 URL encode a string
function base64url(source) {
  // Encode in base64
  let encodedSource = Buffer.from(source).toString('base64');

  // Replace characters according to base64 URL specifications
  encodedSource = encodedSource.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return encodedSource;
}

// JWT Header
const header = {
  alg: "RS256",
  typ: "JWT"
};

// JWT Payload
const now = Math.floor(Date.now() / 1000);  // Current time in seconds
const payload = {
  aud: "https://www.googleapis.com/oauth2/v3/token",
  scope: "https://www.googleapis.com/auth/analytics.readonly",
  iss: authDetails.client_email,  // Use service account email
  exp: now + 3600,  // Expires in 1 hour
  iat: now
};

// Encode the header and payload to base64 URL format
const encodedHeader = base64url(JSON.stringify(header));
const encodedPayload = base64url(JSON.stringify(payload));

// Create the JWT string (header + payload)
const jwt = `${encodedHeader}.${encodedPayload}`;

// Private key (replace with your actual key)
const privateKeyPem = authDetails.private_key;

// Function to sign the JWT with the private key
async function signJwt() {
  const privateKey = await importPrivateKey(privateKeyPem);
  
  // Sign the JWT
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    Buffer.from(jwt)  // The data to sign (header and payload)
  );

  // Combine the JWT and the signature
  const signedJwt = `${jwt}.${base64url(signature)}`;
  return signedJwt;
}

// Send the JWT to Google's OAuth2 token endpoint using native HTTPS module
async function getAccessToken() {
  const signedJwt = await signJwt();

  const postData = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: signedJwt
  }).toString();

  const options = {
    hostname: 'www.googleapis.com',
    path: '/oauth2/v3/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const response = JSON.parse(data);
        if (response.access_token) {
          console.log('Access Token:', response.access_token);
          resolve(response.access_token);
        } else {
          console.error('Error:', response);
          reject(response);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    // Send the request body
    req.write(postData);
    req.end();
  });
}

// Run the function to get the access token
(async function main() {
  await getAccessToken();
})();
