import js from "@eslint/js"
import globals from "globals"
import pluginReact from "eslint-plugin-react"
import pluginNext from "@next/eslint-plugin-next"
import pluginReactHooks from "eslint-plugin-react-hooks"
import { globalIgnores } from "eslint/config"

import { config as baseConfig } from "./base.js"

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const nextJsConfig = [
  ...baseConfig,
  js.configs.recommended,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "cloudflare-env.d.ts"
  ]),
  {
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker
      }
    }
  },
  {
    plugins: {
      "@next/next": pluginNext
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules
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
      "react/react-in-jsx-scope": "off", // Không bắt buộc import React trong file JSX/TSX (React 17+ đã tự động handle JSX transform)
      "react-hooks/exhaustive-deps": "warn", // Cảnh báo khi thiếu dependencies trong mảng của useEffect, useCallback, useMemo
      "import/no-anonymous-default-export": "off", // Cho phép export default ẩn danh (VD: export default function() {} thay vì phải đặt tên hàm)
      "@next/next/no-img-element": "off", // Cho phép sử dụng thẻ <img> HTML truyền thống thay vì bắt buộc dùng component <Image> của Next.js

      // === TypeScript Exceptions ===
      "@typescript-eslint/no-require-imports": "off", // Cho phép sử dụng cú pháp require() của CommonJS thay vì import (hữu ích cho các file config)
      "@typescript-eslint/no-empty-object-type": "off" // Cho phép khai báo interface hoặc object type rỗng (VD: interface Props {})
    }
  }
]
