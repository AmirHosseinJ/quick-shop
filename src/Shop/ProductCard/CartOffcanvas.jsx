import React, {useEffect, useMemo, useRef} from "react";
import {useCart} from "../CartContext/CartContext";
import HttpClient from "../../api/HttpClient.js";
import debounce from "lodash.debounce";

export default function CartOffcanvas({formatIRR, onRemoveRemoteItem, onCheckout, onUpdateQty}) {
    const {items, clear, total, setQty} = useCart();

    const [clearing, setClearing] = React.useState(false);

    const CART_TOKEN_KEY = "wc_cart_token";
    const NONCE_KEY = "wc_nonce";

    const base = import.meta.env.VITE_API_BASE_URL;
    const WBaseUrl = `${base}/wp-json/wc/store/v1`;

    const httpClient = new HttpClient(WBaseUrl);
    const nonce = localStorage.getItem(NONCE_KEY);
    // const cart_token = localStorage.getItem(CART_TOKEN_KEY);

    const updateRef = useRef(onUpdateQty);
    useEffect(() => {
        updateRef.current = onUpdateQty;
    }, [onUpdateQty]);

    const debouncedUpdateQty = useMemo(() =>
            debounce((item, val) => {
                // always calls the latest onUpdateQty
                updateRef.current(item, val);
            }, 1500, {leading: false, trailing: true})
        , []);

    useEffect(() => () => debouncedUpdateQty.cancel(), [debouncedUpdateQty]);

    const handleRemove = async (item) => {
        try {
            await onRemoveRemoteItem?.(item);
        } catch (e) {
            console.error("Remove failed:", e);
        }
    };

    const handleCheckout = async () => {
        try {
            await onCheckout?.(items);
        } catch (e) {
            console.error("Checkout failed:", e);
        }
    };

    const handleChangeQty = (item, nextQty) => {
        const qty = Math.max(1, Number(nextQty || 1));
        // UI: instant
        setQty(item.id, qty, item.key);
        // Woo: debounced (fires ONCE with the last qty)
        debouncedUpdateQty(item, qty);
    };

    // Clear the entire Woo cart, then clear local
    const handleClearAll = async () => {
        if (!items.length || clearing) return;

        // Check if any item has a key (meaning it was added remotely)
        const hasRemoteItems = items.some(item => item.key);

        if (hasRemoteItems) {
            try {
                setClearing(true);
                // Call the API to clear the cart remotely
                await httpClient.delete("/cart/items", {
                    headers: {Nonce: nonce || ""},
                });
                // Keep UI in sync after server success
                clear();
                console.log("Cart cleared remotely and locally");
            } catch (err) {
                console.error("Failed to clear WooCommerce cart:", err);
                alert("خطا در پاک کردن سبد خرید. لطفاً دوباره تلاش کنید.");
            } finally {
                setClearing(false);
            }
        } else {
            // If no remote items, just clear locally
            clear();
            console.log("Cart cleared locally (no remote items found).");
        }
    };


    return (
        <div
            className="offcanvas offcanvas-end"
            tabIndex="-1"
            id="cartOffcanvas"
            aria-labelledby="cartOffcanvasLabel"
        >
            <div className="offcanvas-header mt-4">
                <div className=" d-flex px-2 w-100 justify-content-between">
                    <div className="">
                        <h5 className="offcanvas-title" id="cartOffcanvasLabel">سبد خرید</h5>
                    </div>
                    <div className="">
                        <button type="button" className="btn-close" data-bs-dismiss="offcanvas"
                                aria-label="Close"></button>
                    </div>
                </div>

            </div>

            <div className="offcanvas-body d-flex flex-column">
                {items.length === 0 ? (
                    <div className="text-center text-muted">سبد خالی است.</div>
                ) : (
                    <ul className="list-group mb-3 offcanvas-list">
                        {items.map((x) => (
                            <li className="list-group-item d-flex gap-2 align-items-center"
                                key={x.key || `${x.id}-${x.name}`}>
                                <img src={x.image} alt={x.name} width={48} height={48} className="rounded"/>
                                <div className="flex-grow-1">
                                    <div className="fw-semibold">{x.name}</div>
                                    <small className="text-muted">{x.brand}</small>
                                    <div className="mt-1">{formatIRR(x.price)}</div>

                                    {x.meta?.attributes && (
                                        <small className="text-muted d-block">
                                            {x.meta.attr_name}: {decodeURIComponent(x.meta.attributes[Object.keys(x.meta.attributes)[0]])}
                                        </small>
                                    )}

                                </div>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => {
                                        if (x.qty <= 1) {
                                            // remove (remote if key, local otherwise)
                                            handleRemove(x);
                                        } else {
                                            const step = x.step ?? 1;
                                            const next = x.qty - step;
                                            handleChangeQty(x, next);
                                        }
                                    }}
                                    disabled={x.qty <= 0}
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    className="form-control form-control-sm qty-input"
                                    min={x.min_qty ?? 1}
                                    step={x.step ?? 1}
                                    max={Number.isFinite(x.max_qty) ? x.max_qty : undefined}
                                    value={x.qty}
                                    onChange={(e) => handleChangeQty(x, Number(e.target.value || 1))}
                                    style={{width: 64}}
                                />
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => {
                                        const step = x.step ?? 1;
                                        const max = Number.isFinite(x.max_qty) ? x.max_qty : Infinity;
                                        const next = Math.min(max, x.qty + step);
                                        handleChangeQty(x, next);
                                    }}
                                    disabled={Number.isFinite(x.max_qty) && x.qty >= x.max_qty}
                                >
                                    +
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-danger ms-2"
                                    title="حذف"
                                    onClick={() => handleRemove(x)}
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

                    <div className="row  justify-content-between">
                        <div className="col-5 col-sm-4">
                            <button
                                className="btn btn-outline-danger w-100"
                                onClick={handleClearAll}
                                disabled={!items.length || clearing}
                            >
                                پاک کردن
                            </button>
                        </div>
                        <div className="col-7 col-sm-8">
                            <button
                                className="btn btn-success w-100"
                                disabled={!items.length}
                                data-bs-dismiss="offcanvas"  // This will close the offcanvas when clicked
                            >
                                بازگشت به صفحه خرید
                            </button>
                        </div>
                    </div>


                    <div className="d-flex mt-2">
                        <button className="btn btn-primary w-100" disabled={!items.length} onClick={handleCheckout}>
                            تسویه حساب
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
