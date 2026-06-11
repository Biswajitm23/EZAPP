/**
 * @process dashboard-hero-redesign
 * @description Brownfield React Native (Expo) UI redesign of the MY EZ Dashboard
 * screen into a premium hero-slider experience. Uses an analyze -> implement ->
 * gate (tsc + lint) -> review -> refine convergence loop. STRICT constraint: only
 * the existing design-system theme tokens may be used (no hardcoded palette), and
 * all business logic / API contracts / navigation must be preserved.
 *
 * Adapted (composed) from:
 *   - specializations/ux-ui-design/pixel-perfect-implementation.js (analyze ->
 *     score -> plan -> implement -> refine convergence loop)
 *   - specializations/mobile-development/responsive-mobile-layout.js (RN layout)
 *   - tdd-quality-convergence.js (executable quality gates + convergence)
 *
 * @inputs {
 *   projectRoot: string,
 *   dashboardFile: string,
 *   barrelFile: string,
 *   componentsDir: string,
 *   themeTokensFile: string,
 *   components: string[],
 *   targetQuality: number,
 *   maxIterations: number
 * }
 * @outputs { success, converged, finalScore, iterations, filesCreated, filesModified }
 *
 * @skill react-native-dev specializations/mobile-development/skills/react-native-dev/SKILL.md
 * @skill animation-spec specializations/ux-ui-design/skills/animation-spec/SKILL.md
 * @agent react-native-expert specializations/mobile-development/agents/react-native-expert/AGENT.md
 * @agent ui-implementer specializations/ux-ui-design/agents/ui-implementer/AGENT.md
 * @agent visual-qa-scorer specializations/ux-ui-design/agents/visual-qa-scorer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectRoot = '.',
    dashboardFile = 'app/(protected)/(tabs)/dashboard/index.tsx',
    barrelFile = 'components/index.ts',
    componentsDir = 'components/dashboard',
    themeTokensFile = 'constants/theme/colors.ts',
    components = ['HeroCarousel', 'HeroCard', 'PaginationDots', 'DashboardHeader', 'CategoryTabs'],
    targetQuality = 90,
    maxIterations = 3,
  } = inputs;

  const startTime = ctx.now();
  ctx.log('info', 'Dashboard hero-slider redesign starting');
  ctx.log('info', `Target quality: ${targetQuality}, max iterations: ${maxIterations}`);

  // ==========================================================================
  // PHASE 1: ANALYZE — read current dashboard, theme tokens, components; build
  // a concrete refactor spec (file plan, component responsibilities, token map,
  // animation spec, logic-preservation contract).
  // ==========================================================================
  ctx.log('info', 'Phase 1: Analyze current implementation and build refactor spec');

  const spec = await ctx.task(analyzeTask, {
    projectRoot,
    dashboardFile,
    barrelFile,
    componentsDir,
    themeTokensFile,
    components,
  });

  // Plan-approval gate (auto-approved in non-interactive/yolo mode).
  await ctx.breakpoint({
    question: 'Refactor spec ready. Approve to implement the hero-slider redesign?',
    title: 'Redesign Plan Review',
    expert: 'owner',
    tags: ['approval-gate', 'plan'],
    context: { runId: ctx.runId, componentPlan: spec.componentPlan, tokenMap: spec.tokenMap },
  });

  // ==========================================================================
  // PHASE 2: IMPLEMENT — create the components + refactor the dashboard,
  // strictly theme-token driven, preserving all logic.
  // ==========================================================================
  ctx.log('info', 'Phase 2: Implement components and refactor dashboard');

  let implementation = await ctx.task(implementTask, {
    projectRoot,
    dashboardFile,
    barrelFile,
    componentsDir,
    themeTokensFile,
    components,
    spec,
  });

  ctx.log('info', `Implementation: ${implementation.filesCreated?.length || 0} created, ${implementation.filesModified?.length || 0} modified`);

  // ==========================================================================
  // PHASE 3..5: CONVERGENCE LOOP — gate (tsc + lint) -> review -> refine.
  // ==========================================================================
  let iteration = 0;
  let currentScore = 0;
  let converged = false;
  let lastReview = null;
  const history = [];

  while (!converged && iteration < maxIterations) {
    iteration++;
    ctx.log('info', `=== Convergence iteration ${iteration} ===`);

    // Executable quality gates in parallel.
    const [typecheck, lint] = await ctx.parallel.all([
      () => ctx.task(typecheckTask, { projectRoot, iteration }),
      () => ctx.task(lintTask, { projectRoot, dashboardFile, componentsDir, iteration }),
    ]);

    ctx.log('info', `tsc passed=${typecheck.passed} (scopeErrors=${typecheck.scopeErrorCount}); lint passed=${lint.passed}`);

    // Agent review against the full requirements + theme-token compliance.
    const review = await ctx.task(reviewTask, {
      projectRoot,
      dashboardFile,
      barrelFile,
      componentsDir,
      themeTokensFile,
      components,
      typecheck,
      lint,
      iteration,
      targetQuality,
    });

    lastReview = review;
    currentScore = review.overallScore;
    const gatesPass = typecheck.passed && lint.passed;
    converged = gatesPass && currentScore >= targetQuality;

    history.push({
      iteration,
      score: currentScore,
      gatesPass,
      typecheckPassed: typecheck.passed,
      lintPassed: lint.passed,
      gaps: review.gaps,
      hardcodedColorViolations: review.hardcodedColorViolations,
    });

    ctx.log('info', `Iteration ${iteration}: score=${currentScore}/${targetQuality}, gatesPass=${gatesPass}, converged=${converged}`);

    if (converged) break;

    if (iteration < maxIterations) {
      implementation = await ctx.task(refineTask, {
        projectRoot,
        dashboardFile,
        barrelFile,
        componentsDir,
        themeTokensFile,
        components,
        iteration,
        review,
        typecheck,
        lint,
        spec,
      });
      ctx.log('info', `Refine iteration ${iteration}: ${implementation.filesModified?.length || 0} files touched`);
    }
  }

  // ==========================================================================
  // PHASE 6: FINALIZE — summary + final approval gate (auto-approved in yolo).
  // ==========================================================================
  ctx.log('info', 'Phase 6: Finalize');

  const summary = await ctx.task(finalizeTask, {
    projectRoot,
    dashboardFile,
    componentsDir,
    components,
    converged,
    finalScore: currentScore,
    targetQuality,
    iterations: iteration,
    history,
    lastReview,
  });

  await ctx.breakpoint({
    question: `Redesign complete. Score ${currentScore}/${targetQuality} after ${iteration} iteration(s). Approve completion?`,
    title: 'Redesign Final Review',
    expert: 'owner',
    tags: ['approval-gate', 'final'],
    context: { runId: ctx.runId, converged, finalScore: currentScore, summary: summary.summary },
  });

  return {
    success: converged,
    converged,
    finalScore: currentScore,
    targetQuality,
    iterations: iteration,
    filesCreated: implementation.filesCreated || [],
    filesModified: implementation.filesModified || [],
    history,
    summary: summary.summary,
    metadata: {
      processId: 'dashboard-hero-redesign',
      startTime,
      endTime: ctx.now(),
    },
  };
}

/* ========================================================================== */
/* TASK DEFINITIONS                                                            */
/* ========================================================================== */

