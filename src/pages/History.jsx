import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function History() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            navigate('/');
            return;
        }

        loadReadings();
    }, [currentUser, navigate]);

    const loadReadings = async () => {
        try {
            setLoading(true);
            const readingsRef = collection(db, "users", currentUser.uid, "readings");
            const q = query(readingsRef, orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);

            const readingsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));

            setReadings(readingsData);
        } catch (error) {
            console.error("Error loading readings:", error);
        } finally {
            setLoading(false);
        }
    };

    const deleteReading = async (readingId) => {
        if (!confirm('Are you sure you want to delete this reading?')) return;

        try {
            await deleteDoc(doc(db, "users", currentUser.uid, "readings", readingId));
            await loadReadings();
        } catch (error) {
            console.error("Error deleting reading:", error);
            alert('Failed to delete reading');
        }
    };

    const viewReading = (reading) => {
        navigate('/result', {
            state: {
                ...reading,
                fromHistory: true
            }
        });
    };

    const getReadingTypeLabel = (type) => {
        const types = {
            'general': '🔮 General Reading',
            'year-fortune': '📅 Year Fortune',
            'compatibility': '💕 Compatibility'
        };
        return types[type] || '🔮 Saju Reading';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-gold"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-dark py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-brand-gold">📚 Reading History</h1>
                    <Link
                        to="/"
                        className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        🏠 Home
                    </Link>
                </div>

                {readings.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-xl mb-6">No readings yet</p>
                        <Link
                            to="/"
                            className="bg-brand-gold text-brand-dark px-8 py-3 rounded-lg hover:bg-yellow-500 transition-colors inline-block"
                        >
                            Get Your First Reading
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {readings.map((reading, index) => (
                            <motion.div
                                key={reading.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-brand-gold transition-colors"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">
                                            {reading.name}
                                            {reading.partnerName && ` & ${reading.partnerName}`}
                                        </h3>
                                        <p className="text-sm text-brand-gold">
                                            {getReadingTypeLabel(reading.type)}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <p className="text-sm text-gray-400">
                                        📅 Birth: {reading.birthDate}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        🕐 Time: {reading.birthTime || 'Unknown'}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        📍 {reading.birthPlace || 'Not specified'}
                                    </p>
                                    {reading.createdAt && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Generated: {reading.createdAt.toLocaleDateString()} {reading.createdAt.toLocaleTimeString()}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => viewReading(reading)}
                                        className="flex-1 bg-brand-gold text-brand-dark px-4 py-2 rounded hover:bg-yellow-500 transition-colors font-semibold"
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() => deleteReading(reading.id)}
                                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
