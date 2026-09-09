#!/usr/bin/env bash
# PreToolUse(Bash) guard: git and gh are read-only for Claude in this repository.
#
# Second layer behind permissions.deny in .claude/settings.json. Those rules match
# the START of a command, so they miss forms this catches:
#   - compound commands      cd /tmp && git push
#   - leading env vars       GIT_AUTHOR_NAME=x git commit
#   - flag-position writes   gh api repos/o/r/issues -X POST
#   - bare tag creation      git tag v1.0   (no flag for a prefix rule to match)
#
# Always exits 0. Emitting permissionDecision "deny" is what blocks the call.

set -uo pipefail

cmd=$(jq -r '.tool_input.command // empty' 2>/dev/null) || exit 0
[ -z "$cmd" ] && exit 0

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

# Start of a command: line start, or after ; & | ( { or a && / || operator,
# optionally followed by VAR=value assignments and/or sudo.
BOUNDARY='(^|[;&|({]|&&|\|\|)[[:space:]]*([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*(sudo[[:space:]]+)?'

# Subcommands reserved to the user by project policy. Beyond the obviously
# mutating ones: `fetch` rewrites remote-tracking refs; `config` cannot be split
# into read and write forms by prefix matching; `remote` and `ls-remote` touch
# the remote at all, which is the user's business, not Claude's.
GIT_WRITE='add|commit|push|pull|fetch|config|remote|ls-remote|checkout|switch|merge|rebase|reset|restore|revert|stash|cherry-pick|clean|rm|mv|apply|am|init|bisect|filter-branch|update-ref|gc|prune'

if printf '%s' "$cmd" | grep -qE "${BOUNDARY}git[[:space:]]+(${GIT_WRITE})([[:space:]]|\$)"; then
  deny "Blocked: git is read-only for Claude in this repository, and anything touching a remote is reserved to the user. Local read-only git (status, log, diff, show, describe, for-each-ref, rev-list, merge-base, branch and tag listing) is still available."
fi

if printf '%s' "$cmd" | grep -qE "${BOUNDARY}git[[:space:]]+branch[[:space:]]+(-[dDmMf]|--delete|--move|--force)"; then
  deny "Blocked: deleting, renaming or force-moving a branch must be done by the user. Listing branches (git branch, git branch -a) is allowed."
fi

if printf '%s' "$cmd" | grep -qE "${BOUNDARY}git[[:space:]]+(worktree|submodule)[[:space:]]+(add|remove|rm|rename|prune|update|deinit)"; then
  deny "Blocked: this git subcommand changes repository state. Run it yourself."
fi

# `git tag` lists tags as well as creating them, so it needs argument parsing
# rather than a prefix match: listing and inspection are allowed, anything that
# creates, deletes, or moves a tag is not.
git_tag_is_write() {
  local args="$1" tok listing=0

  # Unambiguous create/delete/force flags.
  if printf '%s' "$args" |
    grep -qE '(^|[[:space:]])(-[adDsfu]|--delete|--force|--annotate|--sign|--local-user|--message|--file|--create-reflog)([[:space:]]|=|$)'; then
    return 0
  fi

  # A bare argument with no preceding listing flag is a tag name being created.
  for tok in $args; do
    case "$tok" in
      -l | --list | -n* | --contains | --no-contains | --points-at | --merged | --no-merged | \
        --sort=* | --format=* | --color* | -i | --ignore-case | --omit-empty)
        listing=1
        ;;
      -*) ;;
      *)
        [ "$listing" -eq 0 ] && return 0
        ;;
    esac
  done
  return 1
}

if printf '%s' "$cmd" | grep -qE "${BOUNDARY}git[[:space:]]+tag([[:space:]]|\$)"; then
  tag_args="${cmd#*git tag}"
  tag_args="${tag_args%%;*}"
  tag_args="${tag_args%%&&*}"
  tag_args="${tag_args%%||*}"
  tag_args="${tag_args%%|*}"
  if git_tag_is_write "$tag_args"; then
    deny "Blocked: creating, deleting or moving a tag must be done by the user. Listing and inspecting tags (git tag, git tag -l, git tag --sort=...) is allowed."
  fi
fi

GH_WRITE='(pr|issue)[[:space:]]+(create|close|reopen|edit|comment|delete|merge|review|ready|lock|unlock|transfer|pin|unpin)'
GH_WRITE="${GH_WRITE}|repo[[:space:]]+(create|delete|edit|fork|rename|archive|unarchive|sync|set-default)"
GH_WRITE="${GH_WRITE}|release[[:space:]]+(create|delete|edit|upload|delete-asset)"
GH_WRITE="${GH_WRITE}|project[[:space:]]+(create|delete|edit|copy|close|link|unlink|mark-template|item-create|item-add|item-edit|item-delete|item-archive|field-create|field-delete)"
GH_WRITE="${GH_WRITE}|workflow[[:space:]]+(run|enable|disable)"
GH_WRITE="${GH_WRITE}|run[[:space:]]+(cancel|rerun|delete)"
GH_WRITE="${GH_WRITE}|(secret|variable)[[:space:]]+(set|delete)"
GH_WRITE="${GH_WRITE}|label[[:space:]]+(create|edit|delete|clone)"
GH_WRITE="${GH_WRITE}|gist[[:space:]]+(create|edit|delete)"
GH_WRITE="${GH_WRITE}|cache[[:space:]]+delete"
GH_WRITE="${GH_WRITE}|ssh-key[[:space:]]+(add|delete)"
GH_WRITE="${GH_WRITE}|auth[[:space:]]+(login|logout|refresh|setup-git)"

