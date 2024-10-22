# Secret Files

1. Download the Service Account credentials and save as `neat-chain-test.json`

2. Create credentials.json and fill with:

```
{"installed":
    {
        "access_token": "<your_access_token>",
        "training_fees_agreement_template_id": "<document_template_id>",
        "offer_letter_template_id": "<document_template_id>",
        "share_email": "<email_to_share_generated_documents_with>"
    }
}
```

3. Add these files to the gitignore.