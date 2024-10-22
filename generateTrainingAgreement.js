const fs = require('fs');

const { getCurrentDate, formatDateConventional, formatDateStructured } = require('./dateUtils');

const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
const candidateDetails = JSON.parse(fs.readFileSync('candidate-details.json', 'utf8'));

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
              text: '2024',
              matchCase: true,
            },
            replaceText: `${currentDate.year}`,
          },
        },
        {
          replaceAllText: {
            containsText: {
              text: '[FIRST NAME] [LAST NAME]',
              matchCase: true,
            },
            replaceText: `${firstName} ${lastName}`,
          },
        },
        {
          replaceAllText: {
            containsText: {
              text: '[First name] [Last name]',
              matchCase: true,
            },
            replaceText: `${firstName.toUpperCase()} ${lastName.toUpperCase()}`,
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
  } 
  catch (error) {
    console.error('Error:', error);
  }
}


function getCandidateDetails() {
    const firstName = candidateDetails.candidate.firstName;
    const lastName = candidateDetails.candidate.lastName;
    const streetAddress = candidateDetails.candidate.streetAddress;
    const city = candidateDetails.candidate.city;
    const postCode = candidateDetails.candidate.postCode;
    const courseStartDate = candidateDetails.candidate.courseStartDate;
    const currentDate = candidateDetails.candidate.currentDate;

    return {firstName, lastName, streetAddress, city, postCode, courseStartDate, currentDate};
}

(async function main() {
  try {
    const accessToken = credentials.installed.access_token;
    const docId = credentials.installed.training_fees_agreement_template_id;

    const { firstName, lastName, streetAddress, city, postCode, courseStartDate} = getCandidateDetails();
    const currentDate = getCurrentDate();
    await generateNewTrainingFeesAgreement(accessToken, docId, firstName, lastName, streetAddress, city, postCode, courseStartDate, currentDate);
  } 
  catch (error) {
    console.error('Error:', error);
  }
})();