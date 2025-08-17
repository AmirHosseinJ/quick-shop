import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard/ProductCard";
import ProductCardPlaceholder from "./ProductCard/ProductCardPlaceholder";
import CartButton from "./ProductCard/CartButton";
import CartOffcanvas from "./ProductCard/CartOffcanvas";
import { CartProvider } from "./CartContext/CartContext";
import "./ShopPage.css";
import HttpClient from "../api/HttpClient.js";

export default function ShopPage() {
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cartToken, setCartToken] = useState(null);

    // Define the WooCommerce base URL
    const WBaseUrl = 'http://localhost/medline/wp-json/wc/store';

    // Initialize HttpClient with WBaseUrl
    const wooHttpClient = new HttpClient(WBaseUrl);
    const reHttpClient = new HttpClient();

    useEffect(() => {
        const fetchCartToken = async () => {
            try {
                const response = await wooHttpClient.get('/cart');  // Use the httpClient to fetch cart
                console.log(response);
                const token = response.headers['cart-token'];  // Extract Cart-Token from response headers
                if (token) {
                    setCartToken(token);  // Save the Cart-Token in state
                    localStorage.setItem('cartToken', token);  // Optionally, store the token in localStorage
                    console.log("Fetching cart token Done");
                }
            } catch (error) {
                console.error("Error fetching cart token:", error);
            }
        };

        fetchCartToken();
    }, []);  // This will run once when the component mounts

    useEffect(() => {
        // Fetch the categories and products
        const fetchProducts = async () => {
            setLoading(true);

            try {
                // Use HttpClient to fetch data from /products
                const response = await reHttpClient.get('/products');  // Use HttpClient to fetch products
                const data = response.data;  // Get the data from the response

                // Get unique categories
                const parentCategories = [...new Set(data.data.flatMap(product => product.parent_categories.map(cat => cat.name)))];
                setCategories(parentCategories);

                // Get brands from products (assuming that `brands` are available in product data)
                const productBrands = [...new Set(data.data.flatMap(product => product.brands.map(brand => brand.name)))];
                setBrands(productBrands);

                setProducts(data.data);  // Set the products data
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);  // Empty dependency array means this effect runs once when the component mounts

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
                <div className="row sticky-top pt-2" id="categories-menu">
                    <div>دسته بندی ها</div>
                    {/* Categories */}
                    <div className="d-flex gap-2 overflow-auto mb-4 justify-content-center pt-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                className={`btn ${selectedCategory === cat ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={() => setSelectedCategory(cat)}
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
                                ? Array.from({ length: 8 }).map((_, i) => <ProductCardPlaceholder key={i} />)
                                : products
                                    .filter((product) => {
                                        const isCategoryMatch =
                                            !selectedCategory || product.parent_categories.some((cat) => cat.name === selectedCategory);
                                        const isBrandMatch = !selectedBrand || product.brands.some((brand) => brand.name === selectedBrand);
                                        return isCategoryMatch && isBrandMatch;
                                    })
                                    .map((p) => (
                                        <ProductCard
                                            key={p.id}
                                            id={p.id}
                                            image={p.image}
                                            name={p.name}
                                            brand={p.brands.map(brand => brand.name).join(', ') || "عمومی"}
                                            price={p.price}
                                            formatIRR={formatIRR}
                                        />
                                    ))}
                        </div>
                    </div>

                    {/* Brands Sidebar */}
                    <div className="col-lg-2 mb-4">
                        <div className="list-group sticky-top">
                            <div className="list-group-item active mt-5">برندها</div>
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
