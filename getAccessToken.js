const fs = require('fs');
const https = require('https');
const { URLSearchParams } = require('url');

const authDetails = JSON.parse(fs.readFileSync('neat-chain.json', 'utf8'));

// Function to convert a PEM-formatted private key into a format usable by the Web Crypto API
async function importPrivateKey(pem) {
  const keyData = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
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
  let encodedSource = Buffer.from(source).toString('base64');
  encodedSource = encodedSource.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return encodedSource;
}

function getJwt() {
  const header = {alg: "RS256", typ: "JWT"};
  const now = Math.floor(Date.now() / 1000);

  const scopes = [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive"
  ].join(" ");

  const payload = {
    aud: "https://www.googleapis.com/oauth2/v3/token",
    scope: scopes,
    iss: authDetails.client_email,
    exp: now + 3600,
    iat: now
  };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  return `${encodedHeader}.${encodedPayload}`;
}

// Function to sign the JWT with the private key
async function signJwt(privatePemKey) {
  const jwt = getJwt()
  const privateKey = await importPrivateKey(privatePemKey);
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    Buffer.from(jwt)
  );

  const signedJwt = `${jwt}.${base64url(signature)}`;
  return signedJwt;
}

// Send the JWT to Google's OAuth2 token endpoint using native HTTPS module
async function getAccessToken(privatePemKey) {
  const signedJwt = await signJwt(privatePemKey);

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
    req.write(postData);
    req.end();
  });
}

// Run the function to get the access token
(async function main() {
  const privatePemKey = authDetails.private_key;
  await getAccessToken(privatePemKey);
})();
