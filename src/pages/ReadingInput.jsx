import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function ReadingInput() {
    const { type } = useParams();
    const navigate = useNavigate();
    const isCompatibility = type === 'compatibility';
    const [formData, setFormData] = useState({
        name: '',
        gender: 'male',
        birthDate: '',
        birthTime: '',
        birthTimeUnknown: false,
        birthType: 'solar',
        birthPlace: '',
        currentResidence: '',
        currentSituation: '',
        // Compatibility specific
        relationshipType: 'romantic',
        customRelationship: '',
        partnerName: '',
        partnerGender: 'female',
        partnerBirthDate: '',
        partnerBirthTime: '',
        partnerBirthTimeUnknown: false,
        partnerBirthType: 'solar',
        partnerBirthPlace: ''
    });

    const { currentUser } = useAuth();
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [saveProfile, setSaveProfile] = useState(true);

    // User profiles management
    const [savedProfiles, setSavedProfiles] = useState([]);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);

    // Partner management
    const [savedPartners, setSavedPartners] = useState([]);
    const [showPartnerModal, setShowPartnerModal] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState(null);

    useEffect(() => {
        if (currentUser) {
            loadSavedProfiles();
            if (isCompatibility) {
                loadSavedPartners();
            }
        }
    }, [currentUser, isCompatibility]);

    const loadSavedProfiles = async () => {
        setLoadingProfile(true);
        try {
            const profilesRef = collection(db, "users", currentUser.uid, "profiles");
            const snapshot = await getDocs(profilesRef);
            const profiles = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSavedProfiles(profiles);

            // Auto-load the first profile if exists
            if (profiles.length > 0 && !formData.name) {
                loadProfile(profiles[0]);
            }
        } catch (error) {
            console.error("Error loading profiles:", error);
        }
        setLoadingProfile(false);
    };

    const saveUserProfile = async () => {
        if (!currentUser || !formData.name) return;

        try {
            const profilesRef = collection(db, "users", currentUser.uid, "profiles");
            await addDoc(profilesRef, {
                name: formData.name,
                gender: formData.gender,
                birthDate: formData.birthDate,
                birthTime: formData.birthTime,
                birthTimeUnknown: formData.birthTimeUnknown,
                birthType: formData.birthType,
                birthPlace: formData.birthPlace,
                currentResidence: formData.currentResidence,
                currentSituation: formData.currentSituation,
                savedAt: serverTimestamp()
            });
            await loadSavedProfiles();
            alert('Profile saved successfully!');
        } catch (error) {
            console.error("Error saving profile:", error);
            alert('Failed to save profile');
        }
    };

    const loadProfile = (profile) => {
        setFormData(prev => ({
            ...prev,
            name: profile.name || '',
            gender: profile.gender || 'male',
            birthDate: profile.birthDate || '',
            birthTime: profile.birthTime || '',
            birthTimeUnknown: profile.birthTimeUnknown || false,
            birthType: profile.birthType || 'solar',
            birthPlace: profile.birthPlace || '',
            currentResidence: profile.currentResidence || '',
            currentSituation: profile.currentSituation || ''
        }));
        setShowProfileModal(false);
        setSelectedProfile(profile.id);
    };

    const deleteProfile = async (profileId) => {
        if (!confirm('Are you sure you want to delete this profile?')) return;

        try {
            await deleteDoc(doc(db, "users", currentUser.uid, "profiles", profileId));
            await loadSavedProfiles();
            if (selectedProfile === profileId) {
                setSelectedProfile(null);
            }
        } catch (error) {
            console.error("Error deleting profile:", error);
            alert('Failed to delete profile');
        }
    };

    const loadSavedPartners = async () => {
        try {
            const partnersRef = collection(db, "users", currentUser.uid, "partners");
            const snapshot = await getDocs(partnersRef);
            const partners = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSavedPartners(partners);
        } catch (error) {
            console.error("Error loading partners:", error);
        }
    };

    const savePartner = async () => {
        if (!currentUser || !formData.partnerName) return;

        try {
            const partnersRef = collection(db, "users", currentUser.uid, "partners");
            await addDoc(partnersRef, {
                name: formData.partnerName,
                gender: formData.partnerGender,
                birthDate: formData.partnerBirthDate,
                birthTime: formData.partnerBirthTime,
                birthTimeUnknown: formData.partnerBirthTimeUnknown,
                birthType: formData.partnerBirthType,
                birthPlace: formData.partnerBirthPlace,
                relationshipType: formData.relationshipType,
                customRelationship: formData.customRelationship,
                createdAt: serverTimestamp()
            });
            await loadSavedPartners();
            alert('Partner saved successfully!');
        } catch (error) {
            console.error("Error saving partner:", error);
            alert('Failed to save partner');
        }
    };

    const deletePartner = async (partnerId) => {
        if (!confirm('Are you sure you want to delete this partner?')) return;

        try {
            await deleteDoc(doc(db, "users", currentUser.uid, "partners", partnerId));
            await loadSavedPartners();
        } catch (error) {
            console.error("Error deleting partner:", error);
        }
    };

    const loadPartner = (partner) => {
        setFormData(prev => ({
            ...prev,
            partnerName: partner.name,
            partnerGender: partner.gender,
            partnerBirthDate: partner.birthDate,
            partnerBirthTime: partner.birthTime,
            partnerBirthTimeUnknown: partner.birthTimeUnknown,
            partnerBirthType: partner.birthType,
            partnerBirthPlace: partner.birthPlace,
            relationshipType: partner.relationshipType || 'romantic',
            customRelationship: partner.customRelationship || ''
        }));
        setSelectedPartner(partner.id);
        setShowPartnerModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (currentUser && saveProfile) {
            try {
                await setDoc(doc(db, "users", currentUser.uid), {
                    name: formData.name,
                    gender: formData.gender,
                    birthDate: formData.birthDate,
                    birthTime: formData.birthTime,
                    birthTimeUnknown: formData.birthTimeUnknown,
                    birthType: formData.birthType,
                    birthPlace: formData.birthPlace,
                    currentResidence: formData.currentResidence,
                    currentSituation: formData.currentSituation,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            } catch (error) {
                console.error("Error saving profile:", error);
            }
        }

        navigate('/checkout', { state: { ...formData, type } });
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const relationshipTypes = [
        { value: 'romantic', label: 'Romantic Partner' },
        { value: 'spouse', label: 'Spouse' },
        { value: 'parent-child', label: 'Parent-Child' },
        { value: 'siblings', label: 'Siblings' },
        { value: 'friends', label: 'Friends' },
        { value: 'business', label: 'Business Partner' },
        { value: 'custom', label: 'Other' }
    ];

    return (
        <div className="min-h-screen bg-brand-dark flex flex-col items-center pt-20 px-4 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 p-8 rounded-lg shadow-xl max-w-2xl w-full border border-gray-800"
            >
                <h2 className="text-2xl font-bold text-brand-gold mb-6 text-center capitalize">
                    {type?.replace('-', ' ')} Reading
                </h2>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Profile Selection */}
                    {currentUser && savedProfiles.length > 0 && (
                        <div className="bg-gray-750 p-4 rounded-lg border border-gray-700">
                            <label className="block text-gray-400 mb-2 text-sm">Load Saved Profile</label>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-brand-gold outline-none"
                                    value={selectedProfile || ''}
                                    onChange={(e) => {
                                        const profile = savedProfiles.find(p => p.id === e.target.value);
                                        if (profile) loadProfile(profile);
                                    }}
                                >
                                    <option value="">-- Select a profile --</option>
                                    {savedProfiles.map(profile => (
                                        <option key={profile.id} value={profile.id}>
                                            {profile.name} ({profile.birthDate})
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowProfileModal(true)}
                                    className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                                >
                                    Manage
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Person 1 */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                            <h3 className="text-lg text-white font-bold">Your Details</h3>
                            {currentUser && (
                                <button
                                    type="button"
                                    onClick={saveUserProfile}
                                    className="bg-brand-gold text-brand-dark px-4 py-1 rounded text-sm font-semibold hover:bg-yellow-500 transition-colors"
                                >
                                    💾 Save Profile
                                </button>
                            )}
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1 text-sm">Full Name</label>
                            <input
                                required
                                type="text"
                                placeholder="Enter your full name"
                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-brand-gold outline-none transition-colors"
                                value={formData.name}
                                onChange={e => updateField('name', e.target.value)}
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="block text-gray-400 mb-1 text-sm">Gender</label>
                                <select
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-brand-gold outline-none"
                                    value={formData.gender}
                                    onChange={e => updateField('gender', e.target.value)}
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="w-1/2">
                                <label className="block text-gray-400 mb-1 text-sm">Birth Date</label>
                                <input
                                    required
                                    type="date"
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white placeholder-gray-500 focus:border-brand-gold outline-none"
                                    value={formData.birthDate}
                                    onChange={e => updateField('birthDate', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-gray-400 text-sm">Birth Time</label>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="timeUnknown"
                                            checked={formData.birthTimeUnknown}
                                            onChange={(e) => updateField('birthTimeUnknown', e.target.checked)}
                                            className="mr-1 w-3 h-3"
                                        />
                                        <label htmlFor="timeUnknown" className="text-xs text-gray-500">Unknown</label>
                                    </div>
                                </div>
                                <input
                                    type="time"
                                    disabled={formData.birthTimeUnknown}
                                    className={`w-full bg-gray-800 border border-gray-700 rounded p-2 text-white placeholder-gray-500 focus:border-brand-gold outline-none ${formData.birthTimeUnknown ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    value={formData.birthTime}
                                    onChange={e => updateField('birthTime', e.target.value)}
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-gray-400 mb-1 text-sm">Calendar Type</label>
                                <select
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-brand-gold outline-none"
                                    value={formData.birthType}
                                    onChange={e => updateField('birthType', e.target.value)}
                                >
                                    <option value="solar">Solar</option>
                                    <option value="lunar">Lunar</option>
                                    <option value="leap">Lunar Leap</option>
                                    <option value="unknown">Unknown</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-400 mb-1 text-sm">Birth Place (City/Country)</label>
                            <input
                                type="text"
                                placeholder="e.g. New York, USA"
                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-brand-gold outline-none"
                                value={formData.birthPlace}
                                onChange={e => updateField('birthPlace', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Partner Section (Compatibility Only) */}
                    {isCompatibility && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                <h3 className="text-lg text-white font-bold">Partner's Details</h3>
                                {currentUser && savedPartners.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowPartnerModal(true)}
                                        className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
                                    >
                                        Load Saved Partner
                                    </button>
                                )}
                            </div>

                            {/* Relationship Type */}
                            <div>
                                <label className="block text-gray-400 mb-1 text-sm">Relationship Type</label>
                                <select
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-brand-gold outline-none"
                                    value={formData.relationshipType}
                                    onChange={e => updateField('relationshipType', e.target.value)}
                                >
                                    {relationshipTypes.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.relationshipType === 'custom' && (
                                <div>
                                    <label className="block text-gray-400 mb-1 text-sm">Specify Relationship</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Mentor, Colleague, etc."
                                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-brand-gold outline-none"
                                        value={formData.customRelationship}
                                        onChange={e => updateField('customRelationship', e.target.value)}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-gray-400 mb-1 text-sm">Partner's Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Enter partner's full name"
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-brand-gold outline-none"
                                    value={formData.partnerName}
                                    onChange={e => updateField('partnerName', e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-gray-400 mb-1 text-sm">Gender</label>
                                    <select
                                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-brand-gold outline-none"
                                        value={formData.partnerGender}
                                        onChange={e => updateField('partnerGender', e.target.value)}
                                    >
                                        <option value="female">Female</option>
                                        <option value="male">Male</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-gray-400 mb-1 text-sm">Birth Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white placeholder-gray-500 focus:border-brand-gold outline-none"
                                        value={formData.partnerBirthDate}
                                        onChange={e => updateField('partnerBirthDate', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-gray-400 text-sm">Birth Time</label>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="partnerTimeUnknown"
                                                checked={formData.partnerBirthTimeUnknown}
                                                onChange={(e) => updateField('partnerBirthTimeUnknown', e.target.checked)}
                                                className="mr-1 w-3 h-3"
                                            />
                                            <label htmlFor="partnerTimeUnknown" className="text-xs text-gray-500">Unknown</label>
                                        </div>
                                    </div>
                                    <input
                                        type="time"
                                        disabled={formData.partnerBirthTimeUnknown}
                                        className={`w-full bg-gray-800 border border-gray-700 rounded p-2 text-white placeholder-gray-500 focus:border-brand-gold outline-none ${formData.partnerBirthTimeUnknown ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        value={formData.partnerBirthTime}
                                        onChange={e => updateField('partnerBirthTime', e.target.value)}
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-gray-400 mb-1 text-sm">Calendar Type</label>
                                    <select
                                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-brand-gold outline-none"
                                        value={formData.partnerBirthType}
                                        onChange={e => updateField('partnerBirthType', e.target.value)}
                                    >
                                        <option value="solar">Solar</option>
                                        <option value="lunar">Lunar</option>
                                        <option value="leap">Lunar Leap</option>
                                        <option value="unknown">Unknown</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1 text-sm">Birth Place (City/Country)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. New York, USA"
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-brand-gold outline-none"
                                    value={formData.partnerBirthPlace}
                                    onChange={e => updateField('partnerBirthPlace', e.target.value)}
                                />
                            </div>

                            {currentUser && (
                                <button
                                    type="button"
                                    onClick={savePartner}
                                    className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors text-sm"
                                >
                                    💾 Save This Partner for Future Readings
                                </button>
                            )}
                        </div>
                    )}

                    {/* Additional Information */}
                    {!isCompatibility && (
                        <div className="space-y-4">
                            <h3 className="text-lg text-white font-bold border-b border-gray-700 pb-2">Additional Information</h3>

                            <div>
                                <label className="block text-gray-400 mb-1 text-sm">Current Residence (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. New York, USA"
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-brand-gold outline-none"
                                    value={formData.currentResidence}
                                    onChange={e => updateField('currentResidence', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1 text-sm">Current Situation (Optional)</label>
                                <textarea
                                    placeholder="e.g. Considering a job change in 3 months, or relationship issues."
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-brand-gold outline-none h-20 resize-none"
                                    value={formData.currentSituation}
                                    onChange={e => updateField('currentSituation', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-brand-gold text-brand-dark font-bold py-3 rounded hover:bg-yellow-500 transition-colors mt-4"
                    >
                        {loadingProfile ? "Loading..." : "Continue to Analysis"}
                    </button>
                </form>
            </motion.div>

            {/* Partner Selection Modal */}
            <AnimatePresence>
                {showPartnerModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowPartnerModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-700"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-brand-gold mb-4">Select Saved Partner</h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {savedPartners.map(partner => (
                                    <div
                                        key={partner.id}
                                        className="bg-gray-800 p-4 rounded border border-gray-700 hover:border-brand-gold transition-colors"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="text-white font-semibold">{partner.name}</h4>
                                                <p className="text-sm text-gray-400">
                                                    {partner.birthDate} • {partner.gender}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {relationshipTypes.find(t => t.value === partner.relationshipType)?.label || partner.relationshipType}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => loadPartner(partner)}
                                                    className="bg-brand-gold text-brand-dark px-3 py-1 rounded text-sm hover:bg-yellow-500 transition-colors"
                                                >
                                                    Load
                                                </button>
                                                <button
                                                    onClick={() => deletePartner(partner.id)}
                                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowPartnerModal(false)}
                                className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile Management Modal */}
            <AnimatePresence>
                {showProfileModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowProfileModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-700"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-brand-gold mb-4">Manage Saved Profiles</h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {savedProfiles.map(profile => (
                                    <div
                                        key={profile.id}
                                        className="bg-gray-800 p-4 rounded border border-gray-700 hover:border-brand-gold transition-colors"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="text-white font-semibold">{profile.name}</h4>
                                                <p className="text-sm text-gray-400">
                                                    {profile.birthDate} • {profile.gender}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {profile.birthPlace || 'No location'}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => loadProfile(profile)}
                                                    className="bg-brand-gold text-brand-dark px-3 py-1 rounded text-sm hover:bg-yellow-500 transition-colors"
                                                >
                                                    Load
                                                </button>
                                                <button
                                                    onClick={() => deleteProfile(profile.id)}
                                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
