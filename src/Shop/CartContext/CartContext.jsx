import React, {createContext, useContext, useEffect, useMemo, useState} from "react";

const CartContext = createContext(null);

export function CartProvider({children}) {
    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem("cart_items_v1");
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem("cart_items_v1", JSON.stringify(items));
    }, [items]);

    const hydrate = (nextItems) => {
        // Replace local cart with server truth (no merge)
        setItems(Array.isArray(nextItems) ? nextItems : []);
    };

    const addItem = (product, qty = 1) => {
        // normalize + pull limits from either explicit fields or Woo’s quantity_limits
        const withLimits = (x) => {
            const ql = x.quantity_limits || {};
            const min = Number.isFinite(x.min_qty) ? x.min_qty : (Number.isFinite(ql.minimum) ? ql.minimum : 1);
            const max = Number.isFinite(x.max_qty) ? x.max_qty : (Number.isFinite(ql.maximum) ? ql.maximum : Infinity);
            const step = Number.isFinite(x.step) ? Math.max(1, x.step) :
                (Number.isFinite(ql.multiple_of) ? Math.max(1, ql.multiple_of) : 1);
            const sold = !!(x.sold_individually ?? x.soldIndividually);
            return {...x, min_qty: min, max_qty: max, step, sold_individually: sold};
        };
        const clampSnap = (n, lim) => {
            if (lim.sold_individually) return 1;
            let v = Math.max(lim.min_qty, Math.min(lim.max_qty, Number(n) || lim.min_qty));
            v = lim.min_qty + Math.floor((v - lim.min_qty) / lim.step) * lim.step; // snap to step
            return v;
        };

        setItems(prev => {
            const idx = prev.findIndex(x => x.id === product.id);
            if (idx >= 0) {
                const copy = [...prev];
                const merged = withLimits({...copy[idx], ...product});
                const nextQty = clampSnap((copy[idx].qty || 0) + (merged.sold_individually ? 1 : qty), merged);
                copy[idx] = {...merged, qty: nextQty};
                return copy;
            }
            const merged = withLimits(product);
            const startQty = clampSnap(Math.max(merged.min_qty, qty), merged);
            return [...prev, {...merged, qty: startQty}];
        });
    };

    const removeItem = (id, key) => {
        setItems((prev) =>
            prev.filter((x) => (key ? x.key !== key : x.id !== id))
        );
    };

    const setQty = (id, qty, key) =>
        setItems(prev =>
            prev.map(x => {
                const match = key ? x.key === key : x.id === id;
                if (!match) return x;

                const min = Number.isFinite(x.min_qty) ? x.min_qty : 1;
                const max = Number.isFinite(x.max_qty) ? x.max_qty : Infinity;
                const step = Number.isFinite(x.step) ? Math.max(1, x.step) : 1;

                let next = Math.max(min, Math.min(max, Number(qty) || min));
                // snap to step grid (>= min)
                next = min + Math.floor((next - min) / step) * step;

                return {...x, qty: next};
            }).filter(x => x.qty > 0)
        );


    const clear = () => setItems([]);

    const count = useMemo(() => items.reduce((s, x) => s + x.qty, 0), [items]);
    const total = useMemo(() => items.reduce((s, x) => s + x.qty * x.price, 0), [items]);

    const value = {items, hydrate, addItem, removeItem, setQty, clear, count, total};


    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within <CartProvider>");
    return ctx;
}
