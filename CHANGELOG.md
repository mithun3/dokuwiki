# Changelog

## [2.0.0] - 2026-01-27

All notable changes to sysya-wiki project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

> **Status:** Planned - Awaiting 1-week Vercel stability verification

### Added (Planned for Post-Stability Phase)
- AWS infrastructure decommissioning automation toolkit
  - 10 executable decommissioning scripts in `/scripts/decommissioning/`
  - Master orchestrator with 5-phase execution
  - Safety gates and emergency rollback procedures
- Comprehensive decommissioning documentation
  - README.md with 2,500+ lines of guidance
  - Pre-flight validation scripts
  - Resource audit and state cleanup utilities
- Cost tracking and verification
  - Expected $150/month savings (~$1,800/year)
  - Automated cost verification script

### Infrastructure Changes (Planned)
- Delete: ECS Fargate cluster, RDS database, EFS storage, ALB, NAT Gateways
- Keep: S3 media bucket, CloudFront CDN, Route53 DNS (moved to Vercel)
- Archive: Terraform state files and infrastructure code

### Migration Completion
- ✅ Full DokuWiki to Next.js migration complete
- ✅ All 22 content pages live and functional
- ✅ Media serving via S3/CloudFront CDN
- ✅ Comments system (Giscus) integrated
- ✅ All tests passing (38/38)
- ✅ Production build verified (0 errors)

---

## [1.2.0] - 2026-01-27

### Added
- Decommissioning automation scripts and documentation
  - `/scripts/decommissioning/` directory with comprehensive toolkit
  - 5 phase-based scripts for safe infrastructure teardown
  - 4 utility scripts for diagnostics and recovery
  - Master orchestrator script with logging
- Decommissioning documentation
  - DECOMMISSIONING-CHECKLIST.md - Executive checklist and timeline
  - DECOMMISSIONING-IMPLEMENTATION-SUMMARY.md - Complete implementation guide
  - `scripts/decommissioning/README.md` - 2,500+ line comprehensive guide
- Safety features for decommissioning
  - Pre-flight validation checks
  - Multiple confirmation gates
  - Emergency rollback procedures
  - Terraform state archival
  - Timestamped audit logging

### Documentation
- Updated DECOMMISSIONING-CHECKLIST.md with script references
- Added versioning strategy documentation
- Created VERSIONING.md (this file)

### Infrastructure
- Documented cost savings: ~$138/month ($1,656/year)
- Prepared Terraform destroy configuration
- Created resource audit and verification tools

---

## [1.1.0] - 2026-01-27

### Added
- Temporal tracking system with evolution phases
  - `ArticleFooter` component displaying article metadata
  - Evolution phase support: foundational/refined/experimental/archived
  - Last reviewed date tracking
  - GitHub edit links for each article
- Frontmatter metadata to key articles
  - `evolutionPhase` field for article maturity
  - `lastReviewedAt` field for maintenance tracking
  - `status` field for current article state
- Enhanced article display
  - Client-side hydration check for SSR compatibility
  - Visual article stage indicators
  - Temporal awareness for readers

