const fs = require('fs');
const querystring = require('querystring');

const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
const CLIENT_ID = credentials.installed.client_id;
const CLIENT_SECRET = credentials.installed.client_secret;
const REDIRECT_URI = credentials.installed.redirect_uris[0];

// AUTH_CODE will still need to be obtained through the OAuth flow and updated in the credentials.json
const AUTH_CODE = credentials.installed.auth_code;

function generateAuthUrl() {
  const params = {
    scope: 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive',
    access_type: 'offline',
    include_granted_scopes: true,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
  };

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${querystring.stringify(params)}`;
  console.log(`Create auth code by following the link:\n${authUrl}`);
  return authUrl;
}

async function getAccessToken() {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const tokenData = querystring.stringify({
    code: AUTH_CODE,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenData,
  });

  const tokenResponse = await response.json();
  console.log(`Access token: ${tokenResponse.access_token}`);
  return tokenResponse.access_token;
}

(async function main() {
  try {
    generateAuthUrl()
    await getAccessToken()
  } 
  catch (error) {
    console.error('Error:', error);
  }
})();