if printf '%s' "$cmd" | grep -qE "${BOUNDARY}gh[[:space:]]+(${GH_WRITE})([[:space:]]|\$)"; then
  deny "Blocked: this gh command changes GitHub state. Run it yourself. Read-only gh (view, list, status) is allowed."
fi

if printf '%s' "$cmd" | grep -qE "${BOUNDARY}gh[[:space:]]+api[[:space:]]" &&
  printf '%s' "$cmd" | grep -qE '(-X|--method)[[:space:]]+(POST|PUT|PATCH|DELETE)'; then
  deny "Blocked: 'gh api' with a write method (POST/PUT/PATCH/DELETE). Run it yourself."
fi

# ---------------------------------------------------------------------------
# Installing or removing software is the user's job. Claude reports the command
# it needs; the user runs it. Running scripts (npm run, npm test, npx playwright
# test) stays available — only the package graph and the machine are protected.
# ---------------------------------------------------------------------------

NPM_WRITE='install|i|ci|add|uninstall|remove|rm|un|update|up|link|unlink|publish|unpublish|dedupe|prune|init|exec'

if printf '%s' "$cmd" | grep -qE "${BOUNDARY}npm[[:space:]]+(${NPM_WRITE})([[:space:]]|\$)"; then
  deny "Blocked: installing, removing or updating packages is the user's job. Tell the user the exact command to run instead. 'npm run <script>', 'npm test' and 'npm ls' are still available."
fi

if printf '%s' "$cmd" | grep -qE "${BOUNDARY}npm[[:space:]]+audit[[:space:]]+fix"; then
  deny "Blocked: 'npm audit fix' rewrites the lockfile. Report the advisory and let the user run it. Plain 'npm audit' is allowed."
fi

if printf '%s' "$cmd" | grep -qE "${BOUNDARY}npm[[:space:]]+pkg[[:space:]]+(set|delete)"; then
  deny "Blocked: 'npm pkg set/delete' edits package.json. Edit the file directly, or hand the command to the user. 'npm pkg get' is allowed."
fi

if printf '%s' "$cmd" | grep -qE "${BOUNDARY}(yarn|pnpm|bun)[[:space:]]+(install|i|add|remove|rm|update|upgrade|link|global)([[:space:]]|\$)"; then
  deny "Blocked: installing or removing packages is the user's job. Tell the user the command to run."
fi

# npx fetches a package when it is not already installed. `npx playwright test`
# runs the local binary and is fine; an explicit install or a forced download is not.
if printf '%s' "$cmd" | grep -qE "${BOUNDARY}npx[[:space:]]+(-y|--yes)([[:space:]]|\$)" ||
  printf '%s' "$cmd" | grep -qE "${BOUNDARY}npx[[:space:]]+[^;&|]*[[:space:]]install([[:space:]]|\$)"; then
  deny "Blocked: this npx invocation installs software (browser binaries or a fetched package). Tell the user the command to run. 'npx playwright test' and other local binaries are allowed."
fi

if printf '%s' "$cmd" | grep -qE "${BOUNDARY}(sudo|doas)([[:space:]]|\$)"; then
  deny "Blocked: Claude does not run privileged commands. Hand it to the user."
fi

if printf '%s' "$cmd" | grep -qE "${BOUNDARY}(dnf|yum|rpm|apt|apt-get|dpkg|pacman|zypper|flatpak|snap|brew|port)([[:space:]]|\$)"; then
  deny "Blocked: system package managers are the user's job. Report what is missing and the command that installs it."
fi

if printf '%s' "$cmd" | grep -qE "${BOUNDARY}(pip|pip3)[[:space:]]+(install|uninstall)([[:space:]]|\$)" ||
  printf '%s' "$cmd" | grep -qE "${BOUNDARY}(python|python3)[[:space:]]+-m[[:space:]]+pip[[:space:]]+(install|uninstall)" ||
  printf '%s' "$cmd" | grep -qE "${BOUNDARY}(cargo|go|gem|composer)[[:space:]]+install([[:space:]]|\$)"; then
  deny "Blocked: installing packages is the user's job. Tell the user the command to run."
fi

# The classic remote-install pattern: fetch a script and pipe it into a shell.
# Note: this pattern is single-quoted, so the end anchor is a bare $ — a \$ here
# would reach grep as an escaped literal dollar and silently match nothing.
if printf '%s' "$cmd" | grep -qE '(curl|wget)[^;&|]*\|[[:space:]]*(sudo[[:space:]]+)?(ba|z|k)?sh([[:space:]]|$)'; then
  deny "Blocked: piping a downloaded script into a shell installs unreviewed software. Hand the command to the user."
fi

exit 0
