# Zero Placeholder Candidate Names Rule

## Rule Statement
Under NO CIRCUMSTANCES should any election dataset file in `public/data/elections/` contain generic placeholder names such as:
- `"Democratic Nominee"`
- `"Republican Nominee"`
- `"Nominee"`
- `"Nominee (District ...)"`
- `"Uncontested Primary"`

All candidate names MUST be real, dynamic officeholders or certified candidates dynamically extracted from official BOE reports or Wikipedia API.

## Build Script Validation Requirement
`scripts/build_dynamic_boe_dataset.py` MUST contain an automated validation check at the end of execution that scans all 209 election JSON files and throws a hard build exception if any generic placeholder string is found.
