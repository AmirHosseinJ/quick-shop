import React, {useMemo, useState, useEffect, useRef} from "react";
import debounce from "lodash.debounce";
import {useCart} from "../CartContext/CartContext";

// Safe decode for percent-encoded values
function safeDecode(v) {
    try {
        // Remove 'pa_' prefix and decode
        const decodedValue = decodeURIComponent(String(v || ""));
        return decodedValue.replace(/^pa_/, ""); // Remove the 'pa_' prefix after decoding
    } catch {
        return String(v || "");
    }
}


function buildAttributeOptions(variations) {
    const map = {};
    variations.forEach((v) => {
        const attrs = v?.attributes || {};
        Object.keys(attrs).forEach((k) => {
            const raw = attrs[k];
            if (!raw) return;
            if (!map[k]) map[k] = new Set();
            map[k].add(raw);
        });
    });
    const out = {};
    Object.keys(map).forEach((k) => (out[k] = Array.from(map[k])));
    return out;
}

function findMatchingVariation(variations, selectedAttrs) {
    return variations.find((v) => {
        const attrs = v?.attributes || {};
        return Object.keys(selectedAttrs).every((k) => {
            const sel = selectedAttrs[k];
            const val = attrs[k];
            return sel && val && String(val) === String(sel);
        });
    });
}

