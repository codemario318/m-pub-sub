import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            prettier: prettier,
        },
        rules: {
            'no-console': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off', // 타입 추론 활용, TS 기본 타입 체킹을 활용
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }],
            'prettier/prettier': 'error'
        },
        settings: {
            'import/resolver': {
                typescript: true,
                node: true
            }
        },
        ignores: ['node_modules/**', 'dist/**', 'coverage/**']
    },
    eslintConfigPrettier
);