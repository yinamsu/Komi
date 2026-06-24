// ========================================================
// KOMICARE Core Application Script (최종 수정본)
// ========================================================

function initLanguage() {
    let savedLang = 'en';
    try {
        savedLang = localStorage.getItem('komicare-lang');
    } catch (e) { /* ignore */ }
    if (!savedLang) {
        savedLang = (navigator.language && navigator.language.startsWith('ko')) ? 'ko' : 'en';
    }
    setLanguage(savedLang);

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
    initLanguage();
    initQuiz();
    initReceiptMasker();
    initReader();
    initTheme();
    loadClinics();
    initClinicDetailModal();
    initSearchAndFilters();
    initTreatmentMenu();
    initReviewWriter();
    initExpandableReviews();
}

document.addEventListener('DOMContentLoaded', initApp);

let activeClinicId = null;
let loadedClinicsGlobal = [];

let quizData = {
    step: 1,
    scores: { tone: 0, reaction: 0, tanning: 0 },
    email: '',
    fitzpatrickType: null
};

function initQuiz() {
    const optionButtons = document.querySelectorAll('.quiz-option');
    const leadForm = document.getElementById('leadForm');

    optionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const stepId = button.getAttribute('data-step');
            const scoreVal = parseInt(button.getAttribute('data-score'));
            const questionType = button.getAttribute('data-type');

            document.querySelectorAll(`.quiz-option[data-type="${questionType}"]`).forEach(btn => {
                btn.classList.remove('selected');
            });
            button.classList.add('selected');

            quizData.scores[questionType] = scoreVal;

            setTimeout(() => {
                advanceStep(parseInt(stepId) + 1);
            }, 300);
        });
    });

    if (leadForm) {
        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('userEmail');
            const submitBtn = leadForm.querySelector('button[type="submit"]');

            calculateFitzpatrick();
            quizData.email = emailInput.value;

            const originalBtnContent = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner">${t('quiz.securing') || 'Securing...'}</span> ⏳`;

            let shouldOpenModal = false;

            try {
                const response = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: quizData.email,
                        fitzpatrickType: quizData.fitzpatrickType
                    })
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Server error.');
                shouldOpenModal = true;
            } catch (error) {
                console.warn("Subscription routing info:", error.message);
                shouldOpenModal = true;
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
                showResults();
                if (shouldOpenModal) openReaderModal();
            }
        });
    }
}

function advanceStep(nextStep) {
    if (nextStep > 3) return;
    quizData.step = nextStep;

    document.querySelectorAll('.quiz-step').forEach(stepDiv => {
        stepDiv.classList.remove('active');
    });

    const nextStepDiv = document.getElementById(`quiz-step-${nextStep}`);
    if (nextStepDiv) nextStepDiv.classList.add('active');

    const progressFill = document.querySelector('.quiz-progress-fill');
    const progressText = document.querySelector('.quiz-progress-text');
    if (progressFill && progressText) {
        const pct = (nextStep / 3) * 100;
        progressFill.style.width = `${pct}%`;

        if (typeof t === 'function' && t('quiz.progress') !== 'quiz.progress') {
            progressText.textContent = t('quiz.progress').replace('{current}', nextStep);
        } else {
            progressText.textContent = `Step ${nextStep} of 3`;
        }
    }
}

function calculateFitzpatrick() {
    const totalScore = quizData.scores.tone + quizData.scores.reaction + quizData.scores.tanning;
    if (totalScore <= 2) quizData.fitzpatrickType = 1;
    else if (totalScore <= 4) quizData.fitzpatrickType = 2;
    else if (totalScore <= 7) quizData.fitzpatrickType = 3;
    else if (totalScore <= 10) quizData.fitzpatrickType = 4;
    else if (totalScore <= 12) quizData.fitzpatrickType = 5;
    else quizData.fitzpatrickType = 6;
}

function showResults() {
    const quizArea = document.getElementById('quiz-setup');
    const resultsArea = document.getElementById('quiz-results');

    if (quizArea && resultsArea) {
        quizArea.style.display = 'none';
        resultsArea.style.display = 'block';
        resultsArea.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const lang = getCurrentLang();
        const profile = lang === 'ko' ? window.fitzpatrickProfiles_ko[quizData.fitzpatrickType] : window.fitzpatrickProfiles_en[quizData.fitzpatrickType];

        document.getElementById('res-type-title').textContent = profile.name;
        document.getElementById('res-behavior').textContent = profile.behavior;
        document.getElementById('res-lasers').textContent = profile.lasers;

        const advText = lang === 'ko' ? `🛡️ 피츠패트릭 ${quizData.fitzpatrickType}형 안전 권고:` : `🛡️ Fitzpatrick ${quizData.fitzpatrickType} Safety Advisory:`;
        document.getElementById('res-warning').innerHTML = `<strong>${advText}</strong><p>${profile.warning}</p>`;

        document.querySelectorAll('.scale-segment').forEach(seg => seg.classList.remove('active'));
        const activeSegment = document.querySelector(`.scale-segment.type-${quizData.fitzpatrickType}`);
        if (activeSegment) activeSegment.classList.add('active');
    }
}

window.restartQuiz = function () {
    quizData = {
        step: 1, scores: { tone: 0, reaction: 0, tanning: 0 }, email: '', fitzpatrickType: null
    };
    document.querySelectorAll('.quiz-option').forEach(btn => btn.classList.remove('selected'));
    const emailInput = document.getElementById('userEmail');
    if (emailInput) emailInput.value = '';
    document.getElementById('quiz-setup').style.display = 'block';
    document.getElementById('quiz-results').style.display = 'none';
    advanceStep(1);
};

function initReceiptMasker() {
    const maskBtn = document.getElementById('btnMaskReceipt');
    const receiptWrap = document.getElementById('receiptMockup');

    if (maskBtn && receiptWrap) {
        maskBtn.addEventListener('click', () => {
            const isMasked = receiptWrap.classList.toggle('masked');
            if (isMasked) {
                maskBtn.textContent = t('receipt.unmask_btn') || '🔒 Unmask Mock Data';
                maskBtn.style.backgroundColor = 'var(--color-success)';
                document.getElementById('mask-status-badge').textContent = t('receipt.status_masked');
                document.getElementById('mask-status-badge').style.color = 'var(--color-success)';
            } else {
                maskBtn.textContent = t('receipt.mask_btn') || '🛡️ Simulate Tax Refund Masking';
                maskBtn.style.backgroundColor = 'var(--color-primary)';
                document.getElementById('mask-status-badge').textContent = t('receipt.status_unmasked');
                document.getElementById('mask-status-badge').style.color = 'var(--color-danger)';
            }
        });
    }
}

let currentChapter = 1;
const totalChapters = 4;

function initReader() {
    const openBtn = document.getElementById('btnOpenReader');
    const openBtnResults = document.getElementById('btnOpenReaderResults');
    const closeBtn = document.getElementById('btnCloseReader');
    const modal = document.getElementById('readerModal');

    if (openBtn) openBtn.addEventListener('click', (e) => { e.preventDefault(); openReaderModal(); });
    if (openBtnResults) openBtnResults.addEventListener('click', (e) => { e.preventDefault(); openReaderModal(); });
    if (closeBtn) closeBtn.addEventListener('click', () => closeReaderModal());
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeReaderModal(); });

    document.querySelectorAll('.reader-toc-btn').forEach(button => {
        button.addEventListener('click', () => setChapter(parseInt(button.getAttribute('data-ch'))));
    });

    const prevBtn = document.getElementById('reader-prev-btn');
    const nextBtn = document.getElementById('reader-next-btn');

    if (prevBtn) prevBtn.addEventListener('click', () => { if (currentChapter > 1) setChapter(currentChapter - 1); });
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentChapter < totalChapters) setChapter(currentChapter + 1);
            else closeReaderModal();
        });
    }
}

function openReaderModal() {
    const modal = document.getElementById('readerModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        setChapter(1);
    }
}

function closeReaderModal() {
    const modal = document.getElementById('readerModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function setChapter(chNum) {
    currentChapter = chNum;
    document.querySelectorAll('.reader-toc-btn').forEach(btn => btn.classList.remove('active'));
    const activeTocBtn = document.querySelector(`.reader-toc-btn[data-ch="${chNum}"]`);
    if (activeTocBtn) activeTocBtn.classList.add('active');

    document.querySelectorAll('.reader-page').forEach(page => page.classList.remove('active'));
    const activePage = document.getElementById(`reader-page-${chNum}`);
    if (activePage) {
        activePage.classList.add('active');
        document.querySelector('.reader-main').scrollTop = 0;
    }

    const prevBtn = document.getElementById('reader-prev-btn');
    const nextBtn = document.getElementById('reader-next-btn');

    if (prevBtn && nextBtn) {
        prevBtn.disabled = (chNum === 1);
        if (chNum === totalChapters) {
            nextBtn.innerHTML = t('reader.finish_btn') || 'Finish & Close ✓';
        } else {
            nextBtn.innerHTML = t('reader.next_btn') || 'Next →';
        }
    }
}

window.toggleChecklistItem = function (elem) { elem.classList.toggle('checked'); };

window.copySafetyChecklist = function () {
    const checklistText = `--- THE K-BEAUTY 5 CRITICAL SAFETY QUESTIONS ---\n...`;
    navigator.clipboard.writeText(checklistText).then(() => {
        const copyBtn = document.getElementById('btnCopyChecklist');
        if (copyBtn) {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = t('reader.copied') || '✨ Copied!';
            copyBtn.style.backgroundColor = 'var(--color-success)';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.backgroundColor = 'var(--color-secondary)';
            }, 2500);
        }
    });
};

function initTheme() {
    const themeSwitcher = document.getElementById('themeSwitcher');
    if (!themeSwitcher) return;
    const savedTheme = localStorage.getItem('komicare-theme') || 'system';
    applyTheme(savedTheme);

    themeSwitcher.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.getAttribute('data-theme')));
    });
}

function applyTheme(theme) {
    const htmlEl = document.documentElement;
    htmlEl.setAttribute('data-theme', theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme);
    localStorage.setItem('komicare-theme', theme);
}

