with open("CheckoutPage.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Giữ từ đầu đến dòng 485 (include return statement cũ)
new_lines = lines[:485]

# Thêm div wrapper và div flex container
new_lines.append(
    "            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>\n"
)

# Lấy từ dòng 754 (bắt đầu "Danh sách sản phẩm đã chọn") đến hết
# Bỏ qua dòng 752-753 (div wrapper và comment cũ)
new_lines.extend(lines[754:])

with open("CheckoutPage.jsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print(f"Fixed CheckoutPage.jsx with {len(new_lines)} lines")
