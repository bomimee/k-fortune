import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function YearFortuneAccordion({ analysis }) {
    const [openSection, setOpenSection] = useState('summary');
    const [openMonth, setOpenMonth] = useState(null);

    // Extract monthly data from pillars section (3️⃣ 월별 운세)
    const extractMonthlyData = () => {
        if (!analysis?.personality?.content) return [];

        const content = analysis.personality.content;
        const months = [];
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthNamesKo = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        monthNames.forEach((monthName, index) => {
            const regex = new RegExp(`\\*\\*${monthName}\\*\\*[\\s:]*([^]*?)(?=\\*\\*(?:January|February|March|April|May|June|July|August|September|October|November|December)\\*\\*|$)`, 'i');
            const match = content.match(regex);

            if (match) {
                months.push({
                    id: index + 1,
                    name: monthName,
                    content: match[1].replace(/^\*+:\s*/, '').trim()
                });
            }
        });

        return months;
    };

    const monthlyData = extractMonthlyData();

    // Main sections (excluding personality which becomes monthly)
    const mainSections = [
        { id: 'summary', title: 'Overall New Year Fortune', key: 'summary', icon: '✨', color: 'from-amber-400 to-orange-500' },
        { id: 'love', title: 'Love & Relationships', key: 'love', icon: '💖', color: 'from-pink-500 to-rose-500' },
        { id: 'wealth', title: 'Wealth & Finance', key: 'wealth', icon: '💰', color: 'from-yellow-500 to-amber-500' },
        { id: 'career', title: 'Career & Professional', key: 'career', icon: '💼', color: 'from-blue-500 to-indigo-500' },
        { id: 'health', title: 'Health & Vitality', key: 'health', icon: '🏥', color: 'from-green-500 to-emerald-500' },
        { id: 'academic', title: 'Academic & Growth', key: 'academic', icon: '📚', color: 'from-purple-500 to-violet-500' }
    ];

    const toggleSection = (sectionId) => {
        setOpenSection(openSection === sectionId ? null : sectionId);
        setOpenMonth(null); // Close any open month when switching sections
    };

    const toggleMonth = (monthId) => {
        setOpenMonth(openMonth === monthId ? null : monthId);
    };

    const renderContent = (content) => {
        if (!content) return null;

        const lines = content.split('\n');
        const elements = [];
        let listItems = [];
        let tableRows = [];
        let inTable = false;

        const flushList = () => {
            if (listItems.length > 0) {
                elements.push(
                    <ul key={`list-${elements.length}`} className="ml-6 mb-4 space-y-2">
                        {listItems}
                    </ul>
                );
                listItems = [];
            }
        };

        const flushTable = () => {
            if (tableRows.length > 0) {
                elements.push(
                    <div key={`table-${elements.length}`} className="overflow-x-auto mb-4">
                        <table className="min-w-full border border-gray-600 rounded-lg overflow-hidden">
                            <tbody>{tableRows}</tbody>
                        </table>
                    </div>
                );
                tableRows = [];
                inTable = false;
            }
        };

        lines.forEach((paragraph, idx) => {
            const trimmed = paragraph.trim();
            if (!trimmed) {
                flushList();
                return;
            }

            if (trimmed === '---' || trimmed === '***') {
                return; // Ignore horizontal rules
            }

            // Handle tables (markdown table format)
            if (trimmed.startsWith('|')) {
                if (!inTable) {
                    flushList();
                    inTable = true;
                }
                // Skip separator rows
                if (trimmed.match(/^\|[\s-:|]+\|$/)) return;

                const cells = trimmed.split('|').filter(cell => cell.trim());
                tableRows.push(
                    <tr key={`row-${idx}`} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                        {cells.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-4 py-3 text-gray-300 border-r border-gray-700 last:border-r-0">
                                {cell.trim()}
                            </td>
                        ))}
                    </tr>
                );
                return;
            } else if (inTable) {
                flushTable();
            }

            // Handle headers
            if (trimmed.startsWith('####')) {
                flushList();
                const text = trimmed.replace(/####/g, '').trim();
                elements.push(
                    <h5 key={idx} className="text-base font-bold text-yellow-400 mt-4 mb-2 flex items-center gap-2">
                        <span className="w-1 h-4 bg-yellow-400 rounded"></span>
                        {text}
                    </h5>
                );
                return;
            }
            if (trimmed.startsWith('###')) {
                flushList();
                const text = trimmed.replace(/###/g, '').trim();
                elements.push(
                    <h4 key={idx} className="text-lg font-bold text-brand-gold mt-5 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-brand-gold rounded"></span>
                        {text}
                    </h4>
                );
                return;
            }
            if (trimmed.startsWith('##')) {
                flushList();
                const text = trimmed.replace(/##/g, '').trim();
                elements.push(
                    <h3 key={idx} className="text-xl font-bold text-brand-gold mt-6 mb-4 pb-2 border-b border-brand-gold/30">
                        {text}
                    </h3>
                );
                return;
            }

            // Handle bold standalone lines
            if (trimmed.match(/^\*\*[^*]+\*\*$/)) {
                flushList();
                const text = trimmed.replace(/\*\*/g, '');
                elements.push(
                    <h5 key={idx} className="text-md font-semibold text-yellow-300 mt-4 mb-2 flex items-center gap-2">
                        <span className="text-brand-gold">▸</span>
                        {text}
                    </h5>
                );
                return;
            }

            // Handle hashtags
            if (trimmed.match(/^#\w+/)) {
                flushList();
                const tags = trimmed.split(/\s+/).filter(t => t.startsWith('#'));
                elements.push(
                    <div key={idx} className="flex flex-wrap gap-2 mb-3">
                        {tags.map((tag, tagIdx) => (
                            <span key={tagIdx} className="px-3 py-1 bg-brand-gold/20 text-brand-gold rounded-full text-sm font-medium border border-brand-gold/30">
                                {tag}
                            </span>
                        ))}
                    </div>
                );
                return;
            }

            // Handle list items
            if (trimmed.match(/^[-•]\s/)) {
                const text = trimmed.replace(/^[-•]\s/, '').trim();
                const processedText = text
                    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                    .replace(/\*([^*]+)\*/g, '<em class="text-yellow-300">$1</em>');

                listItems.push(
                    <li key={idx} className="text-gray-300 flex items-start gap-2">
                        <span className="text-brand-gold mt-1.5 text-xs">●</span>
                        <span dangerouslySetInnerHTML={{ __html: processedText }} />
                    </li>
                );
                return;
            }

            // Handle numbered lists
            if (trimmed.match(/^\d+\.\s/)) {
                const text = trimmed.replace(/^\d+\.\s/, '').trim();
                const processedText = text
                    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                    .replace(/\*([^*]+)\*/g, '<em class="text-yellow-300">$1</em>');

                listItems.push(
                    <li key={idx} className="text-gray-300 ml-4 list-decimal">
                        <span dangerouslySetInnerHTML={{ __html: processedText }} />
                    </li>
                );
                return;
            }

            // Handle score indicators (e.g., ⭐⭐⭐⭐☆)
            if (trimmed.match(/[⭐★☆]{3,}/)) {
                flushList();
                elements.push(
                    <div key={idx} className="text-2xl mb-2">
                        {trimmed}
                    </div>
                );
                return;
            }

            // Regular paragraphs
            flushList();
            const processedText = trimmed
                .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                .replace(/\*([^*]+)\*/g, '<em class="text-yellow-300">$1</em>')
                .replace(/`([^`]+)`/g, '<code class="px-2 py-0.5 bg-gray-700 rounded text-brand-gold text-sm">$1</code>');

            elements.push(
                <p
                    key={idx}
                    className="text-gray-300 mb-3 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: processedText }}
                />
            );
        });

        flushList();
        flushTable();
        return elements;
    };

    const getMonthIcon = (monthId) => {
        const icons = ['❄️', '❄️', '🌸', '🌸', '🌺', '☀️', '☀️', '☀️', '🍂', '🍂', '🍁', '❄️'];
        return icons[monthId - 1] || '📅';
    };

    const getMonthColor = (monthId) => {
        const colors = [
            'from-blue-400 to-cyan-400',    // Jan
            'from-blue-500 to-indigo-500',  // Feb
            'from-pink-400 to-rose-400',    // Mar
            'from-pink-500 to-purple-500',  // Apr
            'from-green-400 to-emerald-400',// May
            'from-yellow-400 to-orange-400',// Jun
            'from-orange-500 to-red-500',   // Jul
            'from-red-500 to-pink-500',     // Aug
            'from-amber-500 to-orange-500', // Sep
            'from-orange-600 to-red-600',   // Oct
            'from-red-600 to-rose-600',     // Nov
            'from-blue-600 to-indigo-600'   // Dec
        ];
        return colors[monthId - 1] || 'from-gray-500 to-gray-600';
    };

    return (
        <div className="space-y-3">
            {/* Main Sections Accordion */}
            {mainSections.map((section, index) => {
                const sectionData = analysis?.[section.key];
                if (!sectionData) return null;

                const isOpen = openSection === section.id;

                return (
                    <motion.div
                        key={section.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl border border-gray-700 overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                    >
                        <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full px-6 py-4 flex justify-between items-center hover:bg-white/5 transition-all group"
                        >
                            <span className="flex items-center gap-3">
                                <span className={`text-2xl p-2 rounded-lg bg-gradient-to-br ${section.color} bg-opacity-20 group-hover:scale-110 transition-transform`}>
                                    {section.icon}
                                </span>
                                <span className="text-lg font-bold text-white group-hover:text-brand-gold transition-colors">
                                    {section.title}
                                </span>
                            </span>
                            <motion.span
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                                className="text-brand-gold text-2xl"
                            >
                                ▼
                            </motion.span>
                        </button>

                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-6 py-6 border-t border-gray-700 bg-gray-900/50">
                                        <div className="prose prose-invert max-w-none">
                                            {renderContent(sectionData.content)}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}

            {/* Monthly Forecast Accordion */}
            {
                monthlyData.length > 0 && monthlyData.map((month, index) => {
                    const isOpen = openMonth === month.id;

                    return (
                        <motion.div
                            key={month.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (mainSections.length + index) * 0.05 }}
                            className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl border border-gray-700 overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <button
                                onClick={() => toggleMonth(month.id)}
                                className="w-full px-5 py-4 flex justify-between items-center hover:bg-white/5 transition-all group"
                            >
                                <span className="flex items-center gap-3">
                                    <span className={`text-2xl p-2 rounded-lg bg-gradient-to-br ${getMonthColor(month.id)} bg-opacity-20 group-hover:scale-110 transition-transform`}>
                                        {getMonthIcon(month.id)}
                                    </span>
                                    <div className="text-left">
                                        <span className="text-lg font-bold text-white block group-hover:text-brand-gold transition-colors">
                                            {month.name}
                                        </span>
                                    </div>
                                </span>
                                <motion.span
                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-brand-gold text-xl"
                                >
                                    ▼
                                </motion.span>
                            </button>

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 py-5 border-t border-gray-700 bg-gray-900/50">
                                            <div className="prose prose-invert max-w-none">
                                                {renderContent(month.content)}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })
            }
        </div >
    );
}
