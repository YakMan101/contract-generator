const fs = require('fs');
const querystring = require('querystring');

const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
const CLIENT_ID = credentials.installed.client_id;
const CLIENT_SECRET = credentials.installed.client_secret;
const REDIRECT_URI = credentials.installed.redirect_uris[0]; // Get the first redirect URI

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
  console.log(`Create new token by following: ${authUrl}`);
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

async function copyGoogleDoc(accessToken, originalDocId) {
  const copyApiUrl = `https://www.googleapis.com/drive/v3/files/${originalDocId}/copy`;

  const response = await fetch(copyApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'New Document Name', // Update with your desired document name
    }),
  });

  const copyResponse = await response.json();
  console.log(copyResponse);
  return copyResponse.id; // New document ID
}

async function modifyGoogleDoc(accessToken, docId) {
  const docsApiUrl = `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`;

  const response = await fetch(docsApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          replaceAllText: {
            containsText: {
              text: 'Hello', // Placeholder in the document
              matchCase: true,
            },
            replaceText: 'Hello there', // Replacement text
          },
        },
        {
          replaceAllText: {
            containsText: {
              text: 'there', // Placeholder in the document
              matchCase: true,
            },
            replaceText: 'not here', // Replacement text
          },
        },
        // Add more replace requests as needed
      ],
    }),
  });

  const jsonResponse = await response.json();
  console.log(jsonResponse);
}

(async function main() {
  try {
    generateAuthUrl()
    // const accessToken = await getAccessToken();
    const accessToken = credentials.installed.access_token;
    const docId = credentials.installed.document_id;
    const newDocId = await copyGoogleDoc(accessToken, docId); // Use actual original document ID
    await modifyGoogleDoc(accessToken, newDocId);
    console.log('Document copied and modified successfully.');
  } catch (error) {
    console.error('Error:', error);
  }
})();