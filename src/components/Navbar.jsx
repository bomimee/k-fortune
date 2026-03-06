import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { currentUser, login, logout } = useAuth();

    return (
        <nav className="p-4 flex justify-between items-center max-w-7xl mx-auto border-b border-gray-800">
            <div className="flex items-center gap-8">
                <Link to="/" className="text-2xl font-bold text-brand-gold tracking-tighter hover:text-white transition-colors">
                    K-SajuFortune
                </Link>
                <Link
                    to="/about"
                    className="text-sm text-gray-300 hover:text-brand-gold transition-colors hidden sm:block"
                >
                    About Saju
                </Link>
                <a
                    href="mailto:pomvaul@gmail.com?subject=K-SajuFortune Inquiry"
                    className="text-sm text-gray-300 hover:text-brand-gold transition-colors hidden sm:block"
                >
                    Contact
                </a>
            </div>
            <div>
                {currentUser ? (
                    <div className="flex items-center gap-6">
                        <Link
                            to="/history"
                            className="text-sm text-gray-300 hover:text-brand-gold transition-colors flex items-center gap-1"
                        >
                            📚 History
                        </Link>
                        <span className="text-sm text-gray-400 hidden md:inline-block">Welcome, {currentUser.displayName}</span>
                        <button onClick={logout} className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <button onClick={login} className="px-5 py-2 border border-brand-gold text-brand-gold rounded hover:bg-brand-gold hover:text-brand-dark transition-colors font-medium">
                        Login
                    </button>
                )}
            </div>
        </nav>
    );
}
