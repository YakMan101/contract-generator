# Setup Secret Files

1. Download the Service Account credentials and save as `neat-chain.json`
    make sure the following are in the file:
    - Service Account email
    - Service Account pemkey

2. Run `getAccessToken.js` to obtain access token.

3. Create credentials.json and fill with:

```
{
    "access_token": "<your_access_token>",
    "training_fees_agreement_template_id": "<document_template_id>",
    "offer_letter_template_id": "<document_template_id>",
    "share_email": "<email_to_share_generated_documents_with>"
}
```

4. Add these `.json` files to the gitignore.

## Notes
At the moment candidate details are pulled from `candidate-details.json` using the `getCandidateDetails()` function in `utils/miscUtils.js` but these details can be introduced in script which ever way is convenient as long as the following information is present:
- `firstName`
- `lastName`
- `streetAddress`
- `city`
- `postCode`
- `courseStartDate`  (in the format e.g. 8th July)

# Generating Letters

Before running the `generateOfferLetter` or `generateTrainingAgreement` scripts. Remember to share the google doc with the Service Account email. These must be google documents and not word documents (e.g: those with .docx, .doc extensions).
