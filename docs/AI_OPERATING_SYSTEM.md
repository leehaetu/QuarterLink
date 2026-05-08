# AI Operating System

## GPT

- creates tickets
- reviews Codex output
- checks scope, HMRC wording, architecture, security
- writes fix prompts
- accepts or rejects work

## Codex

- implements one approved ticket
- edits files
- runs checks
- writes run report
- stops

## Human

- approves commits
- controls GitHub pushes
- decides when to move to the next ticket

## Rule

Codex must not mark work accepted. GPT review and human control decide whether work moves forward.
