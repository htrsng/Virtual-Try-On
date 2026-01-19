import React from 'react';
import { Link } from 'react-router-dom';

function ProductList({ products }) {
    // Kiểm tra xem có dữ liệu sản phẩm không
    if (!products || products.length === 0) {
        return <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải sản phẩm...</div>;
    }

    return (
        <div className="container">
            <h3 style={{
                marginTop: '20px',
                color: '#ee4d2d',
                borderBottom: '4px solid #ee4d2d',
                display: 'inline-block',
                paddingBottom: '5px'
            }}>
                GỢI Ý HÔM NAY
            </h3>

            <div className="product-grid">
                {products.map((product) => (
                    /* QUAN TRỌNG: Phải dùng thẻ Link để bao quanh */
                    <Link
                        to={`/product/${product.id}`}
                        key={product.id}
                        className="product-card"
                        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    >
                        <img src={product.img} alt={product.name} className="product-img" />

                        <div className="product-info">
                            <div className="product-name">{product.name}</div>
                            <div className="product-price">
                                <span>{product.price}</span>
                                <span style={{ fontSize: '10px', background: '#ee4d2d', color: 'white', padding: '2px 5px', borderRadius: '2px' }}>Xem ngay</span>
                            </div>
                        </div>

                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '-4px',
                            background: '#ee4d2d',
                            color: 'white',
                            fontSize: '10px',
                            padding: '2px 4px',
                            borderRadius: '0 2px 2px 0'
                        }}>
                            Yêu thích
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default ProductList;