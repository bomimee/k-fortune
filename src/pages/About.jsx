import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function About() {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const pillars = [
        {
            icon: '🌳',
            element: 'Wood',
            title: 'Growth & Creativity',
            description: 'Represents expansion, flexibility, and new beginnings. Wood energy brings innovation and compassion.'
        },
        {
            icon: '🔥',
            element: 'Fire',
            title: 'Passion & Energy',
            description: 'Symbolizes transformation, enthusiasm, and leadership. Fire energy ignites action and charisma.'
        },
        {
            icon: '🏔️',
            element: 'Earth',
            title: 'Stability & Nurturing',
            description: 'Embodies grounding, reliability, and harmony. Earth energy provides balance and support.'
        },
        {
            icon: '⚔️',
            element: 'Metal',
            title: 'Strength & Precision',
            description: 'Represents structure, determination, and clarity. Metal energy brings focus and discipline.'
        },
        {
            icon: '💧',
            element: 'Water',
            title: 'Wisdom & Adaptability',
            description: 'Symbolizes flow, intuition, and depth. Water energy fosters wisdom and emotional intelligence.'
        }
    ];

    const features = [
        {
            icon: '🎯',
            title: 'Career Guidance',
            description: 'Discover your natural talents and ideal career paths based on your elemental composition.'
        },
        {
            icon: '💰',
            title: 'Wealth Potential',
            description: 'Understand your relationship with money and opportunities for financial growth.'
        },
        {
            icon: '❤️',
            title: 'Relationship Insights',
            description: 'Learn about your compatibility patterns and how to build harmonious connections.'
        },
        {
            icon: '🌟',
            title: 'Life Purpose',
            description: 'Uncover your unique mission and the path to fulfilling your highest potential.'
        },
        {
            icon: '📅',
            title: 'Timing & Cycles',
            description: 'Navigate life\'s rhythms with insights into favorable and challenging periods.'
        },
        {
            icon: '🧘',
            title: 'Personal Growth',
            description: 'Identify strengths to cultivate and challenges to overcome on your journey.'
        }
    ];

    return (
        <div className="min-h-screen bg-brand-dark">
            {/* Hero Section */}
            <motion.section
                className="relative py-20 px-4 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-brand-gold/10 to-transparent"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.h1
                        className="text-5xl md:text-7xl font-bold text-brand-gold mb-6"
                        {...fadeIn}
                    >
                        Discover Your Cosmic DNA
                    </motion.h1>
                    <motion.p
                        className="text-xl md:text-2xl text-gray-300 mb-8 mt-12"
                        {...fadeIn}
                        transition={{ delay: 0.2 }}
                    >
                        Unlock the ancient wisdom of Saju (사주)
                    </motion.p>
                    <motion.p
                        className="text-xl md:text-2xl text-gray-300 mb-12"
                        {...fadeIn}
                        transition={{ delay: 0.2 }}
                    >
                        Your personal blueprint written in the stars
                    </motion.p>
                    <motion.div
                        {...fadeIn}
                        transition={{ delay: 0.4 }}
                    >
                        <Link
                            to="/reading/general"
                            className="inline-block bg-brand-gold text-brand-dark px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-500 transition-all transform hover:scale-105"
                        >
                            Get Your Reading
                        </Link>
                    </motion.div>
                </div>
            </motion.section>

            {/* What is Saju Section */}
            <section className="py-16 px-4 bg-gray-900/50">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl font-bold text-white text-center mb-12">
                            What is <span className="text-brand-gold">Saju</span>?
                        </h2>
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                                    Saju (사주), also known as the "Four Pillars of Destiny," is an ancient Korean system of fortune-telling based on the exact time, date, and location of your birth.
                                </p>
                                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                                    Like your unique DNA, your Saju chart reveals the cosmic energies present at the moment you entered this world. These energies shape your personality, talents, challenges, and life path.
                                </p>
                                <p className="text-gray-300 text-lg leading-relaxed">
                                    By understanding your Four Pillars - representing Year, Month, Day, and Hour - you gain profound insights into who you are and who you're meant to become.
                                </p>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-8 border border-brand-gold/30">
                                <h3 className="text-2xl font-bold text-brand-gold mb-6">The Four Pillars</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <span className="text-3xl">📅</span>
                                        <div>
                                            <h4 className="text-white font-semibold">Year Pillar</h4>
                                            <p className="text-gray-400 text-sm">Your roots, ancestry, and early life foundation</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <span className="text-3xl">🌙</span>
                                        <div>
                                            <h4 className="text-white font-semibold">Month Pillar</h4>
                                            <p className="text-gray-400 text-sm">Your career, social life, and adult years</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <span className="text-3xl">☀️</span>
                                        <div>
                                            <h4 className="text-white font-semibold">Day Pillar</h4>
                                            <p className="text-gray-400 text-sm">Your core self, relationships, and marriage</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <span className="text-3xl">⏰</span>
                                        <div>
                                            <h4 className="text-white font-semibold">Hour Pillar</h4>
                                            <p className="text-gray-400 text-sm">Your legacy, children, and later life</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Five Elements Section */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl font-bold text-white text-center mb-4">
                            The Five Elements
                        </h2>
                        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
                            Your Saju chart is composed of five fundamental energies that interact to create your unique cosmic signature
                        </p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pillars.map((pillar, index) => (
                                <motion.div
                                    key={pillar.element}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-brand-gold transition-all hover:transform hover:scale-105"
                                >
                                    <div className="text-5xl mb-4">{pillar.icon}</div>
                                    <h3 className="text-xl font-bold text-brand-gold mb-2">{pillar.element}</h3>
                                    <h4 className="text-white font-semibold mb-3">{pillar.title}</h4>
                                    <p className="text-gray-400 text-sm">{pillar.description}</p>
                                </motion.div>
                            ))}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5 }}
                                className="bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 rounded-lg p-6 border border-brand-gold flex items-center justify-center"
                            >
                                <div className="text-center">
                                    <div className="text-4xl mb-3">🔄</div>
                                    <p className="text-white font-semibold mb-2">Dynamic Balance</p>
                                    <p className="text-gray-300 text-sm">
                                        These elements interact, support, and challenge each other in your unique chart
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* What You'll Discover Section */}
            <section className="py-16 px-4 bg-gray-900/50">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl font-bold text-white text-center mb-4">
                            What You'll Discover
                        </h2>
                        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
                            Your personalized Saju reading reveals deep insights across all areas of your life
                        </p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-brand-gold transition-all"
                                >
                                    <div className="text-4xl mb-4">{feature.icon}</div>
                                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                    <p className="text-gray-400">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Ready to Decode Your Destiny?
                        </h2>
                        <p className="text-xl text-gray-300 mb-8">
                            Join thousands who have discovered their cosmic blueprint and transformed their lives
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/reading/general"
                                className="bg-brand-gold text-brand-dark px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-500 transition-all transform hover:scale-105"
                            >
                                Get Your Saju Reading
                            </Link>
                            <Link
                                to="/reading/compatibility"
                                className="bg-gray-800 text-white px-8 py-4 rounded-lg font-bold text-lg border border-brand-gold hover:bg-gray-700 transition-all"
                            >
                                Check Compatibility
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
