import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard/ProductCard";
import ProductCardPlaceholder from "./ProductCard/ProductCardPlaceholder";
import CartButton from "./ProductCard/CartButton";
import CartOffcanvas from "./ProductCard/CartOffcanvas";
import { CartProvider } from "./CartContext/CartContext";
import "./ShopPage.css";

export default function ShopPage() {
    const categories = ["فیلر", "بوتاکس", "مزوتراپی", "نخ", "پی آر پی", "مصرفی"];
    const brands = [
        "Deneb", "Audrey", "Zishel", "Replengen", "Eptq", "Belotero",
        "Inovosense", "Aliaxin", "Stylage", "Neauvia", "Fiorage",
        "Cytosial", "Perfectha", "Revofil", "Neuramis", "Otherfiller"
    ];

    const [selectedCategory, setSelectedCategory] = useState(categories[0]);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setProducts(
                Array.from({ length: 20 }).map((_, i) => ({
                    id: Number(`${categories.indexOf(selectedCategory)}${selectedBrand ? brands.indexOf(selectedBrand) : 0}${i + 1}`),
                    name: `${selectedCategory} - محصول ${i + 1}`,
                    brand: selectedBrand || "عمومی",
                    image: `https://picsum.photos/seed/${selectedCategory}-${selectedBrand ?? "all"}-${i}/300/400`,
                    price: Math.floor(Math.random() * 5_000_000) + 1_000_000,
                }))
            );
            setLoading(false);
        }, 200);
    }, [selectedCategory, selectedBrand]);

    const formatIRR = (n) =>
        new Intl.NumberFormat("fa-IR", {
            style: "currency",
            currency: "IRR",
            maximumFractionDigits: 0,
        })
            .format(n)
            .replace("ریال", "تومان");

    return (
        <CartProvider>
            <div className="container-fluid py-4">

                {/* Categories */}
                <div
                    id="categories-menu"
                    className="d-flex gap-2 overflow-auto mb-4 justify-content-center sticky-top pt-2"

                >
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            className={`btn ${
                                selectedCategory === cat ? "btn-primary" : "btn-outline-primary"
                            }`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>


                <div className="row">
                    {/* Products */}
                    <div className="col-lg-10">
                        <div className="row g-3">
                            {loading
                                ? Array.from({ length: 8 }).map((_, i) => <ProductCardPlaceholder key={i} />)
                                : products.map((p) => (
                                    <ProductCard
                                        key={p.id}
                                        id={p.id}
                                        image={p.image}
                                        name={p.name}
                                        brand={p.brand}
                                        price={p.price}
                                        formatIRR={formatIRR}
                                    />
                                ))}
                        </div>
                    </div>

                    {/* Brands Sidebar */}
                    <div className="col-lg-2 mb-4">
                        <div className="list-group">
                            <div className="list-group-item active">برندها</div>
                            {brands.map((brand) => (
                                <button
                                    key={brand}
                                    className={`list-group-item list-group-item-action ${selectedBrand === brand ? "active" : ""}`}
                                    onClick={() => setSelectedBrand(brand === selectedBrand ? null : brand)}
                                >
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Cart Button + Offcanvas Cart */}
            <CartButton />
            <CartOffcanvas formatIRR={formatIRR} />
        </CartProvider>
    );
}
