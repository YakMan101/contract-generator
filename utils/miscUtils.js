const fs = require('fs');

const candidateDetails = JSON.parse(fs.readFileSync('candidate-details.json', 'utf8'));

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

function capitaliseFirstLetter(word) {
    return word[0].toUpperCase() + word.slice(1);
}


module.exports = { getCandidateDetails, shareDocumentWithUser, capitaliseFirstLetter};