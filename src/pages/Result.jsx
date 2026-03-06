import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import YearFortuneAccordion from '../components/YearFortuneAccordion';
import ResultAccordion from '../components/ResultAccordion';

export default function Result() {
    const location = useLocation();
    const { currentUser } = useAuth();

    // Handle state from router (normal flow) or sessionStorage (Polar redirect flow)
    const [state] = useState(() => {
        let initialState = location.state;
        const urlParams = new URLSearchParams(window.location.search);

        if (!initialState && urlParams.get('payment') === 'success') {
            try {
                const savedState = sessionStorage.getItem('sajuState');
                if (savedState) {
                    initialState = JSON.parse(savedState);
                    // Clear it so refreshing the page doesn't re-trigger a free reading
                    sessionStorage.removeItem('sajuState');
                }
            } catch (e) {
                console.error('Error parsing session state', e);
            }
        }
        return initialState;
    });

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    // Guard against React StrictMode double-invoking the effect (saves history only once)
    const hasSaved = useRef(false);

    const saveReadingToHistory = async (readingData) => {
        if (!currentUser) return;

        try {
            const historyRef = collection(db, 'users', currentUser.uid, 'readings');
            // Exclude 'id' from userData so it doesn't shadow the Firestore doc ID
            // (Daily Fortune passes a profile object that has its own 'id' field)
            const { id: _omit, ...userDataClean } = readingData.userData || {};
            await addDoc(historyRef, {
                ...userDataClean,
                saju: readingData.saju,
                analysis: readingData.analysis,
                createdAt: serverTimestamp(),
                type: readingData.userData.type || 'general',
            });
            console.log('Reading saved to history');
        } catch (err) {
            console.error('Error saving reading to history:', err);
        }
    };

    useEffect(() => {
        if (!state) return;

        const generateAIReading = async () => {
            try {
                setLoading(true);
                setError(null);

                // If viewing from history, just load the saved data
                if (state.fromHistory) {
                    setResult({
                        saju: state.saju,
                        analysis: state.analysis,
                        userData: state,
                    });
                    setLoading(false);
                    return;
                }

                // Production: Prepare data for Cloud Function
                const requestData = {
                    name: state.name,
                    gender: state.gender,
                    birthDate: state.birthDate,
                    birthTime: state.birthTime,
                    birthTimeUnknown: state.birthTimeUnknown,
                    birthType: state.birthType,
                    birthPlace: state.birthPlace,
                    currentResidence: state.currentResidence,
                    focusTopics: state.focusTopics || [],
                    currentSituation: state.currentSituation,
                    type: state.type,
                    // Compatibility specific
                    partnerName: state.partnerName || null,
                    partnerGender: state.partnerGender || null,
                    partnerBirthDate: state.partnerBirthDate || null,
                    partnerBirthTime: state.partnerBirthTime || null,
                    partnerBirthTimeUnknown: state.partnerBirthTimeUnknown || false,
                    partnerBirthType: state.partnerBirthType || null,
                    partnerBirthPlace: state.partnerBirthPlace || null,
                    relationshipType: state.relationshipType || null,
                };

                const functions = getFunctions();
                const generateSajuReading = httpsCallable(functions, 'generateSajuReading');
                const response = await generateSajuReading(requestData);

                if (response.data?.success) {
                    const readingData = {
                        saju: {},
                        analysis: response.data.analysis,
                        userData: state,
                    };

                    setResult(readingData);
                    if (!hasSaved.current) {
                        hasSaved.current = true;
                        await saveReadingToHistory(readingData);
                    }
                } else {
                    throw new Error('Failed to generate reading');
                }
            } catch (err) {
                console.error('Error generating AI reading:', err);
                setError(err?.message || 'Failed to generate reading. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (hasSaved.current) return; // StrictMode guard
        generateAIReading();
    }, [state]);

    // ✅ 캔버스를 A4 페이지 내부 높이(mm)에 맞춰 "px 기준"으로 안정적으로 슬라이스해서 PDF에 추가
    const addCanvasToPdf = (pdf, canvas, { margin }) => {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgWidthMm = pageWidth - margin * 2;
        const innerHeightMm = pageHeight - margin * 2;

        // canvasWidth(px) 가 imgWidthMm(mm) 로 출력될 때의 비율 (px per mm)
        const pxPerMm = canvas.width / imgWidthMm;
        const pageSliceHeightPx = Math.floor(innerHeightMm * pxPerMm);

        let y = 0;
        let isFirstSlice = true;

        while (y < canvas.height) {
            const sliceHeightPx = Math.min(pageSliceHeightPx, canvas.height - y);

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = sliceHeightPx;

            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, y, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

            const imgData = tempCanvas.toDataURL('image/png');
            const sliceHeightMm = sliceHeightPx / pxPerMm;

            if (!isFirstSlice) pdf.addPage();
            pdf.addImage(imgData, 'PNG', margin, margin, imgWidthMm, sliceHeightMm);

            isFirstSlice = false;
            y += sliceHeightPx;
        }
    };

    const downloadPDF = async () => {
        if (isDownloading) return;
        if (!state || !result?.analysis) {
            alert('PDF를 생성할 데이터가 없습니다.');
            return;
        }

        let tempContainer = null;

        try {
            setIsDownloading(true);

            const pdf = new jsPDF('p', 'mm', 'a4');
            const margin = 10;

            // Create a temporary container for rendering
            tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.width = '800px';
            tempContainer.style.backgroundColor = '#ffffff';
            tempContainer.style.color = '#333333';
            tempContainer.style.padding = '40px';
            tempContainer.style.fontFamily = 'Arial, sans-serif';
            document.body.appendChild(tempContainer);

            // Title page
            const titlePage = document.createElement('div');
            titlePage.innerHTML = `
        <div style="text-align:center; padding:100px 20px;">
          <h1 style="font-size:32px; color:#1a1a2e; margin-bottom:20px;">
            ${state.name}'s Saju Reading
          </h1>
          <p style="font-size:16px; color:#666666;">
            Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      `;
            tempContainer.innerHTML = '';
            tempContainer.appendChild(titlePage);

            const titleCanvas = await html2canvas(titlePage, { backgroundColor: '#ffffff', scale: 2, logging: false });
            // jsPDF는 기본으로 첫 페이지가 있으니 거기에 바로 추가
            addCanvasToPdf(pdf, titleCanvas, { margin });

            const sectionsToInclude = [
                'summary',
                'foundation',
                'pillars',
                'personality',
                'career',
                'wealth',
                'relationships',
                'health',
                'timing',
                'actionPlan',
                'customAdvice',
            ];

            for (const sectionId of sectionsToInclude) {
                if (state.type === 'year-fortune' && sectionId === 'personality') continue;

                const section = result.analysis?.[sectionId];
                if (!section) continue;

                pdf.addPage();

                const sectionDiv = document.createElement('div');
                sectionDiv.style.padding = '20px';
                sectionDiv.innerHTML = `
          <h2 style="font-size:24px; color:#1a1a2e; margin-bottom:20px; border-bottom:2px solid #d4af37; padding-bottom:10px;">
            ${section.title ?? sectionId}
          </h2>
          <div style="font-size:14px; line-height:1.8; color:#333333; white-space:pre-wrap;">
            ${(section.content || '')
                        .replace(/\*\*/g, '')
                        .replace(/###/g, '')
                        .replace(/##/g, '')
                    }
          </div>
        `;

                tempContainer.innerHTML = '';
                tempContainer.appendChild(sectionDiv);

                const canvas = await html2canvas(sectionDiv, { backgroundColor: '#ffffff', scale: 2, logging: false });
                addCanvasToPdf(pdf, canvas, { margin });
            }

            // Monthly forecast (year-fortune only)
            if (state.type === 'year-fortune' && result.analysis?.personality?.content) {
                const content = result.analysis.personality.content;
                const months = [];
                const monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ];

                monthNames.forEach((monthName) => {
                    const regex = new RegExp(`\\*\\*${monthName}\\*\\*[\\s:]*([^]*?)(?=\\*\\*(?:January|February|March|April|May|June|July|August|September|October|November|December)\\*\\*|$)`, 'i');
                    const match = content.match(regex);

                    if (match) {
                        months.push({
                            name: monthName,
                            content: match[1].replace(/^\*+:\s*/, '').trim() // Extra safety fallback
                        });
                    }
                });

                if (months.length > 0) {
                    pdf.addPage();

                    const monthlyDiv = document.createElement('div');
                    monthlyDiv.style.padding = '20px';
                    monthlyDiv.innerHTML = `
            <h2 style="font-size:24px; color:#1a1a2e; margin-bottom:20px; border-bottom:2px solid #d4af37; padding-bottom:10px;">
              📅 Monthly Forecast
            </h2>
            <div style="font-size:14px; line-height:1.8; color:#333333;">
              ${months
                            .map((month) => `
                    <div style="margin-bottom:15px;">
                      <strong style="color:#1a1a2e; font-size:16px;">${month.name}</strong>
                      <p style="margin-top:5px; white-space:pre-wrap;">${month.content
                                    .replace(/\*\*/g, '')
                                    .replace(/###/g, '')
                                    .replace(/##/g, '')
                                }</p>
                    </div>
                  `)
                            .join('')}
            </div>
          `;

                    tempContainer.innerHTML = '';
                    tempContainer.appendChild(monthlyDiv);

                    const monthlyCanvas = await html2canvas(monthlyDiv, { backgroundColor: '#ffffff', scale: 2, logging: false });
                    addCanvasToPdf(pdf, monthlyCanvas, { margin });
                }
            }

            pdf.save(`${state.name}_Saju_Reading_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('Error generating PDF:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            if (tempContainer && document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer);
            }
            setIsDownloading(false);
        }
    };

    if (!state) {
        return (
            <div className="min-h-screen bg-brand-dark flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl text-white mb-4">Access Denied</h2>
                    <p className="text-gray-400 mb-6">Please start a reading first.</p>
                    <Link to="/" className="bg-brand-gold text-brand-dark px-6 py-3 rounded hover:bg-yellow-500 transition-colors">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-gold mb-4"></div>
                <p className="text-brand-gold text-lg">AI Saju Expert is analyzing your destiny...</p>
                <p className="text-gray-400 text-sm mt-2">This may take 10-30 seconds</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4">
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-md">
                    <h2 className="text-red-400 text-xl font-bold mb-4">Analysis Error</h2>
                    <p className="text-gray-300 mb-6">{error}</p>
                    <Link to="/" className="bg-brand-gold text-brand-dark px-6 py-2 rounded hover:bg-yellow-500 transition-colors">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-dark via-gray-900 to-brand-dark py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-brand-gold mb-2">{state.name}'s Destiny Reading</h1>
                    <p className="text-gray-400 text-sm">
                        Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>

                    <button
                        onClick={downloadPDF}
                        disabled={isDownloading || !result?.analysis}
                        className="mt-4 bg-brand-gold text-brand-dark px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                    >
                        {isDownloading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-dark border-t-transparent"></div>
                                Generating PDF...
                            </>
                        ) : (
                            <>Download PDF Report</>
                        )}
                    </button>
                </motion.div>

                <div className="bg-gray-800 rounded-lg p-8 md:p-12 shadow-2xl border border-gray-700">
                    {state.type === 'year-fortune' ? (
                        <YearFortuneAccordion analysis={result?.analysis} />
                    ) : (
                        <ResultAccordion analysis={result?.analysis} type={state.type} />
                    )}
                </div>

                <div className="flex justify-center mt-8">
                    <Link to="/" className="bg-gray-700 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors">
                        🏠 Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
}