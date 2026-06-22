// KOMICARE Core Application Script

document.addEventListener('DOMContentLoaded', () => {
    initQuiz();
    initReceiptMasker();
    initReader();
    initTheme();
    initClinicDetailModal();
});

// ==========================================
// 1. Fitzpatrick Quiz Diagnostic Engine
// ==========================================

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
        doctor: {
            name: "Dr. Ji-Yeon Lee",
            avatar: "JY",
            title: "Board-Certified Dermatologist | Nd:YAG Specialist",
            bio: "Dr. Lee has over 12 years of clinical dermatology experience, specializing in lasers for thin and reactive skin barriers. She is a recognized speaker on Nd:YAG customization."
        },
        hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 4:00 PM",
        mapIframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.5702213797686!2d127.04277717646549!3d37.5239169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca40f2f3d6dbf%3A0xe54ebad41a5d6f1!2sCheongdam-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035000000!5m2!1sen!2skr"
    },
    2: {
        name: "Myeongdong Forest Dermatology",
        location: "📍 Myeong-dong, Jung-gu",
        rating: "⭐ 4.8 (94+ verified reviews)",
        description: "A tranquil sanctuary clinic in the heart of Myeongdong, prioritizing barrier safety over factory treatments. Enforces a strict maximum of 2 patient bookings per hour.",
        specialties: ["Vascular Laser Calibration", "Rosacea & Redness Recovery", "Ultrasonic Rejuvenation"],
        doctor: {
            name: "Dr. Minji Kim",
            avatar: "MK",
            title: "Board-Certified Dermatologist | Barrier Recovery",
            bio: "Dr. Kim founded Myeongdong Forest to offer custom medical treatments for international travelers who frequently experience barrier breakdown due to travel and climate changes."
        },
        hours: "Mon, Wed, Thu: 10:00 AM - 8:00 PM (Night Clinic) | Tue, Fri: 10:00 AM - 7:00 PM",
        mapIframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3162.7766579299496!2d126.9805952764673!3d37.56152017203678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca2f42a59e9a9%3A0x6b6df7d6b8b0e8c0!2sMyeong-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035100000!5m2!1sen!2skr"
    },
    3: {
        name: "Hannam Aesthetic & Laser House",
        location: "📍 Hannam-dong, Yongsan",
        rating: "⭐ 4.9 (78+ verified reviews)",
        description: "Boutique clinic catering to embassies and expats in Hannam. Equipped with premium dual-cooling laser systems and offering customized wavelength diagnostics.",
        specialties: ["1:1 Wavelength Tuning", "Dual-Cooling Safety Protocols", "High-Fluence Pigment Management"],
        doctor: {
            name: "Dr. Tae-Young Park",
            avatar: "TP",
            title: "Board-Certified Dermatologist | Custom Wavelengths",
            bio: "Dr. Park completed his fellowship at Seoul National University Hospital. He speaks fluent English and is dedicated to making laser treatments safe for diverse Fitzpatrick skin types."
        },
        hours: "Tue - Fri: 11:00 AM - 8:00 PM | Sat: 10:00 AM - 5:00 PM | Sun, Mon: Closed",
        mapIframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.7854653738096!2d127.00693597646618!3d37.53429397204558!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3b98d24ebf5%3A0xefdf5a3c94248a0!2sHannam-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035200000!5m2!1sen!2skr"
    },
    4: {
        name: "Sinsa Glow Dermatology",
        location: "📍 Sinsa-dong, Gangnam",
        rating: "⭐ 4.7 (112+ verified reviews)",
        description: "Specializing in advanced anti-aging treatments with verified genuine consumables logging. We provide every patient with their single-use tip certificate and serial code.",
        specialties: ["Genuine Consumables Logged", "Ultherapy & Shurink custom setups", "Epidermal Thickness Diagnostic"],
        doctor: {
            name: "Dr. Seo-Jun Choi",
            avatar: "SC",
            title: "Board-Certified Dermatologist | Anti-Aging Specialist",
            bio: "Dr. Choi is an expert in non-surgical lifting. He developed Sinsa Glow's 'Barrier First' lifting protocol to prevent post-treatment nerve complications and excessive swelling."
        },
        hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 9:30 AM - 3:00 PM",
        mapIframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.282583827618!2d127.01859527646562!3d37.518698972050546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3e7e00dfb39%3A0xf675dfb3c58b0e8c!2sSinsa-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035300000!5m2!1sen!2skr"
    },
    5: {
        name: "Hongdae Calm Skin Clinic",
        location: "📍 Seokyo-dong, Mapo-gu",
        rating: "⭐ 4.8 (85+ verified reviews)",
        description: "A trendy but medically rigorous clinic in Hongdae. Focuses on laser toning and vascular treatments for younger global patients with absolute physician presence.",
        specialties: ["Nd:YAG & Pico Laser Certified", "100% Physician Consultation", "Youth Acne Barrier Healing"],
        doctor: {
            name: "Dr. Eun-Ji Song",
            avatar: "ES",
            title: "Board-Certified Dermatologist | Pigmentation Expert",
            bio: "Dr. Song is highly recognized for her gentle, layered laser approach. She rejects rapid 'one-size-fits-all' laser protocols, allocating 30+ minutes per patient treatment."
        },
        hours: "Mon, Tue, Fri: 10:00 AM - 7:00 PM | Thu: 10:00 AM - 9:00 PM (Night Clinic) | Sat: 10:00 AM - 4:00 PM",
        mapIframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.0903332467554!2d126.91929527646698!3d37.5541201720392!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357c98da5f87b8b5%3A0x6b6df7d6b8b0e8c0!2sSeogyo-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035400000!5m2!1sen!2skr"
    }
};

function initClinicDetailModal() {
    const clinicCards = document.querySelectorAll('.partner-card');
    const modal = document.getElementById('clinicModal');
    const closeBtn = document.getElementById('btnCloseClinic');

    if (!modal) return;

    clinicCards.forEach(card => {
        card.addEventListener('click', () => {
            const clinicId = card.getAttribute('data-clinic-id');
            const data = clinicDetails[clinicId];

            if (data) {
                // Populate text details
                document.getElementById('clinic-detail-name').textContent = data.name;
                document.getElementById('clinic-detail-location').textContent = data.location;
                document.getElementById('clinic-detail-rating').textContent = data.rating;
                document.getElementById('clinic-detail-desc').textContent = data.description;
                document.getElementById('clinic-detail-hours').textContent = data.hours;

                // Populate Specialties tags
                const specialtiesContainer = document.getElementById('clinic-detail-specialties');
                specialtiesContainer.innerHTML = '';
                data.specialties.forEach(spec => {
                    const tag = document.createElement('span');
                    tag.className = 'partner-tag';
                    tag.textContent = spec;
                    specialtiesContainer.appendChild(tag);
                });

                // Populate Doctor Info
                document.getElementById('clinic-detail-doc-avatar').textContent = data.doctor.avatar;
                document.getElementById('clinic-detail-doc-name').textContent = data.doctor.name;
                document.getElementById('clinic-detail-doc-title').textContent = data.doctor.title;
                document.getElementById('clinic-detail-doc-bio').textContent = data.doctor.bio;

                // Load Map Iframe
                const mapIframe = document.getElementById('clinic-detail-map-iframe');
                if (mapIframe) {
                    mapIframe.src = data.mapIframe;
                }

                // Open Modal
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    // Close Modal
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
        // Clear iframe source to stop loading/performance footprint when closed
        const mapIframe = document.getElementById('clinic-detail-map-iframe');
        if (mapIframe) {
            mapIframe.src = '';
        }
    }
}

