# QuarterLink Project Brief

## Product summary

QuarterLink is bridging-only software for Making Tax Digital for Income Tax.

QuarterLink helps users send quarterly updates from spreadsheet records. It is not bookkeeping software.

The first version is for:
- self-employed individuals
- UK property landlords
- foreign property landlords
- people with both self-employment and property income

Later versions may support:
- bookkeepers
- single accountants
- accountancy practices with staff and client assignment
- smarter spreadsheet mapping
- final declaration / tax return features
- additional country tax regimes

## MVP scope

The first MVP supports:
- a simple QuarterLink landing page
- controlled project documentation
- a country/regime-aware architecture
- future support for spreadsheet bridging
- future support for quarterly updates
- future support for self-employment, UK property, and foreign property income sources

The first MVP does not yet implement:
- HMRC API calls
- OAuth
- authentication
- database storage
- spreadsheet parsing
- quarterly update payload submission
- final declaration
- tax return features

## Strict exclusions

QuarterLink must not build these in the MVP:
- VAT features
- bookkeeping ledger
- bank feeds
- receipt capture
- payroll
- invoicing
- in-app manual adjustment of imported monetary figures

## Spreadsheet strategy

Initial route A:
The user may use a QuarterLink spreadsheet template as their digital record.

Initial route B:
The user may add a QuarterLink summary sheet to their existing spreadsheet and link the required figures to their existing records.

Recommended route:
For existing spreadsheet users, route B should be recommended because it helps preserve the digital path from existing records to QuarterLink.

Later route:
Arbitrary messy spreadsheet mapping is a later paid feature. It is not part of the first MVP.

Important rule:
Imported monetary figures must be read-only after import. Corrections must happen by changing the source spreadsheet and re-importing.

## HMRC wording rules

User-facing content should use:
- Making Tax Digital for Income Tax
- send quarterly updates
- quarterly updates
- spreadsheet records
- bridging software
- software that connects to records

User-facing content should avoid:
- MTD ITSA
- HMRC-approved
- file quarterly tax returns
- submit quarterly returns
- EOPS
- End of Period Statement
- VAT features
- bookkeeping software

## Quarterly update facts

Standard update periods and deadlines:
- Q1 period: 6 April to 5 July
- Q1 deadline: 7 August
- Q2 period: 6 April to 5 October
- Q2 deadline: 7 November
- Q3 period: 6 April to 5 January
- Q3 deadline: 7 February
- Q4 period: 6 April to 5 April
- Q4 deadline: 7 May

Important:
- Period end dates and deadlines are different.
- Quarterly updates are not tax returns.
- Final declaration / tax return features are later and out of the bootstrap.
- Support standard update periods first.
- Calendar update periods are a later feature.
- The £90,000 VAT registration threshold affects simple/consolidated versus detailed categorisation where allowed, but QuarterLink must not build VAT features.

## Product tiers

Planned commercial ladder:
- QuarterLink Individual
- QuarterLink Plus
- QuarterLink Agent
- QuarterLink Practice
- Later final declaration / tax return add-on

Pricing is not decided in the bootstrap. To be specified in a later ticket.

## User groups

Individual:
A person using QuarterLink for their own self-employment, UK property, foreign property, or a combination.

Agent Solo:
A bookkeeper or single accountant managing multiple clients.

Practice:
An accountancy firm with multiple staff members and clients.

Detailed permissions are not implemented in the bootstrap. To be specified in a later ticket.

## Architecture principle

QuarterLink should use one core codebase.

The core should avoid hard-coding HMRC concepts where possible.

The first tax regime is:
UK / Making Tax Digital for Income Tax.

Future country support should be possible through tax regime adapters, but the bootstrap must not build a complex global tax engine.

Suggested structure:
- src/core
- src/tax-regimes/common
- src/tax-regimes/uk/mtd-income-tax

## Controlled AI workflow

GPT:
- creates and reviews tickets
- checks scope
- checks HMRC wording
- checks architecture
- writes fix prompts
- accepts or rejects work

Codex:
- implements one approved ticket
- edits files
- runs checks
- writes a run report
- stops after the ticket

Human:
- controls commits
- controls pushes
- decides when to move to the next ticket

## Bootstrap rule

QL-BOOTSTRAP creates the control system and app skeleton only.

Do not implement:
- HMRC API
- authentication
- database
- spreadsheet parser
- quarterly update payloads
- final declaration
- tax return features
- VAT features
- bookkeeping
- bank feeds
- receipt capture
- payroll
- invoicing

Anything not specified here should be written as:
"To be specified in a later ticket."