const THEME_RULES = [
  'CRITICAL THEME RULE: use ONLY the existing design system. NEVER hardcode any color literal',
  '(no hex like #FFFFFF/#13A07C, no "white"/"black"/"gray", no rgba() for color) in the NEW',
  'component files or the refactored dashboard. The ONE allowed brand constant is BRAND from',
  '@/constants/theme (or colors.brand.primary).',
  'Map colors dynamically via useTheme(): background.primary (screen bg), background.secondary or',
  'background.card (card/surface bg), text.primary (titles), text.secondary (subtitles), border.* ',
  '(borders/inactive dots), brand.primary / BRAND (active accents). isDark from useTheme() for any',
  'light/dark conditional. Use pastelAt(i) for per-card image-fallback tints. Translucent gradient',
  'overlays via expo-linear-gradient using rgba(0,0,0,a) are acceptable ONLY as an image scrim',
  '(reading legibility), not as a theme color substitute.',
];

const PRESERVE_RULES = [
  'PRESERVE EXACTLY (do not modify behavior): dashboardService + useQuery(["dashboard","content"]),',
  'router navigation (openCard logic: external -> WebBrowser, detail -> router.push content/[id],',
  'fallback internal link), useAuth, RefreshControl/onRefresh, HIDDEN_SECTIONS filtering, tab',
  'filtering (activeTab), section ordering by meta.tabs, the Social section special-casing, the',
  'presentations special card, cardState() label/done logic, greetingForNow(), loading skeleton and',
  'error/empty states. API models in api/types.ts MUST stay unchanged.',
];

