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
    initReviewWriter();
    updateFormValidationMessages();
}

document.addEventListener('DOMContentLoaded', initApp);

let activeClinicId = null;
let activeClinicObj = null;
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
        console.error("API Fetch error:", error);
    } finally {
        if (searchInput) searchInput.disabled = false;
    }
}

// Active category filter state variables
let activeCategory = 'all';
let activeTreatment = null;

// Specialty translation mapping helper
function translateSpecialty(specialtyName) {
    if (!specialtyName) return '';
    const nameLower = specialtyName.toLowerCase();
    
    const specialtyKeys = {
        "nd:yag laser calibrations": "treat.toning",
        "skin barrier reconstruction": "treat.water_glow",
        "pico toning": "treat.pico",
        "vascular laser calibration": "treat.toning",
        "rosacea & redness recovery": "treat.toning",
        "ultrasonic rejuvenation": "treat.water_glow",
        "1:1 wavelength tuning": "treat.toning",
        "dual-cooling safety protocols": "treat.toning",
        "high-fluence pigment management": "treat.toning",
        "genuine consumables logged": "treat.oligio",
        "ultherapy & shurink custom setups": "treat.ulthera",
        "epidermal thickness diagnostic": "treat.ulthera",
        "nd:yag & pico laser certified": "treat.pico",
        "100% physician consultation": "booking.treatment_consult",
        "youth acne barrier healing": "treat.fraxel",
        
        // New specialties matching mock clinics:
        "natural adhesion double eyelid": "treat.natural_double",
        "non-incisional ptosis correction": "treat.non_incisional_ptosis",
        "under-eye fat relocation": "treat.undereye_fat",
        "silicone rhinoplasty": "treat.silicone_nose",
        "functional rhinoplasty (rhinitis/septal deviation)": "treat.functional_nose",
        "alar reduction": "treat.alar_reduction",
        "motiva breast augmentation": "treat.motiva",
        "autologous fat breast augmentation": "treat.fat_breast",
        "laminate": "treat.laminate",
        "clear aligners": "treat.clear_align",
        "teeth whitening": "treat.whitening",
        "herbal diet medicine": "treat.herbal_diet_m",
        "acupuncture thread lifting": "treat.acupuncture_thread"
    };

    const key = specialtyKeys[nameLower];
    if (key && typeof t === 'function') {
        const translated = t(key);
        if (translated !== key) return translated;
    }
    return specialtyName;
}

