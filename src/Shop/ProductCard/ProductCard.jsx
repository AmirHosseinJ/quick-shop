import React, {useMemo} from "react";
import {useCart} from "../CartContext/CartContext";

export default function ProductCard({id, image, name, brand, price, formatIRR}) {
    const {items, addItem, setQty, removeItem} = useCart();

    const qty = useMemo(() => {
        const found = items.find((x) => x.id === id);
        return found ? found.qty : 0;
    }, [items, id]);

    const onAdd = () => addItem({id, image, name, brand, price}, 1);
    const onMinus = () => {
        if (qty > 1) setQty(id, qty - 1);
        else removeItem(id);
    };
    const onPlus = () => onAdd();

    return (
        <div className="col-sm-6 col-md-4 col-lg-3">
            <div className="card h-100 product-card position-relative">
                {/* count badge */}
                {qty > 0 && (
                    <span
                        className="position-absolute top-0 start-0 translate-middle badge rounded-pill bg-success card-qty-badge">
            {qty}
          </span>
                )}

                <img src={image} className="card-img-top" alt={name}/>
                <div className="card-body d-flex flex-column">
                    <h6 className="card-title">{name}</h6>
                    <small className="text-muted">{brand}</small>

                    <div className="mt-auto">
                        <div className="d-flex align-items-center justify-content-center mb-2">
                            <div className="fw-bold text-success">{formatIRR(price)}</div>

                            {/* when not in cart -> show add button */}
                            {qty === 0 && (
                                <>
                                    <button className="btn btn-sm btn-primary mx-3" onClick={onAdd}>
                                        +
                                    </button>
                                </>
                            )}

                        </div>
                        <div className="d-flex align-items-center justify-content-center mb-2">

                            {/* when not in cart -> show add button */}
                            {qty > 0 && (
                                // when in cart -> show - qty +
                                <div className="btn-group btn-group-sm" role="group" aria-label="Quantity">
                                    <button className="btn btn-outline-secondary" onClick={onMinus}>−</button>
                                    <button className="btn btn-outline-secondary" disabled style={{width: 44}}>
                                        {qty}
                                    </button>
                                    <button className="btn btn-outline-secondary" onClick={onPlus}>+</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
