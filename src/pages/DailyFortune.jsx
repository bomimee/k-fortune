import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function DailyFortune() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [profiles, setProfiles] = useState([]);
    const [selectedProfileId, setSelectedProfileId] = useState('');
    const [selectedProfile, setSelectedProfile] = useState(null);

    const [formData, setFormData] = useState({
        priority: '',
        mood: '',
        wish: ''
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            loadProfiles();
        } else {
            // Need to handle non-logged in users? Or prompt login?
            // Actually, for daily fortune, maybe login is required to save profiles.
            setProfiles([{
                id: 'guest',
                name: 'Guest',
                gender: 'unknown',
                birthDate: '2000-01-01',
                birthTime: '12:00',
                birthType: 'solar'
            }]);
            setSelectedProfileId('guest');
            setSelectedProfile({
                id: 'guest',
                name: 'Guest',
                gender: 'unknown',
                birthDate: '2000-01-01',
                birthTime: '12:00',
                birthType: 'solar'
            });
        }
    }, [currentUser]);

    const loadProfiles = async () => {
        try {
            const profilesRef = collection(db, "users", currentUser.uid, "profiles");
            const snapshot = await getDocs(profilesRef);
            const loadedProfiles = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProfiles(loadedProfiles);

            if (loadedProfiles.length > 0) {
                // Pre-select the first one by default
                setSelectedProfileId(loadedProfiles[0].id);
                setSelectedProfile(loadedProfiles[0]);
            }
        } catch (error) {
            console.error("Error loading profiles:", error);
        }
    };

    const handleProfileSelect = (profile) => {
        setSelectedProfileId(profile.id);
        setSelectedProfile(profile);
    };

    const handleSkip = () => {
        // Navigate to checkout with empty inputs but selected user data
        if (!selectedProfile) {
            alert('Please select a profile for the reading.');
            return;
        }

        proceedToCheckout({
            priority: '',
            mood: '',
            wish: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedProfile) {
            alert('Please select a profile for the reading.');
            return;
        }
        proceedToCheckout(formData);
    };

    const proceedToCheckout = (customData) => {
        const combinedData = {
            ...selectedProfile,
            ...customData,
            type: 'daily-fortune', // Indicate this is daily fortune to Backend
        };
        navigate('/checkout', { state: combinedData });
    };

    const updateField = (field, value) => {
        if (value.length <= 50) {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark flex flex-col items-center pt-20 px-4 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 p-8 rounded-lg shadow-xl max-w-2xl w-full border border-gray-800"
            >
                <h2 className="text-2xl font-bold text-brand-gold mb-6 text-center capitalize">
                    Daily Fortune Reading
                </h2>

                <p className="text-gray-400 text-center mb-8">
                    Select a profile and share your energy for today's personalized fortune.
                </p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Profile Selection */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <label className="block text-gray-400 mb-2 text-sm font-semibold">Select Profile</label>
                        <select
                            className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-brand-gold outline-none transition-colors"
                            value={selectedProfileId}
                            onChange={(e) => {
                                if (e.target.value === 'add-new') {
                                    navigate('/reading/general');
                                } else {
                                    const profile = profiles.find(p => p.id === e.target.value);
                                    if (profile) handleProfileSelect(profile);
                                }
                            }}
                        >
                            <option value="" disabled>-- Select a profile --</option>
                            {profiles.map(profile => (
                                <option key={profile.id} value={profile.id}>
                                    {profile.name} ({profile.birthDate})
                                </option>
                            ))}
                            <option value="add-new" className="text-brand-gold">+ Add New Profile</option>
                        </select>
                    </div>

                    <div className="space-y-6">
                        {/* Priority */}
                        <div>
                            <label className="block text-brand-gold mb-2 font-semibold">
                                What is your top priority today? (Optional)
                            </label>
                            <div className="relative">
                                <textarea
                                    value={formData.priority}
                                    onChange={(e) => updateField('priority', e.target.value)}
                                    placeholder="e.g., Studying for an exam, blind date, important meeting..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 h-24 resize-none text-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-colors"
                                />
                                <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                                    {formData.priority.length}/50
                                </div>
                            </div>
                        </div>

                        {/* Mood */}
                        <div>
                            <label className="block text-brand-gold mb-2 font-semibold">
                                How are you feeling right now? (Optional)
                            </label>
                            <div className="relative">
                                <textarea
                                    value={formData.mood}
                                    onChange={(e) => updateField('mood', e.target.value)}
                                    placeholder="e.g., A bit anxious, feeling energetic, want to do well..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 h-24 resize-none text-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-colors"
                                />
                                <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                                    {formData.mood.length}/50
                                </div>
                            </div>
                        </div>

                        {/* Wish */}
                        <div>
                            <label className="block text-brand-gold mb-2 font-semibold">
                                Do you have a specific wish for today? (Optional)
                            </label>
                            <div className="relative">
                                <textarea
                                    value={formData.wish}
                                    onChange={(e) => updateField('wish', e.target.value)}
                                    placeholder="e.g., I want to speak confidently at the meeting, I hope I pass the interview!"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 h-24 resize-none text-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-colors"
                                />
                                <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                                    {formData.wish.length}/50
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-800 flex flex-col md:flex-row gap-4">
                        <button
                            type="button"
                            onClick={handleSkip}
                            className="flex-1 bg-gray-800 text-gray-300 font-bold py-3 px-6 rounded-lg hover:bg-gray-700 border border-gray-700 transition-colors order-2 md:order-1"
                        >
                            Skip Inputs
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-brand-gold text-brand-dark font-bold py-3 px-6 rounded-lg hover:bg-yellow-400 transition-colors shadow-lg shadow-brand-gold/20 order-1 md:order-2"
                        >
                            Get Daily Reading
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
