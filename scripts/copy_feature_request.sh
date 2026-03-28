#!/bin/bash
# Copy feature request docs from juno_website/docs to juno_api/docs/feature_requests
# Usage:
#   ./scripts/copy_feature_request.sh                           # interactive - lists available files
#   ./scripts/copy_feature_request.sh <filename>                # copy specific file
#   ./scripts/copy_feature_request.sh --all                     # copy all feature request docs

WEBSITE_DOCS="/Users/omeralimalik/Documents/work/projects/juno_website/docs"
API_FEATURE_REQUESTS="/Users/omeralimalik/Documents/work/projects/juno_api/docs/feature_requests"

# Ensure target directory exists
mkdir -p "$API_FEATURE_REQUESTS"

# Find all feature request / requirement docs (dated files)
get_feature_files() {
    find "$WEBSITE_DOCS" -maxdepth 1 -name "202*_*.md" -type f | sort
}

copy_file() {
    local src="$1"
    local filename=$(basename "$src")
    local dest="$API_FEATURE_REQUESTS/$filename"

    cp "$src" "$dest"
    echo "  Copied: $filename"
    echo "    -> $dest"
}

# --all flag: copy everything
if [ "$1" = "--all" ]; then
    echo "Copying all feature request docs to juno_api..."
    echo ""
    files=$(get_feature_files)
    if [ -z "$files" ]; then
        echo "No feature request docs found (looking for 202*_*.md pattern)"
        exit 1
    fi
    count=0
    while IFS= read -r file; do
        copy_file "$file"
        count=$((count + 1))
    done <<< "$files"
    echo ""
    echo "Done. Copied $count file(s)."
    exit 0
fi

# Specific filename provided
if [ -n "$1" ]; then
    # Try exact path first, then check in docs folder
    if [ -f "$1" ]; then
        copy_file "$1"
    elif [ -f "$WEBSITE_DOCS/$1" ]; then
        copy_file "$WEBSITE_DOCS/$1"
    else
        echo "File not found: $1"
        echo "Looked in: $WEBSITE_DOCS/"
        exit 1
    fi
    echo ""
    echo "Done."
    exit 0
fi

# Interactive mode: list available files
echo "Feature request docs available to copy:"
echo ""
files=$(get_feature_files)
if [ -z "$files" ]; then
    echo "  (none found - looking for 202*_*.md pattern in $WEBSITE_DOCS)"
    exit 0
fi

i=1
file_array=()
while IFS= read -r file; do
    filename=$(basename "$file")
    size=$(du -h "$file" | cut -f1 | xargs)
    echo "  [$i] $filename ($size)"
    file_array+=("$file")
    i=$((i + 1))
done <<< "$files"

echo ""
echo "Usage:"
echo "  $0 <filename>    Copy a specific file"
echo "  $0 --all         Copy all files above"
