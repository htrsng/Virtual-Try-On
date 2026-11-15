# Ứng dụng VFitAI gốc

`vfitai/` giữ mã ứng dụng trước khi repo tập trung vào fuzz testing:

```text
vfitai/
├── client/                 # Giao diện React, TypeScript, Three.js
├── doc/                    # Tài liệu và ảnh ứng dụng
├── tests/                  # Playwright E2E
└── .github/workflows/      # Workflow ứng dụng cũ, đã ngừng kích hoạt
```

Các file được di chuyển cùng cấu trúc tương đối; nội dung và lịch sử Git được giữ.
Nếu cần thao tác với ứng dụng cũ, dùng `archive/vfitai/` làm thư mục gốc.
Ví dụ chạy giao diện từ repo root:

```sh
cd archive/vfitai/client
npm ci
npm run dev
```

Workspace không có backend `server/` mà E2E và workflow cũ tham chiếu, nên chưa
thể chạy đầy đủ ứng dụng. Workflow nằm trong thư mục archive không được GitHub
Actions kích hoạt. Bộ fuzzing sử dụng target riêng và không phụ thuộc archive.

Hướng dẫn hiện tại: [VFitAI API Fuzzing](../README.md).
