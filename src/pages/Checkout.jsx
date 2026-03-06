import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// Pricing per reading type
// ─────────────────────────────────────────────
const PRICES = {
    full: { amount: '2.99', label: 'Full Saju Reading', emoji: '🔮' },
    compatibility: { amount: '2.99', label: 'Compatibility Reading', emoji: '💑' },
    'year-fortune': { amount: '1.99', label: 'Yearly Fortune Reading', emoji: '📅' },
    'daily-fortune': { amount: '0.99', label: 'Daily Fortune Reading', emoji: '☀️' },
};

// ─────────────────────────────────────────────
// PayPal Client ID from .env
// ─────────────────────────────────────────────
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

export default function Checkout() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [paymentStatus, setPaymentStatus] = useState('idle'); // idle | processing | success | error
    const [errorMsg, setErrorMsg] = useState('');

    if (!state) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <p>No reading data found. Please go back and fill in your details.</p>
            </div>
        );
    }

    const priceInfo = PRICES[state.type] || PRICES.full;

    const createOrder = (data, actions) => {
        return actions.order.create({
            purchase_units: [
                {
                    description: priceInfo.label,
                    amount: {
                        currency_code: 'USD',
                        value: priceInfo.amount,
                    },
                },
            ],
            application_context: {
                shipping_preference: 'NO_SHIPPING',
            },
        });
    };

    const onApprove = async (data, actions) => {
        setPaymentStatus('processing');
        try {
            await actions.order.capture();
            setPaymentStatus('success');
            // Small delay to show success animation, then navigate
            setTimeout(() => {
                navigate('/result', { state });
            }, 1200);
        } catch (err) {
            console.error('PayPal capture error:', err);
            setPaymentStatus('error');
            setErrorMsg('Payment capture failed. Please try again.');
        }
    };

    const onError = (err) => {
        console.error('PayPal error:', err);
        setPaymentStatus('error');
        setErrorMsg('Something went wrong with PayPal. Please try again.');
    };

    const onCancel = () => {
        setPaymentStatus('idle');
    };

    return (
        <PayPalScriptProvider
            options={{
                'client-id': PAYPAL_CLIENT_ID,
                currency: 'USD',
                intent: 'capture',
            }}
        >
            <div className="min-h-screen bg-brand-dark pt-24 pb-16 px-4 flex flex-col items-center">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="text-5xl mb-4">{priceInfo.emoji}</div>
                    <h1 className="text-4xl font-bold text-white mb-2">Unlock Your Reading</h1>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Your {priceInfo.label} is ready. Complete your payment to reveal the fortune that
                        the stars have written for <span className="text-brand-gold font-semibold">{state.name}</span>.
                    </p>
                </motion.div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="w-full max-w-md bg-gray-900 rounded-2xl border border-brand-gold/30 overflow-hidden shadow-2xl shadow-brand-gold/10"
                >
                    {/* Gold banner */}
                    <div className="bg-gradient-to-r from-brand-gold via-yellow-400 to-brand-gold px-6 py-4 text-center">
                        <p className="text-brand-dark font-bold text-lg">✨ Special Launch Price</p>
                    </div>

                    {/* Price block */}
                    <div className="px-8 py-6 border-b border-gray-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">{priceInfo.label}</span>
                            <span className="text-2xl font-bold text-brand-gold">${priceInfo.amount}</span>
                        </div>
                        <div className="flex gap-2 text-xs text-gray-500 mt-4">
                            <span className="bg-gray-800 px-3 py-1 rounded-full">🔒 Secure Payment</span>
                            <span className="bg-gray-800 px-3 py-1 rounded-full">💳 PayPal Protected</span>
                            <span className="bg-gray-800 px-3 py-1 rounded-full">⚡ Instant Delivery</span>
                        </div>
                    </div>

                    {/* Payment area */}
                    <div className="px-8 py-6">
                        <AnimatePresence mode="wait">
                            {paymentStatus === 'idle' && (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <p className="text-gray-400 text-sm text-center mb-5">
                                        Pay securely with your PayPal account or any credit / debit card.
                                    </p>
                                    <PayPalButtons
                                        style={{
                                            layout: 'vertical',
                                            color: 'gold',
                                            shape: 'rect',
                                            label: 'pay',
                                            height: 48,
                                        }}
                                        createOrder={createOrder}
                                        onApprove={onApprove}
                                        onError={onError}
                                        onCancel={onCancel}
                                    />
                                </motion.div>
                            )}

                            {paymentStatus === 'processing' && (
                                <motion.div
                                    key="processing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center py-8 gap-4"
                                >
                                    <div className="w-14 h-14 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
                                    <p className="text-white font-semibold">Processing payment…</p>
                                </motion.div>
                            )}

                            {paymentStatus === 'success' && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center py-8 gap-4"
                                >
                                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-3xl">✓</div>
                                    <p className="text-white font-bold text-lg">Payment Successful!</p>
                                    <p className="text-gray-400 text-sm">Generating your reading…</p>
                                </motion.div>
                            )}

                            {paymentStatus === 'error' && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center py-6 gap-4"
                                >
                                    <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-2xl">✕</div>
                                    <p className="text-red-400 text-center text-sm">{errorMsg}</p>
                                    <button
                                        onClick={() => setPaymentStatus('idle')}
                                        className="mt-2 px-6 py-2 bg-brand-gold text-brand-dark font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 flex flex-col items-center gap-3 text-gray-600 text-xs"
                >
                    <p>Payments processed securely via PayPal. No card info stored on our servers.</p>
                    <div className="flex gap-6 text-gray-500">
                        <span>🛡️ SSL Encrypted</span>
                        <span>🔐 PayPal Buyer Protection</span>
                        <span>↩️ No Hidden Fees</span>
                    </div>
                </motion.div>

                {/* Contact / Support */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="mt-6 text-center"
                >
                    <p className="text-gray-600 text-xs mb-1">Having trouble with payment or any other question?</p>
                    <a
                        href="mailto:pomvaul@gmail.com?subject=K-SajuFortune Payment Issue"
                        className="text-brand-gold hover:text-yellow-300 text-sm font-medium transition-colors underline underline-offset-2"
                    >
                        ✉️ Contact us at pomvaul@gmail.com
                    </a>
                </motion.div>
            </div>
        </PayPalScriptProvider>
    );
}
