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

module.exports = { getCandidateDetails };