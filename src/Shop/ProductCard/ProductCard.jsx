import React, {useMemo, useRef, useEffect} from "react";
import debounce from "lodash.debounce";
import {useCart} from "../CartContext/CartContext";

export default function ProductCard({
                                        id,
                                        image,
                                        name,
                                        brand,
                                        price,
                                        formatIRR,
                                        quantity_limits,
                                        sold_individually,
                                        onUpdateQty
                                    }) {
    const {items, addItem, setQty, removeItem} = useCart();

    // Keep latest onUpdateQty in a ref (same pattern as Offcanvas)
    const updateRef = useRef(onUpdateQty);
    useEffect(() => {
        updateRef.current = onUpdateQty;
    }, [onUpdateQty]);

    const debouncedUpdateQty = useMemo(
        () => debounce((item, val) => updateRef.current && updateRef.current(item, val), 1500, {
            leading: false,
            trailing: true
        }),
        []
    );

    const qty = useMemo(() => {
        const found = items.find((x) => x.id === id);
        return found ? Number(found.qty) : 0;
    }, [items, id]);

    const currentItem = useMemo(() => items.find((x) => x.id === id), [items, id]);

    const ql = quantity_limits || {};
    const min = Number.isFinite(ql?.minimum) ? ql.minimum : 1;
    const max = Number.isFinite(ql?.maximum) ? ql.maximum : Infinity;
    const step = Number.isFinite(ql?.multiple_of) ? Math.max(1, ql.multiple_of) : 1;
    const isSoldIndividually = !!sold_individually;

    const onAdd = () => {
        // Respect sold_individually
        if (isSoldIndividually && qty >= 1) return;
        addItem(
            {
                id,
                image,
                name,
                brand,
                price,
                quantity_limits: ql,
                min_qty: Number.isFinite(ql?.minimum) ? ql.minimum : undefined,
                max_qty: Number.isFinite(ql?.maximum) ? ql.maximum : undefined,
                step: Number.isFinite(ql?.multiple_of) ? Math.max(1, ql.multiple_of) : undefined,
                sold_individually: isSoldIndividually,
            },
            1
        );
        // Remote: ask server to reflect the new qty (= 1 or min)
        debouncedUpdateQty(currentItem || {id, name, brand, price}, Math.max(1, min));

    };

    const handleChange = (nextVal) => {
        // Clamp & normalize
        const next = Math.max(min, Math.floor(Number(nextVal || 0)));
        if (isSoldIndividually) {
            if (next <= 0) removeItem(id);
            else setQty(id, 1);
            debouncedUpdateQty(currentItem || {id, name, brand, price}, next <= 0 ? 0 : 1);
            return;
        }
        if (next <= 0) {
            removeItem(id);
            debouncedUpdateQty(currentItem || {id, name, brand, price}, 0);
            return;
        }
        const clamped = Math.min(next, Number.isFinite(max) ? max : next);
        // Snap to step
        const snapped = Math.max(min, clamped - ((clamped - min) % step));
        setQty(id, snapped);
        debouncedUpdateQty(currentItem || {id, name, brand, price}, snapped);
    };

    const onMinus = () => {
        if (isSoldIndividually) {
            removeItem(id);
            debouncedUpdateQty(currentItem || {id, name, brand, price}, 0);
            return;
        }
        if (qty > min) {
            const n = Math.max(min, qty - step);
            setQty(id, n);
            debouncedUpdateQty(currentItem || {id, name, brand, price}, n);
        } else {
            removeItem(id);
            debouncedUpdateQty(currentItem || {id, name, brand, price}, 0);
        }
    };

    const onPlus = () => {
        if (isSoldIndividually) {
            onAdd();
            return;
        }
        const next = qty === 0 ? min : qty + step;
        const clamped = Math.min(next, Number.isFinite(max) ? max : next);
        if (qty === 0) onAdd();
        else {
            setQty(id, clamped);
            debouncedUpdateQty(currentItem || { id, name, brand, price }, clamped);
        }
    };

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
                                <button className="btn btn-sm btn-primary mx-3" onClick={onAdd}
                                        disabled={isSoldIndividually && qty >= 1}>
                                    +
                                </button>
                            )}
                        </div>

                        <div className="d-flex align-items-center justify-content-center mb-2">
                            {qty > 0 && (
                                <div className="btn-group btn-group-sm" role="group" aria-label="Quantity">
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={onMinus}
                                        disabled={isSoldIndividually ? qty <= 0 : qty <= min}
                                    >
                                        −
                                    </button>

                                    {/* Editable input like CartOffcanvas */}
                                    <input
                                        type="number"
                                        className="form-control form-control-sm qty-input text-center"
                                        style={{width: 64}}
                                        min={isSoldIndividually ? 1 : min}
                                        step={isSoldIndividually ? 1 : step}
                                        max={isSoldIndividually ? 1 : (Number.isFinite(max) ? max : undefined)}
                                        value={qty}
                                        onChange={(e) => handleChange(e.target.value)}
                                        disabled={isSoldIndividually}
                                    />

                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={onPlus}
                                        disabled={
                                            isSoldIndividually
                                                ? qty >= 1
                                                : (Number.isFinite(max) && qty >= max)
                                        }
                                    >
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
