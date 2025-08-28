import React, {useEffect, useRef} from "react";
import {useCart} from "../CartContext/CartContext";
import './CartButton.css'
import cartIcon from "../../assets/check-it-out.svg";

export default function CartButton() {
    const {count} = useCart();
    const btnRef = useRef(null);

    // If Offcanvas isn’t mounted, button still shows badge
    return (
        <div className="fixed-bottom">
            {/*<button*/}
            {/*    ref={btnRef}*/}
            {/*    type="button"*/}
            {/*    className="btn btn-primary cart-fab sticky-bottom "*/}
            {/*    data-bs-toggle="offcanvas"*/}
            {/*    data-bs-target="#cartOffcanvas"*/}
            {/*    aria-controls="cartOffcanvas"*/}
            {/*>*/}
            {/*    🛒*/}
            {/*    {count > 0 && <span className="badge bg-light text-dark ms-2">{count}</span>}*/}
            {/*</button>*/}
            <a
                className="custom-btn square"
                id="custom-homebut"
                ref={btnRef}
                data-bs-toggle="offcanvas"
                data-bs-target="#cartOffcanvas"
            >

                <span className="custom-icon-container ">
                   <img
                       src={cartIcon}
                       alt="Cart Icon"
                       className="custom-icon-cart-check "
                   />
                    {count > 0 &&
                        // <span className="badge bg-light text-dark ms-2">
                        //     {count}
                        // </span>
                        <span
                            className="position-absolute top-0 start-0 translate-middle badge rounded-pill  btn-qty-badge">
                        {count}
                    </span>
                    }

                </span>
            </a>

        </div>


    );
}
