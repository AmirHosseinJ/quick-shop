import React, {useMemo} from "react";
import {useCart} from "../CartContext/CartContext";

export default function ProductCard({id, image, name, brand, price, formatIRR, quantity_limits, sold_individually}) {
    const {items, addItem, setQty, removeItem} = useCart();

    const qty = useMemo(() => {
        const found = items.find((x) => x.id === id);
        return found ? Number(found.qty) : 0;
    }, [items, id]);

    const onAdd = () => {
        const ql = quantity_limits || {};
        addItem({
            id, image, name, brand, price,
            quantity_limits: ql,
            min_qty: Number.isFinite(ql?.minimum) ? ql.minimum : undefined,
            max_qty: Number.isFinite(ql?.maximum) ? ql.maximum : undefined,
            step: Number.isFinite(ql?.multiple_of) ? Math.max(1, ql.multiple_of) : undefined,
            sold_individually: !!sold_individually,
        }, 1);
    };
    const min = Number.isFinite(quantity_limits?.minimum) ? quantity_limits.minimum : 1;
    const max = Number.isFinite(quantity_limits?.maximum) ? quantity_limits.maximum : Infinity;

    const onMinus = () => {
        if (qty > 1) setQty(id, qty - 1);
        else removeItem(id);
    };
    const onPlus = () => onAdd();

    const displayImg = image || "data:image/gif;base64,R0lGODlhAQABAAD/ACw="; // 1x1 fallback

    return (
        <div className="col-sm-6 col-md-4 col-lg-3">
            <div className="card h-100 product-card position-relative">
                {qty > 0 && (
                    <span
                        className="position-absolute top-0 start-0 translate-middle badge rounded-pill bg-success card-qty-badge">
            {qty}
          </span>
                )}

                <img src={displayImg} className="card-img-top" alt={name || "product"}/>
                <div className="card-body d-flex flex-column">
                    <h6 className="card-title">{name}</h6>
                    <small className="text-muted">{brand}</small>

                    <div className="mt-auto">
                        <div className="d-flex align-items-center justify-content-center mb-2">
                            <div className="fw-bold text-success">{formatIRR(price)}</div>

                            {qty === 0 && (
                                <button className="btn btn-sm btn-primary mx-3" onClick={onAdd}>
                                    +
                                </button>
                            )}
                        </div>

                        <div className="d-flex align-items-center justify-content-center mb-2">
                            {qty > 0 && (
                                <div className="btn-group btn-group-sm" role="group" aria-label="Quantity">
                                    <button className="btn btn-outline-secondary" onClick={onMinus}
                                            disabled={qty <= min}>
                                        −
                                    </button>
                                    <button className="btn btn-outline-secondary" disabled style={{width: 44}}>
                                        {qty}
                                    </button>
                                    <button className="btn btn-outline-secondary" onClick={onPlus}
                                            disabled={Number.isFinite(max) && qty >= max}>
                                        +
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
