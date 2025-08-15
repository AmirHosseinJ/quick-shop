import React from "react";

export default function ProductCardPlaceholder() {
    return (
        <div className="col-sm-6 col-md-4 col-lg-3">
            <div className="card placeholder-glow">
                <div
                    className="placeholder w-100"
                    style={{ height: "300px" }}
                ></div>
                <div className="card-body">
                    <h5 className="card-title placeholder col-6"></h5>
                    <p className="card-text placeholder col-4"></p>
                </div>
            </div>
        </div>
    );
}
