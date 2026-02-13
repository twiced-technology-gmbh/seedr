# Registry Item Descriptions

Every `item.json` has two description fields. Both are mandatory for all registry items.

## `description` — "What does this do?"

A single sentence that tells the user what the extension is capable of.

- One clear sentence — naturally short because it focuses on the core capability
- Lead with what it *does*, not what it *is* ("Analyze code for 23 classic code smells" not "A code analysis tool")
- No trigger instructions ("Use when..."), no title restatements ("X plugin for Claude")
- Must work at a glance in a list view — users scan, they don't read

## `longDescription` — "Should I install this?"

Everything the user needs to decide whether to install, without reading the README.

- All concrete specifics: supported languages/frameworks, number of rules/patterns/techniques, included agents/commands, approach taken
- Differentiators: what makes this different from doing it manually or using alternatives
- No filler, no marketing speak — just the facts
- After reading this, the user should be able to make an informed install/skip decision
- 1-3 sentences, typically 30-60 words
