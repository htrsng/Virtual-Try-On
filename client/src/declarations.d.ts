// File: src/declarations.d.ts

// 1. Cho phép import tất cả file .jsx
declare module '*.jsx' {
    const content: unknown;
    export default content;
    export const AuthProvider: unknown;
    export const ThemeProvider: unknown;
    export const useAuth: unknown;
    export const useTheme: unknown;
}

// 2. Cho phép import tất cả file .js
declare module '*.js' {
    const content: unknown;
    export default content;
    export const MODEL_INJECTION: Record<number, unknown>;
}

// 3. Cho phép import các thư mục con
declare module './pages/*';
declare module './components/*';
declare module './contexts/*';
declare module './data/*';


