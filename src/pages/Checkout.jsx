import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase'; // verify correct import path for your firebase config

export default function Checkout() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!state) return <div className="text-center pt-20">No reading data found.</div>;

    const handlePolarCheckout = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const functions = getFunctions(app);
            const createPolarCheckout = httpsCallable(functions, 'createPolarCheckout');

            // Generate success URL
            const resultUrl = `${window.location.origin}/result?payment=success`;

            // Save state to sessionStorage because we will leave the SPA 
            // and return via a standard URL redirect from Polar!
            sessionStorage.setItem('sajuState', JSON.stringify(state));

            // Call backend to get the secure checkout URL
            const response = await createPolarCheckout({ success_url: resultUrl });

            if (response.data && response.data.url) {
                // Redirect to Polar hosted checkout page
                window.location.href = response.data.url;
            } else {
                throw new Error("Invalid response from Polar API");
            }
        } catch (err) {
            console.error(err);
            setError(`Failed to initialize payment: ${err.message}`);
            setIsLoading(false);
        }
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
                    <span className="text-2xl font-bold text-brand-gold">$2.99</span>
                </div>

                <div className="mt-6 flex flex-col items-center border-t border-gray-800 pt-6">
                    <button
                        onClick={handlePolarCheckout}
                        disabled={isLoading}
                        className={`w-full text-lg font-bold py-3 rounded-lg text-brand-dark ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-gold hover:bg-yellow-400'} transition-colors shadow-lg`}
                    >
                        {isLoading ? 'Loading Checkout...' : 'Pay with Polar / Credit Card'}
                    </button>
                    {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
                </div>

                <p className="text-xs text-gray-500 mt-4">Secure payment via Polar. Hosted in the US, worldwide cards accepted.</p>
            </div>
        </div>
    );
}
