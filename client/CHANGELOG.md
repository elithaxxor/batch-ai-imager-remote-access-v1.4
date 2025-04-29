# Changelog

## [Unreleased]

### 2025-04-29

#### Documentation
- Expanded and restructured README.md with:
  - Project overview and purpose
  - Technical architecture and how it works
  - Key features and improvement roadmap
  - Clearer build, deployment, and usage instructions
  - New section on rooms for improvement

### 2025-04-27

#### Major Improvements
- **TypeScript Build Stability:**
  - Resolved all TypeScript build errors and warnings for a clean production build.
  - Explicitly typed chart data, overlay arrays, and alert marker objects for robust type safety.
  - Removed unused and erroneous `@ts-expect-error` directives.

- **Chart & Visual Indicator Enhancements:**
  - Improved logic for alert marker annotations on charts, including type-safe dynamic keys and better display of alert types and prices.
  - Enhanced overlay options for technical indicators (SMA, EMA, VWMA, RSI, MACD, Bollinger Bands, Stochastic, ATR).
  - Improved custom notes and annotation handling for user-added chart notes.

- **Dependency Updates:**
  - Installed and configured `chartjs-plugin-annotation` for advanced chart annotations.
  - Updated and documented all relevant dependencies.

- **Documentation:**
  - Expanded README with clear build, deployment, and feature instructions.
  - Added this detailed changelog and ensured Markdown lint compliance.

#### Bug Fixes
- Fixed issues where alert markers would not render due to missing or mis-typed objects.
- Corrected issues with implicit `any` types in chart and overlay logic.
- Fixed variable scope and initialization for chart data and markers.

#### Developer Experience
- Improved ESLint and Markdown lint compliance in documentation files.
- Added explicit instructions for local production build and static serving with `serve`.

---

For previous changes, see commit history.
