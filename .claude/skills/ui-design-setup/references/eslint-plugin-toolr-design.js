/**
 * ESLint plugin for @toolr/ui-design design system enforcement.
 *
 * Reads enforcement rules from ai-manifest.json (the single source of truth)
 * so that adding new components or import paths to the manifest automatically
 * updates what the linter enforces — no need to touch this file.
 *
 * Rules:
 *   - no-raw-spacing:            Ban spacing values outside the 4px grid
 *   - no-raw-colors:             Ban raw hex/rgb/hsl colors and arbitrary Tailwind color values
 *   - no-raw-text-size:          Ban arbitrary text sizing (text-[Npx])
 *   - prefer-design-components:  Prefer ui-design components over raw HTML form elements
 *   - no-deep-imports:           Ban deep imports from @toolr/ui-design internals
 *   - no-direct-icon-imports:    Ban direct lucide-react imports
 *   - no-browser-dialogs:        Ban window.alert/confirm/prompt
 *
 * All rules respect `// toolr-design-ignore-next-line` on the preceding line.
 */

import { createRequire } from 'node:module'

// ---------------------------------------------------------------------------
// Load enforcement data from ai-manifest.json
// ---------------------------------------------------------------------------

const require = createRequire(import.meta.url)

let manifest
try {
  manifest = require('@toolr/ui-design/manifest')
} catch {
  // Fallback if the manifest can't be resolved (e.g. during CI without installs).
  // The plugin still works — it just uses empty enforcement data.
  manifest = { enforcement: {} }
}

const enforcement = manifest.enforcement ?? {}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasIgnoreComment(context, node) {
  const source = context.sourceCode ?? context.getSourceCode()
  const comments = source.getCommentsBefore(node)
  return comments.some((c) => c.value.trim() === 'toolr-design-ignore-next-line')
}

/**
 * Extract string fragments from className-like attributes and template literals.
 * Returns an array of { value: string, node } for each fragment found.
 */
function getClassNameStrings(node) {
  const results = []

  if (node.type === 'Literal' && typeof node.value === 'string') {
    results.push({ value: node.value, node })
  } else if (node.type === 'TemplateLiteral') {
    for (const quasi of node.quasis) {
      if (quasi.value.raw) {
        results.push({ value: quasi.value.raw, node })
      }
    }
  } else if (node.type === 'CallExpression') {
    for (const arg of node.arguments) {
      results.push(...getClassNameStrings(arg))
    }
  } else if (node.type === 'ConditionalExpression') {
    results.push(...getClassNameStrings(node.consequent))
    results.push(...getClassNameStrings(node.alternate))
  } else if (node.type === 'LogicalExpression') {
    results.push(...getClassNameStrings(node.right))
  } else if (node.type === 'BinaryExpression' && node.operator === '+') {
    results.push(...getClassNameStrings(node.left))
    results.push(...getClassNameStrings(node.right))
  }

  return results
}

/**
 * Visitor that checks className/class JSX attributes against a test function.
 * testFn(classString) should return an array of { message: string } objects.
 */
