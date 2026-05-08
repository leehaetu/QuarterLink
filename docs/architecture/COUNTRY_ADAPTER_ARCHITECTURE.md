# Country Adapter Architecture

QuarterLink starts with UK Making Tax Digital for Income Tax.

Core modules should stay as country-neutral as practical.

Tax authority logic belongs in tax-regime adapters.

Do not build a complex global tax engine in the bootstrap.

Future country support is an architectural principle, not a bootstrap feature. To be specified in a later ticket.
