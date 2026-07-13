#!/usr/bin/env bash
# PreToolUse guard: block destructive gh/git commands.
# Reads the hook JSON on stdin, inspects the Bash command, and denies if it
# matches a destructive pattern. See CLAUDE.md "GitHub CLI (gh) Safety".
#
# Denies by emitting a PreToolUse decision JSON. Non-matching commands emit
# nothing and exit 0 (allowed to proceed to normal permission handling).

set -euo pipefail

cmd="$(jq -r '.tool_input.command // ""')"

# Normalize runs of whitespace to single spaces so "gh   project    delete"
# still matches. Keep it lowercase-insensitive via grep -iE per check.
norm="$(printf '%s' "$cmd" | tr '\n\t' '  ' | tr -s ' ')"

reason=""

# gh subcommand deletes (token-adjacent, not substrings in arguments).
if grep -iqE 'gh +project +delete\b' <<<"$norm"; then
  reason="Blocked: 'gh project delete' deletes a GitHub Project (destructive)."
elif grep -iqE 'gh +project +item-delete\b' <<<"$norm"; then
  reason="Blocked: 'gh project item-delete' removes a Project item (destructive)."
elif grep -iqE 'gh +project +field-delete\b' <<<"$norm"; then
  reason="Blocked: 'gh project field-delete' removes a Project field (destructive)."
elif grep -iqE 'gh +repo +delete\b' <<<"$norm"; then
  reason="Blocked: 'gh repo delete' deletes a repository (destructive)."
elif grep -iqE 'gh +issue +delete\b' <<<"$norm"; then
  reason="Blocked: 'gh issue delete' permanently deletes an issue (destructive)."
elif grep -iqE 'gh +release +delete\b' <<<"$norm"; then
  reason="Blocked: 'gh release delete' deletes a release (destructive)."
# gh api graphql delete mutations (e.g. deleteProjectV2, deleteIssue, deleteRef).
elif grep -iqE 'gh +api\b' <<<"$norm" && grep -iq 'graphql' <<<"$norm" && grep -iqE 'delete[a-z0-9]' <<<"$norm"; then
  reason="Blocked: 'gh api graphql' delete mutation (destructive)."
# git force-push.
elif grep -iqE 'git +push\b' <<<"$norm" && grep -iqE '(--force\b|--force-with-lease| -f\b)' <<<"$norm"; then
  reason="Blocked: force-push rewrites remote history (destructive)."
# git branch deletion (local -d/-D, or push --delete / colon refspec).
elif grep -iqE 'git +branch +(--delete\b|-[dD]\b)' <<<"$norm"; then
  reason="Blocked: 'git branch -d/-D' deletes a branch (destructive)."
elif grep -iqE 'git +push\b' <<<"$norm" && grep -iqE '(--delete\b| :[^ ]+)' <<<"$norm"; then
  reason="Blocked: deleting a remote branch via git push (destructive)."
fi

if [[ -n "$reason" ]]; then
  jq -n --arg r "$reason" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: ($r + " Blocked by project policy (CLAUDE.md GitHub CLI Safety). If you truly intend this, run it yourself outside Claude.")
    }
  }'
fi

exit 0
