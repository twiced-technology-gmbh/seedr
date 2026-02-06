---
name: remove-community
description: |
  Remove a community-sourced item from the seedr registry.
  Trigger on: "/remove-community <slug>", "remove community item", "delete community plugin/skill".
  Looks up the item by slug in registry/manifest.json (sourceType: "community"), confirms with the user,
  and removes the manifest entry. No local files to delete — community items are metadata-only.
---

# Remove Community Item

Remove a community-sourced item from the seedr registry by slug.

## Workflow

### 1. Parse the argument

Extract `<slug>` from the user's input (e.g. `/remove-community superpowers`).

### 2. Look up the item in the manifest

Read `registry/manifest.json`, parse as JSON.

Search the `items[]` array for an entry where `slug` matches and `sourceType === "community"`.

**If not found:** Check if the slug exists with a different `sourceType`. If so, tell the user:
> "Found `<slug>` but it has sourceType `<actual>`, not `community`. Use `/remove-toolr` instead."

If the slug doesn't exist at all, error:
> "No item with slug `<slug>` found in the registry."

### 3. Confirm with the user

Show item details and ask for confirmation using AskUserQuestion:

```
questions:
  - question: "Remove '<name>' (<type>) from the registry? This will remove the manifest entry."
    header: "Confirm"
    options:
      - label: "Yes, remove it"
        description: "Remove from manifest.json (no local files to delete)"
      - label: "No, cancel"
        description: "Keep the item unchanged"
```

If the user selects "No, cancel", abort with a message.

### 4. Remove from manifest.json

Read `registry/manifest.json` again (to avoid stale data), parse as JSON.

Filter out the matching item from `items[]`.

Write the updated manifest back with `JSON.stringify(manifest, null, 2) + "\n"`.

### 5. Print summary

Print:
- Removed: `<name>` (`<slug>`, type: `<type>`)
- Updated: `registry/manifest.json`
- Note: No local files to clean up (community items are metadata-only)
- Remind user to commit and push

## Important notes

- Only removes items with `sourceType: "community"` — refuse to remove toolr items via this skill
- Always confirm before removing — no `--force` shortcut
- Community items removed this way will NOT reappear after `pnpm sync` unless they match a freshly synced item from the Anthropic registry
