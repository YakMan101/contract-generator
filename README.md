# SigmaLabs Contract Generator

This guide will help you generate offer letters and training agreements for candidates using Google Docs through a Node.js script.
The process involves copying Google Doc templates, filling them with candidate information, and sharing the documents via email.

## Prerequisites
1. **Create a Google Cloud Console Project**:
   - Enable the **Google Docs API**.
   - Enable the **Google Drive API**.
   - Create a **Service Account** and generate a new key in JSON format.

2. **Share Google Docs**:
   - Share the Google Docs (templates) with the **Service Account email**.
   - Ensure the documents are in **Google Docs format** (convert `.docx`, `.doc` files if necessary).

3. **Node.js**:
   - Some of the scripts use basic `fs` (filesystem) functionality.
   - They have been tested with Node.js but should be compatible with most JavaScript environments.

## Files Overview
- **Main Scripts**:
   - `generateContractsOneFile.js`: Generates both offer letters and training agreements in a single run.
   - `generateOfferLetter.js`: Creates an offer letter for a candidate by copying and modifying a template.
   - `generateTrainingAgreement.js`: Creates a training agreement for a candidate in a similar manner.
   - `getAccessToken.js`: Generates an access token using the Service Account credentials.
  
- **Utilities**:
   - `utils/dateUtils.js`: Functions to work with and format dates.
   - `utils/miscUtils.js`: Miscellaneous helper functions such as retrieving candidate details.
  
- **Sample Data**:
   - `candidate-data.json`: Example file with sample candidate information.

## Generating Letters Using a Single File
To generate both an offer letter and a training agreement in one go, you can use the `generateContractsOneFile.js` script.

### Steps:
**Configure Candidate Information**:
   At the start of `generateContractsOneFile.js`, fill out the following placeholders:

```js
// ========== Candidate Information ==========
const firstName = "Michael"; // These are placeholder values
const lastName = "Brown";
const streetAddress = "50 Oak Street";
const city = "Liverpool";
const postCode = "L1 5AB";
const courseStartDate = "8th July";

// ========== Sensitive Information ==========
const serviceAccountPemKey = "<service_account_pem_key>";
const serviceAccountEmail = "<service_account_email>";

const offerLetterDocTemplateId = "<offer_letter_template_id>";  // Found in Google Doc URL
const trainingAgreementLetterTemplateId = "training_agreement_template_id";
const emailToShareWith = "<your_email>";
```
The script will:
   - Generate an access token.
   - Copy and modify the offer letter and training agreement templates.
   - Share the new documents with the specified email.
   - Print the URLs of the newly created documents.

**Extracting Google Doc IDs**:
   You can extract Google Document IDs from their URLs.  
   For example, in the URL `https://docs.google.com/document/d/1abcdEfGhIjKlMnOpQrStUvWxYz1234567890/edit`,  
   the document ID is the part between `/d/` and `/edit` (`1abcdEfGhIjKlMnOpQrStUvWxYz1234567890`).

## Running Other Files
To run the other scripts individually, you need to set up sensitive data files as follows.

### 1. **Create `neat-chain.json` for Service Account**:
   Download your Service Account credentials and save them as `neat-chain.json`.
   Ensure the file contains at least:

   ```json
   {
       "private_key": "<pem_key>",
       "client_email": "<service_account_email>"
   }
   ```

### 2. **Generate Access Token**:
   Run `getAccessToken.js` to obtain an access token.

### 3. **Create `credentials.json`**:
   Fill in the following details in `credentials.json`:

   ```json
   {
       "access_token": "<your_access_token>",
       "training_fees_agreement_template_id": "<document_template_id>",
       "offer_letter_template_id": "<document_template_id>",
       "share_email": "<email_to_share_generated_documents_with>"
   }
   ```

### 4. **Add Files to `.gitignore`**:
   Ensure sensitive files (`neat-chain.json`, `credentials.json`) are included in your `.gitignore` to avoid accidentally committing them to public repositories.

## Candidate Details
Candidate details can be fetched from `candidate-data.json` using the `getCandidateDetails()` function from `utils/miscUtils.js`.
Alternatively, you can directly add the candidate details in your script.
Required information includes:
- `firstName`
- `lastName`
- `streetAddress`
- `city`
- `postCode`
- `courseStartDate` (format: e.g. 8th July)

## Notes
- Always handle sensitive data carefully to avoid exposing it in public repositories or logs.
