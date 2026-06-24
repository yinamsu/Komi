// KOMICARE Core Application Script

// ==========================================
// Language Initialization (must run first)
// ==========================================
function initLanguage() {
    let savedLang = 'en';
    try {
        savedLang = localStorage.getItem('komicare-lang');
    } catch (e) { /* ignore */ }
    if (!savedLang) {
        savedLang = (navigator.language && navigator.language.startsWith('ko')) ? 'ko' : 'en';
    }
    setLanguage(savedLang);

    // Bind click events to language switcher buttons
    const langSwitcher = document.getElementById('langSwitcher');
    if (langSwitcher) {
        langSwitcher.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.getAttribute('data-lang');
                setLanguage(lang);
            });
        });
    }
}

function initApp() {
    initLanguage();      // Language first
    initQuiz();
    initReceiptMasker();
    initReader();
    initTheme();
    loadClinics();
    initClinicDetailModal();
    initSearchAndFilters();
    initReviewWriter();
}

document.addEventListener('DOMContentLoaded', initApp);

// ==========================================
// 1. Fitzpatrick Quiz Diagnostic Engine
// ==========================================

let activeClinicId = null;

let quizData = {
    step: 1,
    scores: {
        tone: 0,
        reaction: 0,
        tanning: 0
    },
    email: '',
    fitzpatrickType: null
};

// Skin details and warning parameters based on calculated Fitzpatrick Type
const fitzpatrickProfiles = {
    1: {
        name: "Fitzpatrick Type I (Pale White / Fair)",
        behavior: "Always burns, never tans. High freckling.",
        lasers: "Gentle custom energy settings only. High risk with standard fractional lasers.",
        warning: "EXTREME BURN & REDNESS RISK. Mass-market factory settings are calibrated for East Asian skin (Type III-IV). Firing these high-intensity settings on Type I skin will easily cook your skin barrier, causing chronic redness, blistering, or scarring. You must demand lower fluence and longer pulse durations."
    },
    2: {
        name: "Fitzpatrick Type II (Fair / Light Blond)",
        behavior: "Burns easily, tans minimally. Highly sensitive.",
        lasers: "Requires customized pulse duration. Safe with specialized vascular/pigment lasers under low settings.",
        warning: "HIGH BURN & BARRIER DAMAGE RISK. Standard 'Seoul Factory' preset settings will likely cause severe laser redness or micro-scarring on Type II skin. Doctor-Direct consultation is mandatory to manually calibrate the energy output, instead of letting a technician use automated presets."
    },
    3: {
        name: "Fitzpatrick Type III (Beige / Olive-tinted)",
        behavior: "Burns moderately, tans gradually to light brown.",
        lasers: "Requires careful calibration for pigment rebound. Moderate risk of post-inflammatory hyperpigmentation (PIH).",
        warning: "MODERATE PIGMENT REBOUND RISK. While Type III skin is more resilient, factory chains operating on 15-minute cycles will rush through settings. This often triggers rebound melasma or PIH. Ensure the clinic uses genuine tips and EMR logging to track parameters."
    },
    4: {
        name: "Fitzpatrick Type IV (Light Brown / Olive)",
        behavior: "Burns minimally, tans easily to moderate brown.",
        lasers: "Medium-risk pigment reactivity. Requires Nd:YAG or fractional devices set with conservative fluences.",
        warning: "PIH (HYPERPIGMENTATION) RISK. Standard settings intended for lighter skin can trigger massive melanin responses in Type IV skin, leading to dark patches that take months to clear. The doctor must check your active tan state and adjust cooling parameters accordingly."
    },
    5: {
        name: "Fitzpatrick Type V (Dark Brown)",
        behavior: "Rarely burns, tans easily to dark brown.",
        lasers: "ND:YAG laser only for hair removal/toning. Standard IPL or Alex lasers are highly contraindicated.",
        warning: "SEVERE HYPERPIGMENTATION & BURN RISK. Type V skin has highly active melanin. Factory clinics using standard Alexandrite or IPL wavelengths will literally cook the epidermis because the laser cannot differentiate between hair/pigment and the surrounding skin. Safe treatment requires a specialized Nd:YAG laser."
    },
    6: {
        name: "Fitzpatrick Type VI (Deeply Pigmented Black)",
        behavior: "Never burns, deeply pigmented.",
        lasers: "Nd:YAG laser with long pulse width only. Cooling mechanism must be set to maximum.",
        warning: "CRITICAL MELANIN REACTIVITY WARNING. Factory-style chains are highly dangerous for Type VI skin. Standard laser settings will result in permanent pigment loss (hypopigmentation white spots) or severe chemical burns. You must select clinics that possess specific Nd:YAG hardware and long-pulse calibration track records."
    }
};

function initQuiz() {
    const optionButtons = document.querySelectorAll('.quiz-option');
    const nextButtons = document.querySelectorAll('.quiz-next-btn');
    const progressFill = document.querySelector('.quiz-progress-fill');
    const progressText = document.querySelector('.quiz-progress-text');
    const leadForm = document.getElementById('leadForm');

    // Handle Option Selection
    optionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const stepId = button.getAttribute('data-step');
            const scoreVal = parseInt(button.getAttribute('data-score'));
            const questionType = button.getAttribute('data-type');

            // Toggle active selection styling
            document.querySelectorAll(`.quiz-option[data-type="${questionType}"]`).forEach(btn => {
                btn.classList.remove('selected');
            });
            button.classList.add('selected');

            // Save Score
            quizData.scores[questionType] = scoreVal;

            // Automatically advance after a short delay for smooth UX
            setTimeout(() => {
                advanceStep(parseInt(stepId) + 1);
            }, 300);
        });
    });

    // Lead Form Submit
    if (leadForm) {
        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('userEmail');
            const submitBtn = leadForm.querySelector('button[type="submit"]');
            
            // Compute Fitzpatrick Score
            calculateFitzpatrick();
            
            // Save email state
            quizData.email = emailInput.value;

            // Loading state UI
            const originalBtnContent = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner">Securing Connection...</span> ⏳';

            let shouldOpenModal = false;

            try {
                // Point securely to the serverless Vercel function API
                const response = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: quizData.email,
                        fitzpatrickType: quizData.fitzpatrickType
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Server error occurred.');
                }

                console.log("Waitlist success:", result.message);
                shouldOpenModal = true;

            } catch (error) {
                alert(`Subscription Status: ${error.message}`);
                // If email already registered, open the handbook anyway to prevent user dropoff
                if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already waitlisted')) {
                    shouldOpenModal = true;
                }
            } finally {
                // Restore button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
                
                // Transition to Result Screen
                showResults();

                // Open ebook modal immediately on success / duplicate check
                if (shouldOpenModal) {
                    openReaderModal();
                }
            }
        });
    }
}

