import React, {useRef} from "react";
import {useCart} from "../CartContext/CartContext";
import './CartButton.css'
import cartIcon from "../../assets/check-it-out.svg";

export default function CartButton() {
    const {count} = useCart();
    const btnRef = useRef(null);

    // If Offcanvas isn’t mounted, button still shows badge
    return (
        <div className="fixed-bottom">

            {/*<a*/}
            {/*    className="custom-btn square"*/}
            {/*    id="custom-homebut"*/}
            {/*    ref={btnRef}*/}
            {/*    data-bs-toggle="offcanvas"*/}
            {/*    data-bs-target="#cartOffcanvas"*/}
            {/*>*/}
            <button
                type="button"
                className="custom-btn square"
                id="custom-homebut"
                ref={btnRef}
                data-bs-toggle="offcanvas"
                data-bs-target="#cartOffcanvas"
            >

                <span id="custom-icon-container">
                   <img
                       src={cartIcon}
                       alt="Cart Icon"
                       id="custom-icon-cart-check"
                       className="custom-icon-cart-check"
                   />
                    {count > 0 &&
                        // <span className="badge bg-light text-dark ms-2">
                        //     {count}
                        // </span>
                        <span
                            id="btn-qty-badge"
                            className="position-absolute top-0 start-0 badge rounded-pill">
                        {count}
                    </span>
                    }

                </span>
                {/*</a>*/}
            </button>

        </div>


    );
}
