const fs = require('fs');

const authDetails = JSON.parse(fs.readFileSync('neat-chain.json', 'utf8'));

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

function base64url(source) {
  let encodedSource = Buffer.from(source).toString('base64');
  encodedSource = encodedSource.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return encodedSource;
}


function urlEncode(data) {
  return Object.keys(data)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&');
}

function getJwt() {
  const header = { alg: "RS256", typ: "JWT" };
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

async function signJwt(privatePemKey) {
  const jwt = getJwt();
  const privateKey = await importPrivateKey(privatePemKey);
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    Buffer.from(jwt)
  );

  const signedJwt = `${jwt}.${base64url(signature)}`;
  return signedJwt;
}

async function getAccessToken(privatePemKey) {
  const signedJwt = await signJwt(privatePemKey);

  const postData = urlEncode({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: signedJwt
  });

  const response = await fetch('https://www.googleapis.com/oauth2/v3/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: postData
  });

  const data = await response.json();

  if (data.access_token) {
    console.log('Access Token:', data.access_token);
    return data.access_token;
  } else {
    console.error('Error:', data);
    throw new Error(data);
  }
}

(async function main() {
  const privatePemKey = authDetails.private_key;
  await getAccessToken(privatePemKey);
})();
