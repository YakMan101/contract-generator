// ========== Candidate information ==========
const firstName = "Michael";  // These are placeholder values
const lastName = "Brown";
const streetAddress = "50 Oak Street";
const city = "Liverpool";
const postCode = "L1 5AB";
const courseStartDate = "8th July";

// ========== Sensitive information ==========
const serviceAccountPemKey = "<service_account_pem_key>";
const serviceAccountEmail = "<service_account_email>";

const offerLetterDocTemplateId = "<offer_letter_template_id>";  // Can be found in doc url
const trainingAgreementLetterTemplateId = "training_agreement_template_id";
const emailToShareWith = "<your_email>";


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
    iss: serviceAccountEmail,
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

function urlEncode(data) {
  return Object.keys(data)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&');
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

function getCurrentDate() {
  const date = new Date();
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  return { day, monthIndex, year };
}

function getDayWithSuffix(day) {
    const suffix = (day % 10 === 1 && day % 100 !== 11) ? 'st' :
                   (day % 10 === 2 && day % 100 !== 12) ? 'nd' :
                   (day % 10 === 3 && day % 100 !== 13) ? 'rd' : 'th';
    return `${day}${suffix}`;
}

function formatDateConventional(dateComponents) {
  const { day, monthIndex, year } = dateComponents;

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  return `${getDayWithSuffix(day)} ${monthNames[monthIndex]} ${year}`;
}

function formatDateStructured(dateComponents) {
  const { year, monthIndex, day } = dateComponents;

  const formattedMonth = String(monthIndex + 1).padStart(2, '0'); // monthIndex is 0-based
  const formattedDay = String(day).padStart(2, '0');

  return `${year}${formattedMonth}${formattedDay}`;
}

async function copyOfferLetterTemplate(accessToken, originalDocId, firstName, lastName, date) {
  const copyApiUrl = `https://www.googleapis.com/drive/v3/files/${originalDocId}/copy`;

  const response = await fetch(copyApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `${formatDateStructured(date)}_Offer Letter_${firstName} ${lastName}`,
    }),
  });

  const copyResponse = await response.json();
  console.log(copyResponse);
  return copyResponse.id;
}

async function modifyOfferLetter(accessToken, docId, firstName, lastName, streetAddress, city, postCode, courseStartDate, currentDate) {
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
              text: '[NAME]',
              matchCase: true,
            },
            replaceText: `${firstName} ${lastName}`,
          },
        },
        {
          replaceAllText: {
            containsText: {
              text: '[DATE]',
              matchCase: true,
            },
            replaceText: formatDateConventional(currentDate),
          },
        },
        {
          replaceAllText: {
            containsText: {
              text: '[ADDRESS]',
              matchCase: true,
            },
            replaceText: `${streetAddress}\n${city}\n${postCode}`,
          },
        },
        {
          replaceAllText: {
            containsText: {
              text: '[COHORT START DATE]',
              matchCase: true,
            },
            replaceText: courseStartDate,
          },
        },
        {
          replaceAllText: {
            containsText: {
              text: '[FIRST NAME]',
              matchCase: true,
            },
            replaceText: `${firstName}`,
          },
        },
        {
          updateTextStyle: {
            range: {
              startIndex: 1,
              endIndex: 11400,
            },
            textStyle: {
              backgroundColor: null,
            },
            fields: 'backgroundColor',
          },
        },
      ],
    }),
  });

  const jsonResponse = await response.json();
  console.log(jsonResponse);
}

async function generateOfferLetter(accessToken, templateDocId, firstName, lastName, streetAddress, city, postCode, courseStartDate, currentDate) {
  try {
    const newDocId = await copyOfferLetterTemplate(accessToken, templateDocId, firstName, lastName, currentDate);
    await modifyOfferLetter(accessToken, newDocId, firstName, lastName, streetAddress, city, postCode, courseStartDate, currentDate);
    console.log('New Offer Letter copied and modified successfully.');
    return newDocId;
  } 
  catch (error) {
    console.error('Error:', error);
  }
}