function createClassNameVisitor(context, testFn) {
  return {
    JSXAttribute(node) {
      const name = node.name && node.name.name
      if (name !== 'className' && name !== 'class') return
      if (hasIgnoreComment(context, node)) return

      const value = node.value
      if (!value) return

      let stringsToCheck = []
      if (value.type === 'Literal') {
        stringsToCheck = [{ value: value.value, node: value }]
      } else if (value.type === 'JSXExpressionContainer') {
        stringsToCheck = getClassNameStrings(value.expression)
      }

      for (const { value: str, node: strNode } of stringsToCheck) {
        if (typeof str !== 'string') continue
        for (const result of testFn(str)) {
          context.report({ node: strNode, message: result.message })
        }
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Rule: no-raw-spacing
// ---------------------------------------------------------------------------

const ALLOWED_SPACING_VALUES = new Set([
  '0', '0.5', '1', '1.5', '2', '3', '4', '6',
  'px', 'auto', 'full', 'screen',
])

const SPACING_PREFIXES = [
  'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl', 'ps', 'pe',
  'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml', 'ms', 'me',
  'gap', 'gap-x', 'gap-y',
  'space-x', 'space-y',
  'inset', 'inset-x', 'inset-y',
  'top', 'right', 'bottom', 'left',
  'start', 'end',
  'w', 'min-w', 'max-w',
  'h', 'min-h', 'max-h',
  'size',
  'basis',
  'scroll-m', 'scroll-mx', 'scroll-my', 'scroll-mt', 'scroll-mr', 'scroll-mb', 'scroll-ml',
  'scroll-p', 'scroll-px', 'scroll-py', 'scroll-pt', 'scroll-pr', 'scroll-pb', 'scroll-pl',
]

const spacingPrefixPattern = SPACING_PREFIXES
  .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|')

const SPACING_RE = new RegExp(
  `(?:^|\\s)-?(?:${spacingPrefixPattern})-(\\d+(?:\\.\\d+)?)(?=\\s|$)`,
  'g'
)

const noRawSpacing = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow spacing values outside the design system 4px grid',
    },
    messages: {
      rawSpacing:
        '"{{match}}" uses a spacing value outside the 4px grid. ' +
        'Allowed values: 0, 0.5, 1, 1.5, 2, 3, 4, 6. ' +
        'See ui-design docs/rules/foundations.md for the spacing scale.',
    },
  },
  create(context) {
    return createClassNameVisitor(context, (str) => {
      const violations = []
      SPACING_RE.lastIndex = 0
      let m
      while ((m = SPACING_RE.exec(str)) !== null) {
        const numericValue = m[1]
        if (!ALLOWED_SPACING_VALUES.has(numericValue)) {
          violations.push({
            message: `"${m[0].trim()}" uses a spacing value outside the 4px grid. ` +
              'Allowed values: 0, 0.5, 1, 1.5, 2, 3, 4, 6. ' +
              'See ui-design docs/rules/foundations.md for the spacing scale.',
          })
        }
      }
      return violations
    })
  },
}

// ---------------------------------------------------------------------------
// Rule: no-raw-colors
// ---------------------------------------------------------------------------

const ARBITRARY_COLOR_RE = /(?:^|\s)(?:bg|text|border|ring|outline|shadow|accent|caret|fill|stroke|from|via|to|decoration|divide|placeholder)-\[#[0-9a-fA-F]{3,8}\]/g
const RAW_HEX_RE = /#[0-9a-fA-F]{3,8}(?=\s|$|[;'",)}])/g
const RAW_FUNC_COLOR_RE = /(?:rgba?|hsla?)\s*\(/gi

const noRawColors = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow raw color values; use Tailwind utilities or CSS variables',
    },
  },
  create(context) {
    const classNameVisitor = createClassNameVisitor(context, (str) => {
      const violations = []
      ARBITRARY_COLOR_RE.lastIndex = 0
      let arbMatch
      while ((arbMatch = ARBITRARY_COLOR_RE.exec(str)) !== null) {
        violations.push({
          message:
            `"${arbMatch[0].trim()}" uses an arbitrary color value. ` +
            'Use standard Tailwind color utilities (e.g. bg-gray-800, text-blue-400) ' +
            'or CSS variables (var(--surface)). See ui-design docs/rules/color-system.md.',
        })
      }
      return violations
    })

    return {
      ...classNameVisitor,

      Property(node) {
        if (hasIgnoreComment(context, node)) return

        if (
          node.parent.type !== 'ObjectExpression' ||
          node.parent.parent.type !== 'JSXExpressionContainer'
        ) return

        const attr = node.parent.parent.parent
        if (attr.type !== 'JSXAttribute' || (attr.name && attr.name.name !== 'style')) return

        if (node.value && node.value.type === 'Literal' && typeof node.value.value === 'string') {
          const val = node.value.value
          if (RAW_HEX_RE.test(val) || RAW_FUNC_COLOR_RE.test(val)) {
            context.report({
              node: node.value,
              message:
                `Raw color "${val}" in style prop. ` +
                'Use CSS variables (var(--surface), var(--text-primary)) instead. ' +
                'See ui-design docs/rules/color-system.md.',
            })
          }
        }
      },
    }
  },
}

// ---------------------------------------------------------------------------
// Rule: no-raw-text-size
// ---------------------------------------------------------------------------

const ARBITRARY_TEXT_SIZE_RE = /(?:^|\s)text-\[\d+px\]/g
const ALLOWED_TEXT_SIZES = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-xss']

const noRawTextSize = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow arbitrary text sizing; use design system text scale',
    },
  },
  create(context) {
    return createClassNameVisitor(context, (str) => {
      const violations = []
      ARBITRARY_TEXT_SIZE_RE.lastIndex = 0
      let m
      while ((m = ARBITRARY_TEXT_SIZE_RE.exec(str)) !== null) {
        violations.push({
          message:
            `"${m[0].trim()}" uses an arbitrary text size. ` +
            `Use the design system scale: ${ALLOWED_TEXT_SIZES.join(', ')}. ` +
            'See ui-design docs/rules/foundations.md.',
        })
      }
      return violations
    })
  },
}

