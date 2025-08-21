// src/components/ProductCard/VariationProductCard.jsx
import React, {useMemo, useState, useEffect} from "react";
import {useCart} from "../CartContext/CartContext";

// Optional: map attribute slugs to user-friendly labels
const ATTR_LABELS = {
    pa_size: "سایز",
    pa_hajm: "حجم",
};

// Safe decode for percent-encoded values
function safeDecode(v) {
    try {
        return decodeURIComponent(String(v || ""));
    } catch {
        return String(v || "");
    }
}

function buildAttributeOptions(variations) {
    // { pa_size: Set([...]), pa_hajm: Set([...]) }
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
    // convert to arrays
    const out = {};
    Object.keys(map).forEach((k) => (out[k] = Array.from(map[k])));
    return out;
}

function findMatchingVariation(variations, selectedAttrs) {
    // must match all selected attributes exactly
    return variations.find((v) => {
        const attrs = v?.attributes || {};
        return Object.keys(selectedAttrs).every((k) => {
            const sel = selectedAttrs[k];
            if (!sel) return false;
            return String(attrs[k] || "") === String(sel);
        });
    });
}

export default function VariationProductCard({product, formatIRR}) {
    const {items, addItem, setQty, removeItem} = useCart();

    const variations = product?.variations || [];
    const attrOptions = useMemo(
        () => buildAttributeOptions(variations),
        [variations]
    );

    const [selected, setSelected] = useState({}); // e.g., { pa_hajm: '1litr' }

    // Auto-select single-option attributes
    useEffect(() => {
        const init = {};
        Object.keys(attrOptions).forEach((k) => {
            const opts = attrOptions[k];
            if (opts.length === 1) init[k] = opts[0];
        });
        if (Object.keys(init).length) {
            setSelected((prev) => ({...init, ...prev}));
        }
    }, [attrOptions]);

    const selectedVariation = useMemo(
        () => findMatchingVariation(variations, selected),
        [variations, selected]
    );

    // Resolve display values
    const image =
        selectedVariation?.image ||
        product?.image ||
        product?.images?.[0]?.src ||
        "data:image/gif;base64,R0lGODlhAQABAAD/ACw=";

    const rawPrice =
        selectedVariation?.price ??
        selectedVariation?.regular_price ??
        product?.price ??
        0;
    const price = Number(rawPrice || 0);

    const stockStatus =
        selectedVariation?.stock_status || product?.stock_status || "instock";

    // Unique id in cart = variation.id (parent id is not unique for variants)
    const cartId = selectedVariation ? selectedVariation.id : product.id;

    const nameWithAttrs = useMemo(() => {
        const base = product?.name || "";
        const attrs = selectedVariation?.attributes || {};
        const pretty =
            Object.keys(attrs).length > 0
                ? Object.entries(attrs)
                    .map(([k, v]) => `${ATTR_LABELS[k] || k}: ${safeDecode(v)}`)
                    .join("، ")
                : "";
        return pretty ? `${base} — ${pretty}` : base;
    }, [product?.name, selectedVariation]);

    const qtyInCart = useMemo(() => {
        const found = items.find((x) => x.id === cartId);
        return found ? Number(found.qty) : 0;
    }, [items, cartId]);

    const onAdd = () => {
        if (!selectedVariation) return;
        const ql = selectedVariation?.quantity_limits || product?.quantity_limits || {};
        const min = Number.isFinite(ql?.minimum) ? ql.minimum : 1;
        const max = Number.isFinite(ql?.maximum) ? ql.maximum : undefined;
        const step = Number.isFinite(ql?.multiple_of) ? Math.max(1, ql.multiple_of) : 1;

        addItem(
            {
                id: selectedVariation.id,
                image,
                name: nameWithAttrs,
                brand:
                    (product?.brands || [])
                        .map((b) => b?.name)
                        .filter(Boolean)
                        .join(", ") || "عمومی",
                price, // keep raw number; formatter is UI-only
                meta: {
                    parentId: product.id,
                    attributes: selectedVariation.attributes,
                },
                quantity_limits: ql,
                min_qty: min,
                max_qty: max,
                step,
                sold_individually: !!(selectedVariation?.sold_individually ?? product?.sold_individually),

            },
            1
        );
    };

    const onMinus = () => {
        if (qtyInCart > 1) setQty(cartId, qtyInCart - 1);
        else removeItem(cartId);
    };
    const onPlus = () => onAdd();

    const hasAllSelections =
        Object.keys(attrOptions).length > 0 &&
        Object.keys(attrOptions).every((k) => !!selected[k]);

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
                    <h6 className="card-title">{product?.name}</h6>
                    <small className="text-muted">
                        {(product?.brands || []).map((b) => b?.name).filter(Boolean).join(", ") || "عمومی"}
                    </small>

                    {/* Attribute selectors */}
                    {Object.keys(attrOptions).length > 0 && (
                        <div className="mt-2">
                            {Object.keys(attrOptions).map((attrKey) => (
                                <div className="mb-2" key={attrKey}>
                                    <label className="form-label d-block">
                                        {ATTR_LABELS[attrKey] || attrKey}
                                    </label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={selected[attrKey] || ""}
                                        onChange={(e) =>
                                            setSelected((prev) => ({...prev, [attrKey]: e.target.value}))
                                        }
                                    >
                                        <option value="" disabled>
                                            انتخاب کنید
                                        </option>
                                        {attrOptions[attrKey].map((val) => (
                                            <option key={val} value={val}>
                                                {safeDecode(val)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-auto">
                        <div className="d-flex align-items-center justify-content-center mb-2">
                            <div className="fw-bold text-success">
                                {formatIRR ? formatIRR(price) : price}
                            </div>

                            {qtyInCart === 0 && (
                                <button
                                    className="btn btn-sm btn-primary mx-3"
                                    onClick={onAdd}
                                    disabled={!hasAllSelections || !selectedVariation || stockStatus === "outofstock"}
                                    title={
                                        !hasAllSelections
                                            ? "ابتدا گزینه‌ها را انتخاب کنید"
                                            : stockStatus === "outofstock"
                                                ? "ناموجود"
                                                : undefined
                                    }
                                >
                                    +
                                </button>
                            )}
                        </div>

                        <div className="d-flex align-items-center justify-content-center mb-2">
                            {qtyInCart > 0 && (
                                <div className="btn-group btn-group-sm" role="group" aria-label="Quantity">
                                    <button className="btn btn-outline-secondary" onClick={onMinus}>−</button>
                                    <button className="btn btn-outline-secondary" disabled style={{width: 44}}>
                                        {qtyInCart}
                                    </button>
                                    <button className="btn btn-outline-secondary"
                                            onClick={onPlus}
                                            disabled={Number.isFinite(selectedVariation?.quantity_limits?.maximum) && qtyInCart >= selectedVariation.quantity_limits.maximum}>
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