function advanceStep(nextStep) {
    if (nextStep > 3) return; // Wait for form submit on step 3

    quizData.step = nextStep;
    
    // Hide all steps, show current
    document.querySelectorAll('.quiz-step').forEach(stepDiv => {
        stepDiv.classList.remove('active');
    });
    
    const nextStepDiv = document.getElementById(`quiz-step-${nextStep}`);
    if (nextStepDiv) {
        nextStepDiv.classList.add('active');
    }

    // Update Progress Bar
    const progressFill = document.querySelector('.quiz-progress-fill');
    const progressText = document.querySelector('.quiz-progress-text');
    if (progressFill && progressText) {
        const pct = (nextStep / 3) * 100;
        progressFill.style.width = `${pct}%`;
        progressText.textContent = `Step ${nextStep} of 3`;
    }
}

function calculateFitzpatrick() {
    const totalScore = quizData.scores.tone + quizData.scores.reaction + quizData.scores.tanning;
    
    // Proportional mapping based on a max score of 14:
    // Type 1: 0-2 pts
    // Type 2: 3-4 pts
    // Type 3: 5-7 pts
    // Type 4: 8-10 pts
    // Type 5: 11-12 pts
    // Type 6: 13-14 pts
    if (totalScore <= 2) {
        quizData.fitzpatrickType = 1;
    } else if (totalScore <= 4) {
        quizData.fitzpatrickType = 2;
    } else if (totalScore <= 7) {
        quizData.fitzpatrickType = 3;
    } else if (totalScore <= 10) {
        quizData.fitzpatrickType = 4;
    } else if (totalScore <= 12) {
        quizData.fitzpatrickType = 5;
    } else {
        quizData.fitzpatrickType = 6;
    }
}

function showResults() {
    // Hide Quiz content, show Results
    const quizArea = document.getElementById('quiz-setup');
    const resultsArea = document.getElementById('quiz-results');
    
    if (quizArea && resultsArea) {
        quizArea.style.display = 'none';
        resultsArea.style.display = 'block';
        resultsArea.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Update result display
        const profile = fitzpatrickProfiles[quizData.fitzpatrickType];
        
        document.getElementById('res-type-title').textContent = profile.name;
        document.getElementById('res-behavior').textContent = profile.behavior;
        document.getElementById('res-lasers').textContent = profile.lasers;
        document.getElementById('res-warning').innerHTML = `<strong>🛡️ Fitzpatrick ${quizData.fitzpatrickType} Safety Advisory:</strong><p>${profile.warning}</p>`;

        // Update visual color bar
        document.querySelectorAll('.scale-segment').forEach(seg => {
            seg.classList.remove('active');
        });
        const activeSegment = document.querySelector(`.scale-segment.type-${quizData.fitzpatrickType}`);
        if (activeSegment) {
            activeSegment.classList.add('active');
        }
    }
}

// Restart Quiz
window.restartQuiz = function() {
    quizData = {
        step: 1,
        scores: { tone: 0, reaction: 0, tanning: 0 },
        email: '',
        fitzpatrickType: null
    };

    // Reset Quiz selection styling
    document.querySelectorAll('.quiz-option').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Reset Form input
    const emailInput = document.getElementById('userEmail');
    if (emailInput) emailInput.value = '';

    // Show step 1
    document.getElementById('quiz-setup').style.display = 'block';
    document.getElementById('quiz-results').style.display = 'none';
    advanceStep(1);
};


// ==========================================
// 2. Receipt Masking Demo Controller
// ==========================================

function initReceiptMasker() {
    const maskBtn = document.getElementById('btnMaskReceipt');
    const receiptWrap = document.getElementById('receiptMockup');

    if (maskBtn && receiptWrap) {
        maskBtn.addEventListener('click', () => {
            const isMasked = receiptWrap.classList.toggle('masked');
            
            if (isMasked) {
                maskBtn.textContent = '🔒 Unmask Mock Data';
                maskBtn.style.backgroundColor = 'var(--color-success)';
                // Visual indicators
                document.getElementById('mask-status-badge').textContent = '✅ Secure Client-Side Masking Active';
                document.getElementById('mask-status-badge').style.color = 'var(--color-success)';
            } else {
                maskBtn.textContent = '🛡️ Simulate Tax Refund Masking';
                maskBtn.style.backgroundColor = 'var(--color-primary)';
                document.getElementById('mask-status-badge').textContent = '⚠️ Unmasked Plaintext Data Exists';
                document.getElementById('mask-status-badge').style.color = 'var(--color-danger)';
            }
        });
    }
}


// ==========================================
// 3. E-Book Reader Modal controller
// ==========================================

let currentChapter = 1;
const totalChapters = 4;

