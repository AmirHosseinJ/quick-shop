import React, {useEffect, useMemo, useRef} from "react";
import {useCart} from "../CartContext/CartContext";
import HttpClient from "../../api/HttpClient.js";
import debounce from "lodash.debounce";

export default function CartOffcanvas({formatIRR, onRemoveRemoteItem, onCheckout, onUpdateQty}) {
    const {items, removeItem, clear, total, setQty} = useCart();
    const CART_TOKEN_KEY = "wc_cart_token";
    const NONCE_KEY = "wc_nonce";

    const WBaseUrl = "https://localhost/medline/wp-json/wc/store/v1";
    const httpClient = new HttpClient(WBaseUrl);
    const nonce = localStorage.getItem(NONCE_KEY);
    const cart_token = localStorage.getItem(CART_TOKEN_KEY);

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

// This function will be used to send the cart items to WooCommerce API
    // This function will be used to send the cart items to WooCommerce API
    function sendCart() {
        // Always use the live items from CartContext so variation IDs are correct
        if (!items || items.length === 0) {
            console.log("Cart is empty");
            return;
        }

        // Build Store API batch payload
        const cartData = {
            requests: items.map((item) => {
                // Expect item.id to be:
                // - simple product id for simple products
                // - variation id for variable products (from VariationProductCard)
                const body = {
                    id: item.id,
                    quantity: Number(item.qty || 1),
                };

                return {
                    path: "/wc/store/v1/cart/add-item",
                    method: "POST",
                    cache: "no-store",
                    body,
                    headers: {
                        // Both headers help keep the same WC Store API cart/session
                        Nonce: nonce || "",
                        // "Cart-Token": cart_token || "",
                    },
                };
            }),
        };

        httpClient
            .post("/batch", cartData)
            .then((response) => {
                let success = true;

                // Validate each request's result
                const batch = response?.data?.responses || [];
                batch.forEach((itemResponse) => {
                    const status = itemResponse?.status;
                    // Woo adds 201 Created on success for add-item
                    if (status === 201) {
                        const added = itemResponse?.body?.items?.[0];
                        console.log("Item added successfully:", added?.name || "(unknown)");
                    } else {
                        const failed = itemResponse?.body?.items?.[0];
                        console.error(
                            "Error adding item to cart:",
                            failed?.name || "(unknown)",
                            status
                        );
                        success = false;
                    }
                });

                if (success) {
                    console.log("All items added successfully");
                    // window.location.href = "https://localhost/medline/checkout";
                    window.location.href = `https://localhost/medline/checkout?cart_token=${encodeURIComponent(cart_token)}`;

                }
            })
            .catch((error) => {
                console.error("Request failed", error);
            });
    }

    async function handleRemoveItem(item) {
        try {
            // If Woo gave us a line item key → remove via API too
            if (item?.key) {

                await httpClient.post(`/cart/remove-item?key=${item.key}`, null, {
                    headers: {
                        Nonce: nonce,
                    },
                });

                console.log(`Removed from WooCommerce cart: ${item.name}`);
            }

            // Always remove from local cart context
            removeItem(item.id);
        } catch (err) {
            console.error("Failed to remove item from WooCommerce:", err);
            // still remove locally so UI updates
            removeItem(item.id);
        }
    }

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
                            <li className="list-group-item d-flex gap-2 align-items-center"
                                key={x.key || `${x.id}-${x.name}`}>
                                <img src={x.image} alt={x.name} width={48} height={48} className="rounded"/>
                                <div className="flex-grow-1">
                                    <div className="fw-semibold">{x.name}</div>
                                    <small className="text-muted">{x.brand}</small>
                                    <div className="mt-1">{formatIRR(x.price)}</div>
                                    {x.meta?.attributes && (
                                        <small className="text-muted d-block">
                                            {Object.entries(x.meta.attributes)
                                                .map(([k, v]) => `${({
                                                    pa_size: "سایز",
                                                    pa_hajm: "حجم"
                                                }[k] || k)}: ${decodeURIComponent(v)}`)
                                                .join("، ")}
                                        </small>
                                    )}

                                </div>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => handleChangeQty(x, (x.qty - (x.step ?? 1)))}
                                    disabled={x.qty <= (x.min_qty ?? 1)}
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
                        <button className="btn btn-primary w-100" disabled={!items.length} onClick={handleCheckout}>
                            تسویه حساب
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
