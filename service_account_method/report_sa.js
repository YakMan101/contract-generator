const { google } = require('googleapis');
const path = require('path');

// Path to your service account key file
const SERVICE_ACCOUNT_KEY_PATH = path.join(__dirname, 'neat-chain-439413-p4-6e87921ae568.json');

// Step 1: Authorize with a service account
async function authorize() {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/documents'],
  });

  const client = await auth.getClient();
  console.log(client);
  return client;
}

// Step 2: Copy Google Doc
async function copyGoogleDoc(auth, originalDocId) {
  const drive = google.drive({ version: 'v3', auth });
  const copyApiUrl = `files/${originalDocId}/copy`;

  const response = await drive.files.copy({
    fileId: originalDocId,
    requestBody: {
      name: 'New Document Name', // Update with your desired document name
    },
  });

  return response.data.id; // New document ID
}

// Step 3: Replace Placeholders in Google Doc
async function modifyGoogleDoc(auth, docId) {
  const docs = google.docs({ version: 'v1', auth });

  const response = await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
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
        // Add more replace requests as needed
      ],
    },
  });

  console.log(response.data);
}

// Main function to execute copying and modification
(async function main() {
  try {
    const docID = '<DOC_ID>'
    const auth = await authorize();
    const newDocId = await copyGoogleDoc(auth, docID); // Use actual original document ID
    await modifyGoogleDoc(auth, newDocId);
    // console.log('Document copied and modified successfully.');
  } catch (error) {
    console.error('Error:', error);
  }
})();
