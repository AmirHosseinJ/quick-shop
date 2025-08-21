import React, {useCallback, useEffect, useMemo, useState} from "react";
import ProductCard from "./ProductCard/ProductCard";
import ProductCardPlaceholder from "./ProductCard/ProductCardPlaceholder";
import CartButton from "./ProductCard/CartButton";
import CartOffcanvas from "./ProductCard/CartOffcanvas";

import "./ShopPage.css";
import HttpClient from "../api/HttpClient.js";
import VariationProductCard from "./ProductCard/VariationProductCard";
import {useCart} from "./CartContext/CartContext.jsx";

// ===== Consistent storage keys =====
const CART_TOKEN_KEY = "wc_cart_token";
const NONCE_KEY = "wc_nonce";
const CART_ITEMS_KEY = "cart_items";
const CART_ITEMS_V1_KEY = "cart_items_v1";

// If Woo is in rials and UI shows tomans, divide by 10
const formatIRRtoToman = (n) =>
    new Intl.NumberFormat("fa-IR", {
        style: "currency",
        currency: "IRR",
        maximumFractionDigits: 0,
    })
        .format(Math.round(Number(n || 0) / 10))
        .replace("ریال", "تومان");

export default function ShopPage() {
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cartItems, setCartItems] = useState([]);
    const {removeItem, setQty, hydrate} = useCart(); // to remove locally after remote ops


    const WBaseUrl = "https://localhost/medline/wp-json/wc/store/v1";
    const nonce = localStorage.getItem(NONCE_KEY);
    const cart_token = localStorage.getItem(CART_TOKEN_KEY);

    // Memoize clients to avoid re-instantiation
    const reHttpClient = useMemo(() => new HttpClient(), []);
    const wooHttpClient = useMemo(() => new HttpClient(WBaseUrl), [WBaseUrl]);


    // Fetch cart (headers + body)
    useEffect(() => {
        const fetchCartHeaderToken = async () => {
            try {
                const response = await wooHttpClient.get("/cart");

                // Axios lowercases header keys
                const cartToken = response.headers["cart-token"];
                const nonce = response.headers["nonce"];

                if (cartToken) {
                    localStorage.setItem(CART_TOKEN_KEY, cartToken);
                    console.log("Saved cart token:", cartToken);
                }
                if (nonce) {
                    localStorage.setItem(NONCE_KEY, nonce);
                    console.log("Saved nonce:", nonce);
                }

                const items = response.data?.items || [];
                setCartItems(items);
                localStorage.setItem(CART_ITEMS_KEY, JSON.stringify(items));
            } catch (error) {
                console.error("Error fetching cart token and items:", error);
            }
        };

        fetchCartHeaderToken();
    }, [wooHttpClient]);

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const response = await reHttpClient.get("/products");
                const data = response.data?.data || [];

                // Derive categories & brands safely
                const parentCategories = [
                    ...new Set(
                        data.flatMap((p) => (p?.parent_categories || []).map((c) => c?.name).filter(Boolean))
                    ),
                ];
                setCategories(parentCategories);

                const productBrands = [
                    ...new Set(
                        data.flatMap((p) => (p?.brands || []).map((b) => b?.name).filter(Boolean))
                    ),
                ];
                setBrands(productBrands);

                setProducts(data);
            } catch (err) {
                console.error("Error fetching products:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [reHttpClient]);

    // Map cart items → v1 format *after* we have items
    useEffect(() => {
        if (!cartItems || cartItems.length === 0) {
            // replace local cart with empty (keeps UI in sync)
            hydrate([]);
            return;
        }

        const cartV1 = cartItems.map((item) => ({
            id: item?.id,
            image: item?.images?.[0]?.src || "",
            name: item?.name || "",
            brand: "عمومی", // adjust if you carry brand on the cart line item meta
            price: Number(item?.prices?.price || 0), // in rials
            qty: Number(item?.quantity || 0),
            key: item?.key || null,

            // ✅ carry limits to UI
            max_qty: item?.quantity_limits?.maximum ?? null,
            min_qty: item?.quantity_limits?.minimum ?? 1,
            step: item?.quantity_limits?.multiple_of ?? 1,
            sold_individually: !!item?.sold_individually,

        }));

        hydrate(cartV1);
        console.log("Hydrated cart from server:", cartV1);
    }, [cartItems]);

    // UI helpers
    const toggleCategory = (cat) =>
        setSelectedCategory((curr) => (curr === cat ? null : cat));
    const toggleBrand = (b) => setSelectedBrand((curr) => (curr === b ? null : b));

    const formatIRR = (n) => new Intl.NumberFormat("fa-IR", {
        style: "currency",
        currency: "IRR",
        maximumFractionDigits: 0,
    }).format(n).replace("ریال", "تومان");


    // Remove a single line from Woo if it has a key
    const removeRemoteItem = useCallback(
        async (item) => {
            if (item?.key) {
                await wooHttpClient.post(`/cart/remove-item?key=${item.key}`, null, {
                    headers: {Nonce: nonce},
                });
            }
            // Always remove from local state
            removeItem(item.id, item.key);
        },
        [wooHttpClient, nonce, removeItem]
    );

    // Batch add current items to Woo, then redirect to checkout with cart_token
    const checkoutWithBatch = useCallback(
        async (liveItems) => {
            if (!liveItems || liveItems.length === 0) return;

            const payload = {
                requests: liveItems
                    // only items without an existing Woo line item key
                    .filter((item) => !item.key)
                    .map((item) => ({
                        path: "/wc/store/v1/cart/add-item",
                        method: "POST",
                        cache: "no-store",
                        body: {
                            id: item.id,
                            quantity: Number(item.qty || 1),
                        },
                        headers: { Nonce: nonce },
                    })),
            };

            const res = await wooHttpClient.post("/batch", payload);
            const responses = res?.data?.responses || [];
            const allOk = responses.every((r) => r?.status === 201);

            if (allOk) {
                const target = cart_token
                    ? `https://localhost/medline/checkout?cart_token=${encodeURIComponent(cart_token)}`
                    : "https://localhost/medline/checkout";
                window.location.href = target;
            } else {
                console.error("Some items failed to add:", responses);
            }
        },
        [wooHttpClient, nonce, cart_token]
    );

    // ShopPage.jsx (add this next to removeRemoteItem & checkoutWithBatch)
    const onUpdateQty = useCallback(
        async (item, nextQty) => {

            const min = Number.isFinite(item?.min_qty) ? item.min_qty : 1;
            const max = Number.isFinite(item?.max_qty) ? item.max_qty : 9999;
            const step = Number.isFinite(item?.step) ? Math.max(1, item.step) : 1;

            let qty = Math.max(min, Math.min(max, Number(nextQty || min)));
            qty = min + Math.floor((qty - min) / step) * step;

            try {
                if (item?.key) {
                    await wooHttpClient.post(
                        `/cart/update-item?key=${item.key}`,
                        {quantity: qty},
                        {headers: {Nonce: nonce}}
                    );
                }
                setQty(item.id, qty, item.key);
            } catch (e) {
                console.error("Update qty failed:", e);
            }
        },
        [wooHttpClient, nonce, setQty]
    );


    return (
        <>
            <div className="container-fluid py-4">
                <div className="row sticky-top pt-2" id="categories-menu">
                    <div>دسته بندی ها</div>

                    {/* Categories */}
                    <div className="d-flex gap-2 overflow-auto mb-4 justify-content-center pt-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                className={`btn ${
                                    selectedCategory === cat ? "btn-primary" : "btn-outline-primary"
                                }`}
                                onClick={() => toggleCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="row">
                    {/* Products */}
                    <div className="col-lg-10">
                        <div className="row g-3">
                            {loading
                                ? Array.from({length: 8}).map((_, i) => <ProductCardPlaceholder key={i}/>)
                                : products
                                    .filter((product) => {
                                        const isCategoryMatch =
                                            !selectedCategory ||
                                            (product?.parent_categories || []).some((cat) => cat?.name === selectedCategory);
                                        const isBrandMatch =
                                            !selectedBrand ||
                                            (product?.brands || []).some((brand) => brand?.name === selectedBrand);
                                        return isCategoryMatch && isBrandMatch;
                                    })
                                    .map((p) =>
                                        p?.variations?.length ? (
                                            <VariationProductCard
                                                key={p.id}
                                                product={p}
                                                formatIRR={formatIRR} // pass your formatter
                                                onUpdateQty={onUpdateQty}
                                            />
                                        ) : (
                                            <ProductCard
                                                key={p.id}
                                                id={p.id}
                                                image={p.image}
                                                name={p.name}
                                                brand={(p?.brands || []).map((b) => b?.name).filter(Boolean).join(", ") || "عمومی"}
                                                price={Number(p.price ?? p?.prices?.price ?? 0)}
                                                formatIRR={formatIRR}
                                                quantity_limits={p.quantity_limits}
                                                sold_individually={!!p.sold_individually}
                                                onUpdateQty={onUpdateQty}
                                            />
                                        )
                                    )}
                        </div>
                    </div>

                    {/* Brands Sidebar */}
                    <div className="col-lg-2 mb-4">
                        <div className="list-group sticky-top">
                            <div className="list-group-item active mt-5">برندها</div>
                            {brands.map((brand) => (
                                <button
                                    key={brand}
                                    className={`list-group-item list-group-item-action ${
                                        selectedBrand === brand ? "active" : ""
                                    }`}
                                    onClick={() => toggleBrand(brand)}
                                >
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Cart Button + Offcanvas Cart */}
            <CartButton/>
            <CartOffcanvas
                formatIRR={formatIRR}
                onRemoveRemoteItem={removeRemoteItem}
                onCheckout={checkoutWithBatch}
                onUpdateQty={onUpdateQty}
            />
        </>
    );
}
