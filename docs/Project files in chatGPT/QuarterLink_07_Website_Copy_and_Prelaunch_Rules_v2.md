# QuarterLink — Website, Copy and Pre-Launch Rules v2

Last updated: 2026-05-11
Status: active public website/source copy guardrail

## Purpose

QuarterLink needs an information/sales website, but the product is not yet built or HMRC-recognised. Public copy must not overclaim.

The old website prototype retained at `Archive/Website project files.zip` is a visual/content prototype only. It must not be treated as production-ready.

## Current website position

Until the app has real product capability, the website should be a pre-launch/information site.

Approved current positioning:

```text
QuarterLink is being built as spreadsheet bridging software for Making Tax Digital for Income Tax quarterly updates.
```

Do not say or imply:

- QuarterLink is available now.
- QuarterLink is HMRC-approved.
- QuarterLink is HMRC-recognised.
- QuarterLink has passed HMRC sandbox testing.
- QuarterLink can currently submit updates.
- QuarterLink can currently generate proof packs.
- QuarterLink currently supports agents/practices.
- QuarterLink currently supports final declaration/tax return submission.
- QuarterLink has live pricing.

## Website goals before product launch

The public website may:

- Explain the product being built.
- Explain the intended bridging-only scope.
- Explain that quarterly updates are not tax returns.
- Explain target users: self-employed people and landlords using spreadsheets.
- Collect early interest/waitlist leads.
- Invite accountants/bookkeepers to register interest.
- Link to official GOV.UK/HMRC information.
- State that final declaration/tax return functionality is outside the first version.

The website must not:

- Take payment for unavailable software.
- Promise specific launch dates unless confirmed.
- Publish final pricing as if live.
- Claim recognition/approval.
- Collect excessive sensitive tax information before the app is ready.
- Store leads insecurely.
- Use token-in-query admin access for anything production-facing.

## Required pages for pre-launch site

Minimum safe pages:

- Home.
- How it will work.
- For individuals.
- For landlords.
- For accountants/bookkeepers — register interest only.
- FAQ.
- Security/compliance approach.
- Privacy notice.
- Cookie notice.
- Contact / join waitlist.

Do not launch pricing as a live paid plan page yet. Use “pricing to be confirmed”.

## Copy rules

### Approved pre-launch wording

Use:

```text
QuarterLink is being built for Making Tax Digital for Income Tax quarterly updates.
```

```text
Designed for people who keep spreadsheet records and want bridging software rather than full bookkeeping software.
```

```text
Quarterly updates are summaries of income and expenses. They are not tax returns.
```

```text
Final declaration/tax return submission is outside the first planned version.
```

```text
Join the early interest list.
```

### Wording to avoid before recognition/product launch

Avoid:

```text
Start sending today.
```

```text
Submit to HMRC now.
```

```text
HMRC approved.
```

```text
HMRC recognised.
```

```text
Guaranteed compliant.
```

```text
Proof pack generated automatically.
```

```text
Smart mapping included.
```

```text
Final declaration add-on available.
```

```text
Agent/practice portal live.
```

### Tone of voice

Use a tone that is:

- Clear.
- Reassuring.
- Plain English.
- Professional.
- Practical.
- Non-technical unless detail is genuinely needed.

Avoid:

- Scaring users about Making Tax Digital for Income Tax.
- Overpromising capability.
- Sounding like HMRC.
- Making spreadsheet users feel they are wrong to use spreadsheets.

### Visual direction

Good reference ideas for future approved website work:

- Spreadsheet-style grids.
- Quarterly deadline cards.
- Upload/review/send flow.
- Dashboard status cards.
- Simple flow from spreadsheet records to QuarterLink to HMRC.
- Calm blue/green trust colours.
- White space and practical product UI.

Avoid:

- VAT imagery.
- Bank-feed imagery.
- Receipt-scanning imagery.
- Full ledger imagery.
- HMRC logo use unless explicitly allowed and compliant.
- Complex tax-form visuals.

## Old website zip assessment

The archived website prototype can be used for:

- Visual inspiration.
- Page structure ideas.
- Brand direction.
- Copy snippets after legal/compliance rewrite.

It must not be used directly because:

- It includes present-tense product capability claims.
- It contains pricing-style pages before pricing is decided.
- It mentions final declaration/tax return add-ons before they are scoped.
- It includes practice/agent pages that can imply working product support.
- It uses a simple lead/admin mechanism unsuitable for production.
- Its privacy/terms pages are not production-grade.
- It is separate from the live Next.js repo.

## Lead capture requirements

If a pre-launch waitlist is built, it must include:

- Minimal fields only: name, email, user type, optional message.
- Clear consent wording.
- Privacy notice link.
- Spam/rate limiting.
- Secure storage.
- No tax identifiers unless explicitly justified later.
- No UTR/NINO collection on public waitlist forms.

## Public website technical direction

Preferred route:

- Build marketing pages inside the main Next.js app when approved.
- Keep the old zip outside the live app.
- Use a dedicated ticket for website integration.

Do not add website forms, CRM, email marketing, analytics or cookies without:

- Privacy/cookie decision.
- Provider decision.
- Consent model.
- Data retention rule.
- Security review.

## Website MVP copy skeleton

Homepage hero:

```text
Spreadsheet bridging software for Making Tax Digital for Income Tax quarterly updates.

QuarterLink is being built for self-employed people and landlords who want to keep using spreadsheet records instead of moving to full bookkeeping software.
```

CTA:

```text
Join the early interest list
```

Trust note:

```text
QuarterLink is not yet HMRC-recognised. Recognition claims will only be made after the required HMRC process is completed.
```

Scope note:

```text
The first planned version focuses on quarterly updates. Final declaration and full tax return submission are outside the first planned version.
```

## Launch gates for public production website

Before production launch:

- Copy reviewed against HMRC wording file.
- Privacy notice reviewed.
- Cookie notice/consent implemented if analytics/cookies used.
- Terms reviewed.
- Security headers configured.
- Lead storage secured.
- Admin access secured.
- No misleading capability claims.
- No pricing/payment unless product scope and refund/cancellation terms are ready.
