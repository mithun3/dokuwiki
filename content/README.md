# Content as Code - DokuWiki Pages

All wiki pages are authored directly in native DokuWiki `.txt` format in this directory.

**Current source of truth:** Pages are in [`pages/`](./pages/) subdirectory (git-tracked).

## Structure

```
pages/
├── home.txt
├── sidebar.txt
├── recording/
└── sounds/
```

All `.txt` files are in DokuWiki native syntax and are copied into the Docker image during build. See [`docs/ADDING-CONTENT.md`](../docs/ADDING-CONTENT.md) for the workflow.

