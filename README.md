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

3. Add these `.json` files to the gitignore.

# Generating Letters