async function shareDocumentWithUser(accessToken, documentId, userEmail) {
  const shareApiUrl = `https://www.googleapis.com/drive/v3/files/${documentId}/permissions`;

  const response = await fetch(shareApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'writer',
      type: 'user',
      emailAddress: userEmail,
    }),
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(`Error sharing document: ${errorResponse.error.message}`);
  }

  console.log(`Document shared with ${userEmail} successfully.`);
}

async function copyTrainingFeesAgreementTemplate(accessToken, originalDocId, firstName, lastName, date) {
  const copyApiUrl = `https://www.googleapis.com/drive/v3/files/${originalDocId}/copy`;

  const response = await fetch(copyApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `${formatDateStructured(date)}_Training fees agreement_${firstName} ${lastName}`,
    }),
  });

  const copyResponse = await response.json();
  console.log(copyResponse);
  return copyResponse.id;
}

async function modifyTrainingFeesAgreement(accessToken, docId, firstName, lastName, streetAddress, city, postCode, courseStartDate, currentDate) {
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
              text: '[FIRST NAME] [LAST NAME]',
              matchCase: true,
            },
            replaceText: `${firstName.toUpperCase()} ${lastName.toUpperCase()}`,
          },
        },
        {
          replaceAllText: {
            containsText: {
              text: '[First name] [Last name]',
              matchCase: true,
            },
            replaceText: `${firstName} ${lastName}`,
          },
        },
        {
          replaceAllText: {
            containsText: {
              text: '[insert date]',
              matchCase: true,
            },
            replaceText: formatDateConventional(currentDate),
          },
        },
        {
          replaceAllText: {
            containsText: {
              text: '[Street address] [City] [Post Code]',
              matchCase: true,
            },
            replaceText: `${streetAddress}, ${city}, ${postCode}`,
          },
        },
        {
          replaceAllText: {
            containsText: {
              text: '[Course Start Date]',
              matchCase: true,
            },
            replaceText: courseStartDate,
          },
        },
        {
          updateTextStyle: {
            range: {
              startIndex: 1,
              endIndex: 9919,
            },
            textStyle: {
              backgroundColor: null,
            },
            fields: 'backgroundColor',
          },
        },
      ],
    }),
  });

  const jsonResponse = await response.json();
  console.log(jsonResponse);
}

async function generateNewTrainingFeesAgreement(accessToken, templateDocId, firstName, lastName, streetAddress, city, postCode, courseStartDate, currentDate) {
  try {
    const newDocId = await copyTrainingFeesAgreementTemplate(accessToken, templateDocId, firstName, lastName, currentDate);
    await modifyTrainingFeesAgreement(accessToken, newDocId, firstName, lastName, streetAddress, city, postCode, courseStartDate, currentDate);
    console.log('New Training Fees Agreement copied and modified successfully.');
    return newDocId
  } 
  catch (error) {
    console.error('Error:', error);
  }
}

(async function main() {
  const accessToken = await getAccessToken(serviceAccountPemKey);
  const currentDate = getCurrentDate();
  const newOfferLetterDocId = await generateOfferLetter(accessToken, offerLetterDocTemplateId, firstName, lastName, streetAddress, city, postCode, courseStartDate, currentDate);
  await shareDocumentWithUser(accessToken, newOfferLetterDocId, emailToShareWith);
  const newTrainingFeesAgreementDocId = await generateNewTrainingFeesAgreement(accessToken, trainingAgreementLetterTemplateId, firstName, lastName, streetAddress, city, postCode, courseStartDate, currentDate)
  await shareDocumentWithUser(accessToken, newTrainingFeesAgreementDocId, emailToShareWith);
  console.log()
  const newOfferLetterDocUrl = `https://docs.google.com/document/d/${newOfferLetterDocId}/edit`;
  console.log('Offer Letter URL:', newOfferLetterDocUrl);
  const newTrainingFeesAgreementDocUrl  = `https://docs.google.com/document/d/${newTrainingFeesAgreementDocId}/edit`;
  console.log('Training Fees Agreement URL:', newTrainingFeesAgreementDocUrl );
})();