async function loadClinics() {
    const container = document.getElementById('dynamic-partner-list');
    const searchInput = document.getElementById('directorySearchInput');

    if (searchInput) searchInput.disabled = true;

    try {
        const response = await fetch('/api/clinics');
        const result = await response.json();

        if (result && result.success && result.clinics) {
            loadedClinicsGlobal = result.clinics;
            renderClinicCards(result.clinics);
        }
    } catch (error) {
        console.error("API Fetch error, loading client-side fallback clinics:", error);
        const fallback = [
            {
                id: 1,
                name: "Cheongdam Barrier Lab",
                location: "📍 Cheongdam-dong, Gangnam",
                rating: "⭐ 4.9 (120+ verified reviews)",
                description: "Specialized in non-invasive skin barrier recovery and pigmentation lasers for sensitive skin types. Known for ultra-conservative energy calibration and genuine, certified tips.",
                specialties: ["Nd:YAG Laser Calibrations", "Skin Barrier Reconstruction", "Pico Toning", "Skin Booster", "Lifting", "Pigmentation"],
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
            {
                id: 2,
                name: "Myeongdong Forest Dermatology",
                location: "📍 Myeong-dong, Jung-gu",
                rating: "⭐ 4.8 (94+ verified reviews)",
                description: "A tranquil sanctuary clinic in the heart of Myeongdong, prioritizing barrier safety over factory treatments. Enforces a strict maximum of 2 patient bookings per hour.",
                specialties: ["Vascular Laser Calibration", "Rosacea & Redness Recovery", "Ultrasonic Rejuvenation", "Acne", "Pigmentation", "Hair Removal"],
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
            {
                id: 3,
                name: "Hannam Aesthetic & Laser House",
                location: "📍 Hannam-dong, Yongsan",
                rating: "⭐ 4.9 (78+ verified reviews)",
                description: "Boutique clinic catering to embassies and expats in Hannam. Equipped with premium dual-cooling laser systems and offering customized wavelength diagnostics.",
                specialties: ["1:1 Wavelength Tuning", "Dual-Cooling Safety Protocols", "High-Fluence Pigment Management", "Filler", "Botox", "Lifting"],
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
            {
                id: 4,
                name: "Sinsa Glow Dermatology",
                location: "📍 Sinsa-dong, Gangnam",
                rating: "⭐ 4.7 (112+ verified reviews)",
                description: "Specializing in advanced anti-aging treatments with verified genuine consumables logging. We provide every patient with their single-use tip certificate and serial code.",
                specialties: ["Genuine Consumables Logged", "Ultherapy & Shurink custom setups", "Epidermal Thickness Diagnostic", "Skin Booster", "Lifting"],
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
            {
                id: 5,
                name: "Hongdae Calm Skin Clinic",
                location: "📍 Seokyo-dong, Mapo-gu",
                rating: "⭐ 4.8 (85+ verified reviews)",
                description: "A trendy but medically rigorous clinic in Hongdae. Focuses on laser toning and vascular treatments for younger global patients with absolute physician presence.",
                specialties: ["Nd:YAG & Pico Laser Certified", "100% Physician Consultation", "Youth Acne Barrier Healing", "Acne", "Hair Removal"],
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
            },
            {
                id: 6,
                name: "Yeouido Line Skin Clinic",
                location: "📍 Yeouido-dong, Yeongdeungpo-gu",
                rating: "⭐ 4.8 (90+ verified reviews)",
                description: "Specialized in customized obesity treatments and face fat dissolution with minimal downtime. Emphasizes patient comfort and strict dosage transparency.",
                specialties: ["Obesity Injection", "Botox", "Filler"],
                doctor_name: "Dr. Min-Woo Cho",
                doctor_avatar: "MC",
                doctor_title: "Board-Certified Dermatologist | Body Contouring",
                doctor_bio: "Dr. Cho has 15 years of experience in aesthetic medicine, specializing in safe medical injections for localized fat and anti-wrinkle botox.",
                hours: "Mon - Fri: 10:00 AM - 7:30 PM | Sat: 10:00 AM - 3:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.5702213797686!2d126.92427717646549!3d37.5239169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357c9f187a59df7d%3A0xe54ebad41a5d6f1!2sYeouido-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035500000!5m2!1sen!2skr",
                slots_tag: "Max 3 Bookings/Hr",
                doctor_type: "dermatologist",
                sleep_anesthesia: false,
                anesthesiologist_resident: false,
                foreign_attraction_registered: true,
                foreigner_insurance: true,
                excellent_aftercare: true
            },
            {
                id: 7,
                name: "Apgujeong Royal Dermatologists",
                location: "📍 Apgujeong-dong, Gangnam",
                rating: "⭐ 4.9 (132+ verified reviews)",
                description: "A prestigious clinic specializing in advanced non-surgical lifting and scalp restoration. Located in the heart of Apgujeong, the luxury mecca of K-Beauty.",
                specialties: ["Hair Loss", "Lifting", "Filler", "Botox"],
                doctor_name: "Dr. Sang-Hyun Park",
                doctor_avatar: "SP",
                doctor_title: "Board-Certified Dermatologist | Anti-Aging Specialist",
                doctor_bio: "Dr. Park completed his residency at Seoul National University Hospital. He is a prominent speaker at clinical conferences regarding facial contouring and hair-loss therapies.",
                hours: "Mon - Fri: 10:30 AM - 8:00 PM | Sat: 10:00 AM - 4:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.082583827618!2d127.02859527646562!3d37.52869897205055!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3e7e00dfb39%3A0xf675dfb3c58b0e8c!2sApgujeong-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035600000!5m2!1sen!2skr",
                slots_tag: "Max 2 Bookings/Hr",
                doctor_type: "dermatologist",
                sleep_anesthesia: true,
                anesthesiologist_resident: false,
                foreign_attraction_registered: true,
                foreigner_insurance: true,
                excellent_aftercare: true
            },
            {
                id: 8,
                name: "Gangnam Clear Acne Center",
                location: "📍 Yeoksam-dong, Gangnam",
                rating: "⭐ 4.8 (115+ verified reviews)",
                description: "Dedicated to solving youth and adult acne using state-of-the-art sebaceous gland destruction lasers and calming protocols.",
                specialties: ["Acne", "Pigmentation"],
                doctor_name: "Dr. Yoon-Seo Jang",
                doctor_avatar: "YJ",
                doctor_title: "Board-Certified Dermatologist | Acne Specialist",
                doctor_bio: "Dr. Jang has dedicated her career to studying and treating acne scars. She is known for her meticulous extraction technique and gentle skin-calming programs.",
                hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 9:30 AM - 2:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.5702213797686!2d127.02777717646549!3d37.5239169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca40f2f3d6dbf%3A0xe54ebad41a5d6f1!2sYeoksam-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035700000!5m2!1sen!2skr",
                slots_tag: "Max 3 Bookings/Hr",
                doctor_type: "dermatologist",
                sleep_anesthesia: false,
                anesthesiologist_resident: false,
                foreign_attraction_registered: true,
                foreigner_insurance: false,
                excellent_aftercare: true
            },
            {
                id: 9,
                name: "Cheongdam Youth Hair Clinic",
                location: "📍 Cheongdam-dong, Gangnam",
                rating: "⭐ 4.9 (67+ verified reviews)",
                description: "Premium hair restoration clinic offering advanced follicular unit extraction and non-surgical scalp booster injections for men and women.",
                specialties: ["Hair Loss", "Hair Removal"],
                doctor_name: "Dr. Ji-Hoon Kang",
                doctor_avatar: "JK",
                doctor_title: "Specialist | Hair Restoration Surgeon",
                doctor_bio: "Dr. Kang has conducted over 3,000 hair transplant procedures and specializes in early-stage scalp treatments to halt alopecia progression.",
                hours: "Mon, Tue, Thu, Fri: 10:00 AM - 6:00 PM | Sat: 10:00 AM - 2:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.5702213797686!2d127.04277717646549!3d37.5239169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca40f2f3d6dbf%3A0xe54ebad41a5d6f1!2sCheongdam-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035800000!5m2!1sen!2skr",
                slots_tag: "Max 2 Bookings/Hr",
                doctor_type: "specialist",
                sleep_anesthesia: true,
                anesthesiologist_resident: false,
                foreign_attraction_registered: true,
                foreigner_insurance: true,
                excellent_aftercare: false
            },
            {
                id: 10,
                name: "Seoul Station Gateway Dermatology",
                location: "📍 Dongja-dong, Yongsan-gu",
                rating: "⭐ 4.7 (88+ verified reviews)",
                description: "Ideally located for tourists right next to Seoul Station, providing fast, safe laser hair removal and botox treatments with zero recovery time.",
                specialties: ["Hair Removal", "Botox"],
                doctor_name: "Dr. Jin-Soo Kim",
                doctor_avatar: "JK",
                doctor_title: "Board-Certified Dermatologist | Laser Science",
                doctor_bio: "Dr. Kim has specialized in quick, precise laser procedures that fit into tight travel itineraries, focusing on maximum comfort and speed.",
                hours: "Mon - Fri: 9:30 AM - 6:30 PM | Sat: 9:30 AM - 1:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.7854653738096!2d126.97293597646618!3d37.55429397204558!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3b98d24ebf5%3A0xefdf5a3c94248a0!2sDongja-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035900000!5m2!1sen!2skr",
                slots_tag: "Max 4 Bookings/Hr",
                doctor_type: "dermatologist",
                sleep_anesthesia: false,
                anesthesiologist_resident: false,
                foreign_attraction_registered: false,
                foreigner_insurance: true,
                excellent_aftercare: false
            },
            {
                id: 11,
                name: "Banpo Glass Skin Lab",
                location: "📍 Banpo-dong, Seocho-gu",
                rating: "⭐ 4.9 (95+ verified reviews)",
                description: "Specialized in premium moisture skin boosters (Rejuran, Chanell) and filler design. Delivers a gorgeous natural glass skin glow.",
                specialties: ["Skin Booster", "Filler", "Pigmentation"],
                doctor_name: "Dr. Da-Eun Yoo",
                doctor_avatar: "DY",
                doctor_title: "Board-Certified Dermatologist | Skin Glow Specialist",
                doctor_bio: "Dr. Yoo is highly respected for her delicate touch in intradermal injections, ensuring minimal bruising and maximal product absorption.",
                hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 3:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.5702213797686!2d127.00277717646549!3d37.5239169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca40f2f3d6dbf%3A0xe54ebad41a5d6f1!2sBanpo-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036000000!5m2!1sen!2skr",
                slots_tag: "Max 2 Bookings/Hr",
                doctor_type: "dermatologist",
                sleep_anesthesia: false,
                anesthesiologist_resident: false,
                foreign_attraction_registered: true,
                foreigner_insurance: true,
                excellent_aftercare: true
            },
            {
                id: 12,
                name: "Dongdaemun Glow Laser",
                location: "📍 Euljiro, Jung-gu",
                rating: "⭐ 4.8 (74+ verified reviews)",
                description: "Focuses on clearing pigmentation, freckles, and sun spots for diverse nationalities with custom laser settings.",
                specialties: ["Pigmentation", "Acne"],
                doctor_name: "Dr. Nam-gyu Park",
                doctor_avatar: "NP",
                doctor_title: "Board-Certified Dermatologist | Pigment Laser Specialist",
                doctor_bio: "Dr. Park completed his medical degree at Yonsei University. He has extensive experience adjusting laser wavelengths for Western and South Asian skin profiles.",
                hours: "Mon - Fri: 11:00 AM - 8:00 PM | Sat: 10:00 AM - 4:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3162.7766579299496!2d127.0065952764673!3d37.56152017203678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca2f42a59e9a9%3A0x6b6df7d6b8b0e8c0!2sEuljiro%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036100000!5m2!1sen!2skr",
                slots_tag: "Max 3 Bookings/Hr",
                doctor_type: "dermatologist",
                sleep_anesthesia: false,
                anesthesiologist_resident: false,
                foreign_attraction_registered: true,
                foreigner_insurance: false,
                excellent_aftercare: false
            },
            {
                id: 13,
                name: "Suyu Relief Dermatology",
                location: "📍 Suyu-dong, Gangbuk-gu",
                rating: "⭐ 4.7 (91+ verified reviews)",
                description: "A friendly community-oriented specialist dermatology office focused on acne healing and premium laser hair removal.",
                specialties: ["Acne", "Hair Removal", "Botox"],
                doctor_name: "Dr. Bo-Min Choi",
                doctor_avatar: "BC",
                doctor_title: "Board-Certified Dermatologist | Clinical Dermatology",
                doctor_bio: "Dr. Choi focuses on safe medical treatments with zero exaggeration, dedicating ample time to explain diagnostic results.",
                hours: "Mon - Fri: 9:30 AM - 7:00 PM | Sat: 9:30 AM - 2:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3160.7766579299496!2d127.0265952764673!3d37.63152017203678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357cb0f42a59e9a9%3A0x6b6df7d6b8b0e8c0!2sSuyu-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036200000!5m2!1sen!2skr",
                slots_tag: "Max 3 Bookings/Hr",
                doctor_type: "dermatologist",
                sleep_anesthesia: false,
                anesthesiologist_resident: false,
                foreign_attraction_registered: false,
                foreigner_insurance: true,
                excellent_aftercare: false
            },
            {
                id: 14,
                name: "Jamsil Aesthetic",
                location: "📍 Jamsil-dong, Songpa-gu",
                rating: "⭐ 4.8 (104+ verified reviews)",
                description: "Specialized in high-tech lifting (Ulthera, Thermage) and fat dissolving body injections. Located next to Lotte World Tower.",
                specialties: ["Lifting", "Obesity Injection"],
                doctor_name: "Dr. Jae-Hee Song",
                doctor_avatar: "JS",
                doctor_title: "Board-Certified Dermatologist | Body Sculpting",
                doctor_bio: "Dr. Song is an expert in non-invasive skin tightening and body line design, with certified safety credentials.",
                hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 4:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.5702213797686!2d127.09877717646549!3d37.5119169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca40f2f3d6dbf%3A0xe54ebad41a5d6f1!2sJamsil-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036300000!5m2!1sen!2skr",
                slots_tag: "Max 2 Bookings/Hr",
                doctor_type: "dermatologist",
                sleep_anesthesia: true,
                anesthesiologist_resident: false,
                foreign_attraction_registered: true,
                foreigner_insurance: true,
                excellent_aftercare: true
            },
            {
                id: 15,
                name: "Insadong Skin Healing",
                location: "📍 Insa-dong, Jongno-gu",
                rating: "⭐ 4.8 (64+ verified reviews)",
                description: "Focused on natural skin barrier recovery and herbal-infused calming booster therapies for exhausted travelers.",
                specialties: ["Skin Booster", "Acne"],
                doctor_name: "Dr. Seo-Yeon Jung",
                doctor_avatar: "SJ",
                doctor_title: "Board-Certified Dermatologist | Natural Skin Restoration",
                doctor_bio: "Dr. Jung blends classic dermatological laser care with soothing, skin barrier-friendly moisture boosters for immediate traveler recovery.",
                hours: "Mon - Fri: 10:00 AM - 6:30 PM | Sat: 10:00 AM - 2:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3162.7766579299496!2d126.9855952764673!3d37.57452017203678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca2f42a59e9a9%3A0x6b6df7d6b8b0e8c0!2sInsa-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036400000!5m2!1sen!2skr",
                slots_tag: "Max 2 Bookings/Hr",
                doctor_type: "dermatologist",
                sleep_anesthesia: false,
                anesthesiologist_resident: false,
                foreign_attraction_registered: false,
                foreigner_insurance: true,
                excellent_aftercare: true
            },
            {
                id: 16,
                name: "Seocho Skin Balance",
                location: "📍 Seocho-dong, Seocho-gu",
                rating: "⭐ 4.7 (96+ verified reviews)",
                description: "Customized aesthetic clinics that specialize in face balancing fillers, botox, and fat dissolving line treatments.",
                specialties: ["Obesity Injection", "Filler", "Botox"],
                doctor_name: "Dr. Dong-Hyun Shin",
                doctor_avatar: "DS",
                doctor_title: "Board-Certified Dermatologist | Aesthetic Balance",
                doctor_bio: "Dr. Shin provides careful and proportion-accurate injections to enhance features while ensuring safety first.",
                hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 9:30 AM - 3:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.5702213797686!2d127.01277717646549!3d37.5239169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca40f2f3d6dbf%3A0xe54ebad41a5d6f1!2sSeocho-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036500000!5m2!1sen!2skr",
                slots_tag: "Max 3 Bookings/Hr",
                doctor_type: "dermatologist",
                sleep_anesthesia: false,
                anesthesiologist_resident: false,
                foreign_attraction_registered: true,
                foreigner_insurance: false,
                excellent_aftercare: false
            },
            {
                id: 17,
                name: "Itaewon Global Skin Clinic",
                location: "📍 Itaewon-dong, Yongsan-gu",
                rating: "⭐ 4.8 (110+ verified reviews)",
                description: "With a fully English-speaking medical staff, this clinic is designed for international visitors seeking skin treatments, pigment laser, and hair loss solutions.",
                specialties: ["Hair Removal", "Hair Loss", "Pigmentation"],
                doctor_name: "Dr. Sarah Miller",
                doctor_avatar: "SM",
                doctor_title: "Board-Certified Dermatologist | Global Skin Specialist",
                doctor_bio: "Dr. Miller finished her medical education in the US and Korea, focusing on pigmentary responses in skin of color (Types IV-VI).",
                hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 4:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.7854653738096!2d126.99293597646618!3d37.53429397204558!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3b98d24ebf5%3A0xefdf5a3c94248a0!2sItaewon-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036600000!5m2!1sen!2skr",
                slots_tag: "Max 2 Bookings/Hr",
                doctor_type: "dermatologist",
                sleep_anesthesia: false,
                anesthesiologist_resident: false,
                foreign_attraction_registered: true,
                foreigner_insurance: true,
                excellent_aftercare: true
            },
            {
                id: 18,
                name: "Mapo Clear Hair Clinic",
                location: "📍 Mapo-dong, Mapo-gu",
                rating: "⭐ 4.8 (69+ verified reviews)",
                description: "Specialized in hair-loss diagnostics, offering premium growth factor infusions and professional laser hair removal packages.",
                specialties: ["Hair Loss", "Hair Removal"],
                doctor_name: "Dr. Sung-Min Ryu",
                doctor_avatar: "SR",
                doctor_title: "Specialist | Hair Loss & Scalp Science",
                doctor_bio: "Dr. Ryu has written several papers on micro-needle therapy systems for alopecia and is a board member of the Hair Restoration Society.",
                hours: "Mon - Fri: 10:00 AM - 6:30 PM | Sat: 10:00 AM - 3:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.0903332467554!2d126.94295276466698!3d37.5541201720392!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357c98da5f87b8b5%3A0x6b6df7d6b8b0e8c0!2sMapo-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036700000!5m2!1sen!2skr",
                slots_tag: "Max 3 Bookings/Hr",
                doctor_type: "specialist",
                sleep_anesthesia: false,
                anesthesiologist_resident: false,
                foreign_attraction_registered: false,
                foreigner_insurance: true,
                excellent_aftercare: false
            },
            {
                id: 19,
                name: "Yeongdeungpo Laser Center",
                location: "📍 Yeongdeungpo-dong, Yeongdeungpo-gu",
                rating: "⭐ 4.7 (76+ verified reviews)",
                description: "Equipped with advanced dual-wavelength pigment toning lasers, focusing on skin tone equalization and laser hair removal.",
                specialties: ["Pigmentation", "Hair Removal"],
                doctor_name: "Dr. Tae-Jin Yoon",
                doctor_avatar: "TY",
                doctor_title: "Board-Certified Dermatologist | Laser Specialist",
                doctor_bio: "Dr. Yoon has over 10 years of laser clinical experience, calibrating settings based on individual pigment thickness.",
                hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 2:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.5702213797686!2d126.90427717646549!3d37.5239169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357c9f187a59df7d%3A0xe54ebad41a5d6f1!2sYeongdeungpo-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036800000!5m2!1sen!2skr",
                slots_tag: "Max 3 Bookings/Hr",
                doctor_type: "dermatologist",
                sleep_anesthesia: false,
                anesthesiologist_resident: false,
                foreign_attraction_registered: true,
                foreigner_insurance: true,
                excellent_aftercare: false
            },
            {
                id: 20,
                name: "Gangnam V-line Clinic",
                location: "📍 Nonhyeon-dong, Gangnam",
                rating: "⭐ 4.9 (148+ verified reviews)",
                description: "Specialized in advanced facial lifting and fat dissolution to create the perfect V-line, using combination lifting therapies.",
                specialties: ["Lifting", "Botox", "Filler", "Obesity Injection"],
                doctor_name: "Dr. Young-Ho Koh",
                doctor_avatar: "YK",
                doctor_title: "Board-Certified Dermatologist | Facial Contouring",
                doctor_bio: "Dr. Koh is an expert in non-invasive lifting. He designed a proprietary protocol that guarantees maximum lift with minimal swelling.",
                hours: "Mon - Fri: 10:00 AM - 8:00 PM | Sat: 10:00 AM - 4:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.282583827618!2d127.02859527646562!3d37.518698972050546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3e7e00dfb39%3A0xf675dfb3c58b0e8c!2sNonhyeon-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036900000!5m2!1sen!2skr",
                slots_tag: "Max 2 Bookings/Hr",
                doctor_type: "dermatologist",
                sleep_anesthesia: true,
                anesthesiologist_resident: true,
                foreign_attraction_registered: true,
                foreigner_insurance: true,
                excellent_aftercare: true
            },
            {
                id: 21,
                name: "Bundang Grace Skin Lab",
                location: "📍 Jeongja-dong, Seongnam",
                rating: "⭐ 4.8 (98+ verified reviews)",
                description: "Premium aesthetic clinic focusing on custom skin boosters and facial lifting, catering to residents in southern Seoul areas.",
                specialties: ["Skin Booster", "Lifting", "Botox"],
                doctor_name: "Dr. Hye-Jin Lim",
                doctor_avatar: "HL",
                doctor_title: "Board-Certified Dermatologist | Skincare Specialist",
                doctor_bio: "Dr. Lim is famous for her detailed consultation. She customizes combination therapies of boosters and non-invasive lasers.",
                hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 3:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3167.5702213797686!2d127.10877717646549!3d37.3639169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca40f2f3d6dbf%3A0xe54ebad41a5d6f1!2sJeongja-dong%2C%20Seongnam!5e0!3m2!1sen!2skr!4v1719037000000!5m2!1sen!2skr",
                slots_tag: "Max 3 Bookings/Hr",
                doctor_type: "dermatologist",
                sleep_anesthesia: false,
                anesthesiologist_resident: true,
                foreign_attraction_registered: true,
                foreigner_insurance: true,
                excellent_aftercare: true
            },
            {
                id: 22,
                name: "Mokdong Pure Skin Clinic",
                location: "📍 Mok-dong, Yangcheon-gu",
                rating: "⭐ 4.8 (89+ verified reviews)",
                description: "Focused on acne scars, vascular clearing, and painless laser hair removal, providing comfortable clinical environments.",
                specialties: ["Acne", "Pigmentation", "Hair Removal"],
                doctor_name: "Dr. Kyu-Hyun Hwang",
                doctor_avatar: "KH",
                doctor_title: "Board-Certified Dermatologist | Laser & Acne Therapy",
                doctor_bio: "Dr. Hwang completed his residency at Severance Hospital. He emphasizes restoring skin barriers and using safe, certified consumables.",
                hours: "Mon - Fri: 9:30 AM - 7:00 PM | Sat: 9:30 AM - 3:00 PM",
                map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.5702213797686!2d126.87427717646549!3d37.5239169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1s0x357c9f187a59df7d%3A0xe54ebad41a5d6f1!2sMok-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719037100000!5m2!1sen!2skr",
                slots_tag: "Max 3 Bookings/Hr",
                doctor_type: "dermatologist",
                sleep_anesthesia: false,
                anesthesiologist_resident: false,
                foreign_attraction_registered: false,
                foreigner_insurance: true,
                excellent_aftercare: true
            }
        ];
        loadedClinicsGlobal = fallback;
        renderClinicCards(fallback);
    } finally {
        if (searchInput) searchInput.disabled = false;
    }
}

function renderClinicCards(clinics) {
    const container = document.getElementById('dynamic-partner-list');
    if (!container) return;
    if (!clinics || clinics.length === 0) {
        container.innerHTML = `<div class="text-center" style="padding:40px; color:var(--text-muted); width:100%;">${t('directory.empty')}</div>`;
        return;
    }

    container.innerHTML = '';
    clinics.forEach(clinic => {
        const specs = Array.isArray(clinic.specialties) ? clinic.specialties : [];
        const tagsHTML = specs.map(spec => {
            const key = 'menu.' + spec.toLowerCase().replace(/ /g, '');
            const translated = t(key);
            const displayTag = (translated && translated !== key) ? translated : spec;
            return `<span class="partner-tag">${displayTag}</span>`;
        }).join('');
        const ratingVal = clinic.rating.includes('(') ? clinic.rating.split(' ')[1] : clinic.rating.replace('⭐', '').trim();

        let doctorTypeLabel = t(`badge.${clinic.doctor_type}`) || clinic.doctor_type;
        let anesthesiaLabel = clinic.sleep_anesthesia ? (clinic.anesthesiologist_resident ? t('badge.anesthesiologist') : t('badge.no_anesthesiologist')) : '';

        const cardHTML = `
            <div class="partner-card" data-clinic-id="${clinic.id}">
                <div class="partner-top">
                    <div class="partner-info">
                        <h4>${clinic.name}</h4>
                        <span class="partner-location">${clinic.location}</span>
                    </div>
                    <div class="partner-rating"><span>⭐ ${ratingVal}</span></div>
                </div>
                <div class="partner-tags">
                    ${tagsHTML}
                    <span class="partner-tag slots">${clinic.slots_tag}</span>
                </div>
                <div class="safety-badges-row">
                    <span class="safety-badge badge-dermatologist">${doctorTypeLabel}</span>
                    ${anesthesiaLabel ? `<span class="safety-badge badge-anesthesiologist">${anesthesiaLabel}</span>` : ''}
                    ${clinic.foreign_attraction_registered ? `<span class="safety-badge badge-registered">${t('badge.foreign_attraction')}</span>` : ''}
                    ${clinic.foreigner_insurance ? `<span class="safety-badge badge-insurance">${t('badge.foreigner_insurance')}</span>` : ''}
                    ${clinic.excellent_aftercare ? `<span class="safety-badge badge-aftercare">${t('badge.aftercare_excellence')}</span>` : ''}
                </div>
                <div class="partner-doctors">
                    <div class="doctor-profile">
                        <div class="doctor-avatar">${clinic.doctor_avatar}</div>
                        <div class="doctor-meta"><h5>${clinic.doctor_name}</h5><p>${clinic.doctor_title}</p></div>
                    </div>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// 예리 원장님 피드백 반영: 11개 세부 평점 카테고리 시각화 동적 연동 함수
function openClinicDetailModal(clinicId) {
    const data = loadedClinicsGlobal.find(c => c.id === parseInt(clinicId));
    if (!data) return;

    activeClinicId = clinicId;
    resetBookingViews();

    document.getElementById('clinic-detail-name').textContent = data.name;
    document.getElementById('clinic-detail-location').textContent = data.location;
    document.getElementById('clinic-detail-rating').textContent = data.rating;
    document.getElementById('clinic-detail-desc').textContent = data.description;
    document.getElementById('clinic-detail-hours').textContent = data.hours;

    const specialtiesContainer = document.getElementById('clinic-detail-specialties');
    specialtiesContainer.innerHTML = '';
    (data.specialties || []).forEach(spec => {
        const tag = document.createElement('span');
        tag.className = 'partner-tag';
        tag.textContent = spec;
        specialtiesContainer.appendChild(tag);
    });

    const safetyContainer = document.getElementById('clinic-detail-safety-grid');
    if (safetyContainer) {
        safetyContainer.innerHTML = '';
        const lang = getCurrentLang();

        const ratingCategories = [
            { label: t('rev_sim.cat_booking') || '1. Reservation:', score: getClinicCategoryScore(clinicId, 'booking') },
            { label: t('rev_sim.cat_visit') || '2. Arrival & Wait:', score: getClinicCategoryScore(clinicId, 'visit') },
            { label: t('rev_sim.cat_procedure') || '3. During treatment:', score: getClinicCategoryScore(clinicId, 'procedure') },
            { label: t('rev_sim.cat_post_care') || '4. Post-treatment:', score: getClinicCategoryScore(clinicId, 'post_care') },
            { label: t('rev_sim.cat_side_effect') || '5. Side Effects & Pain:', score: getClinicCategoryScore(clinicId, 'side_effect') },
            { label: t('rev_sim.cat_revisit') || '6. Intention to Revisit:', score: getClinicCategoryScore(clinicId, 'revisit') },
            { label: t('rev_sim.cat_parking') || '9. Parking:', score: getClinicCategoryScore(clinicId, 'parking') },
            { label: t('rev_sim.cat_kindness') || '10. Staff Friendliness:', score: getClinicCategoryScore(clinicId, 'kindness') },
            { label: t('rev_sim.cat_language_barrier') || '11. Language Inconvenience:', score: getClinicCategoryScore(clinicId, 'language_barrier') },
            { label: t('rev_sim.cat_recommend') || '12. Willingness to Recommend:', score: getClinicCategoryScore(clinicId, 'recommend') },
            { label: t('rev_sim.cat_onemonth') || '13. 1-Month Later Follow-up:', score: getClinicCategoryScore(clinicId, 'onemonth') }
        ];

        ratingCategories.forEach(cat => {
            const row = document.createElement('div');
            row.className = 'clinic-detail-rating-row';
            row.style.cssText = 'margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;';
            const pct = (cat.score / 5) * 100;

            row.innerHTML = `
                <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin-bottom: 4px;">
                    <span style="color: var(--text-primary);">${cat.label}</span>
                    <span style="color: var(--color-accent); font-weight: 700;">${cat.score} / 5.0</span>
                </div>
                <div style="width: 100%; height: 6px; background-color: var(--border-color); border-radius: 10px; overflow: hidden;">
                    <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-accent)); border-radius: 10px;"></div>
                </div>
            `;
            safetyContainer.appendChild(row);
        });

        // Good highlights
        const reviewsForClinic = submittedReviews.filter(r => r.clinicId === parseInt(clinicId));
        
        const highlightBox = document.createElement('div');
        highlightBox.style.cssText = 'margin-top: 16px; background: var(--bg-primary); padding: 12px; border-radius: 8px; font-size: 12px; border-left: 4px solid var(--color-success);';
        
        let goodText = lang === 'ko' ? '"원장님이 피부 두께를 직접 자로 재가며 파장을 수동 조절해 주신 점이 대만족이었습니다."' : '"Loved how the doctor manually adjusted the wavelength based on my exact skin profile."';
        if (reviewsForClinic.length > 0 && reviewsForClinic[reviewsForClinic.length - 1].good) {
            goodText = `"${reviewsForClinic[reviewsForClinic.length - 1].good}"`;
        }
        
        highlightBox.innerHTML = `
            <strong>💡 ${t('rev_sim.cat_good') || '7. Highlights'}:</strong>
            <p style="margin-top: 4px; font-style: italic; color: var(--text-secondary);">${goodText}</p>
        `;
        safetyContainer.appendChild(highlightBox);
        
        // Areas for Improvement
        let badText = "";
        if (reviewsForClinic.length > 0 && reviewsForClinic[reviewsForClinic.length - 1].bad) {
            badText = `"${reviewsForClinic[reviewsForClinic.length - 1].bad}"`;
        }
        
        if (badText) {
            const improvementBox = document.createElement('div');
            improvementBox.style.cssText = 'margin-top: 12px; background: var(--bg-primary); padding: 12px; border-radius: 8px; font-size: 12px; border-left: 4px solid var(--color-danger);';
            improvementBox.innerHTML = `
                <strong>⚠️ ${t('rev_sim.cat_bad') || '8. Areas for Improvement'}:</strong>
                <p style="margin-top: 4px; font-style: italic; color: var(--text-secondary);">${badText}</p>
            `;
            safetyContainer.appendChild(improvementBox);
        }
    }

    document.getElementById('clinic-detail-doc-avatar').textContent = data.doctor_avatar;
    document.getElementById('clinic-detail-doc-name').textContent = data.doctor_name;
    document.getElementById('clinic-detail-doc-title').textContent = data.doctor_title;
    document.getElementById('clinic-detail-doc-bio').textContent = data.doctor_bio;

    const mapIframe = document.getElementById('clinic-detail-map-iframe');
    if (mapIframe) mapIframe.src = data.map_iframe;

    const modal = document.getElementById('clinicModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function resetBookingViews() {
    document.getElementById('clinic-map-view').classList.add('active');
    document.getElementById('clinic-booking-view').classList.remove('active');
    document.getElementById('booking-success-view').style.display = 'none';
    document.getElementById('clinicBookingForm').style.display = 'block';
    document.getElementById('clinicBookingForm').reset();
}

function initClinicDetailModal() {
    const container = document.getElementById('dynamic-partner-list');
    const modal = document.getElementById('clinicModal');

    if (container) {
        container.addEventListener('click', (e) => {
            const card = e.target.closest('.partner-card');
            if (card) openClinicDetailModal(card.getAttribute('data-clinic-id'));
        });
    }

    document.getElementById('btnShowBookingForm')?.addEventListener('click', () => {
        document.getElementById('clinic-map-view').classList.remove('active');
        document.getElementById('clinic-booking-view').classList.add('active');
    });

    document.getElementById('btnBackToMap')?.addEventListener('click', resetBookingViews);
    document.getElementById('btnResetBookingModal')?.addEventListener('click', resetBookingViews);

    document.getElementById('btnCloseClinic')?.addEventListener('click', closeClinicModal);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeClinicModal(); });
}

function closeClinicModal() {
    const modal = document.getElementById('clinicModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('clinic-detail-map-iframe').src = '';
    }
}

let activeTreatmentFilter = 'all';

function applyFilters() {
    const searchInput = document.getElementById('directorySearchInput');
    const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    const activeTagBtn = document.querySelector('.filter-tag.active');
    const tagFilter = activeTagBtn ? activeTagBtn.getAttribute('data-specialty') : 'all';
    
    let filtered = loadedClinicsGlobal;
    
    // 1. Category Menu Filter
    if (activeTreatmentFilter !== 'all') {
        filtered = filtered.filter(c => {
            return c.specialties.some(spec => {
                const specLower = spec.toLowerCase().replace(/ /g, '');
                const filterLower = activeTreatmentFilter.toLowerCase().replace(/ /g, '');
                return specLower.includes(filterLower);
            });
        });
    }
    
    // 2. Tag Filter
    if (tagFilter !== 'all') {
        filtered = filtered.filter(c => c.specialties.includes(tagFilter));
    }
    
    // 3. Search Input Query
    if (q) {
        filtered = filtered.filter(c => {
            const nameMatch = c.name.toLowerCase().includes(q);
            const docMatch = c.doctor_name.toLowerCase().includes(q);
            const specMatch = c.specialties.some(spec => {
                const specLower = spec.toLowerCase();
                const key = 'menu.' + specLower.replace(/ /g, '');
                const trans = t(key).toLowerCase();
                return specLower.includes(q) || trans.includes(q);
            });
            return nameMatch || docMatch || specMatch;
        });
    }
    
    renderClinicCards(filtered);
}

function initSearchAndFilters() {
    const searchInput = document.getElementById('directorySearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFilters();
        });
    }
    
    const tagsWrapper = document.getElementById('filterTagsWrapper');
    if (tagsWrapper) {
        tagsWrapper.querySelectorAll('.filter-tag').forEach(tagBtn => {
            tagBtn.addEventListener('click', () => {
                tagsWrapper.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
                tagBtn.classList.add('active');
                applyFilters();
            });
        });
    }
    
    window.addEventListener('languageChanged', () => {
        applyFilters();
    });
}

function initTreatmentMenu() {
    const menuItems = document.querySelectorAll('.treatment-card');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const treatment = item.getAttribute('data-treatment');
            
            if (item.classList.contains('active')) {
                item.classList.remove('active');
                activeTreatmentFilter = 'all';
            } else {
                menuItems.forEach(card => card.classList.remove('active'));
                item.classList.add('active');
                activeTreatmentFilter = treatment;
            }
            
            applyFilters();
            
            // Scroll to directory section
            const dirSection = document.querySelector('.section-directory');
            if (dirSection) {
                dirSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Global reviews state
let submittedReviews = [];

const baseRatings = {
    1: { booking: 4.8, visit: 4.5, procedure: 4.9, post_care: 4.7, side_effect: 1.2, revisit: 4.8, parking: 4.4, kindness: 4.7, language_barrier: 4.5, recommend: 4.9, onemonth: 4.7 },
    2: { booking: 4.7, visit: 4.6, procedure: 4.8, post_care: 4.6, side_effect: 1.5, revisit: 4.7, parking: 4.2, kindness: 4.8, language_barrier: 4.6, recommend: 4.8, onemonth: 4.6 },
    3: { booking: 4.9, visit: 4.4, procedure: 4.9, post_care: 4.8, side_effect: 1.1, revisit: 4.9, parking: 4.5, kindness: 4.9, language_barrier: 4.8, recommend: 4.9, onemonth: 4.8 },
    4: { booking: 4.6, visit: 4.5, procedure: 4.7, post_care: 4.5, side_effect: 1.8, revisit: 4.6, parking: 4.1, kindness: 4.7, language_barrier: 4.4, recommend: 4.7, onemonth: 4.5 },
    5: { booking: 4.8, visit: 4.3, procedure: 4.8, post_care: 4.6, side_effect: 1.4, revisit: 4.8, parking: 4.3, kindness: 4.8, language_barrier: 4.7, recommend: 4.8, onemonth: 4.7 }
};

function getClinicCategoryScore(clinicId, categoryKey) {
    const clinicIdInt = parseInt(clinicId);
    const defaultScore = baseRatings[clinicIdInt]?.[categoryKey] || 4.5;
    const reviewsForClinic = submittedReviews.filter(r => r.clinicId === clinicIdInt);
    if (reviewsForClinic.length === 0) return defaultScore;
    
    let sum = defaultScore;
    reviewsForClinic.forEach(r => {
        sum += parseFloat(r[categoryKey]);
    });
    return (sum / (reviewsForClinic.length + 1)).toFixed(1);
}

function getClinicOverallRating(clinicId) {
    const categories = ['booking', 'visit', 'procedure', 'post_care', 'revisit', 'parking', 'kindness', 'language_barrier', 'recommend', 'onemonth'];
    let sum = 0;
    categories.forEach(cat => {
        sum += parseFloat(getClinicCategoryScore(clinicId, cat));
    });
    return (sum / categories.length).toFixed(1);
}

let passportUploaded = false;
let receiptUploaded = false;
let currentWriterStep = 1;

// 리뷰 작성 시뮬레이터 핸들러 및 원장 리스트 드롭다운 롤메뉴 리바인딩 패치 완료
function initReviewWriter() {
    document.getElementById('btnOpenReviewWriter')?.addEventListener('click', () => {
        document.getElementById('reviewWriterModal').classList.add('active');
        // 🚨 모달이 열리는 순간 드롭다운에 원장님 명단을 깨짐 없이 동적 주입합니다.
        updateReviewDoctorDropdown();
        resetReviewWriterModal();
    });
    
    document.getElementById('btnCloseReviewWriter')?.addEventListener('click', () => {
        document.getElementById('reviewWriterModal').classList.remove('active');
    });
    
    initDropzones();
    initWhistleblower();
    initWizard();
}

function resetReviewWriterModal() {
    currentWriterStep = 1;
    passportUploaded = false;
    receiptUploaded = false;
    
    // Hide success indicators
    const passportSuccess = document.getElementById('passportSuccess');
    const receiptSuccess = document.getElementById('receiptSuccess');
    if (passportSuccess) passportSuccess.style.display = 'none';
    if (receiptSuccess) receiptSuccess.style.display = 'none';
    
    // Reset dropzone styles
    const passportDropzone = document.getElementById('passportDropzone');
    const receiptDropzone = document.getElementById('receiptDropzone');
    if (passportDropzone) {
        passportDropzone.style.borderColor = 'var(--border-color)';
        passportDropzone.style.backgroundColor = 'var(--bg-primary)';
    }
    if (receiptDropzone) {
        receiptDropzone.style.borderColor = 'var(--border-color)';
        receiptDropzone.style.backgroundColor = 'var(--bg-primary)';
    }
    
    // Reset inputs
    document.getElementById('reviewWriterForm')?.reset();
    
    // Reset whistleblower report button
    const btnReportBribe = document.getElementById('btnReportBribe');
    const whistleblowerSuccess = document.getElementById('whistleblowerSuccess');
    if (btnReportBribe) btnReportBribe.style.display = 'block';
    if (whistleblowerSuccess) whistleblowerSuccess.style.display = 'none';
    
    // Show controls block if hidden
    const controls = document.getElementById('writerControls');
    if (controls) controls.style.display = 'flex';
    
    updateSliderValues();
    updateWizardUI();
}

function updateSliderValues() {
    const sliders = [
        { id: 'booking', default: 5 },
        { id: 'visit', default: 5 },
        { id: 'procedure', default: 5 },
        { id: 'post-care', default: 5 },
        { id: 'side-effect', default: 1 },
        { id: 'revisit', default: 5 },
        { id: 'parking', default: 5 },
        { id: 'kindness', default: 5 },
        { id: 'language-barrier', default: 5 },
        { id: 'recommend', default: 5 },
        { id: 'onemonth', default: 5 }
    ];
    
    sliders.forEach(slider => {
        const input = document.getElementById(`slide-${slider.id}`);
        const badge = document.getElementById(`val-${slider.id}`);
        if (input && badge) {
            input.value = slider.default;
            badge.textContent = `${slider.default} / 5`;
            
            // Listen for input events to update real-time values
            input.oninput = () => {
                badge.textContent = `${input.value} / 5`;
            };
        }
    });
}

function initDropzones() {
    const passportDropzone = document.getElementById('passportDropzone');
    const receiptDropzone = document.getElementById('receiptDropzone');
    const passportSuccess = document.getElementById('passportSuccess');
    const receiptSuccess = document.getElementById('receiptSuccess');
    
    if (passportDropzone) {
        passportDropzone.onclick = () => {
            passportUploaded = true;
            if (passportSuccess) passportSuccess.style.display = 'block';
            passportDropzone.style.borderColor = 'var(--color-success)';
            passportDropzone.style.backgroundColor = 'rgba(46, 125, 50, 0.05)';
        };
    }
    
    if (receiptDropzone) {
        receiptDropzone.onclick = () => {
            receiptUploaded = true;
            if (receiptSuccess) receiptSuccess.style.display = 'block';
            receiptDropzone.style.borderColor = 'var(--color-success)';
            receiptDropzone.style.backgroundColor = 'rgba(46, 125, 50, 0.05)';
        };
    }
}

function initWhistleblower() {
    const btnReportBribe = document.getElementById('btnReportBribe');
    const whistleblowerSuccess = document.getElementById('whistleblowerSuccess');
    if (btnReportBribe) {
        btnReportBribe.onclick = () => {
            if (whistleblowerSuccess) {
                whistleblowerSuccess.style.display = 'block';
            }
            btnReportBribe.style.display = 'none';
        };
    }
}

function initWizard() {
    const btnPrev = document.getElementById('btnWriterPrev');
    const btnNext = document.getElementById('btnWriterNext');
    
    if (!btnNext) return;
    
    currentWriterStep = 1;
    updateWizardUI();
    
    btnPrev.onclick = () => {
        if (currentWriterStep > 1) {
            currentWriterStep--;
            updateWizardUI();
        }
    };
    
    btnNext.onclick = () => {
        if (currentWriterStep === 1) {
            // Validate doctor selection
            const docSelect = document.getElementById('reviewDoctorSelect');
            if (!docSelect || !docSelect.value) {
                alert(getCurrentLang() === 'ko' ? '시술 원장님을 선택해주세요.' : 'Please select the treating physician.');
                return;
            }
            // Validate uploads
            if (!passportUploaded || !receiptUploaded) {
                alert(getCurrentLang() === 'ko' ? '여권 및 영수증 인증 서류를 클릭하여 등록해주세요.' : 'Please click on passport and receipt dropzones to upload verification documents.');
                return;
            }
            
            currentWriterStep = 2;
            updateWizardUI();
        } else if (currentWriterStep === 2) {
            // Validate highlights (good review)
            const textGood = document.getElementById('text-good');
            if (!textGood || !textGood.value.trim()) {
                alert(getCurrentLang() === 'ko' ? '좋았던 점(Highlights)을 작성해주세요.' : 'Please write your highlights.');
                return;
            }
            
            currentWriterStep = 3;
            updateWizardUI();
        } else if (currentWriterStep === 3) {
            // Submit review!
            submitReview();
        }
    };
}

function updateWizardUI() {
    const panels = [
        document.getElementById('writer-panel-1'),
        document.getElementById('writer-panel-2'),
        document.getElementById('writer-panel-3'),
        document.getElementById('writer-panel-4')
    ];
    
    const indicators = [
        document.getElementById('step-ind-1'),
        document.getElementById('step-ind-2'),
        document.getElementById('step-ind-3')
    ];
    
    const btnPrev = document.getElementById('btnWriterPrev');
    const btnNext = document.getElementById('btnWriterNext');
    
    // Hide all panels, show current
    panels.forEach((panel, idx) => {
        if (panel) {
            if (idx === currentWriterStep - 1) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        }
    });
    
    // Update step indicators
    indicators.forEach((ind, idx) => {
        if (ind) {
            if (idx < currentWriterStep - 1) {
                ind.className = 'step-indicator completed';
                ind.innerHTML = '✓';
            } else if (idx === currentWriterStep - 1) {
                ind.className = 'step-indicator active';
                ind.innerHTML = idx + 1;
            } else {
                ind.className = 'step-indicator';
                ind.innerHTML = idx + 1;
            }
        }
    });
    
    // Update button states
    if (btnPrev && btnNext) {
        if (currentWriterStep === 1) {
            btnPrev.disabled = true;
            btnNext.innerHTML = getCurrentLang() === 'ko' ? '다음 &rarr;' : 'Next &rarr;';
        } else if (currentWriterStep === 2) {
            btnPrev.disabled = false;
            btnNext.innerHTML = getCurrentLang() === 'ko' ? '다음 &rarr;' : 'Next &rarr;';
        } else if (currentWriterStep === 3) {
            btnPrev.disabled = false;
            btnNext.innerHTML = t('rev_sim.submit') || 'Upload Authenticated Review';
        } else if (currentWriterStep === 4) {
            // Success step: controls should be hidden
            const controls = document.getElementById('writerControls');
            if (controls) controls.style.display = 'none';
        }
    }
}

function submitReview() {
    const docSelect = document.getElementById('reviewDoctorSelect');
    const clinicId = parseInt(docSelect.value);
    
    const reviewData = {
        clinicId: clinicId,
        booking: parseInt(document.getElementById('slide-booking')?.value || 5),
        visit: parseInt(document.getElementById('slide-visit')?.value || 5),
        procedure: parseInt(document.getElementById('slide-procedure')?.value || 5),
        post_care: parseInt(document.getElementById('slide-post-care')?.value || 5),
        side_effect: parseInt(document.getElementById('slide-side-effect')?.value || 1),
        revisit: parseInt(document.getElementById('slide-revisit')?.value || 5),
        parking: parseInt(document.getElementById('slide-parking')?.value || 5),
        kindness: parseInt(document.getElementById('slide-kindness')?.value || 5),
        language_barrier: parseInt(document.getElementById('slide-language-barrier')?.value || 5),
        recommend: parseInt(document.getElementById('slide-recommend')?.value || 5),
        onemonth: parseInt(document.getElementById('slide-onemonth')?.value || 5),
        good: document.getElementById('text-good')?.value || "",
        bad: document.getElementById('text-bad')?.value || ""
    };
    
    submittedReviews.push(reviewData);
    
    // 1. Recalculate clinic average rating and update global array
    const clinic = loadedClinicsGlobal.find(c => c.id === clinicId);
    if (clinic) {
        const overallRating = getClinicOverallRating(clinicId);
        const count = 120 + submittedReviews.filter(r => r.clinicId === clinicId).length;
        clinic.rating = `⭐ ${overallRating} (${count}+ verified reviews)`;
        
        // 2. Rerender clinic cards on the landing page
        renderClinicCards(loadedClinicsGlobal);
    }
    
    // 3. Dynamically insert a new card to the verified reviews grid
    appendReviewToGrid(reviewData);
    
    // 4. Update wizard to Success panel
    currentWriterStep = 4;
    updateWizardUI();
}

function appendReviewToGrid(review) {
    const grid = document.querySelector('.reviews-grid');
    if (!grid) return;
    
    const triggerBtn = document.getElementById('btnOpenReviewWriter');
    if (!triggerBtn) return;
    
    const clinic = loadedClinicsGlobal.find(c => c.id === review.clinicId);
    const clinicName = clinic ? clinic.name : 'Selected Boutique Clinic';
    const doctorName = clinic ? clinic.doctor_name : 'Chief Physician';
    
    const fitzType = quizData.fitzpatrickType || 3;
    const skinLabel = getCurrentLang() === 'ko' ? `피츠패트릭 Type ${fitzType}` : `Fitzpatrick Type ${fitzType}`;
    const initials = 'UR';
    const reviewerName = getCurrentLang() === 'ko' ? '방문 인증 회원' : 'Verified Patient';
    
    const procedureScore = review.procedure;
    const stars = '⭐'.repeat(procedureScore);
    
    const cardHTML = `
        <div class="review-card" style="animation: fadeIn 0.6s ease;">
            <div class="review-card-header">
                <div class="reviewer-profile">
                    <div class="reviewer-avatar" style="background-color: var(--color-accent); color: #fff;">${initials}</div>
                    <div>
                        <div class="reviewer-name">${reviewerName}</div>
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${skinLabel}</div>
                    </div>
                </div>
                <div class="review-meta">
                    <div class="review-stars">${stars}</div>
                    <span class="review-verify-badge" data-i18n="reviews.verified_badge">✓ Receipt Verified</span>
                </div>
            </div>
            <p class="review-content">
                "${review.good}"
            </p>
            <div class="review-doctor-link">
                <span>Clinic: ${clinicName}</span>
                <span>Physician: <strong>${doctorName}</strong></span>
            </div>
        </div>
    `;
    
    triggerBtn.insertAdjacentHTML('beforebegin', cardHTML);
}

function updateReviewDoctorDropdown() {
    const docSelect = document.getElementById('reviewDoctorSelect');
    if (!docSelect) return;
 
    docSelect.innerHTML = '';
 
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = getCurrentLang() === 'ko' ? '-- 시술 원장님을 선택하세요 --' : '-- Select Treating Physician --';
    docSelect.appendChild(defaultOpt);
 
    if (loadedClinicsGlobal && loadedClinicsGlobal.length > 0) {
        loadedClinicsGlobal.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.doctor_name} (${c.name})`;
            docSelect.appendChild(opt);
        });
    } else {
        const backupClinics = [
            { id: 1, name: "Cheongdam Barrier Lab", doctor_name: "Dr. Ji-Yeon Lee" },
            { id: 2, name: "Myeongdong Forest Dermatology", doctor_name: "Dr. Minji Kim" },
            { id: 3, name: "Hannam Aesthetic & Laser House", doctor_name: "Dr. Tae-Young Park" },
            { id: 4, name: "Sinsa Glow Dermatology", doctor_name: "Dr. Seo-Jun Choi" },
            { id: 5, name: "Hongdae Calm Skin Clinic", doctor_name: "Dr. Eun-Ji Song" }
        ];
        backupClinics.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = getCurrentLang() === 'ko' && c.id === 2 ? `김민지 원장 (명동 포레스트)` : `${c.doctor_name} (${c.name})`;
            docSelect.appendChild(opt);
        });
    }
}

