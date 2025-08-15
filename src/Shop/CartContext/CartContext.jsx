import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
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

    const addItem = (product, qty = 1) => {
        setItems((prev) => {
            const idx = prev.findIndex((x) => x.id === product.id);
            if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
                return copy;
            }
            return [...prev, { ...product, qty }];
        });
    };

    const removeItem = (id) => setItems((prev) => prev.filter((x) => x.id !== id));

    const setQty = (id, qty) => {
        setItems((prev) =>
            prev
                .map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x))
                .filter((x) => x.qty > 0)
        );
    };

    const clear = () => setItems([]);

    const count = useMemo(() => items.reduce((s, x) => s + x.qty, 0), [items]);
    const total = useMemo(() => items.reduce((s, x) => s + x.qty * x.price, 0), [items]);

    const value = { items, addItem, removeItem, setQty, clear, count, total };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within <CartProvider>");
    return ctx;
}
