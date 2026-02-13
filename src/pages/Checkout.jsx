import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb";

export default function Checkout() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    if (!state) return <div className="text-center pt-20">No reading data found.</div>;

    const handleApprove = (orderId) => {
        // In a real app, verify the order with your backend here
        console.log("Order approved:", orderId);
        navigate('/result', { state: state });
    };

    return (
        <div className="min-h-screen bg-brand-dark pt-20 px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Unlock Your Destiny</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                Your {state.birthType} Saju analysis for <strong>{state.name}</strong> is ready.
                Gain deep insights into your career, wealth, and relationships.
            </p>

            <div className="bg-gray-900 p-6 rounded-lg max-w-sm mx-auto border border-brand-gold/30">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-300">Total</span>
                    <span className="text-2xl font-bold text-brand-gold">$9.99</span>
                </div>

                {/* PayPal Integration */}
                <PayPalScriptProvider options={{
                    "client-id": PAYPAL_CLIENT_ID,
                    currency: "USD",
                    intent: "capture"
                }}>
                    <PayPalButtons
                        style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
                        createOrder={(data, actions) => {
                            return actions.order.create({
                                purchase_units: [
                                    {
                                        amount: {
                                            value: "9.99",
                                        },
                                    },
                                ],
                            });
                        }}
                        onApprove={(data, actions) => {
                            return actions.order.capture().then((details) => {
                                handleApprove(data.orderID);
                            });
                        }}
                        onError={(err) => {
                            setError("Payment failed. Please try again.");
                            console.error("PayPal Error:", err);
                        }}
                    />
                </PayPalScriptProvider>
                {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}

                <p className="text-xs text-gray-500 mt-4">Secure payment via PayPal. Satisfaction guaranteed.</p>
            </div>
        </div>
    );
}