function initReader() {
    const openBtn = document.getElementById('btnOpenReader');
    const openBtnResults = document.getElementById('btnOpenReaderResults');
    const closeBtn = document.getElementById('btnCloseReader');
    const modal = document.getElementById('readerModal');
    
    // Open Dialog
    if (openBtn) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openReaderModal();
        });
    }
    if (openBtnResults) {
        openBtnResults.addEventListener('click', (e) => {
            e.preventDefault();
            openReaderModal();
        });
    }

    // Close Dialog
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeReaderModal();
        });
    }

    // Modal Background click to close
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeReaderModal();
            }
        });
    }

    // Sidebar navigation buttons
    const tocButtons = document.querySelectorAll('.reader-toc-btn');
    tocButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetCh = parseInt(button.getAttribute('data-ch'));
            setChapter(targetCh);
        });
    });

    // Bottom Navigation Buttons
    const prevBtn = document.getElementById('reader-prev-btn');
    const nextBtn = document.getElementById('reader-next-btn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentChapter > 1) {
                setChapter(currentChapter - 1);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentChapter < totalChapters) {
                setChapter(currentChapter + 1);
            } else {
                closeReaderModal();
            }
        });
    }
}

function openReaderModal() {
    const modal = document.getElementById('readerModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Stop page scroll
        setChapter(1);
    }
}

function closeReaderModal() {
    const modal = document.getElementById('readerModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore page scroll
    }
}

function setChapter(chNum) {
    currentChapter = chNum;

    // Toggle active sidebar buttons
    document.querySelectorAll('.reader-toc-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeTocBtn = document.querySelector(`.reader-toc-btn[data-ch="${chNum}"]`);
    if (activeTocBtn) {
        activeTocBtn.classList.add('active');
    }

    // Toggle active chapter content panels
    document.querySelectorAll('.reader-page').forEach(page => {
        page.classList.remove('active');
    });
    const activePage = document.getElementById(`reader-page-${chNum}`);
    if (activePage) {
        activePage.classList.add('active');
        // Scroll reader content to top
        document.querySelector('.reader-main').scrollTop = 0;
    }

    // Update Bottom Navigation Button states
    const prevBtn = document.getElementById('reader-prev-btn');
    const nextBtn = document.getElementById('reader-next-btn');

    if (prevBtn && nextBtn) {
        prevBtn.disabled = (chNum === 1);
        if (chNum === totalChapters) {
            nextBtn.innerHTML = 'Finish & Close ✓';
        } else {
            nextBtn.innerHTML = 'Next &rarr;';
        }
    }
}

// Checklist Item toggler inside E-book
window.toggleChecklistItem = function(elem) {
    elem.classList.toggle('checked');
};

// Clipboard copying for checklist
window.copySafetyChecklist = function() {
    const checklistText = `--- THE K-BEAUTY 5 CRITICAL SAFETY QUESTIONS ---
Ask the dermatologist these five questions before allowing a laser to touch your face:

Q1. Doctor-Direct Consultation:
"Will the doctor who is consulting me right now be the exact same person performing the laser procedure?" (Exposes "Shadow Doctor" switches).

Q2. Fitzpatrick-Specific Customization:
"Based on my specific Fitzpatrick skin type, what exact wavelength and pulse duration settings are you using to avoid PIH or burns?" (Tests their medical expertise vs. factory presets).

Q3. Genuine Tips Verification:
"Can you show me the genuine, single-use tip (정품팁) packaging and the device's activation log before we start?" (Prevents the use of illegal, reloaded, or counterfeit tips).

Q4. Side-Effect Protocols:
"What is your clinic's immediate medical protocol and emergency contact if I experience an adverse reaction or burn after I leave?" (Ensures they have a safety net, not just a sales goal).

Q5. Practitioner Assignment & Track Record:
"Can I see the specific track record or portfolio of this doctor's experience with Western skin types?" (Verifies the practitioner's skill, not just the clinic's brand name).`;

    navigator.clipboard.writeText(checklistText).then(() => {
        const copyBtn = document.getElementById('btnCopyChecklist');
        if (copyBtn) {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✨ Copied to Clipboard!';
            copyBtn.style.backgroundColor = 'var(--color-success)';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.backgroundColor = 'var(--color-secondary)';
            }, 2500);
        }
    }).catch(err => {
        alert('Failed to copy checklist to clipboard. Please copy manually.');
    });
};

// ==========================================
// 4. Dark/Light Mode Theme controller
// ==========================================

function initTheme() {
    const themeSwitcher = document.getElementById('themeSwitcher');
    if (!themeSwitcher) return;

    const themeButtons = themeSwitcher.querySelectorAll('.theme-btn');
    
    // Get saved theme or fallback to 'system'
    const savedTheme = localStorage.getItem('komicare-theme') || 'system';
    
    // Set initial state
    applyTheme(savedTheme);

    // Bind click events
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedTheme = btn.getAttribute('data-theme');
            applyTheme(selectedTheme);
        });
    });

    // Listen for system theme changes dynamically
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const currentStored = localStorage.getItem('komicare-theme') || 'system';
        if (currentStored === 'system') {
            applyTheme('system');
        }
    });
}

