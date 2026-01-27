#!/bin/bash
# Backup GitHub Discussions to JSON file
# Run this script weekly or via GitHub Actions

REPO_OWNER="mithun3"
REPO_NAME="dokuwiki"
BACKUP_DIR="${BACKUP_DIR:-.}/backups/discussions"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/discussions-$TIMESTAMP.json"

# GitHub API query to fetch all discussions
# Requires GITHUB_TOKEN environment variable
QUERY='{
  repository(owner: "'$REPO_OWNER'", name: "'$REPO_NAME'") {
    discussions(first: 100) {
      nodes {
        id
        title
        body
        createdAt
        updatedAt
        author {
          login
        }
        category {
          name
        }
        comments(first: 50) {
          nodes {
            id
            body
            createdAt
            author {
              login
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}'

echo "Backing up GitHub Discussions for $REPO_OWNER/$REPO_NAME..."

# Use gh CLI if available, otherwise use curl
if command -v gh &> /dev/null; then
  gh api graphql -f query="$QUERY" > "$BACKUP_FILE"
  echo "✅ Backup saved to $BACKUP_FILE"
  echo "File size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
  echo "⚠️  GitHub CLI not found. Install it to enable backups."
  echo "   https://cli.github.com/"
  exit 1
fi

# Show sample of backed up data
echo ""
echo "Sample discussions backed up:"
jq '.data.repository.discussions.nodes[].title' "$BACKUP_FILE" 2>/dev/null | head -5
