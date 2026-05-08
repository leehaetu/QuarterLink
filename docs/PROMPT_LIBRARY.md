# Prompt Library

## Ask GPT to create the next ticket

Create the next QuarterLink ticket from the source-of-truth documents. Keep it scoped to one implementation step. Do not approve it for Codex until scope, HMRC wording, architecture, and security have been checked.

## Ask Codex to implement one approved ticket

Implement the currently approved QuarterLink ticket only. Do not continue to the next ticket. Run the required checks, write the run report, update ticket control files, and stop.

## Ask GPT to review a Codex run report

Review the Codex run report and changed files for scope, HMRC wording, architecture, security, tests, and documentation. Respond with ACCEPTED, FIX_REQUIRED, or REJECTED.

## Ask Codex to fix GPT review issues only

Fix only the issues listed in the GPT review. Do not add unrelated changes, do not start the next ticket, run the required checks, and update the run report.
