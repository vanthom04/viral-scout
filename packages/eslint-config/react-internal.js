import js from "@eslint/js"
import globals from "globals"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"

import { config as baseConfig } from "./base.js"

/**
 * A custom ESLint configuration for libraries that use React.
 *
 * @type {import("eslint").Linter.Config} */
export const config = [
  ...baseConfig,
  js.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
        ...globals.browser
      }
    }
  },
  {
    plugins: {
      "react-hooks": pluginReactHooks
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,

      "no-undef": "off",
      "no-unused-vars": "off",

      // === React & Next.js Specific ===
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off" // Không bắt buộc import React trong file JSX/TSX (React 17+ đã tự động handle JSX transform)
    }
  }
]
