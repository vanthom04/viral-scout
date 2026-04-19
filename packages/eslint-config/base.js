import js from "@eslint/js"
import tseslint from "typescript-eslint"
import turboPlugin from "eslint-plugin-turbo"
import onlyWarn from "eslint-plugin-only-warn"

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn"
    }
  },
  {
    plugins: {
      onlyWarn
    }
  },
  {
    ignores: ["dist/**"],
    rules: {
      // === Formatting & Code Style ===
      indent: ["warn", 2, { SwitchCase: 1 }], // Thụt lề 2 spaces, có hỗ trợ khoảng cách cho Switch Case
      quotes: ["warn", "double"], // Dùng dấu nháy kép ("")
      semi: [1, "never"], // Không sử dụng dấu chấm phẩy (;) ở cuối câu
      "no-multi-spaces": 1, // Cấm sử dụng nhiều khoảng trắng liên tiếp không cần thiết
      "no-trailing-spaces": 1, // Xóa bỏ khoảng trắng thừa ở cuối dòng code
      "no-multiple-empty-lines": 1, // Không để quá nhiều dòng trống liên tiếp
      "keyword-spacing": 1, // Đảm bảo có khoảng trắng quanh các từ khóa (if, else, for...)
      "arrow-spacing": 1, // Đảm bảo có khoảng trắng trước và sau dấu mũi tên (=>)
      "comma-spacing": 1, // Đảm bảo có khoảng trắng sau dấu phẩy (,)
      "array-bracket-spacing": 1, // Đảm bảo khoảng cách nhất quán bên trong mảng []
      "object-curly-spacing": [1, "always"], // Yêu cầu có khoảng trắng bên trong object {}
      "space-before-blocks": ["warn", "always"], // Bắt buộc có khoảng trắng trước các block code {}

      // === Logic & Best Practices ===
      "no-useless-catch": "off", // Tắt cảnh báo khối catch vô nghĩa
      "no-console": ["warn", { allow: ["info", "warn", "error"] }], // Cảnh báo console.log, nhưng cho phép console.info/warn/error

      // === TypeScript Specific ===
      "@typescript-eslint/no-explicit-any": "warn", // Cảnh báo khi sử dụng kiểu any
      "@typescript-eslint/no-unused-vars": ["warn", { vars: "all", argsIgnorePattern: "^_" }] // Cảnh báo khi khai báo biến mà không sử dụng
    }
  }
]