function clinicMatchesCategoryOrTreatment(clinic, categoryId, treatmentName) {
    if (!categoryId || categoryId === 'all') return true;

    const specialties = (clinic.specialties || []).map(s => s.toLowerCase());

    // If a specific treatment chip is selected
    if (treatmentName) {
        const tLower = treatmentName.toLowerCase();
        // Check direct match, substring match, or loose semantic match
        if (specialties.some(spec => spec.includes(tLower) || tLower.includes(spec))) {
            return true;
        }
        
        // Smart keyword fallbacks
        if (tLower.includes("pico") && specialties.some(s => s.includes("pico"))) return true;
        if (tLower.includes("ulthera") && specialties.some(s => s.includes("ulthera") || s.includes("shurink") || s.includes("lifting"))) return true;
        if (tLower.includes("shurink") && specialties.some(s => s.includes("shurink") || s.includes("ulthera") || s.includes("lifting"))) return true;
        if (tLower.includes("barrier") && specialties.some(s => s.includes("barrier"))) return true;
        if (tLower.includes("toning") && specialties.some(s => s.includes("toning"))) return true;
        if (tLower.includes("redness") && specialties.some(s => s.includes("redness") || s.includes("vascular"))) return true;
        if (tLower.includes("double eyelid") && specialties.some(s => s.includes("eyelid") || s.includes("쌍꺼풀"))) return true;
        if (tLower.includes("rhinoplasty") && specialties.some(s => s.includes("rhinoplasty") || s.includes("코성형") || s.includes("코끝"))) return true;
        if (tLower.includes("breast") && specialties.some(s => s.includes("breast") || s.includes("가슴"))) return true;
        if (tLower.includes("diet") && specialties.some(s => s.includes("diet") || s.includes("다이어트"))) return true;
        if (tLower.includes("laminate") && specialties.some(s => s.includes("laminate") || s.includes("라미네이트"))) return true;
        
        return false;
    }

    // Category-wide keyword matching maps
    const categoryKeywords = {
        skin: ["yag", "barrier", "toning", "pigment", "acne", "peel", "skin", "피부", "스킨", "필링", "미백", "색소", "여드름", "점"],
        lifting: ["lifting", "ulthera", "shurink", "inmode", "thermage", "oligio", "thread", "contour", "리프팅", "울쎄라", "슈링크", "인모드", "써마지", "올리지오", "실", "윤곽", "조각", "이중턱"],
        botox: ["botox", "보톡스", "미간", "이마", "눈가", "입술", "자갈턱", "사각턱", "침샘", "승모근", "종아리", "다한증"],
        filler: ["filler", "필러", "이마", "앞광대", "볼", "팔자주름", "턱끝", "코", "입술", "입꼬리", "애교살", "골반", "힙업"],
        eye: ["eye", "double eyelid", "canthoplasty", "ptosis", "blepharoplasty", "눈", "쌍꺼풀", "트임", "눈매", "상안검", "하안검"],
        nose: ["rhinoplasty", "nose", "코", "콧대", "코끝", "콧볼", "복코", "매부리코"],
        contour: ["contour", "jaw", "cheekbone", "orthognathic", "양악", "윤곽", "사각턱 수술", "광대축소", "돌출입"],
        fat: ["lipo", "fat", "지방", "지방흡입", "지방이식"],
        breast: ["breast", "motiva", "mentor", "nipple", "gynecomastia", "가슴", "유두", "여유증"],
        hair: ["hair", "scalp", "meso", "모발", "탈모", "두피", "헤어라인"],
        epilation: ["epilation", "hair removal", "제모", "겨드랑이", "인중", "비키니"],
        dental: ["dental", "teeth", "laminate", "orthodontic", "aligner", "치아", "라미네이트", "교정", "미백", "임플란트"],
        herbal: ["herbal", "diet", "acupuncture", "한방", "한약", "매선", "침", "약침"],
        others: ["tattoo", "문신", "쁘띠", "부작용", "관리"]
    };

    const keywords = categoryKeywords[categoryId] || [];
    return specialties.some(spec => keywords.some(kw => spec.includes(kw)));
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
        const tagsHTML = specs.map(spec => `<span class="partner-tag">${translateSpecialty(spec)}</span>`).join('');
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
    activeClinicObj = data;
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
        tag.textContent = translateSpecialty(spec);
        specialtiesContainer.appendChild(tag);
    });

    // Dynamically populate booking treatments for this clinic
    populateBookingTreatments(data);

    const safetyContainer = document.getElementById('clinic-detail-safety-grid');
    if (safetyContainer) {
        safetyContainer.innerHTML = '';
        const lang = getCurrentLang();

        const ratingCategories = [
            { label: t('rev_sim.cat_booking') || '1. Reservation:', score: 4.8 },
            { label: t('rev_sim.cat_visit') || '2. Arrival & Wait:', score: 4.5 },
            { label: t('rev_sim.cat_doc_design') || '3. Procedure Consultation:', score: 4.9 },
            { label: t('rev_sim.cat_post_care') || '4. Aftercare Warning Guide:', score: 4.7 },
            { label: t('rev_sim.cat_side_effect') || '5. Side Effects & Pain:', score: 1.2 },
            { label: t('rev_sim.cat_revisit') || '6. Intention to Revisit:', score: 4.8 },
            { label: t('rev_sim.cat_kindness') || '9. Staff Kindness & Parking:', score: 4.6 },
            { label: t('rev_sim.cat_recommend') || '10. Willingness to Recommend:', score: 4.9 },
            { label: t('rev_sim.cat_onemonth') || '11. 1-Month Later Follow-up:', score: 4.7 }
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

        const highlightBox = document.createElement('div');
        highlightBox.style.cssText = 'margin-top: 16px; background: var(--bg-primary); padding: 12px; border-radius: 8px; font-size: 12px; border-left: 4px solid var(--color-success);';
        highlightBox.innerHTML = `
            <strong>💡 ${t('rev_sim.cat_good') || '7. Highlights'}:</strong>
            <p style="margin-top: 4px; font-style: italic; color: var(--text-secondary);">${lang === 'ko' ? '"원장님이 피부 두께를 직접 자로 재가며 파장을 수동 조절해 주신 점이 대만족이었습니다."' : '"Loved how the doctor manually adjusted the wavelength based on my exact skin profile."'}</p>
        `;
        safetyContainer.appendChild(highlightBox);
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

function closeClinicModal() {
    const modal = document.getElementById('clinicModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('clinic-detail-map-iframe').src = '';
    }
}

function populateBookingTreatments(clinic) {
    const treatmentSelect = document.getElementById('bookingTreatment');
    if (!treatmentSelect) return;

    treatmentSelect.innerHTML = '';

    // Default Consultation Option
    const defaultOpt = document.createElement('option');
    defaultOpt.value = 'Consultation Only';
    defaultOpt.setAttribute('data-i18n', 'booking.treatment_consult');
    defaultOpt.textContent = typeof t === 'function' ? t('booking.treatment_consult') : 'Consultation Only';
    treatmentSelect.appendChild(defaultOpt);

    // Specialties Options
    const specs = Array.isArray(clinic.specialties) ? clinic.specialties : [];
    
    // De-duplicate specialties just in case (e.g. if we have both EN and KO in the array, let's group them or translate them)
    const processedSpecs = [];
    specs.forEach(spec => {
        const trans = translateSpecialty(spec);
        if (!processedSpecs.includes(trans)) {
            processedSpecs.push(trans);
            const opt = document.createElement('option');
            opt.value = spec; // Send original DB spec name to backend
            opt.textContent = trans;
            treatmentSelect.appendChild(opt);
        }
    });

    // If a specific treatment chip is active, auto-select it in the dropdown (or add it if not present)
    if (activeTreatment) {
        let matched = false;
        for (let i = 0; i < treatmentSelect.options.length; i++) {
            const opt = treatmentSelect.options[i];
            if (opt.value.toLowerCase().includes(activeTreatment.toLowerCase()) || 
                opt.textContent.toLowerCase().includes(activeTreatment.toLowerCase())) {
                treatmentSelect.selectedIndex = i;
                matched = true;
                break;
            }
        }
        
        if (!matched) {
            // Add the selected treatment as a custom option
            const customOpt = document.createElement('option');
            customOpt.value = activeTreatment;
            customOpt.textContent = activeTreatment;
            customOpt.selected = true;
            treatmentSelect.appendChild(customOpt);
        }
    }
}

function filterClinics() {
    const searchInput = document.getElementById('directorySearchInput');
    const q = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filtered = loadedClinicsGlobal.filter(clinic => {
        // Category and Treatment filter
        if (!clinicMatchesCategoryOrTreatment(clinic, activeCategory, activeTreatment)) {
            return false;
        }

        // Search text filter
        if (q) {
            const nameMatch = clinic.name.toLowerCase().includes(q);
            const doctorMatch = clinic.doctor_name.toLowerCase().includes(q);
            const specialtyMatch = clinic.specialties.some(s => s.toLowerCase().includes(q) || translateSpecialty(s).toLowerCase().includes(q));
            const descMatch = clinic.description.toLowerCase().includes(q);
            return nameMatch || doctorMatch || specialtyMatch || descMatch;
        }

        return true;
    });

    renderClinicCards(filtered);
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

    // Secure booking submission flow
    const bookingForm = document.getElementById('clinicBookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            const originalBtnContent = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner">${t('quiz.securing') || 'Securing...'}</span> ⏳`;
            
            const payload = {
                clinicId: activeClinicId,
                clientName: document.getElementById('bookingName').value,
                clientEmail: document.getElementById('bookingEmail').value,
                bookingDate: document.getElementById('bookingDate').value,
                bookingTime: document.getElementById('bookingTime').value,
                treatment: document.getElementById('bookingTreatment').value
            };
            
            try {
                const response = await fetch('/api/book', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Server booking failed.');
                
                // Show booking success view
                document.getElementById('clinic-booking-view').classList.remove('active');
                document.getElementById('booking-success-view').style.display = 'block';
                bookingForm.style.display = 'none';
                
                const successMsg = document.getElementById('booking-success-message');
                if (successMsg) {
                    const clinicName = activeClinicObj ? activeClinicObj.name : 'Clinic';
                    const rawDate = document.getElementById('bookingDate').value;
                    const formattedDate = formatDateByLocale(rawDate, getCurrentLang());
                    const timeVal = document.getElementById('bookingTime').value;
                    const bookingId = result.bookingId;
                    const emailVal = document.getElementById('bookingEmail').value;
                    
                    let template = t('booking.success_detail');
                    template = template.replace('{clinic}', clinicName)
                                       .replace('{date}', formattedDate)
                                       .replace('{time}', timeVal)
                                       .replace('{bookingId}', bookingId)
                                       .replace('{email}', emailVal);
                    successMsg.innerHTML = template;
                }
            } catch (err) {
                console.error("Booking API error:", err.message);
                alert(getCurrentLang() === 'ko' ? `예약 중 오류가 발생했습니다: ${err.message}` : `Booking error: ${err.message}`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
            }
        });
    }
}

function initSearchAndFilters() {
    const searchInput = document.getElementById('directorySearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterClinics();
        });
    }

    const visualMenu = document.querySelector('.visual-category-menu');

    // Bind Category Tabs
    const tabsWrapper = document.getElementById('categoryTabsWrapper');
    if (tabsWrapper) {
        tabsWrapper.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Clear visual menu active states when manual tab is clicked
                if (visualMenu) {
                    visualMenu.querySelectorAll('.visual-category-item').forEach(i => i.classList.remove('active'));
                }

                // Toggle Tab Active State
                tabsWrapper.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Switch Active Submenu
                activeCategory = tab.getAttribute('data-category');
                activeTreatment = null; // Reset selected treatment chip when switching category

                const submenuPanel = document.getElementById('categorySubmenuPanel');
                if (submenuPanel) {
                    submenuPanel.querySelectorAll('.submenu-content').forEach(c => {
                        c.classList.remove('active');
                        // Reset chip selection styles inside hidden menus
                        c.querySelectorAll('.treat-chip').forEach(chip => chip.classList.remove('active'));
                    });

                    const targetSubmenu = document.getElementById(`submenu-${activeCategory}`);
                    if (targetSubmenu) {
                        targetSubmenu.classList.add('active');
                    }
                }

                // Apply Filters
                filterClinics();
            });
        });
    }

    // Bind Treatment Chips (using Event Delegation on the Submenu Panel)
    const submenuPanel = document.getElementById('categorySubmenuPanel');
    if (submenuPanel) {
        submenuPanel.addEventListener('click', (e) => {
            const chip = e.target.closest('.treat-chip');
            if (!chip) return;

            const contentBlock = chip.closest('.submenu-content');
            const alreadyActive = chip.classList.contains('active');

            // Reset other chips in this submenu block
            if (contentBlock) {
                contentBlock.querySelectorAll('.treat-chip').forEach(c => c.classList.remove('active'));
            }

            if (alreadyActive) {
                // Deselect chip
                activeTreatment = null;
            } else {
                // Select chip
                chip.classList.add('active');
                activeTreatment = chip.getAttribute('data-treatment');
            }

            // Apply Filters
            filterClinics();
        });
    }

    // Bind 9-Icon Visual Category Menu
    if (visualMenu) {
        visualMenu.querySelectorAll('.visual-category-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Toggle active style on visual items
                visualMenu.querySelectorAll('.visual-category-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                // Smooth scroll to directory widget
                const targetSection = document.getElementById('directory');
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }

                const targetCat = item.getAttribute('data-target-category');
                const targetSub = item.getAttribute('data-target-subcategory');
                const targetTreat = item.getAttribute('data-target-treatment');

                // 1. Programmatically set active main category tab
                const mainTab = document.querySelector(`.category-tab[data-category="${targetCat}"]`);
                if (mainTab) {
                    tabsWrapper.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                    mainTab.classList.add('active');
                    
                    activeCategory = targetCat;
                    activeTreatment = null;

                    const submenuPanel = document.getElementById('categorySubmenuPanel');
                    if (submenuPanel) {
                        submenuPanel.querySelectorAll('.submenu-content').forEach(c => {
                            c.classList.remove('active');
                            c.querySelectorAll('.treat-chip').forEach(chip => chip.classList.remove('active'));
                        });

                        const targetSubmenu = document.getElementById(`submenu-${activeCategory}`);
                        if (targetSubmenu) {
                            targetSubmenu.classList.add('active');
                            
                            // 2. Select subcategory / treatment chip
                            if (targetSub) {
                                const subTitleEl = Array.from(targetSubmenu.querySelectorAll('.submenu-title')).find(el => {
                                    return el.getAttribute('data-i18n') === `subcat.${targetSub}`;
                                });
                                if (subTitleEl) {
                                    const groupEl = subTitleEl.closest('.submenu-group');
                                    if (groupEl) {
                                        const firstChip = groupEl.querySelector('.treat-chip');
                                        if (firstChip) {
                                            firstChip.classList.add('active');
                                            activeTreatment = firstChip.getAttribute('data-treatment');
                                        }
                                    }
                                }
                            }

                            if (targetTreat) {
                                const chip = Array.from(targetSubmenu.querySelectorAll('.treat-chip')).find(el => {
                                    const chipTreat = el.getAttribute('data-treatment');
                                    return chipTreat && chipTreat.toLowerCase() === targetTreat.toLowerCase();
                                });
                                if (chip) {
                                    chip.classList.add('active');
                                    activeTreatment = chip.getAttribute('data-treatment');
                                }
                            }
                        }
                    }
                    
                    // Filter clinics
                    filterClinics();
                }
            });
        });
    }

    // Live Translate dynamically rendered cards when language changes
    window.addEventListener('languageChanged', () => {
        filterClinics();
        updateFormValidationMessages();
    });
}

