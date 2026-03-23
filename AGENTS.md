# Agent Implementation Rules

## Package Manager: pnpm (MANDATORY)

**ALWAYS use `pnpm` for package management operations.**

- ❌ Do NOT use `npm install`, `npm add`, `npm remove`
- ❌ Do NOT use `yarn`
- ✅ ALWAYS use `pnpm install`, `pnpm add`, `pnpm remove`

Reason: This project uses `pnpm-workspace.yaml` and `pnpm-lock.yaml` for monorepo management.

**For running scripts**, use `npm run` (as defined in package.json):

```bash
npm run dev
npm run build
npm run test:coverage
npm run lint:fix
```

Commands reference:

- Install dependencies: `pnpm install`
- Add package: `pnpm add <package>` (or `pnpm add -D` for dev)
- Remove package: `pnpm remove <package>` (or `pnpm remove -D`)
- Run script: `npm run <script-name>` (from package.json)

## Code Coverage: Comprehensive Test Scenarios for New Implementations

**HARD REQUIREMENT**: All new code implementations must have comprehensive E2E test scenarios.

Test location: `tests/specs/` (use Playwright fixtures and test utilities)

Requirements:

- New features: Add E2E tests covering realistic user workflows
- Bug fixes: Include regression tests in `tests/specs/`
- Documentation updates: Update CONTRIBUTION.md

Run tests:

```bash
npm run test:coverage
npm run test:e2e:core
```

**Coverage measurement**: Verify code paths are exercised through test scenarios covering:

- Happy path workflows
- Error scenarios
- Edge cases
- IPC communication patterns

See [CONTRIBUTION.md](./CONTRIBUTION.md) for testing approach and examples.

## Documentation

See **CONTRIBUTION.md** for:

- Development workflow
- Architecture overview
- All other implementation details

**IMPORTANT**: Do NOT create separate .md files for feature documentation. Consolidate all docs into CONTRIBUTION.md or appropriate section.

Report/meta documentation goes to `/agentReports/` folder (not project root).
