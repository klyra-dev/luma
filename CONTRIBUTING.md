# Contributing to Luma (Brightness Controller)

Thank you for your interest in contributing to Luma. We welcome contributions of all kinds — bug reports, documentation improvements, UX tweaks, and code. This document describes the recommended workflow and standards to make your contribution straightforward and easy to review.

## Table of contents
- How to report a bug
- Requesting a feature
- Making changes (developer workflow)
- Pull request checklist
- Code style & testing
- Communication & code of conduct
- Licensing

---

## How to report a bug
When filing an issue, include:
- A short, descriptive title.
- Steps to reproduce the problem.
- Expected behavior vs. what happened.
- Browser and OS versions (e.g., Chrome 118 / macOS 13).
- Screenshots or a short gif when helpful.
- Console errors (if any) and any relevant extension logs.

A minimal issue template:
- Title: Brief description
- Steps to reproduce: 1..n
- Expected result:
- Actual result:
- Environment: Chrome version, OS

---

## Requesting a feature
Before opening a feature request:
1. Search existing issues to avoid duplication.
2. Provide a short description of the user problem and proposed solution.
3. Explain any privacy, performance, or UX trade-offs.

Feature requests are welcome; maintainers may ask for clarification or suggest a smaller scoped change for initial implementation.

---

## Making changes (developer workflow)
1. Fork the repository and clone your fork.
2. Create a topic branch from `main`:
   - `git checkout -b feat/your-short-description`
3. Make small, focused commits. Prefer many small commits over one huge commit.
4. Write or update tests and documentation as appropriate.
5. Push your branch to your fork, then open a PR against `main`.

Local development tips:
- To test the extension locally, open Chrome → `chrome://extensions` → enable "Developer mode" → "Load unpacked" → select the project root.
- After changes, reload the unpacked extension and refresh any open tabs to see updates.

---

## Pull request checklist
Before requesting review, ensure:
- [ ] The PR is small and focused (single feature/bug per PR).
- [ ] The README or user-facing docs are updated if the behavior or UI changed.
- [ ] The code follows the project's style and is sufficiently commented.
- [ ] Any new UI includes screenshots or brief notes about accessibility.
- [ ] Tests are added or existing tests updated where applicable.
- [ ] You signed the commits with a clear message (see Commit Messages).

Commit message guideline:
- Use an imperative, concise subject: `feat: add live preview in popup`
- Add a body if additional context is needed.

---

## Code style & testing
- Language: Vanilla JavaScript, HTML, and CSS.
- Keep functions small and focused. Prefer clarity over cleverness.
- Avoid global variables — use closures or module patterns.
- For UI changes, follow accessible patterns (labels, keyboard navigation, readable color contrast).
- If you add dependencies or build steps, explain why and update the README with build/test instructions.

Tests
- The project currently does not enforce a test suite. If you add test infrastructure, document how to run tests and include them in CI.

---

## Communication & Code of Conduct
- Be respectful and constructive.
- If you're unsure about a larger change, open an issue first to discuss design and scope.
- Follow this project's Code of Conduct: be welcoming, respectful, and helpful. (Add or link to `CODE_OF_CONDUCT.md` in the repo.)

---

## Licensing
By contributing, you agree that your contributions will be licensed under the project's MIT license (see `LICENSE`).

---

Thanks again for improving Luma. We appreciate any contribution — big or small. If you need help getting started, open an issue with the label "help wanted" or tag a maintainer in the discussion.