/** PHASE 1 — analyze & spec. */
export const analyzeTask = defineTask('analyze-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze dashboard + theme and produce refactor spec',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior React Native + Expo UI architect',
      task: 'Read the current dashboard screen, the theme token system, and the components barrel, then produce a concrete, file-level refactor spec to redesign the dashboard into a premium hero-slider experience split into reusable components.',
      context: { ...args },
      instructions: [
        `Read these files first (paths relative to projectRoot=${args.projectRoot}):`,
        `  - dashboard screen: ${args.dashboardFile}`,
        `  - theme tokens: ${args.themeTokensFile} and constants/theme/index.ts`,
        `  - components barrel: ${args.barrelFile}`,
        '  - components/motion/PressableScale.tsx, components/motion/Reveal.tsx, components/AppHeader.tsx',
        '  - api/types.ts (DashboardItem, DashboardSection, DashboardTab) — READ ONLY, do not plan changes here',
        '  - package.json (confirm react-native-reanimated, expo-image, expo-linear-gradient are available)',
        '',
        `Plan exactly these new components under ${args.componentsDir}/: ${args.components.join(', ')}.`,
        'For each component define: file path, props (TypeScript shapes reusing api/types.ts), responsibility,',
        'which theme tokens it reads, and the reanimated animations it owns.',
        'HeroCarousel: horizontal snap FlatList/ScrollView, card width = 84% screen, neighbours peeking,',
        '  per-card interpolation (active scale 1 / inactive 0.92, slight translateX, opacity), drives PaginationDots.',
        'HeroCard: edge-to-edge expo-image, bottom linear-gradient scrim, radius 24-28, soft elevation, glass overlay;',
        '  left = title + subtitle/progress (submitted_forms/total_forms), right = status pill',
        '  (done -> surface bg + text.primary; pending -> BRAND bg + background.primary text). Reuse cardState() logic.',
        'PaginationDots: theme-colored, active dot wider + BRAND (width animated), inactive = border color.',
        'DashboardHeader: wrap existing <AppHeader/>, keep greeting + avatar, improve spacing/typography.',
        'CategoryTabs: API-driven tabs; active = BRAND bg + background text; inactive = background.secondary bg + text.secondary.',
        ...THEME_RULES,
        ...PRESERVE_RULES,
        'Define a tokenMap: for every visual element, the exact theme token to use.',
        'Write the spec to artifacts/refactor-spec.md as well, then return the JSON.',
        'Do NOT modify any source files in this task — analysis & planning only.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['componentPlan', 'tokenMap', 'preserveContract'],
      properties: {
        componentPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              responsibility: { type: 'string' },
              props: { type: 'string' },
              tokensUsed: { type: 'array', items: { type: 'string' } },
              animations: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        tokenMap: { type: 'object' },
        preserveContract: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['agent', 'analysis'],
}));

/** PHASE 2 — implement. */
export const implementTask = defineTask('implement-redesign', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement hero-slider components and refactor dashboard',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior React Native + Expo + TypeScript engineer',
      task: 'Implement the approved refactor spec: create the new hero-slider components and refactor the dashboard screen to use them. Production-ready, fully typed, theme-token driven.',
      context: { spec: args.spec, components: args.components },
      instructions: [
        `Create new components under ${args.componentsDir}/: ${args.components.join('.tsx, ')}.tsx`,
        `Refactor ${args.dashboardFile} to compose them; keep it the default export screen.`,
        `Update the components barrel ${args.barrelFile} to export the new components (add a clean section).`,
        'Reuse existing primitives: PressableScale, Reveal (from @/components), AppHeader, expo-image Image,',
        'react-native-reanimated, and expo-linear-gradient for the card scrim.',
        'Hero slider: horizontal snap, card width ~84% of useWindowDimensions().width, neighbours peek via side',
        'padding; per-card reanimated interpolation off a shared scrollX (active scale 1, inactive 0.92, slight',
        'translateX, opacity fade). PaginationDots below with an animated active dot (wider, BRAND).',
        'Hero card per spec: edge-to-edge expo-image, expo-linear-gradient bottom scrim, radius 24-28, soft shadow,',
        'left title + subtitle/progress, right status pill (done vs pending states per spec).',
        ...THEME_RULES,
        ...PRESERVE_RULES,
        'Keep the Social section + Presentations special card behavior working (may live inside HeroCarousel host or',
        'remain in the screen — your call — but their tap behavior and rendering must be preserved).',
        'Ensure TypeScript is strict-clean (no any leaks beyond existing DashboardItem index signature), imports',
        'resolve via the @/ alias, and dark mode works automatically through useTheme().',
        'ACTUALLY WRITE the files to disk now. Then return the JSON summary listing real paths.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['agent', 'implementation'],
}));