### Files Modified
- [nextjs-wiki/src/app/[...slug]/page.tsx](nextjs-wiki/src/app/[...slug]/page.tsx) - ArticleFooter integration
- [nextjs-wiki/content/*.mdx](nextjs-wiki/content/) - Added metadata to core pages
- [nextjs-wiki/content/recording/*.mdx](nextjs-wiki/content/recording/) - Added metadata to recording section
- Created [nextjs-wiki/src/components/ArticleFooter.tsx](nextjs-wiki/src/components/ArticleFooter.tsx)

### Tests
- All 38 tests passing ✓
- Test infrastructure verified with UI mode

---

## [1.0.0] - 2026-01-27

### Initial Release - Next.js Migration Complete

#### Added
- **Next.js 14.2 Framework**
  - App Router with file-based routing
  - Server Components and static generation
  - TypeScript support with strict types
  - TailwindCSS styling system
  - Dark mode support via next-themes

- **Content Migration**
  - All 22 DokuWiki pages converted to MDX
  - Frontmatter-based metadata system via gray-matter
  - Hierarchical content organization with nested routes
  - Recursive route segments for flexible URL structure
  - Full syntax highlighting (rehype-highlight)
  - GitHub Flavored Markdown support (remark-gfm)

- **Media System**
  - Zustand-based media player store (persistent)
  - Shuffle, playback, and volume controls
  - Auto-discovery of media links from page content
  - MediaPlayer and MediaGallery components
  - Track queue management
  - Play state synchronization across pages

- **Comments System**
  - Giscus integration for GitHub Discussions
  - Comments linked to GitHub repository
  - Per-page discussion threads
  - Moderation via GitHub

- **Components**
  - Dynamic page rendering with metadata
  - Article navigation with breadcrumbs
  - Responsive media galleries
  - Code syntax highlighting
  - Table rendering with HTML support

- **Testing Infrastructure**
  - Vitest test framework with jsdom environment
  - 38 comprehensive unit tests
  - Code coverage configuration
  - Test UI for interactive development
  - Path alias resolution in tests

- **Build & Deployment**
  - Production build: 22/22 pages (0 errors)
  - Vercel deployment configured
  - Custom domain (sysya.com.au) resolving
  - Static generation for fast performance
  - Automatic deployments from git push

- **Development Experience**
  - TypeScript strict mode
  - ESLint configuration
  - Prettier code formatting
  - Hot Module Replacement (HMR)
  - Source maps for debugging

#### Fixed
- **Code Quality Issues**
  - Removed 227 lines of duplicate `useMediaPlayerStore` export in store.ts
  - Removed 105 lines of duplicate handlers in MediaGallery.tsx
  - Fixed MDX table rendering (converted markdown to HTML for reliability)

- **Build Errors**
  - Resolved "Cannot set properties of undefined (reading 'inTable')" error
  - Fixed Vitest config interference by moving to `.vitest/` directory
  - Corrected import alias resolution in test environment

- **Test Failures**
  - Fixed 3 failing content tests (frontmatter parsing, content structure)
  - Fixed shuffle test (used correct store method `toggleShuffle`)
  - Verified all edge cases in media player logic

#### Performance
- **Build Performance**
  - Build time: < 2 minutes
  - Generated 22 static pages
  - Zero build errors
  
- **Runtime Performance**
  - Media player shuffle: O(n) algorithm
  - Zustand store optimized with persist middleware
  - Selective re-renders via useMemo and useCallback
  - Client-side hydration optimization

#### Testing
- **Test Coverage**
  - 38/38 tests passing ✓
  - Content loader tests (frontmatter, markdown parsing)
  - Media player store tests (playback, shuffle, queue management)
  - Integration tests with realistic content

#### Documentation Created
- [README.md](../README.md) - Project overview
- [QUICK-START.md](../QUICK-START.md) - Getting started guide
- [IMPLEMENTATION-SUMMARY.md](../IMPLEMENTATION-SUMMARY.md) - Migration details
- [TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md) - Common issues and solutions
- [COMMENTS-ARCHITECTURE.md](../docs/COMMENTS-ARCHITECTURE.md) - Giscus integration guide

#### Migration Statistics
- **Content Pages:** 22 articles across 5 categories
- **Media Files:** 200+ audio/video files via CDN
- **Comments:** Full GitHub Discussions integration
- **Build Size:** Optimized static site
- **Deployment:** Fully automated via Vercel
- **Monitoring:** Vercel Analytics and Sentry

#### Breaking Changes
- Old DokuWiki URL structure no longer supported (redirects implemented via URL rewriting)
- PHP backend completely replaced by Next.js
- ECS deployment replaced by Vercel serverless

#### Dependencies Upgraded
- `next`: ^14.2.0
- `react`: ^18.3.0
- `zustand`: ^4.5.0
- `@mdx-js/*`: ^3.0.0
- `rehype-highlight`: ^7.0.0
- `remark-gfm`: ^4.0.0

#### Known Issues (None at Release)
- All identified issues fixed
- Production build clean
- Tests comprehensive

---

## Release Schedule

| Version | Target Date | Status | Focus |
|---------|-------------|--------|-------|
| **v1.0.0** | 2026-01-27 | ✅ Released | Migration complete, tests passing |
| **v1.1.0** | 2026-01-27 | ✅ Released | Temporal tracking, article metadata |
| **v1.2.0** | 2026-01-27 | ✅ Released | Decommissioning automation |
| **v2.0.0** | 2026-02-TBD | ⏳ Planned | AWS infrastructure removed, migration finalized |

---

## Migration Journey

### Phase 1: Foundation (Week 1-2)
- ✅ Next.js project setup
- ✅ Content migration from DokuWiki to MDX
- ✅ Basic routing and pages

### Phase 2: Enhancement (Week 2-3)
- ✅ Media player implementation
- ✅ Comments system integration
- ✅ Testing infrastructure

### Phase 3: Polish (Week 3-4)
- ✅ Code cleanup and deduplication
- ✅ Error fixes and optimization
- ✅ Production deployment

### Phase 4: Infrastructure Cleanup (Week 4+)
- ✅ Decommissioning automation created
- ⏳ 1-week Vercel stability verification
- ⏳ AWS infrastructure decommissioning
- ⏳ Cost reduction confirmation

---

## Version Tagging Strategy

### Tag Format
`v<MAJOR>.<MINOR>.<PATCH>` following Semantic Versioning

- **MAJOR** - Breaking changes or major infrastructure shifts
- **MINOR** - New features or significant enhancements
- **PATCH** - Bug fixes and minor updates

### Current Tags
- `v1.0.0` - Initial Next.js migration complete
- `v1.1.0` - Temporal tracking system added
- `v1.2.0` - Decommissioning automation created

### Future Tags
- `v2.0.0` - AWS decommissioning complete, fully serverless

### Creating Tags
```bash
# Create annotated tag
git tag -a v1.0.0 -m "Initial Next.js migration complete"

# Push tags to remote
git push origin --tags

# View tags
git tag -l
```

---

## Upgrade Path

### From v1.0.0 to v1.1.0
No breaking changes - transparent upgrade with new metadata in articles

### From v1.x.x to v2.0.0
- AWS infrastructure removed (not user-facing)
- Vercel becomes sole deployment platform
- No application code changes required

---

## Support Policy

- **Latest version**: Fully supported
- **Previous major version**: Security fixes only
- **Older versions**: No support

---

**Last Updated:** January 27, 2026  
**Next Review:** Post-AWS-decommissioning (February 2026)  
**Maintainer:** Migration Team