function applyTheme(theme) {
    const htmlEl = document.documentElement;
    const themeSwitcher = document.getElementById('themeSwitcher');
    
    // Toggle HTML attributes explicitly to resolve forced browser overrides
    if (theme === 'light') {
        htmlEl.setAttribute('data-theme', 'light');
        localStorage.setItem('komicare-theme', 'light');
    } else if (theme === 'dark') {
        htmlEl.setAttribute('data-theme', 'dark');
        localStorage.setItem('komicare-theme', 'dark');
    } else {
        // System Settings: explicitly calculate and apply the class
        const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemIsDark) {
            htmlEl.setAttribute('data-theme', 'dark');
        } else {
            htmlEl.setAttribute('data-theme', 'light');
        }
        localStorage.setItem('komicare-theme', 'system');
        
        // Update switcher active button to system
        if (themeSwitcher) {
            themeSwitcher.querySelectorAll('.theme-btn').forEach(btn => {
                if (btn.getAttribute('data-theme') === 'system') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
        return;
    }

    // Update active button state for explicit light/dark
    if (themeSwitcher) {
        themeSwitcher.querySelectorAll('.theme-btn').forEach(btn => {
            if (btn.getAttribute('data-theme') === theme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

// ==========================================
// 5. Clinic Detail Modal Controller & Data
// ==========================================

const clinicDetails = {
    1: {
        name: "Cheongdam Barrier Lab",
        location: "📍 Cheongdam-dong, Gangnam",
        rating: "⭐ 4.9 (120+ verified reviews)",
        description: "Specialized in non-invasive skin barrier recovery and pigmentation lasers for sensitive skin types. Known for ultra-conservative energy calibration and genuine, certified tips.",
        specialties: ["Nd:YAG Laser Calibrations", "Skin Barrier Reconstruction", "Pico Toning"],
        doctor_name: "Dr. Ji-Yeon Lee",
        doctor_avatar: "JY",
        doctor_title: "Board-Certified Dermatologist | Nd:YAG Specialist",
        doctor_bio: "Dr. Lee has over 12 years of clinical dermatology experience, specializing in lasers for thin and reactive skin barriers. She is a recognized speaker on Nd:YAG customization.",
        hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 4:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.5702213797686!2d127.04277717646549!3d37.5239169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca40f2f3d6dbf%3A0xe54ebad41a5d6f1!2sCheongdam-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035000000!5m2!1sen!2skr",
        slots_tag: "Max 3 Bookings/Hr",
        doctor_type: "dermatologist",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: true,
        foreigner_insurance: true,
        excellent_aftercare: true
    },
    2: {
        name: "Myeongdong Forest Dermatology",
        location: "📍 Myeong-dong, Jung-gu",
        rating: "⭐ 4.8 (94+ verified reviews)",
        description: "A tranquil sanctuary clinic in the heart of Myeongdong, prioritizing barrier safety over factory treatments. Enforces a strict maximum of 2 patient bookings per hour.",
        specialties: ["Vascular Laser Calibration", "Rosacea & Redness Recovery", "Ultrasonic Rejuvenation"],
        doctor_name: "Dr. Minji Kim",
        doctor_avatar: "MK",
        doctor_title: "Board-Certified Dermatologist | Barrier Recovery",
        doctor_bio: "Dr. Kim founded Myeongdong Forest to offer custom medical treatments for international travelers who frequently experience barrier breakdown due to travel and climate changes.",
        hours: "Mon, Wed, Thu: 10:00 AM - 8:00 PM (Night Clinic) | Tue, Fri: 10:00 AM - 7:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3162.7766579299496!2d126.9805952764673!3d37.56152017203678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca2f42a59e9a9%3A0x6b6df7d6b8b0e8c0!2sMyeong-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035100000!5m2!1sen!2skr",
        slots_tag: "Max 2 Bookings/Hr",
        doctor_type: "dermatologist",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: true,
        foreigner_insurance: true,
        excellent_aftercare: true
    },
    3: {
        name: "Hannam Aesthetic & Laser House",
        location: "📍 Hannam-dong, Yongsan",
        rating: "⭐ 4.9 (78+ verified reviews)",
        description: "Boutique clinic catering to embassies and expats in Hannam. Equipped with premium dual-cooling laser systems and offering customized wavelength diagnostics.",
        specialties: ["1:1 Wavelength Tuning", "Dual-Cooling Safety Protocols", "High-Fluence Pigment Management"],
        doctor_name: "Dr. Tae-Young Park",
        doctor_avatar: "TP",
        doctor_title: "Board-Certified Dermatologist | Custom Wavelengths",
        doctor_bio: "Dr. Park completed his fellowship at Seoul National University Hospital. He speaks fluent English and is dedicated to making laser treatments safe for diverse Fitzpatrick skin types.",
        hours: "Tue - Fri: 11:00 AM - 8:00 PM | Sat: 10:00 AM - 5:00 PM | Sun, Mon: Closed",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.7854653738096!2d127.00693597646618!3d37.53429397204558!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3b98d24ebf5%3A0xefdf5a3c94248a0!2sHannam-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035200000!5m2!1sen!2skr",
        slots_tag: "Max 3 Bookings/Hr",
        doctor_type: "specialist",
        sleep_anesthesia: true,
        anesthesiologist_resident: true,
        foreign_attraction_registered: true,
        foreigner_insurance: true,
        excellent_aftercare: false
    },
    4: {
        name: "Sinsa Glow Dermatology",
        location: "📍 Sinsa-dong, Gangnam",
        rating: "⭐ 4.7 (112+ verified reviews)",
        description: "Specializing in advanced anti-aging treatments with verified genuine consumables logging. We provide every patient with their single-use tip certificate and serial code.",
        specialties: ["Genuine Consumables Logged", "Ultherapy & Shurink custom setups", "Epidermal Thickness Diagnostic"],
        doctor_name: "Dr. Seo-Jun Choi",
        doctor_avatar: "SC",
        doctor_title: "Board-Certified Dermatologist | Anti-Aging Specialist",
        doctor_bio: "Dr. Choi is an expert in non-surgical lifting. He developed Sinsa Glow's 'Barrier First' lifting protocol to prevent post-treatment nerve complications and excessive swelling.",
        hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 9:30 AM - 3:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.282583827618!2d127.01859527646562!3d37.518698972050546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3e7e00dfb39%3A0xf675dfb3c58b0e8c!2sSinsa-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035300000!5m2!1sen!2skr",
        slots_tag: "Max 2 Bookings/Hr",
        doctor_type: "dermatologist",
        sleep_anesthesia: true,
        anesthesiologist_resident: false,
        foreign_attraction_registered: true,
        foreigner_insurance: false,
        excellent_aftercare: false
    },
    5: {
        name: "Hongdae Calm Skin Clinic",
        location: "📍 Seokyo-dong, Mapo-gu",
        rating: "⭐ 4.8 (85+ verified reviews)",
        description: "A trendy but medically rigorous clinic in Hongdae. Focuses on laser toning and vascular treatments for younger global patients with absolute physician presence.",
        specialties: ["Nd:YAG & Pico Laser Certified", "100% Physician Consultation", "Youth Acne Barrier Healing"],
        doctor_name: "Dr. Eun-Ji Song",
        doctor_avatar: "ES",
        doctor_title: "Board-Certified Dermatologist | Pigmentation Expert",
        doctor_bio: "Dr. Song is highly recognized for her gentle, layered laser approach. She rejects rapid 'one-size-fits-all' laser protocols, allocating 30+ minutes per patient treatment.",
        hours: "Mon, Tue, Fri: 10:00 AM - 7:00 PM | Thu: 10:00 AM - 9:00 PM (Night Clinic) | Sat: 10:00 AM - 4:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.0903332467554!2d126.91929527646698!3d37.5541201720392!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357c98da5f87b8b5%3A0x6b6df7d6b8b0e8c0!2sSeogyo-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035400000!5m2!1sen!2skr",
        slots_tag: "Max 4 Bookings/Hr",
        doctor_type: "gp",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: false,
        foreigner_insurance: true,
        excellent_aftercare: false
    }
};

let loadedClinicsGlobal = [];

async function loadClinics() {
    try {
        const response = await fetch('/api/clinics');
        const result = await response.json();
        
        if (result && result.success && result.clinics) {
            loadedClinicsGlobal = result.clinics;
            // Sync Supabase clinic schemas into local mapping variable
            result.clinics.forEach(c => {
                clinicDetails[c.id] = c;
            });
            renderClinicCards(result.clinics);
        } else {
            throw new Error("Failed to parse clinics API payload");
        }
    } catch (error) {
        console.warn("API clinics load failed, loading front-end local database fallback:", error);
        // Render from local fallback
        const fallbackArray = Object.keys(clinicDetails).map(key => ({
            id: parseInt(key),
            ...clinicDetails[key]
        }));
        loadedClinicsGlobal = fallbackArray;
        renderClinicCards(fallbackArray);
    }
}

function renderClinicCards(clinics) {
    const container = document.getElementById('dynamic-partner-list');
    if (!container) return;

    if (!clinics || clinics.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 40px; color: var(--text-muted); width: 100%;">
                ⚠️ No verified boutique clinics available at the moment.
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    clinics.forEach(clinic => {
        const specs = Array.isArray(clinic.specialties) ? clinic.specialties : [];
        const tagsHTML = specs.map(spec => `<span class="partner-tag">${spec}</span>`).join('');
        
        // Grab numeric rating only (e.g. "4.9")
        const ratingVal = clinic.rating.includes('(') ? clinic.rating.split(' ')[1] : clinic.rating.replace('⭐', '').trim();

        // Safety Badges Localized
        let doctorTypeLabel = '';
        let doctorTypeClass = '';
        if (clinic.doctor_type === 'dermatologist') {
            doctorTypeLabel = (typeof t === 'function') ? t('badge.dermatologist') : 'Board-Certified Dermatologist';
            doctorTypeClass = 'badge-dermatologist';
        } else if (clinic.doctor_type === 'specialist') {
            doctorTypeLabel = (typeof t === 'function') ? t('badge.specialist') : 'Specialist';
            doctorTypeClass = 'badge-specialist';
        } else {
            doctorTypeLabel = (typeof t === 'function') ? t('badge.gp') : 'General Practitioner';
            doctorTypeClass = 'badge-gp';
        }

        let anesthesiaLabel = '';
        let anesthesiaClass = '';
        if (clinic.sleep_anesthesia) {
            if (clinic.anesthesiologist_resident) {
                anesthesiaLabel = (typeof t === 'function') ? t('badge.anesthesiologist') : 'Anesthesiologist Residing';
                anesthesiaClass = 'badge-anesthesiologist';
            } else {
                anesthesiaLabel = (typeof t === 'function') ? t('badge.no_anesthesiologist') : 'Local Anesthesia Only';
                anesthesiaClass = 'badge-no_anesthesiologist';
            }
        }

        const safetyBadgesHTML = `
            <span class="safety-badge ${doctorTypeClass}">${doctorTypeLabel}</span>
            ${anesthesiaLabel ? `<span class="safety-badge ${anesthesiaClass}">${anesthesiaLabel}</span>` : ''}
            ${clinic.foreign_attraction_registered ? `<span class="safety-badge badge-registered">${(typeof t === 'function') ? t('badge.foreign_attraction') : 'Registered Attraction Clinic'}</span>` : ''}
            ${clinic.foreigner_insurance ? `<span class="safety-badge badge-insurance">${(typeof t === 'function') ? t('badge.foreigner_insurance') : 'Foreigner Liability Insured'}</span>` : ''}
            ${clinic.excellent_aftercare ? `<span class="safety-badge badge-aftercare">★ ${(typeof t === 'function') ? t('badge.aftercare_excellence') : 'Excellent Aftercare Selected'}</span>` : ''}
        `;

        const cardHTML = `
            <div class="partner-card" data-clinic-id="${clinic.id}">
                <div class="partner-top">
                    <div class="partner-info">
                        <h4>${clinic.name}</h4>
                        <span class="partner-location">${clinic.location}</span>
                    </div>
                    <div class="partner-rating">
                        <span>⭐ ${ratingVal}</span>
                    </div>
                </div>
                <div class="partner-tags">
                    ${tagsHTML}
                    <span class="partner-tag slots">${clinic.slots_tag}</span>
                </div>
                <div class="safety-badges-row">
                    ${safetyBadgesHTML}
                </div>
                <div class="partner-doctors">
                    <div class="doctor-profile">
                        <div class="doctor-avatar">${clinic.doctor_avatar}</div>
                        <div class="doctor-meta">
                            <h5>${clinic.doctor_name}</h5>
                            <p>${clinic.doctor_title}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function openClinicDetailModal(clinicId) {
    const data = clinicDetails[clinicId];
    if (!data) return;

    activeClinicId = clinicId;

    // Reset views inside booking wizard
    resetBookingViews();

    // Populate text details
    document.getElementById('clinic-detail-name').textContent = data.name;
    document.getElementById('clinic-detail-location').textContent = data.location;
    document.getElementById('clinic-detail-rating').textContent = data.rating;
    document.getElementById('clinic-detail-desc').textContent = data.description;
    document.getElementById('clinic-detail-hours').textContent = data.hours;

    // Populate Specialties tags
    const specialtiesContainer = document.getElementById('clinic-detail-specialties');
    specialtiesContainer.innerHTML = '';
    const specs = Array.isArray(data.specialties) ? data.specialties : [];
    specs.forEach(spec => {
        const tag = document.createElement('span');
        tag.className = 'partner-tag';
        tag.textContent = spec;
        specialtiesContainer.appendChild(tag);
    });

    // Populate Safety Details Grid
    const safetyContainer = document.getElementById('clinic-detail-safety-grid');
    if (safetyContainer) {
        safetyContainer.innerHTML = '';
        
        let doctorTypeLabel = '';
        if (data.doctor_type === 'dermatologist') {
            doctorTypeLabel = (typeof t === 'function') ? t('badge.dermatologist') : 'Board-Certified Dermatologist';
        } else if (data.doctor_type === 'specialist') {
            doctorTypeLabel = (typeof t === 'function') ? t('badge.specialist') : 'Specialist';
        } else {
            doctorTypeLabel = (typeof t === 'function') ? t('badge.gp') : 'General Practitioner';
        }

        const items = [
            { label: doctorTypeLabel, active: true },
            { label: data.sleep_anesthesia ? (data.anesthesiologist_resident ? ((typeof t === 'function') ? t('badge.anesthesiologist') : 'Anesthesiologist Residing') : ((typeof t === 'function') ? t('badge.no_anesthesiologist') : 'Local Anesthesia Only')) : ((typeof t === 'function') ? t('badge.no_anesthesiologist') : 'Local Anesthesia Only'), active: data.sleep_anesthesia },
            { label: (typeof t === 'function') ? t('badge.foreign_attraction') : 'Registered Attraction Clinic', active: data.foreign_attraction_registered },
            { label: (typeof t === 'function') ? t('badge.foreigner_insurance') : 'Foreigner Liability Insured', active: data.foreigner_insurance },
            { label: (typeof t === 'function') ? t('badge.aftercare_excellence') : 'Excellent Aftercare Selected', active: data.excellent_aftercare }
        ];

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'safety-detail-item';
            div.innerHTML = `
                <span class="safety-check-icon ${item.active ? 'active' : 'inactive'}">${item.active ? '✅' : '❌'}</span>
                <span>${item.label}</span>
            `;
            safetyContainer.appendChild(div);
        });
    }

    // Populate Doctor Info
    document.getElementById('clinic-detail-doc-avatar').textContent = data.doctor_avatar;
    document.getElementById('clinic-detail-doc-name').textContent = data.doctor_name;
    document.getElementById('clinic-detail-doc-title').textContent = data.doctor_title;
    document.getElementById('clinic-detail-doc-bio').textContent = data.doctor_bio;

    // Load Map Iframe
    const mapIframe = document.getElementById('clinic-detail-map-iframe');
    if (mapIframe) {
        mapIframe.src = data.map_iframe;
    }

    // Set today as minimum on date picker
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }

    // Open Modal
    const modal = document.getElementById('clinicModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function resetBookingViews() {
    const mapView = document.getElementById('clinic-map-view');
    const bookingView = document.getElementById('clinic-booking-view');
    const bookingSuccess = document.getElementById('booking-success-view');
    const bookingForm = document.getElementById('clinicBookingForm');

    if (mapView && bookingView && bookingSuccess && bookingForm) {
        mapView.classList.add('active');
        bookingView.classList.remove('active');
        bookingSuccess.style.display = 'none';
        bookingForm.style.display = 'block';
        bookingForm.reset();
    }
}

function initClinicDetailModal() {
    const container = document.getElementById('dynamic-partner-list');
    const modal = document.getElementById('clinicModal');
    const closeBtn = document.getElementById('btnCloseClinic');

    // Switchers
    const btnShowBookingForm = document.getElementById('btnShowBookingForm');
    const btnBackToMap = document.getElementById('btnBackToMap');
    const btnResetBookingModal = document.getElementById('btnResetBookingModal');

    // Form
    const bookingForm = document.getElementById('clinicBookingForm');

    if (!modal) return;

    // 1. Event Delegation for Clinic list clicks
    if (container) {
        container.addEventListener('click', (e) => {
            const card = e.target.closest('.partner-card');
            if (card) {
                const clinicId = card.getAttribute('data-clinic-id');
                openClinicDetailModal(clinicId);
            }
        });
    }

    // 2. View switch actions
    if (btnShowBookingForm) {
        btnShowBookingForm.addEventListener('click', () => {
            document.getElementById('clinic-map-view').classList.remove('active');
            document.getElementById('clinic-booking-view').classList.add('active');
        });
    }

    if (btnBackToMap) {
        btnBackToMap.addEventListener('click', () => {
            resetBookingViews();
        });
    }

    if (btnResetBookingModal) {
        btnResetBookingModal.addEventListener('click', () => {
            resetBookingViews();
        });
    }

    // 3. Form Submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            const originalBtnContent = submitBtn.innerHTML;

            const clientName = document.getElementById('bookingName').value;
            const clientEmail = document.getElementById('bookingEmail').value;
            const bookingDate = document.getElementById('bookingDate').value;
            const bookingTime = document.getElementById('bookingTime').value;
            const treatment = document.getElementById('bookingTreatment').value;

            // Loader state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner">Securing Slot...</span> ⏳';

            try {
                const response = await fetch('/api/book', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        clinicId: activeClinicId,
                        clientName,
                        clientEmail,
                        bookingDate,
                        bookingTime,
                        treatment
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Server error occurred.');
                }

                // Show Success Screen
                bookingForm.style.display = 'none';
                const successView = document.getElementById('booking-success-view');
                const successMsg = document.getElementById('booking-success-message');

                const clinicNameStr = clinicDetails[activeClinicId]?.name || 'the clinic';
                successMsg.innerHTML = `We have successfully reserved your premium 1:1 consultation slot with <strong>${clinicNameStr}</strong> on <strong>${bookingDate}</strong> at <strong>${bookingTime}</strong>.<br><br>🔒 Secure Receipt Code: <code>${result.bookingId}</code>. A confirmation receipt has been dispatched to <strong>${clientEmail}</strong>.`;
                successView.style.display = 'block';

            } catch (error) {
                alert(`Booking Error: ${error.message}`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
            }
        });
    }

    // 4. Close Modal Handlers
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeClinicModal();
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeClinicModal();
        }
    });
}

function closeClinicModal() {
    const modal = document.getElementById('clinicModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Clear map iframe to stop CPU footprint
        const mapIframe = document.getElementById('clinic-detail-map-iframe');
        if (mapIframe) {
            mapIframe.src = '';
        }
    }
}

// ==========================================
// 6. Specialty Filtering and Search Logic
// ==========================================

let activeSpecialtyFilter = 'all';
let searchQuery = '';

function initSearchAndFilters() {
    const searchInput = document.getElementById('directorySearchInput');
    const filterTags = document.querySelectorAll('.filter-tag');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            filterAndRenderClinics();
        });
    }

    filterTags.forEach(tag => {
        tag.addEventListener('click', () => {
            filterTags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            activeSpecialtyFilter = tag.getAttribute('data-specialty');
            filterAndRenderClinics();
        });
    });
}

function filterAndRenderClinics() {
    const filtered = loadedClinicsGlobal.filter(clinic => {
        // Specialty filter
        let matchesSpecialty = true;
        if (activeSpecialtyFilter !== 'all') {
            const specs = Array.isArray(clinic.specialties) ? clinic.specialties : [];
            matchesSpecialty = specs.some(s => s === activeSpecialtyFilter);
        }

        // Search query filter (matches clinic name, location, specialties, doctor name)
        let matchesSearch = true;
        if (searchQuery) {
            const name = (clinic.name || '').toLowerCase();
            const loc = (clinic.location || '').toLowerCase();
            const doc = (clinic.doctor_name || '').toLowerCase();
            const specs = (clinic.specialties || []).map(s => s.toLowerCase()).join(' ');
            matchesSearch = name.includes(searchQuery) || loc.includes(searchQuery) || doc.includes(searchQuery) || specs.includes(searchQuery);
        }

        return matchesSpecialty && matchesSearch;
    });

    renderClinicCards(filtered);
}

// ==========================================
// 7. Review Writer Wizard Simulator Logic
// ==========================================

let reviewWriterActiveStep = 1;

function initReviewWriter() {
    const openBtn = document.getElementById('btnOpenReviewWriter');
    const closeBtn = document.getElementById('btnCloseReviewWriter');
    const modal = document.getElementById('reviewWriterModal');
    
    const prevBtn = document.getElementById('btnWriterPrev');
    const nextBtn = document.getElementById('btnWriterNext');
    
    // Sliders
    const sliders = [
        { id: 'slide-booking', valId: 'val-booking' },
        { id: 'slide-visit', valId: 'val-visit' },
        { id: 'slide-doc-design', valId: 'val-doc-design' },
        { id: 'slide-post-care', valId: 'val-post-care' },
        { id: 'slide-side-effect', valId: 'val-side-effect' },
        { id: 'slide-kindness', valId: 'val-kindness' }
    ];

    // Initialize slider value badges
    sliders.forEach(s => {
        const sliderEl = document.getElementById(s.id);
        const valEl = document.getElementById(s.valId);
        if (sliderEl && valEl) {
            sliderEl.addEventListener('input', (e) => {
                valEl.textContent = `${e.target.value} / 5`;
            });
        }
    });

    // Intent button toggles
    initSelectGroup('btn-revisit-yes', 'btn-revisit-no');
    initSelectGroup('btn-recommend-yes', 'btn-recommend-no');

    // Document dropzones simulation
    initDropzone('passportDropzone', 'passportSuccess');
    initDropzone('receiptDropzone', 'receiptSuccess');

    // Whistleblower Report Simulation
    const reportBribeBtn = document.getElementById('btnReportBribe');
    const whistleblowerSuccess = document.getElementById('whistleblowerSuccess');
    if (reportBribeBtn && whistleblowerSuccess) {
        reportBribeBtn.addEventListener('click', () => {
            reportBribeBtn.disabled = true;
            reportBribeBtn.textContent = 'Registering Report... ⏳';
            
            setTimeout(() => {
                reportBribeBtn.style.display = 'none';
                whistleblowerSuccess.style.display = 'block';
            }, 1200);
        });
    }

    // Modal triggers
    if (openBtn) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openReviewWriterModal();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeReviewWriterModal();
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeReviewWriterModal();
            }
        });
    }

    // Step navigators
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (reviewWriterActiveStep > 1) {
                setReviewWriterStep(reviewWriterActiveStep - 1);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (reviewWriterActiveStep < 3) {
                // Basic validation: must select doctor in step 1
                if (reviewWriterActiveStep === 1) {
                    const docSelect = document.getElementById('reviewDoctorSelect');
                    if (!docSelect || !docSelect.value) {
                        alert('Please select the operating physician.');
                        return;
                    }
                }
                setReviewWriterStep(reviewWriterActiveStep + 1);
            } else if (reviewWriterActiveStep === 3) {
                // Submit review writer
                submitReviewSimulation();
            }
        });
    }

    // Sync language updates — only re-render if clinics are loaded
    window.addEventListener('languageChanged', () => {
        if (loadedClinicsGlobal.length > 0) {
            filterAndRenderClinics();
        }
        if (activeClinicId) {
            openClinicDetailModal(activeClinicId);
        }
        updateReviewDoctorDropdown();
    });
}

function initSelectGroup(yesId, noId) {
    const yesBtn = document.getElementById(yesId);
    const noBtn = document.getElementById(noId);

    if (yesBtn && noBtn) {
        yesBtn.addEventListener('click', () => {
            yesBtn.classList.add('active');
            noBtn.classList.remove('active');
        });
        noBtn.addEventListener('click', () => {
            noBtn.classList.add('active');
            yesBtn.classList.remove('active');
        });
    }
}

function initDropzone(dzId, successId) {
    const dz = document.getElementById(dzId);
    const success = document.getElementById(successId);

    if (dz && success) {
        dz.addEventListener('click', () => {
            dz.style.borderColor = 'var(--color-success)';
            dz.style.backgroundColor = 'var(--color-success-light)';
            success.style.display = 'flex';
        });
    }
}

function openReviewWriterModal() {
    const modal = document.getElementById('reviewWriterModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        setReviewWriterStep(1);
        
        // Reset inputs and Whistleblower button
        const form = document.getElementById('reviewWriterForm');
        if (form) form.reset();
        
        const reportBribeBtn = document.getElementById('btnReportBribe');
        const whistleblowerSuccess = document.getElementById('whistleblowerSuccess');
        if (reportBribeBtn && whistleblowerSuccess) {
            reportBribeBtn.style.display = 'block';
            reportBribeBtn.disabled = false;
            reportBribeBtn.textContent = (typeof t === 'function') ? t('rev_sim.whistleblower_btn') : '🚨 Report Bribe Attempt';
            whistleblowerSuccess.style.display = 'none';
        }

        // Reset dropzones
        const zones = [
            { dz: 'passportDropzone', succ: 'passportSuccess' },
            { dz: 'receiptDropzone', succ: 'receiptSuccess' }
        ];
        zones.forEach(z => {
            const dzEl = document.getElementById(z.dz);
            const succEl = document.getElementById(z.succ);
            if (dzEl && succEl) {
                dzEl.style.borderColor = '';
                dzEl.style.backgroundColor = '';
                succEl.style.display = 'none';
            }
        });

        // Load doctors list
        updateReviewDoctorDropdown();
    }
}

function closeReviewWriterModal() {
    const modal = document.getElementById('reviewWriterModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function updateReviewDoctorDropdown() {
    const docSelect = document.getElementById('reviewDoctorSelect');
    if (docSelect) {
        docSelect.innerHTML = '';
        
        // Load options based on current database fallbacks
        const fallbackArray = Object.keys(clinicDetails).map(key => ({
            id: parseInt(key),
            ...clinicDetails[key]
        }));

        const clinicsList = loadedClinicsGlobal.length ? loadedClinicsGlobal : fallbackArray;

        clinicsList.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.doctor_name} (${c.name})`;
            docSelect.appendChild(opt);
        });
    }
}

function setReviewWriterStep(stepNum) {
    reviewWriterActiveStep = stepNum;

    // Toggle panel displays
    document.querySelectorAll('.writer-panel').forEach(p => p.classList.remove('active'));
    const targetPanel = document.getElementById(`writer-panel-${stepNum}`);
    if (targetPanel) targetPanel.classList.add('active');

    // Toggle step indicators
    document.querySelectorAll('.step-indicator').forEach((ind, idx) => {
        ind.classList.remove('active', 'completed');
        const num = idx + 1;
        if (num === stepNum) {
            ind.classList.add('active');
        } else if (num < stepNum) {
            ind.classList.add('completed');
        }
    });

    // Control buttons visibility and labels
    const prevBtn = document.getElementById('btnWriterPrev');
    const nextBtn = document.getElementById('btnWriterNext');
    const controls = document.getElementById('writerControls');

    if (prevBtn && nextBtn && controls) {
        controls.style.display = 'flex';
        prevBtn.disabled = (stepNum === 1);
        
        if (stepNum === 3) {
            nextBtn.textContent = (typeof t === 'function') ? t('rev_sim.submit') : 'Upload Authenticated Review';
        } else {
            nextBtn.textContent = 'Next ➔';
        }
    }
}

function submitReviewSimulation() {
    const nextBtn = document.getElementById('btnWriterNext');
    const originalText = nextBtn.textContent;
    
    nextBtn.disabled = true;
    nextBtn.textContent = 'Publishing Review... ⏳';

    setTimeout(() => {
        nextBtn.disabled = false;
        nextBtn.textContent = originalText;
        
        // Transition to Step 4 Success screen
        document.querySelectorAll('.writer-panel').forEach(p => p.classList.remove('active'));
        const panel4 = document.getElementById('writer-panel-4');
        if (panel4) panel4.classList.add('active');

        // Hide steps indicator and control actions
        const controls = document.getElementById('writerControls');
        if (controls) controls.style.display = 'none';

        // Add visual success checklist styling to step indicators
        document.querySelectorAll('.step-indicator').forEach(ind => {
            ind.classList.add('completed');
        });
    }, 1500);
}


