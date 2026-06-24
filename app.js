// KOMICARE Core Application Script

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
    const checklistText = `--- THE K-BEAUTY 5 CRITICAL SAFETY QUESTIONS ---\n...`; // Text logic identical
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

    if (searchInput) searchInput.disabled = true; // Guard Race Condition

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
        if (searchInput) searchInput.disabled = false; // Release Guard
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
        const tagsHTML = specs.map(spec => `<span class="partner-tag">${spec}</span>`).join('');
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

function initSearchAndFilters() {
    const searchInput = document.getElementById('directorySearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            const filtered = loadedClinicsGlobal.filter(c => c.name.toLowerCase().includes(q) || c.doctor_name.toLowerCase().includes(q));
            renderClinicCards(filtered);
        });
    }
}

function initReviewWriter() {
    document.getElementById('btnOpenReviewWriter')?.addEventListener('click', () => {
        document.getElementById('reviewWriterModal').classList.add('active');
    });
    document.getElementById('btnCloseReviewWriter')?.addEventListener('click', () => {
        document.getElementById('reviewWriterModal').classList.remove('active');
    });
}