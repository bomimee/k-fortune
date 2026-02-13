import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { generateTestAnalysis } from '../utils/testData';

export default function Home() {
    const [stars, setStars] = useState([]);
    const [sparkles, setSparkles] = useState([]);

    // Generate falling stars
    useEffect(() => {
        const generateStars = () => {
            const newStars = Array.from({ length: 20 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                animationDuration: 3 + Math.random() * 4,
                animationDelay: Math.random() * 5,
                size: 2 + Math.random() * 3
            }));
            setStars(newStars);
        };

        generateStars();
    }, []);

    // Generate sparkles
    useEffect(() => {
        const generateSparkles = () => {
            const newSparkles = Array.from({ length: 30 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                top: Math.random() * 100,
                animationDuration: 1.5 + Math.random() * 2,
                animationDelay: Math.random() * 3,
                size: 1 + Math.random() * 2
            }));
            setSparkles(newSparkles);
        };

        generateSparkles();
    }, []);

    return (
        <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
            {/* Falling Stars */}
            {stars.map((star) => (
                <div
                    key={`star-${star.id}`}
                    className="absolute pointer-events-none"
                    style={{
                        left: `${star.left}%`,
                        top: '-10px',
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        animation: `fall ${star.animationDuration}s linear ${star.animationDelay}s infinite`,
                    }}
                >
                    <div className="w-full h-full bg-brand-gold rounded-full shadow-lg shadow-brand-gold/50"></div>
                    <div
                        className="absolute top-0 left-0 w-full h-full bg-brand-gold rounded-full blur-sm opacity-70"
                        style={{
                            animation: `pulse ${star.animationDuration * 0.5}s ease-in-out infinite`
                        }}
                    ></div>
                </div>
            ))}

            {/* Sparkles */}
            {sparkles.map((sparkle) => (
                <div
                    key={`sparkle-${sparkle.id}`}
                    className="absolute pointer-events-none"
                    style={{
                        left: `${sparkle.left}%`,
                        top: `${sparkle.top}%`,
                        width: `${sparkle.size}px`,
                        height: `${sparkle.size}px`,
                        animation: `twinkle ${sparkle.animationDuration}s ease-in-out ${sparkle.animationDelay}s infinite`,
                    }}
                >
                    <div className="w-full h-full bg-white rounded-full shadow-lg shadow-white/50"></div>
                </div>
            ))}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-brand-dark/50 to-brand-dark pointer-events-none"></div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10"
            >
                <motion.h1
                    className="text-5xl md:text-7xl font-bold text-brand-gold mb-6"
                    animate={{
                        textShadow: [
                            "0 0 20px rgba(255, 215, 0, 0.5)",
                            "0 0 40px rgba(255, 215, 0, 0.8)",
                            "0 0 20px rgba(255, 215, 0, 0.5)",
                        ]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    Unlock Your Fate
                </motion.h1>

                <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-4 mt-12">
                    Ancient Korean wisdom meeting modern insight.
                </p>
                <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-12">
                    Discover your Saju (Four Pillars of Destiny) today.
                </p>

                <div className="flex flex-col md:flex-row gap-6 justify-center flex-wrap">
                    <Link to="/reading/full" className="px-8 py-4 bg-brand-gold text-brand-dark font-bold rounded-lg hover:bg-yellow-500 transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-brand-gold/50 text-lg">
                        Start Full Reading
                    </Link>
                    <Link to="/reading/compatibility" className="px-8 py-4 border border-brand-gold text-brand-gold font-bold rounded-lg hover:bg-brand-gold hover:text-brand-dark transition-all transform hover:scale-105 text-lg">
                        Check Compatibility
                    </Link>
                    <Link to="/reading/year-fortune" className="px-8 py-4 border border-gray-600 text-gray-300 font-bold rounded-lg hover:border-brand-gold hover:text-brand-gold transition-all transform hover:scale-105 text-lg">
                        Yearly Forecast
                    </Link>
                </div>

                {/* Test Buttons 
                <div className="mt-12 pt-8 border-t border-gray-700">
                    <p className="text-gray-500 text-sm mb-4">🧪 테스트 모드 (개발용)</p>
                    <div className="flex flex-col md:flex-row gap-3 justify-center flex-wrap">
                        <Link
                            to="/result"
                            state={{
                                name: "테스트",
                                birthDate: "1990-05-15",
                                birthTime: "10:00",
                                gender: "male",
                                type: "general",
                                fromHistory: true,
                                analysis: generateTestAnalysis('general')
                            }}
                            className="px-6 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-all"
                        >
                            📊 일반 사주 테스트
                        </Link>
                        <Link
                            to="/result"
                            state={{
                                name: "김철수",
                                partnerName: "이영희",
                                birthDate: "1990-05-15",
                                birthTime: "10:00",
                                partnerBirthDate: "1992-08-20",
                                partnerBirthTime: "14:00",
                                gender: "male",
                                partnerGender: "female",
                                type: "compatibility",
                                fromHistory: true,
                                analysis: generateTestAnalysis('compatibility')
                            }}
                            className="px-6 py-2 bg-pink-600 text-white text-sm font-semibold rounded-lg hover:bg-pink-700 transition-all"
                        >
                            💑 궁합 분석 테스트
                        </Link>
                        <Link
                            to="/result"
                            state={{
                                name: "테스트",
                                birthDate: "1990-05-15",
                                birthTime: "10:00",
                                gender: "male",
                                type: "year-fortune",
                                fromHistory: true,
                                analysis: generateTestAnalysis('year-fortune')
                            }}
                            className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all"
                        >
                            📅 연간 운세 테스트
                        </Link>
                    </div>
                </div>
                */}
            </motion.div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes fall {
                    0% {
                        transform: translateY(0) translateX(0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) translateX(50px);
                        opacity: 0;
                    }
                }

                @keyframes twinkle {
                    0%, 100% {
                        opacity: 0;
                        transform: scale(0);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 0.7;
                    }
                    50% {
                        transform: scale(1.5);
                        opacity: 0.3;
                    }
                }
            `}</style>
        </div>
    );
}
