import React from "react";
import {useCart} from "../CartContext/CartContext";

export default function CartOffcanvas({formatIRR}) {
    const {items, setQty, removeItem, clear, total} = useCart();

    return (
        <div
            className="offcanvas offcanvas-end"
            tabIndex="-1"
            id="cartOffcanvas"
            aria-labelledby="cartOffcanvasLabel"
        >
            <div className="offcanvas-header">
                <h5 className="offcanvas-title" id="cartOffcanvasLabel">سبد خرید</h5>
                <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>

            <div className="offcanvas-body d-flex flex-column">
                {items.length === 0 ? (
                    <div className="text-center text-muted">سبد خالی است.</div>
                ) : (
                    <ul className="list-group mb-3">
                        {items.map((x) => (
                            <li className="list-group-item d-flex gap-2 align-items-center" key={x.id}>
                                <img src={x.image} alt={x.name} width={48} height={48} className="rounded"/>
                                <div className="flex-grow-1">
                                    <div className="fw-semibold">{x.name}</div>
                                    <small className="text-muted">{x.brand}</small>
                                    <div className="mt-1">{formatIRR(x.price)}</div>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => setQty(x.id, x.qty - 1)}
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm qty-input"
                                        min="1"
                                        value={x.qty}
                                        onChange={(e) => setQty(x.id, Number(e.target.value || 1))}
                                        style={{width: 64}}
                                    />
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => setQty(x.id, x.qty + 1)}
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    className="btn btn-sm btn-outline-danger ms-2"
                                    title="حذف"
                                    onClick={() => removeItem(x.id)}
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="fw-bold">مجموع</div>
                        <div className="fw-bold text-success">{formatIRR(total)}</div>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-danger w-25" onClick={clear} disabled={!items.length}>
                            پاک کردن
                        </button>
                        <button
                            className="btn btn-success w-75"
                            disabled={!items.length}
                            data-bs-dismiss="offcanvas"  // This will close the offcanvas when clicked
                        >
                            ادامه خرید
                        </button>

                    </div>
                    <div className="d-flex mt-2">
                        <button className="btn btn-primary w-100" disabled={!items.length}>
                            تسویه حساب
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