// 리뷰 작성 시뮬레이터 핸들러 및 원장 리스트 드롭다운 롤메뉴 리바인딩 패치 완료
function initReviewWriter() {
    document.getElementById('btnOpenReviewWriter')?.addEventListener('click', () => {
        document.getElementById('reviewWriterModal').classList.add('active');
        // 🚨 모달이 열리는 순간 드롭다운에 원장님 명단을 깨짐 없이 동적 주입합니다.
        updateReviewDoctorDropdown();
    });
    document.getElementById('btnCloseReviewWriter')?.addEventListener('click', () => {
        document.getElementById('reviewWriterModal').classList.remove('active');
    });
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
        // Fallback 데이터셋 바인딩 구조 안정화
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

function formatDateByLocale(dateString, lang) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const [year, month, day] = parts;
    if (lang === 'ko') {
        return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
    } else {
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const monthName = monthNames[parseInt(month) - 1] || month;
        return `${monthName} ${parseInt(day)}, ${year}`;
    }
}

function updateFormValidationMessages() {
    const lang = getCurrentLang();
    
    const nameInput = document.getElementById('bookingName');
    const emailInput = document.getElementById('bookingEmail');
    const dateInput = document.getElementById('bookingDate');
    const timeSelect = document.getElementById('bookingTime');
    const quizEmailInput = document.getElementById('userEmail');

    const applyValidity = (el, type) => {
        if (!el) return;
        el.oninvalid = function(e) {
            e.target.setCustomValidity(t(`validation.${type}`));
        };
        el.oninput = function(e) {
            e.target.setCustomValidity("");
        };
    };

    if (nameInput) applyValidity(nameInput, 'name_required');
    
    if (emailInput) {
        emailInput.oninvalid = function(e) {
            if (e.target.value === '') {
                e.target.setCustomValidity(t('validation.email_required'));
            } else {
                e.target.setCustomValidity(t('validation.email_invalid'));
            }
        };
        emailInput.oninput = function(e) {
            e.target.setCustomValidity("");
        };
    }
    
    if (dateInput) applyValidity(dateInput, 'date_required');
    if (timeSelect) applyValidity(timeSelect, 'time_required');

    if (quizEmailInput) {
        quizEmailInput.oninvalid = function(e) {
            if (e.target.value === '') {
                e.target.setCustomValidity(t('validation.email_required'));
            } else {
                e.target.setCustomValidity(t('validation.email_invalid'));
            }
        };
        quizEmailInput.oninput = function(e) {
            e.target.setCustomValidity("");
        };
    }
}