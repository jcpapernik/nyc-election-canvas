# NYC Election Canvas Rules

## 1. Party Slug Normalization Invariance
Whenever constructing dynamic election dataset keys or file paths, party string normalization MUST strictly match static file naming conventions (`democratic_` for Democratic, `republican_` for Republican). Never truncate or abbreviate party prefixes in route keys.

## 2. Uncontested & Unopposed Race Event Handling
Uncontested/unopposed races (`isUncontested: true`) MUST remain 100% interactive, clickable, and inspectable on map vector layers. They must render with full candidate color opacity and display an explicit "UNCONTESTED RACE — Candidate Unopposed" badge in tooltips and inspector cards.

## 3. Strict Source File Line Count Constraint
Every single source file under `src/` MUST remain strictly **<= 299 lines of code**. Large components or utility engines must be modularized across clean sub-files.