// ========================================================
// Expandable Reviews – Dummy Data & Rendering
// ========================================================

const DUMMY_REVIEWS = [
    { name: "Emily W.", initials: "EW", date: "2025.09.15", stars: 5, treatment: "💉 Pico Laser Toning", helpful: 12, clinicId: 4, clinic: "Sinsa Glow Dermatology", doctor: "Dr. Seo-Jun Choi", text_en: "\"Booked through KOMICARE after reading about Pico safety for Type I skin. Dr. Choi spent 15 minutes on consultation alone. My melasma has faded dramatically after 3 sessions. Worth every won.\"", text_ko: "\"KOMICARE를 통해 Type I 피부에 안전한 피코 레이저를 예약했어요. 최서준 원장님이 상담에만 15분을 써주셨고, 3회 시술 후 기미가 눈에 띄게 옅어졌습니다.\"" },
    { name: "Yuki T.", initials: "YT", date: "2025.08.22", stars: 5, treatment: "✨ Botox (Forehead)", helpful: 9, clinicId: 3, clinic: "Hannam Aesthetic & Laser House", doctor: "Dr. Tae-Young Park", text_en: "\"First time getting Botox outside Japan. Dr. Park used micro-dosing technique and the result is incredibly natural. No frozen look at all. The clinic was spotless and private.\"", text_ko: "\"일본 밖에서 처음으로 보톡스를 맞았어요. 박태영 원장님이 마이크로 도징 기법을 사용하셔서 결과가 매우 자연스럽습니다. 클리닉도 깨끗하고 프라이빗했어요.\"" },
    { name: "Sarah L.", initials: "SL", date: "2025.10.05", stars: 4, treatment: "💧 Skin Booster (Juvelook)", helpful: 7, clinicId: 1, clinic: "Cheongdam Barrier Lab", doctor: "Dr. Ji-Yeon Lee", text_en: "\"Juvelook treatment was smooth. Dr. Lee explained the collagen stimulation process thoroughly. Only 4 stars because the wait time was slightly longer than expected, but the result speaks for itself.\"", text_ko: "\"쥬베룩 시술이 매끄러웠어요. 이지연 원장님이 콜라겐 자극 과정을 꼼꼼히 설명해주셨습니다. 대기 시간이 약간 길었지만 결과는 확실합니다.\"" },
    { name: "David K.", initials: "DK", date: "2025.11.20", stars: 5, treatment: "🧴 Acne Scar Treatment", helpful: 15, clinicId: 5, clinic: "Hongdae Calm Skin Clinic", doctor: "Dr. Eun-Ji Song", text_en: "\"Had severe acne scars from my teens. Dr. Song combined fractional laser with PRP therapy. After 5 sessions, my skin texture improved by at least 70%. She genuinely cares about results.\"", text_ko: "\"10대 시절부터 심한 여드름 흉터가 있었어요. 송은지 원장님이 프랙셔널 레이저와 PRP를 병행하셨고, 5회 시술 후 피부결이 70% 이상 개선됐습니다.\"" },
    { name: "Maria G.", initials: "MG", date: "2025.07.30", stars: 5, treatment: "💉 Filler (Nasolabial)", helpful: 11, clinicId: 11, clinic: "Banpo Glass Skin Lab", doctor: "Dr. Da-Eun Yoo", text_en: "\"Came from Spain specifically for Korean dermatology. Dr. Yoo's filler technique is artistic – she used a cannula method that left zero bruising. My nasolabial folds look 10 years younger.\"", text_ko: "\"한국 피부과를 위해 스페인에서 왔어요. 유다은 원장님의 필러 기법은 예술적입니다. 캐뉼라 기법으로 멍이 전혀 없었고, 팔자주름이 10년은 젊어 보여요.\"" },
    { name: "James C.", initials: "JC", date: "2025.12.01", stars: 5, treatment: "💪 Lifting (Ulthera)", helpful: 19, clinicId: 20, clinic: "Gangnam V-line Clinic", doctor: "Dr. Young-Ho Koh", text_en: "\"Ultherapy at a boutique clinic is a completely different experience. Dr. Koh mapped out every treatment line and adjusted energy levels for my jawline specifically. Factory clinics just blast you with the same settings.\"", text_ko: "\"부티크 클리닉에서의 울쎄라는 완전히 다른 경험이에요. 고영호 원장님이 모든 시술 라인을 매핑하고 턱선에 맞게 에너지를 조절하셨습니다.\"" },
    { name: "Priya S.", initials: "PS", date: "2025.09.28", stars: 4, treatment: "🎯 Pigmentation (Laser)", helpful: 8, clinicId: 17, clinic: "Itaewon Global Skin Clinic", doctor: "Dr. Sarah Miller", text_en: "\"As an Indian woman (Type IV), finding a clinic that understands melanin-rich skin was crucial. Dr. Miller used a Q-switched Nd:YAG specifically calibrated for my skin. Took more sessions but no PIH.\"", text_ko: "\"인도 여성(Type IV)으로서 멜라닌이 풍부한 피부를 이해하는 클리닉을 찾는 것이 중요했어요. 밀러 원장님이 제 피부에 맞게 Q-스위치 Nd:YAG를 캘리브레이션하셨습니다.\"" },
    { name: "Alex M.", initials: "AM2", date: "2025.10.10", stars: 5, treatment: "💊 Obesity Injection (Saxenda)", helpful: 6, clinicId: 2, clinic: "Myeongdong Forest Dermatology", doctor: "Dr. Minji Kim", text_en: "\"Dr. Kim monitored my blood panels before starting Saxenda. She created a gradual dose-escalation plan and checked in weekly. Lost 8kg in 3 months with zero side effects. This is how medical weight loss should work.\"", text_ko: "\"김민지 원장님이 삭센다 시작 전 혈액 검사를 해주셨어요. 점진적 용량 증량 계획을 세워주시고 매주 체크인하셨습니다. 3개월에 8kg 감량, 부작용 제로.\"" },
    { name: "Chen W.", initials: "CW", date: "2025.11.05", stars: 5, treatment: "🧬 Hair Loss (PRP)", helpful: 14, clinicId: 9, clinic: "Cheongdam Youth Hair Clinic", doctor: "Dr. Ji-Hoon Kang", text_en: "\"Was skeptical about PRP for hair loss but Dr. Kang showed me clinical data from his previous patients. After 6 sessions, my crown area has visible new growth. He's the real deal.\"", text_ko: "\"탈모에 PRP가 효과가 있을지 회의적이었지만, 강지훈 원장님이 이전 환자들의 임상 데이터를 보여주셨어요. 6회 시술 후 정수리에 새 모발이 눈에 띄게 자랐습니다.\"" },
    { name: "Rachel P.", initials: "RP", date: "2025.08.15", stars: 5, treatment: "✨ Hair Removal (Full Leg)", helpful: 10, clinicId: 10, clinic: "Seoul Station Gateway Dermatology", doctor: "Dr. Jin-Soo Kim", text_en: "\"Best hair removal experience ever. Dr. Kim used a diode laser with a cooling tip – minimal pain compared to the factory chain I tried before. 4 sessions in and my legs are silky smooth.\"", text_ko: "\"최고의 제모 경험이었어요. 김진수 원장님이 쿨링 팁이 달린 다이오드 레이저를 사용하셔서 이전 체인 클리닉보다 통증이 훨씬 적었습니다.\"" },
    { name: "Fatima A.", initials: "FA", date: "2025.12.10", stars: 5, treatment: "💉 Filler (Tear Trough)", helpful: 22, clinicId: 1, clinic: "Cheongdam Barrier Lab", doctor: "Dr. Ji-Yeon Lee", text_en: "\"Tear trough filler is risky if done wrong. Dr. Lee used HA filler with a blunt cannula and the Tyndall effect was completely avoided. My under-eye hollows are gone and it looks natural.\"", text_ko: "\"눈밑 필러는 잘못하면 위험한데, 이지연 원장님이 블런트 캐뉼라로 HA 필러를 사용하셔서 틴달 현상이 완전히 방지됐습니다. 다크서클이 사라지고 자연스러워요.\"" },
    { name: "Tom B.", initials: "TB", date: "2025.07.20", stars: 4, treatment: "💧 Skin Booster (Rejuran)", helpful: 5, clinicId: 3, clinic: "Hannam Aesthetic & Laser House", doctor: "Dr. Tae-Young Park", text_en: "\"Rejuran healer treatment was good overall. Slight redness for 2 days which Dr. Park warned me about. My pores look significantly smaller after 3 weeks. Would come back for maintenance.\"", text_ko: "\"리쥬란 힐러 시술이 전반적으로 좋았어요. 박태영 원장님이 미리 경고해준 대로 2일간 약간 붉었지만, 3주 후 모공이 확연히 작아졌습니다.\"" },
    { name: "Sophie R.", initials: "SR", date: "2025.10.25", stars: 5, treatment: "✨ Botox (Masseter)", helpful: 17, clinicId: 7, clinic: "Apgujeong Royal Dermatologists", doctor: "Dr. Sang-Hyun Park", text_en: "\"Got masseter Botox for jawline slimming. Dr. Park measured my masseter thickness with ultrasound before deciding on units. Result: a beautifully contoured face without that over-done look.\"", text_ko: "\"턱 슬리밍을 위해 교근 보톡스를 맞았어요. 박상현 원장님이 초음파로 교근 두께를 측정한 후 유닛을 결정하셨습니다. 과하지 않은 아름다운 윤곽이에요.\"" },
    { name: "Michael O.", initials: "MO", date: "2025.09.08", stars: 5, treatment: "🧴 Acne Treatment (Isotretinoin)", helpful: 13, clinicId: 8, clinic: "Gangnam Clear Acne Center", doctor: "Dr. Yoon-Seo Jang", text_en: "\"Severe cystic acne for years. Dr. Jang prescribed isotretinoin with monthly blood monitoring and customized my skincare routine. 6 months later, my skin is clear for the first time since puberty.\"", text_ko: "\"수년간 심한 낭포성 여드름이 있었어요. 장윤서 원장님이 매월 혈액 검사와 함께 이소트레티노인을 처방하고 스킨케어 루틴을 맞춤 설정해주셨습니다.\"" },
    { name: "Nina K.", initials: "NK", date: "2025.11.28", stars: 5, treatment: "💪 Lifting (Oligio)", helpful: 9, clinicId: 21, clinic: "Bundang Grace Skin Lab", doctor: "Dr. Hye-Jin Lim", text_en: "\"Chose Oligio over Ulthera for less downtime. Dr. Lim's technique was precise – she focused on my sagging cheek area and the results were visible within 2 weeks. Premium experience all around.\"", text_ko: "\"다운타임이 적은 올리지오를 선택했어요. 임혜진 원장님의 정밀한 기법으로 처진 볼 부위에 집중하셨고, 2주 만에 효과가 나타났습니다.\"" },
    { name: "Lucas F.", initials: "LF", date: "2025.08.05", stars: 4, treatment: "🎯 Pigmentation (IPL)", helpful: 6, clinicId: 12, clinic: "Dongdaemun Glow Laser", doctor: "Dr. Nam-gyu Park", text_en: "\"IPL for sun spots. Dr. Park was cautious with my Type III skin and used lower energy with more passes. Spots are 80% lighter. Slightly more sessions needed but I'd rather be safe.\"", text_ko: "\"기미 제거를 위한 IPL이었어요. 박남규 원장님이 Type III 피부에 맞게 낮은 에너지로 더 많은 패스를 사용하셨습니다. 안전하게 80% 옅어졌어요.\"" },
    { name: "Hannah J.", initials: "HJ", date: "2025.12.15", stars: 5, treatment: "💉 Pico Laser (Tattoo Removal)", helpful: 20, clinicId: 2, clinic: "Myeongdong Forest Dermatology", doctor: "Dr. Minji Kim", text_en: "\"Removing a forearm tattoo. Dr. Kim explained the picosecond advantage over Q-switch for my ink colors. After 4 sessions, it's 60% faded with minimal scarring. She's methodical and honest about timelines.\"", text_ko: "\"팔뚝 타투 제거 중이에요. 김민지 원장님이 제 잉크 색상에 피코초가 Q-스위치보다 유리한 이유를 설명해주셨습니다. 4회 후 60% 옅어졌고 흉터도 최소화됐어요.\"" },
    { name: "Oscar D.", initials: "OD", date: "2025.10.18", stars: 5, treatment: "💊 Obesity Injection (Contrave)", helpful: 8, clinicId: 6, clinic: "Yeouido Line Skin Clinic", doctor: "Dr. Min-Woo Cho", text_en: "\"Dr. Cho's weight management program is evidence-based. He combined Contrave with a personalized meal plan. Lost 12kg in 4 months. No crash dieting, just science.\"", text_ko: "\"조민우 원장님의 체중 관리 프로그램은 근거 기반입니다. 콘트라브와 맞춤 식단 계획을 병행하셨고, 4개월에 12kg 감량했어요.\"" },
    { name: "Aisha R.", initials: "AR", date: "2025.09.22", stars: 5, treatment: "✨ Hair Removal (Underarm)", helpful: 11, clinicId: 19, clinic: "Yeongdeungpo Laser Center", doctor: "Dr. Tae-Jin Yoon", text_en: "\"As a Type V skin, I was worried about burns from laser hair removal. Dr. Yoon used a long-pulsed Nd:YAG at conservative settings. 5 sessions done, virtually hair-free with zero pigmentation issues.\"", text_ko: "\"Type V 피부라 레이저 제모 시 화상이 걱정됐어요. 윤태진 원장님이 보수적인 세팅으로 롱펄스 Nd:YAG를 사용하셨고, 5회 후 색소 문제 없이 거의 무모 상태입니다.\"" },
    { name: "Kevin Z.", initials: "KZ", date: "2025.11.12", stars: 5, treatment: "💧 Skin Booster (Profhilo)", helpful: 16, clinicId: 15, clinic: "Insadong Skin Healing", doctor: "Dr. Seo-Yeon Jung", text_en: "\"Profhilo bio-remodeling by Dr. Jung was transformative. She injected at 10 BAP points and the hydration boost kicked in within a week. My neck skin looks 5 years younger. Boutique quality you can't get at chain clinics.\"", text_ko: "\"정서연 원장님의 프로파일로 바이오 리모델링은 혁신적이었어요. 10개의 BAP 포인트에 주입하셨고, 일주일 만에 보습 효과가 나타났습니다.\"" },
    { name: "Laura H.", initials: "LH", date: "2025.08.28", stars: 4, treatment: "🧬 Hair Loss (Minoxidil + Laser Cap)", helpful: 7, clinicId: 18, clinic: "Mapo Clear Hair Clinic", doctor: "Dr. Sung-Min Ryu", text_en: "\"Female pattern hair loss is tough to treat. Dr. Ryu combined prescription minoxidil with low-level laser therapy. After 4 months, I'm seeing baby hairs along my hairline. Patience is key, he says.\"", text_ko: "\"여성형 탈모는 치료가 어렵지만, 류성민 원장님이 처방 미녹시딜과 저출력 레이저를 병행하셨습니다. 4개월 후 헤어라인에 잔머리가 보이기 시작했어요.\"" },
    { name: "Daniel S.", initials: "DS", date: "2025.12.08", stars: 5, treatment: "💉 Filler (Chin Augmentation)", helpful: 14, clinicId: 16, clinic: "Seocho Skin Balance", doctor: "Dr. Dong-Hyun Shin", text_en: "\"Non-surgical chin augmentation with filler. Dr. Shin analyzed my facial proportions and used 2 syringes of Volux for a defined jawline. The before/after is dramatic. No surgery needed.\"", text_ko: "\"필러로 비수술 턱 확대를 했어요. 신동현 원장님이 얼굴 비율을 분석하고 볼룩스 2시린지로 선명한 턱선을 만들어주셨습니다. 비포/애프터가 극적이에요.\"" },
    { name: "Clara M.", initials: "CM", date: "2025.07.15", stars: 5, treatment: "🧴 Acne Scar (Subcision)", helpful: 18, clinicId: 22, clinic: "Mokdong Pure Skin Clinic", doctor: "Dr. Kyu-Hyun Hwang", text_en: "\"Rolling acne scars on my cheeks. Dr. Hwang performed subcision followed by cross TCA. After 3 rounds, the depth of my scars reduced significantly. He takes clinical photos every visit for comparison.\"", text_ko: "\"볼에 롤링 여드름 흉터가 있었어요. 황규현 원장님이 서브시전 후 크로스 TCA를 시행하셨고, 3회 후 흉터 깊이가 크게 줄었습니다. 매 방문마다 임상 사진을 찍어 비교해주세요.\"" },
    { name: "Robert Y.", initials: "RY", date: "2025.10.30", stars: 5, treatment: "💪 Lifting (Thread Lift)", helpful: 10, clinicId: 14, clinic: "Jamsil Aesthetic", doctor: "Dr. Jae-Hee Song", text_en: "\"PDO thread lift for my midface. Dr. Song used bidirectional cog threads and the lift is visible immediately. Minimal swelling, back to work in 3 days. This is the future of non-invasive lifting.\"", text_ko: "\"중안면 PDO 실리프트를 했어요. 송재희 원장님이 양방향 코그실을 사용하셔서 리프팅이 즉시 보입니다. 부기 최소, 3일 만에 출근했어요.\"" },
    { name: "Lena V.", initials: "LV", date: "2025.09.18", stars: 4, treatment: "🎯 Pigmentation (Cosmelan)", helpful: 9, clinicId: 17, clinic: "Itaewon Global Skin Clinic", doctor: "Dr. Sarah Miller", text_en: "\"Cosmelan peel for stubborn melasma. Dr. Miller warned about the peeling phase being intense – she wasn't wrong. But 6 weeks later, my skin is the most even-toned it's been in years. Trust the process.\"", text_ko: "\"완고한 기미를 위한 코스멜란 필이었어요. 밀러 원장님이 필링 단계가 강할 거라고 경고하셨는데 맞았어요. 하지만 6주 후 몇 년 만에 가장 균일한 피부톤을 얻었습니다.\"" },
    { name: "Marco P.", initials: "MP", date: "2025.11.25", stars: 5, treatment: "✨ Botox (Neck Bands)", helpful: 7, clinicId: 13, clinic: "Suyu Relief Dermatology", doctor: "Dr. Bo-Min Choi", text_en: "\"Nefertiti neck lift with Botox. Dr. Choi injected along my platysma bands and the neck definition is incredible. People think I got surgery. Truly an artist with a syringe.\"", text_ko: "\"네페르티티 넥 리프트를 보톡스로 했어요. 최보민 원장님이 활경근 밴드를 따라 주입하셨고, 목선이 놀라울 정도로 선명해졌습니다.\"" },
    { name: "Ayumi N.", initials: "AN", date: "2025.08.12", stars: 5, treatment: "💧 Skin Booster (Exosome)", helpful: 13, clinicId: 2, clinic: "Myeongdong Forest Dermatology", doctor: "Dr. Minji Kim", text_en: "\"Exosome therapy for skin rejuvenation. Dr. Kim combined it with microneedling for better penetration. My skin barrier strengthened noticeably – less redness, more resilience. Japanese skincare + Korean derm = perfection.\"", text_ko: "\"피부 재생을 위한 엑소좀 치료였어요. 김민지 원장님이 마이크로니들링과 병행하여 침투력을 높이셨습니다. 피부 장벽이 확연히 강화됐어요.\"" },
    { name: "Viktor K.", initials: "VK", date: "2025.12.20", stars: 5, treatment: "🧬 Hair Loss (Finasteride + PRP)", helpful: 11, clinicId: 18, clinic: "Mapo Clear Hair Clinic", doctor: "Dr. Sung-Min Ryu", text_en: "\"Combination therapy: finasteride + monthly PRP. Dr. Ryu checked my DHT levels and customized the dosage. 8 months in, my hair density has improved by around 40%. He tracks everything with trichoscopy.\"", text_ko: "\"피나스테리드 + 월간 PRP 병합 치료였어요. 류성민 원장님이 DHT 수치를 확인하고 용량을 맞춤 조절하셨습니다. 8개월 후 모발 밀도가 약 40% 개선됐어요.\"" },
    { name: "Isabel C.", initials: "IC", date: "2025.10.02", stars: 5, treatment: "💉 Filler (Cheek Volume)", helpful: 15, clinicId: 3, clinic: "Hannam Aesthetic & Laser House", doctor: "Dr. Tae-Young Park", text_en: "\"Lost cheek volume after weight loss. Dr. Park restored it with Voluma – used the MD Codes technique for natural projection. My friends say I look refreshed, not 'done'. That's the highest compliment.\"", text_ko: "\"체중 감소 후 볼 볼륨이 빠졌어요. 박태영 원장님이 MD 코드 기법으로 볼루마를 사용하여 자연스러운 볼륨을 복원해주셨습니다. 친구들이 '했다'가 아니라 '상쾌해 보인다'고 해요.\"" }
];

