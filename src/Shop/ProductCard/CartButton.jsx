import React, {useEffect, useRef} from "react";
import {useCart} from "../CartContext/CartContext";

export default function CartButton() {
    const {count} = useCart();
    const btnRef = useRef(null);

    // If Offcanvas isn’t mounted, button still shows badge
    return (
        <div className="sticky-bottom pb-3">
            <button
                ref={btnRef}
                type="button"
                className="btn btn-primary cart-fab sticky-bottom "
                data-bs-toggle="offcanvas"
                data-bs-target="#cartOffcanvas"
                aria-controls="cartOffcanvas"
            >
                🛒
                {count > 0 && <span className="badge bg-light text-dark ms-2">{count}</span>}
            </button>
        </div>

    );
}
