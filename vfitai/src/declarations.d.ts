// File: src/declarations.d.ts

// 1. Cho phép import file .jsx mà không cần kiểm tra kỹ
declare module '*.jsx' {
    const content: any;
    export default content;
}

// 2. Cho phép import các thư mục con (để chắc chắn)
declare module './pages/*';
declare module './components/*';