// ---------------------------------------------------------------------------
// Rule: prefer-design-components (reads from manifest)
// ---------------------------------------------------------------------------

const HTML_REPLACEMENTS = enforcement.htmlReplacements ?? {}

const preferDesignComponents = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer @toolr/ui-design components over raw HTML form elements',
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename()
    if (!filename.endsWith('.tsx')) return {}

    return {
      JSXOpeningElement(node) {
        if (hasIgnoreComment(context, node)) return

        const name = node.name && node.name.name
        if (!name || typeof name !== 'string') return

        const replacement = HTML_REPLACEMENTS[name]
        if (replacement) {
          context.report({
            node,
            message:
              `Use <${replacement}> from @toolr/ui-design instead of raw <${name}>. ` +
              'See ui-design docs/rules/component-usage.md.',
          })
        }
      },
    }
  },
}

// ---------------------------------------------------------------------------
// Rule: no-deep-imports (reads from manifest)
// ---------------------------------------------------------------------------

const ALLOWED_IMPORT_PATHS = new Set(enforcement.allowedImportPaths ?? [])

const noDeepImports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow deep imports from @toolr/ui-design internals',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value
        if (!source.startsWith('@toolr/ui-design')) return
        if (hasIgnoreComment(context, node)) return

        if (!ALLOWED_IMPORT_PATHS.has(source)) {
          const allowed = [...ALLOWED_IMPORT_PATHS].map((p) => `"${p}"`).join(', ')
          context.report({
            node: node.source,
            message:
              `Deep import "${source}" is not allowed. ` +
              `Import from: ${allowed}. ` +
              'See ui-design docs/rules/token-conventions.md.',
          })
        }
      },
    }
  },
}

// ---------------------------------------------------------------------------
// Rule: no-direct-icon-imports (reads from manifest)
// ---------------------------------------------------------------------------

const BANNED_IMPORTS = new Set(enforcement.bannedImports ?? [])

const noDirectIconImports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow direct lucide-react imports; use IconButton icon="name" string prop',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (!BANNED_IMPORTS.has(node.source.value)) return
        if (hasIgnoreComment(context, node)) return

        context.report({
          node: node.source,
          message:
            `Direct "${node.source.value}" import. Use IconButton with icon="name" string prop instead. ` +
            'See ui-design docs/rules/component-usage.md.',
        })
      },
    }
  },
}

// ---------------------------------------------------------------------------
// Rule: no-browser-dialogs (reads from manifest)
// ---------------------------------------------------------------------------

const BANNED_GLOBALS = new Set(enforcement.bannedGlobals ?? [])
const BANNED_GLOBAL_REPLACEMENTS = enforcement.bannedGlobalReplacements ?? {}

const noBrowserDialogs = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow window.alert/confirm/prompt; use design system modals',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (hasIgnoreComment(context, node)) return

        let methodName = null

        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'window' &&
          node.callee.property.type === 'Identifier' &&
          BANNED_GLOBALS.has(node.callee.property.name)
        ) {
          methodName = node.callee.property.name
        }

        if (
          node.callee.type === 'Identifier' &&
          BANNED_GLOBALS.has(node.callee.name)
        ) {
          methodName = node.callee.name
        }

        if (methodName) {
          const replacement = BANNED_GLOBAL_REPLACEMENTS[methodName] ?? 'a design system component'
          context.report({
            node,
            message:
              `Use <${replacement}> from @toolr/ui-design instead of ${methodName}(). ` +
              'Browser dialogs block the event loop and break the user experience.',
          })
        }
      },
    }
  },
}

// ---------------------------------------------------------------------------
// Plugin export
// ---------------------------------------------------------------------------

const plugin = {
  meta: {
    name: 'eslint-plugin-toolr-design',
    version: '1.0.0',
  },
  rules: {
    'no-raw-spacing': noRawSpacing,
    'no-raw-colors': noRawColors,
    'no-raw-text-size': noRawTextSize,
    'prefer-design-components': preferDesignComponents,
    'no-deep-imports': noDeepImports,
    'no-direct-icon-imports': noDirectIconImports,
    'no-browser-dialogs': noBrowserDialogs,
  },
}

export default plugin