function initExpandableReviews() {
    const grid = document.getElementById('allReviewsGrid');
    const wrapper = document.getElementById('reviewsExpandWrapper');
    const btn = document.getElementById('btnExpandReviews');
    if (!grid || !wrapper || !btn) return;

    // Render dummy reviews
    renderDummyReviews(grid);

    // Toggle expand/collapse
    let expanded = false;
    btn.addEventListener('click', () => {
        expanded = !expanded;
        wrapper.classList.toggle('expanded', expanded);
        btn.classList.toggle('expanded', expanded);

        if (expanded) {
            // Smooth scroll to show expanded area
            setTimeout(() => {
                wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 200);
        }
    });

    // Re-render on language change
    window.addEventListener('languageChanged', () => {
        renderDummyReviews(grid);
    });
}

function renderDummyReviews(grid) {
    const lang = getCurrentLang();
    grid.innerHTML = '';

    DUMMY_REVIEWS.forEach((r, i) => {
        const starStr = '⭐'.repeat(r.stars) + (r.stars < 5 ? '' : '');
        const text = lang === 'ko' ? r.text_ko : r.text_en;
        const verifiedText = lang === 'ko' ? '✓ 영수증 인증 완료' : '✓ Receipt Verified';
        const helpfulText = lang === 'ko' ? '도움됨' : 'Helpful';
        const clinicPrefix = lang === 'ko' ? '클리닉: ' : 'Clinic: ';
        const physicianPrefix = lang === 'ko' ? '담당의: ' : 'Physician: ';

        const card = document.createElement('div');
        card.className = 'review-card';
        card.style.animationDelay = `${i * 0.05}s`;
        card.innerHTML = `
            <div class="review-card-header">
                <div class="reviewer-profile">
                    <div class="reviewer-avatar">${r.initials}</div>
                    <div>
                        <div class="reviewer-name">${r.name}</div>
                        <div class="review-date">${r.date}</div>
                    </div>
                </div>
                <div class="review-meta">
                    <div class="review-stars">${starStr}</div>
                    <span class="review-verify-badge">${verifiedText}</span>
                </div>
            </div>
            <div class="review-treatment-tag">${r.treatment}</div>
            <p class="review-content">${text}</p>
            <div class="review-helpful">
                <button class="review-helpful-btn">👍 ${helpfulText} <span class="helpful-count">${r.helpful}</span></button>
            </div>
            <div class="review-doctor-link">
                <span class="review-clinic-link" data-clinic-id="${r.clinicId}">${clinicPrefix}<strong>${r.clinic}</strong></span>
                <span>${physicianPrefix}<strong>${r.doctor}</strong></span>
            </div>
        `;
        grid.appendChild(card);
    });

    // Helpful button interaction
    grid.querySelectorAll('.review-helpful-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const countEl = this.querySelector('.helpful-count');
            let count = parseInt(countEl.textContent);
            if (!this.classList.contains('voted')) {
                count++;
                this.classList.add('voted');
                this.style.borderColor = 'var(--color-primary)';
                this.style.color = 'var(--color-primary)';
                this.style.background = 'var(--color-primary-light)';
            } else {
                count--;
                this.classList.remove('voted');
                this.style.borderColor = '';
                this.style.color = '';
                this.style.background = '';
            }
            countEl.textContent = count;
        });
    });

    // Clinic link → open clinic detail modal
    grid.querySelectorAll('.review-clinic-link').forEach(link => {
        link.addEventListener('click', function() {
            const clinicId = this.getAttribute('data-clinic-id');
            if (clinicId && typeof openClinicDetailModal === 'function') {
                openClinicDetailModal(clinicId);
            }
        });
    });
}