export default function VariationProductCard({product, formatIRR, onUpdateQty}) {
    const {items, addItem, setQty, removeItem} = useCart();

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

    const variations = product?.variations || [];
    const attrOptions = useMemo(() => buildAttributeOptions(variations), [variations]);

    const [selected, setSelected] = useState({}); // e.g., { pa_hajm: '1litr' }

    // Auto-select single-option attributes
    useEffect(() => {
        const init = {};
        Object.keys(attrOptions).forEach((k) => {
            const opts = attrOptions[k] || [];
            if (opts.length === 1) init[k] = opts[0];
        });
        setSelected((prev) => ({...init, ...prev}));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(attrOptions)]);

    const selectedVariation = useMemo(
        () => findMatchingVariation(variations, selected),
        [variations, selected]
    );

    // Build a stable cart ID: use variation id so +/- affects the correct variant
    const cartId = selectedVariation?.id ?? product?.id ?? 0;

    const currentItem = useMemo(() => items.find((x) => x.id === cartId), [items, cartId]);

    // Resolve display values
    const image =
        selectedVariation?.image ||
        product?.image ||
        "data:image/gif;base64,R0lGODlhAQABAAD/ACw=";

    const nameWithAttrs = useMemo(() => {
        const base = product?.name || "";
        return base; // Just return the product name without adding attributes
    }, [product?.name]);


    const qtyInCart = useMemo(() => {
        const found = items.find((x) => x.id === cartId);
        return found ? Number(found.qty) : 0;
    }, [items, cartId]);

    // Limits
    const ql = selectedVariation?.quantity_limits || product?.quantity_limits || {};
    const min = Number.isFinite(ql?.minimum) ? ql.minimum : 1;
    const max = Number.isFinite(ql?.maximum) ? ql.maximum : Infinity;
    const step = Number.isFinite(ql?.multiple_of) ? Math.max(1, ql.multiple_of) : 1;
    const isSoldIndividually = !!(selectedVariation?.sold_individually ?? product?.sold_individually);

    const onAdd = () => {
        if (!selectedVariation) return;
        if (isSoldIndividually && qtyInCart >= 1) return;

        addItem(
            {
                id: selectedVariation.id,
                image,
                name: nameWithAttrs,
                brand: (product?.brands || []).map((b) => b.name).join("، "),
                price: selectedVariation?.price ?? product?.price,
                meta: {
                    attributes: selectedVariation?.attributes || {},
                    attr_name: selectedVariation?.attr_name || '',
                },
                quantity_limits: ql,
                min_qty: Number.isFinite(ql?.minimum) ? ql.minimum : undefined,
                max_qty: Number.isFinite(ql?.maximum) ? ql.maximum : undefined,
                step: Number.isFinite(ql?.multiple_of) ? Math.max(1, ql.multiple_of) : undefined,
                sold_individually: isSoldIndividually,
            },
            1
        );
        debouncedUpdateQty(currentItem || {id: selectedVariation.id, name: nameWithAttrs}, Math.max(1, min));
    };

    const handleChange = (nextVal) => {
        if (!selectedVariation) return;
        const next = Math.max(min, Math.floor(Number(nextVal || 0)));

        if (isSoldIndividually) {
            if (next <= 0) removeItem(cartId);
            else setQty(cartId, 1);
            return;
        }

        if (next <= 0) {
            removeItem(cartId);
            debouncedUpdateQty(currentItem || {id: cartId}, 0);
            return;
        }

        const clamped = Math.min(next, Number.isFinite(max) ? max : next);
        const snapped = Math.max(min, clamped - ((clamped - min) % step));
        setQty(cartId, snapped);
        debouncedUpdateQty(currentItem || {id: cartId}, snapped);
    };

    const onMinus = () => {
        if (!selectedVariation) return;
        const ql = selectedVariation?.quantity_limits || product?.quantity_limits || {};
        const min = Number.isFinite(ql?.minimum) ? ql.minimum : 1;

        if ((selectedVariation?.sold_individually ?? product?.sold_individually)) {
            removeItem(cartId);
            debouncedUpdateQty(currentItem || {id: cartId}, 0);
            return;
        }

        if (qtyInCart > min) {
            const n = Math.max(min, qtyInCart - (Number.isFinite(ql?.multiple_of) ? Math.max(1, ql.multiple_of) : 1));
            setQty(cartId, n);
            debouncedUpdateQty(currentItem || {id: cartId}, n);
        } else {
            removeItem(cartId);
            debouncedUpdateQty(currentItem || {id: cartId}, 0);
        }
    };

    const onPlus = () => {
        if (!selectedVariation) return;

        if (isSoldIndividually) {
            onAdd();
            return;
        }

        const next = qtyInCart === 0 ? min : qtyInCart + step;
        const clamped = Math.min(next, Number.isFinite(max) ? max : next);
        if (qtyInCart === 0) onAdd();
        else setQty(cartId, clamped);
        debouncedUpdateQty(currentItem || { id: cartId }, clamped);
    };

    const stockStatus = selectedVariation?.stock_status || product?.stock_status;

    return (
        <div className="col-sm-6 col-md-4 col-lg-3">
            <div className="card h-100 product-card position-relative">
                {qtyInCart > 0 && (
                    <span
                        className="position-absolute top-0 start-0 translate-middle badge rounded-pill bg-success card-qty-badge">
                        {qtyInCart}
                    </span>
                )}

                <img src={image} className="card-img-top" alt={product?.name || "product"}/>

                <div className="card-body d-flex flex-column">
                    <h6 className="card-title">{nameWithAttrs}</h6>
                    <small className="text-muted">
                        {(product?.brands || []).map((b) => b.name).join("، ")}
                    </small>

                    {/* Attribute pickers */}
                    {Object.keys(attrOptions).length > 0 && (
                        <div className="my-2">
                            {Object.entries(attrOptions).map(([attrKey, opts]) => (
                                <div className="mb-2" key={attrKey}>
                                    <div className="small fw-bold mb-1">
                                        {/* Display the attribute name directly from the 'attr_name' */}
                                        {selectedVariation?.attr_name || safeDecode(attrKey)} {/* If 'attr_name' exists, use it, else fall back to decoded key */}
                                    </div>
                                    <div className="d-flex flex-wrap gap-1 justify-content-center">
                                        {opts.map((opt) => {
                                            const isActive = String(selected[attrKey] || "") === String(opt);
                                            return (
                                                <button
                                                    type="button"
                                                    key={opt}
                                                    className={`btn btn-sm ${isActive ? "btn-primary" : "btn-outline-secondary"}`}
                                                    onClick={() => setSelected((s) => ({ ...s, [attrKey]: opt }))}
                                                >
                                                    {safeDecode(opt)} {/* Decode the option value */}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}


                    <div className="mt-auto">
                        <div className="d-flex align-items-center justify-content-center mb-2">
                            <div className="fw-bold text-success">
                                {formatIRR ? formatIRR(selectedVariation?.price ?? product?.price) : (selectedVariation?.price ?? product?.price)}
                            </div>

                            {qtyInCart === 0 && (
                                <button
                                    className="btn btn-sm btn-primary mx-3"
                                    onClick={onAdd}
                                    disabled={!selectedVariation || (isSoldIndividually && qtyInCart >= 1)}
                                >
                                    +
                                </button>
                            )}
                        </div>

                        <div className="d-flex align-items-center justify-content-center mb-2">
                            {qtyInCart > 0 && (
                                <div className="btn-group btn-group-sm" role="group" aria-label="Quantity">
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={onMinus}
                                        disabled={isSoldIndividually ? qtyInCart <= 0 : qtyInCart <= min}
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
                                        value={qtyInCart}
                                        onChange={(e) => handleChange(e.target.value)}
                                        disabled={!selectedVariation || isSoldIndividually}
                                    />

                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={onPlus}
                                        disabled={
                                            !selectedVariation ||
                                            (isSoldIndividually
                                                ? qtyInCart >= 1
                                                : (Number.isFinite(max) && qtyInCart >= max))
                                        }
                                    >
                                        +
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Stock hint */}
                        {selectedVariation && (
                            <div className="text-center">
                                {stockStatus === "instock" && <small className="text-success">موجود</small>}
                                {stockStatus === "onbackorder" && <small className="text-warning">پیش‌سفارش</small>}
                                {stockStatus === "outofstock" && <small className="text-danger">ناموجود</small>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
