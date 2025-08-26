import './App.css'
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import ShopPage from "./Shop/ShopPage.jsx";
import {CartProvider} from "./Shop/CartContext/CartContext";

function App() {

    return (
        <>
            <CartProvider>
                <ShopPage></ShopPage>
            </CartProvider>

        </>
    )
}

export default App
