const fs = require('fs');

const { getCurrentDate, formatDateConventional, formatDateStructured } = require('./utils/dateUtils');
const { getCandidateDetails, shareDocumentWithUser } = require('./utils/miscUtils');

const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));

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

(async function main() {
  try {
    const accessToken = credentials.access_token;
    const docId = credentials.offer_letter_template_id;

    const { firstName, lastName, streetAddress, city, postCode, courseStartDate} = getCandidateDetails();
    const currentDate = getCurrentDate();
    const newDocId = await generateOfferLetter(accessToken, docId, firstName, lastName, streetAddress, city, postCode, courseStartDate, currentDate);
    const emailToShareWith = credentials.share_email;
    shareDocumentWithUser(accessToken, newDocId, emailToShareWith)
  } 
  catch (error) {
    console.error('Error:', error);
  }
})();