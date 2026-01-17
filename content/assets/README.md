# Branding Assets

Place your custom branding files here. They will be deployed during the Docker build.

## Supported Files

| File | Size | Description | Destination |
|------|------|-------------|-------------|
| `logo.png` | 64x64 px | Site logo (header) | `/lib/tpl/dokuwiki/images/logo.png` |
| `favicon.ico` | 32x32 px | Browser tab icon | `/lib/tpl/dokuwiki/images/favicon.ico` |
| `apple-touch-icon.png` | 180x180 px | iOS home screen icon | `/lib/tpl/dokuwiki/images/apple-touch-icon.png` |

## Guidelines

- **Logo**: PNG with transparent background, square aspect ratio (64x64 recommended)
- **Favicon**: ICO format, 32x32 or 16x16 pixels
- **Apple Touch Icon**: PNG, 180x180 pixels, no transparency

## Example

```
content/
└── assets/
    ├── README.md
    ├── logo.png           # Your custom logo
    ├── favicon.ico        # Browser tab icon
    └── apple-touch-icon.png
```

## Deployment

Assets are copied during Docker build. After adding/changing assets:

1. Commit and push changes
2. Build and push new Docker image
3. Deploy (or wait for CI/CD)

The Dockerfile handles copying these files if they exist.
