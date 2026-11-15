# GitHub About và topics

[Metadata đề xuất](github-metadata.json) đã chuẩn bị cho `htrsng/Virtual-Try-On`.
Chưa áp dụng lên GitHub: máy không có `gh`, kết nối GitHub của phiên làm việc chưa
được thiết lập. Việc commit file này không tự cập nhật About hoặc topics.

Khi có quyền quản trị repo, dùng biểu tượng cài đặt cạnh About trên GitHub để nhập
description/topics từ JSON. Hoặc sau khi cài GitHub CLI và đăng nhập:

```sh
gh repo edit htrsng/Virtual-Try-On --description "QA portfolio for a simulated e-commerce API: acceptance tests, TypeScript unit tests, React component checks, seeded fuzzing, replay, traceability and reproducible defect reports." --add-topic software-testing,qa-automation,api-testing,test-automation,fuzzing,security-testing,python,nodejs,vitest,z3,github-actions
```

Lệnh bổ sung topics, không xóa topics sẵn có. Không đổi tên repo hoặc ghi nhận đã
cập nhật remote khi chưa có kết quả xác nhận.
