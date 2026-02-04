// File: src/declarations.d.ts

// 1. Cho phép import tất cả file .jsx
declare module '*.jsx' {
    const content: any;
    export default content;
    export const AuthProvider: any;
    export const ThemeProvider: any;
    export const useAuth: any;
    export const useTheme: any;
}

// 2. Cho phép import tất cả file .js
declare module '*.js' {
    const content: any;
    export default content;
    export const MODEL_INJECTION: any;
}

// 3. Cho phép import các thư mục con
declare module './pages/*';
declare module './components/*';
declare module './contexts/*';
declare module './data/*';


