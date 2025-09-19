import globals from "globals";
import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
    {
        ignores: ["dist/**"],
    },
    js.configs.recommended,
    {
        files: ["**/*.{js,jsx}"],
        plugins: {
            react,
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2021,
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            "react-refresh/only-export-components": "warn",
            "react/react-in-jsx-scope": "off",
            "no-unused-vars": "warn",
            "react/prop-types": "off",
            "react/no-unescaped-entities": "off",
        },
    },
];