/** PHASE 3 — typecheck gate (shell). */
export const typecheckTask = defineTask('typecheck-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: `TypeScript gate (iteration ${args.iteration})`,
  shell: { command: 'npx tsc --noEmit' },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['shell', 'gate', 'typecheck', `iteration-${args.iteration}`],
}));

/** PHASE 3 — lint gate (shell). */
export const lintTask = defineTask('lint-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: `ESLint gate (iteration ${args.iteration})`,
  shell: { command: 'npx expo lint' },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['shell', 'gate', 'lint', `iteration-${args.iteration}`],
}));

/** PHASE 4 — review. */
export const reviewTask = defineTask('review-redesign', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review redesign vs requirements (iteration ${args.iteration})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Principal React Native UI reviewer and design-system auditor',
      task: 'Audit the redesigned dashboard + new components against the requirements and the strict theme-token rule, then score 0-100 and list precise, actionable gaps.',
      context: {
        typecheck: args.typecheck,
        lint: args.lint,
        iteration: args.iteration,
        targetQuality: args.targetQuality,
      },
      instructions: [
        `Read the new components in ${args.componentsDir}/ and the refactored ${args.dashboardFile} and ${args.barrelFile}.`,
        'Audit dimensions: (1) component architecture matches the required split',
        `(${args.components.join(', ')}); (2) hero slider behavior (84% width, peeking neighbours, snap, scale 1/0.92,`,
        'translateX, opacity); (3) hero card design (edge-to-edge image, gradient scrim, radius 24-28, status pill',
        'states, subtitle/progress); (4) animated pagination dots; (5) header + category tab styling per spec.',
        'CRITICAL AUDIT: grep the NEW/refactored files for hardcoded color literals (hex, named colors, rgba color).',
        'List EVERY violation as {file, line, snippet}. Translucent black/white rgba scrims for image legibility are OK;',
        'any themeable color that is hardcoded is a violation.',
        'PRESERVATION AUDIT: confirm dashboardService/useQuery, router navigation, useAuth, refresh, filtering, hidden',
        'sections, social + presentations handling, cardState, greeting, loading/error/empty states are intact and',
        'api/types.ts is unchanged.',
        `Factor the executable gates: typecheck.passed=${args.typecheck && args.typecheck.passed}, lint.passed=${args.lint && args.lint.passed}.`,
        'If gates fail, cap overallScore below the target and include the failures as gaps.',
        'Return JSON: overallScore (0-100), breakdown, gaps[], hardcodedColorViolations[], preservationOk (bool),',
        'criticalIssues[], summary.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'gaps', 'preservationOk'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        breakdown: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        hardcodedColorViolations: {
          type: 'array',
          items: {
            type: 'object',
            properties: { file: { type: 'string' }, line: { type: 'number' }, snippet: { type: 'string' } },
          },
        },
        preservationOk: { type: 'boolean' },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['agent', 'review', `iteration-${args.iteration}`],
}));

/** PHASE 5 — refine. */
export const refineTask = defineTask('refine-redesign', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refine redesign to fix gaps (iteration ${args.iteration})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior React Native + Expo + TypeScript engineer',
      task: 'Fix the gaps, hardcoded-color violations, and gate failures from the review while preserving all logic and the theme-token rule.',
      context: {
        review: args.review,
        typecheck: args.typecheck,
        lint: args.lint,
        iteration: args.iteration,
      },
      instructions: [
        'Address EVERY item in review.gaps, review.hardcodedColorViolations, and review.criticalIssues.',
        'Replace any hardcoded color with the correct theme token (see review for file:line).',
        'Fix all TypeScript errors reported by the typecheck gate and lint errors from the lint gate that touch the',
        `new/refactored files (${args.componentsDir}/* and ${args.dashboardFile}).`,
        ...THEME_RULES,
        ...PRESERVE_RULES,
        'Make minimal, targeted edits — do not rewrite working code or introduce new scope.',
        'ACTUALLY EDIT the files now, then return the JSON summary of what changed.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['agent', 'refine', `iteration-${args.iteration}`],
}));

/** PHASE 6 — finalize. */
export const finalizeTask = defineTask('finalize-redesign', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Finalize redesign summary',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Tech lead writing a concise change summary',
      task: 'Produce a short human-readable summary of the dashboard hero-slider redesign: components created, files changed, how the theme-token rule and logic preservation were honored, convergence result, and any residual follow-ups.',
      context: { ...args },
      instructions: [
        'Be concise and factual. Reference the convergence history.',
        'List the final component files and the key behaviors preserved.',
        'Return JSON with a markdown "summary" string and "followUps" array.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['summary'],
      properties: {
        summary: { type: 'string' },
        followUps: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['agent', 'finalize'],
}));
