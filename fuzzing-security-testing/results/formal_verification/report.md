# Xác minh đặc tả Excel

Bộ xác minh của dự án theo quy tắc PDF; không phải pipeline gốc core.spec_pipeline.
Kết quả thuộc mô hình và mã cấy lỗi minh họa, không cộng vào lỗi API Node.js.

| Workbook | Trạng thái | CTL đúng/sai | Cặp mutex vi phạm | SMT SAT | Overflow int32 SAT |
|---|---|---|---|---|---|
| Module_Auth_Login_spec.xlsx | VALID | 2/2 | 1 | 5 | 5 |
| Module_Orders_Create_spec.xlsx | VALID | 2/2 | 1 | 5 | 5 |
| Module_OrderStatus_spec.xlsx | VALID | 3/3 | 1 | 5 | 5 |
| Module_Products_Manage_spec.xlsx | VALID | 2/2 | 1 | 5 | 5 |
| Module_Users_Admin_spec.xlsx | VALID | 3/3 | 1 | 5 | 5 |

## Thuộc tính sai và phản ví dụ

### Module_Auth_Login_spec.xlsx — `AG(!violation)`

```json
[
  {
    "path": [
      "login_attempt_free",
      "login_attempt_main_holds",
      "login_attempt_conflict"
    ],
    "reason": {
      "state": "login_attempt_conflict",
      "formula": [
        "!",
        [
          "atom",
          "violation"
        ]
      ],
      "reason": "Formula false at state"
    }
  }
]
```

### Module_Auth_Login_spec.xlsx — `EF(main_locked)`

```json
[
  {
    "state": "start",
    "formula": [
      "EF",
      [
        "atom",
        "main_locked"
      ]
    ],
    "reason": "Formula false at state"
  }
]
```

### Module_Orders_Create_spec.xlsx — `AG(!violation)`

```json
[
  {
    "path": [
      "discount_redeem_free",
      "discount_redeem_main_holds",
      "discount_redeem_conflict"
    ],
    "reason": {
      "state": "discount_redeem_conflict",
      "formula": [
        "!",
        [
          "atom",
          "violation"
        ]
      ],
      "reason": "Formula false at state"
    }
  }
]
```

### Module_Orders_Create_spec.xlsx — `EF(main_locked)`

```json
[
  {
    "state": "start",
    "formula": [
      "EF",
      [
        "atom",
        "main_locked"
      ]
    ],
    "reason": "Formula false at state"
  }
]
```

### Module_OrderStatus_spec.xlsx — `AG(!violation)`

```json
[
  {
    "path": [
      "order_update_free",
      "order_update_main_holds",
      "order_update_conflict"
    ],
    "reason": {
      "state": "order_update_conflict",
      "formula": [
        "!",
        [
          "atom",
          "violation"
        ]
      ],
      "reason": "Formula false at state"
    }
  }
]
```

### Module_OrderStatus_spec.xlsx — `EF(main_locked)`

```json
[
  {
    "state": "actual_Dang_xu_ly",
    "formula": [
      "EF",
      [
        "atom",
        "main_locked"
      ]
    ],
    "reason": "Formula false at state"
  },
  {
    "state": "spec_Dang_xu_ly",
    "formula": [
      "EF",
      [
        "atom",
        "main_locked"
      ]
    ],
    "reason": "Formula false at state"
  }
]
```

### Module_OrderStatus_spec.xlsx — `AG(actual_completed -> AX(actual_completed))`

```json
[
  {
    "path": [
      "actual_Dang_xu_ly",
      "actual_Da_giao"
    ],
    "reason": {
      "path": [
        "actual_Da_giao",
        "actual_Da_huy"
      ],
      "reason": "AX operand false at successor"
    }
  }
]
```

### Module_Products_Manage_spec.xlsx — `AG(!violation)`

```json
[
  {
    "path": [
      "stock_update_free",
      "stock_update_main_holds",
      "stock_update_conflict"
    ],
    "reason": {
      "state": "stock_update_conflict",
      "formula": [
        "!",
        [
          "atom",
          "violation"
        ]
      ],
      "reason": "Formula false at state"
    }
  }
]
```

### Module_Products_Manage_spec.xlsx — `EF(main_locked)`

```json
[
  {
    "state": "product_start",
    "formula": [
      "EF",
      [
        "atom",
        "main_locked"
      ]
    ],
    "reason": "Formula false at state"
  }
]
```

### Module_Users_Admin_spec.xlsx — `AG(!violation)`

```json
[
  {
    "path": [
      "profile_update_free",
      "profile_update_main_holds",
      "profile_update_conflict"
    ],
    "reason": {
      "state": "profile_update_conflict",
      "formula": [
        "!",
        [
          "atom",
          "violation"
        ]
      ],
      "reason": "Formula false at state"
    }
  }
]
```

### Module_Users_Admin_spec.xlsx — `EF(main_locked)`

```json
[
  {
    "state": "admin_start",
    "formula": [
      "EF",
      [
        "atom",
        "main_locked"
      ]
    ],
    "reason": "Formula false at state"
  },
  {
    "state": "profile_start",
    "formula": [
      "EF",
      [
        "atom",
        "main_locked"
      ]
    ],
    "reason": "Formula false at state"
  }
]
```

### Module_Users_Admin_spec.xlsx — `EF(created_200)`

```json
[
  {
    "state": "profile_start",
    "formula": [
      "EF",
      [
        "atom",
        "created_200"
      ]
    ],
    "reason": "Formula false at state"
  },
  {
    "state": "profile_update_free",
    "formula": [
      "EF",
      [
        "atom",
        "created_200"
      ]
    ],
    "reason": "Formula false at state"
  }
]
```

## Cách hiểu

- VALID nghĩa là mô hình được đọc và kiểm tra cấu trúc; không có nghĩa mọi thuộc tính đều đúng.
- Conflict được cấy theo template nên AG(!violation) và cặp mutex đầu tiên phải có phản ví dụ.
- CTL được đánh giá tại TẤT CẢ trạng thái khởi tạo. Các cụm khóa và nghiệp vụ rời nhau khiến EF(main_locked) sai ở nhánh nghiệp vụ; không có nghĩa main_locked không thể đạt từ mọi nhánh khác. Xem failing_initial_states.
- Không tự đổi mô hình/công thức để ép PASS. Nếu muốn EF kiểm tra riêng cụm khóa thì cần chốt lại tập trạng thái khởi tạo hoặc mô hình thành phần, rồi tạo phiên bản đặc tả mới.
- SAT của điều kiện nghiệp vụ và SAT tràn int32 là hai solver riêng; báo cáo thêm phép kiểm tra kết hợp, không trộn hai kết luận.
- Mẫu buffer-overflow mới được cảnh báo bằng pattern strcpy; chưa có xác nhận ASan.
- Python divide được thực thi ở giá trị biên; magic_value dùng Z3 cho nhánh mẫu cụ thể, không phải concolic tổng quát.
- Nếu công cụ báo ERROR thì chưa được kết luận đặc tả hợp lệ; xem errors trong JSON.
