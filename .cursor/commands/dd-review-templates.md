# Review Datadog templates

Review the toolkit's rules and skill templates for Datadog configuration correctness, consistency with current docs, and drift. Use in the d-scribe repo after iterating on templates or before releasing.

Delegate to the `dd-review-templates` subagent, which will:

1. Enumerate `rules/*.mdc` and `skills/dd-add-product/templates/`, `skills/dd-terraform/templates/`
2. Check frontmatter, syntax, doc alignment, and consistency across files
3. Produce a PASS/WARN/FAIL report with suggested edits
4. If you say "fix" or "apply fixes", apply non-destructive edits and summarize changes
