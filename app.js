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

        progressText.dataset.step = nextStep;
        progressText.textContent = t('quiz.progress').replace('{current}', nextStep);
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
        const profilesMap = {
            ko: window.fitzpatrickProfiles_ko,
            ja: window.fitzpatrickProfiles_ja,
            zh: window.fitzpatrickProfiles_zh,
            en: window.fitzpatrickProfiles_en
        };
        const profileDict = profilesMap[lang] || profilesMap.en;
        const profile = profileDict ? profileDict[quizData.fitzpatrickType] : window.fitzpatrickProfiles_en[quizData.fitzpatrickType];

        document.getElementById('res-type-title').textContent = profile.name;
        document.getElementById('res-behavior').textContent = profile.behavior;
        document.getElementById('res-lasers').textContent = profile.lasers;

        const advTemplate = t('results.safety_advisory') || `🛡️ Fitzpatrick ${quizData.fitzpatrickType} Safety Advisory:`;
        const advText = advTemplate.replace('{type}', quizData.fitzpatrickType);
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
    // Porcelain light theme is the brand default; visitors can still pick dark or follow the system
    let savedTheme = null;
    try { savedTheme = localStorage.getItem('komicare-theme'); } catch (e) {}
    applyTheme(savedTheme || 'light');

    themeSwitcher.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.getAttribute('data-theme')));
    });
}

function applyTheme(theme) {
    const htmlEl = document.documentElement;
    htmlEl.setAttribute('data-theme', theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme);
    document.querySelectorAll('#themeSwitcher .theme-btn').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-theme') === theme));
    try { localStorage.setItem('komicare-theme', theme); } catch (e) {}
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
        } else if (container) {
            loadedClinicsGlobal = [];
            container.innerHTML = `<div class="text-center" style="padding:40px; color:var(--text-muted); width:100%;">${escapeHTML(t('directory.load_error'))}</div>`;
        }
    } catch (error) {
        console.error("API fetch error, clinic list unavailable:", error);
        loadedClinicsGlobal = [];
        if (container) container.innerHTML = `<div class="text-center" style="padding:40px; color:var(--text-muted); width:100%;">${escapeHTML(t('directory.load_error'))}</div>`;
    } finally {
        if (searchInput) searchInput.disabled = false;
    }
}

// Escape untrusted strings (DB clinic data, user-typed reviews) before interpolating into HTML
function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Mirror of the server-side check: only Google Maps embed URLs may become an iframe src
function isSafeMapEmbedUrl(value) {
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.hostname !== 'www.google.com') return false;
        return url.pathname.startsWith('/maps/embed') || (url.pathname === '/maps' && url.searchParams.get('output') === 'embed');
    } catch (e) {
        return false;
    }
}

function localizeSpecialty(spec) {
    const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'en';
    const dict = (window.specialtyTranslations && window.specialtyTranslations[lang]) || {};
    const cleanKey = spec.trim().toLowerCase();
    if (dict[cleanKey]) return dict[cleanKey];
    const key = 'menu.' + cleanKey.replace(/ /g, '');
    const translated = t(key);
    return (translated && translated !== key) ? translated : spec;
}

// Stored ratings look like "⭐ 4.9 (120+ verified reviews)"; rebuild the review count label per language
function localizeRating(rating) {
    const m = String(rating || '').match(/([\d.]+)\s*\((\d+)\+/);
    if (!m) return t('clinic.no_reviews_yet');
    return `⭐ ${m[1]} (${t('clinic.verified_reviews').replace('{count}', m[2])})`;
}

// Owner-entered translations from the partner portal win over the automatic dictionaries
function clinicText(clinic, field, kind) {
    if (!clinic) return '';
    const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'en';
    const own = clinic.translations && clinic.translations[lang] && clinic.translations[lang][field];
    return own || getLocalizedText(clinic[field], kind);
}

// kind ('clinic' | 'doctor' | 'location' | 'text') lets English-only values be translated into ko/ja/zh.
// 'title' and 'hours' use "|" to separate sections rather than "English | 한국어", so they skip the split.
function getLocalizedText(rawText, kind) {
    if (!rawText) return '';
    const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'en';
    if ((kind === 'title' || kind === 'hours') && typeof localizeEntity === 'function') {
        return localizeEntity(rawText, kind, lang);
    }
    let text = rawText;
    if (rawText.includes('|')) {
        const parts = rawText.split('|').map(p => p.trim());
        const hasKorean = (str) => /[\uac00-\ud7a3]/.test(str);
        const koPart = parts.find(p => hasKorean(p)) || parts[1] || parts[0];
        const enPart = parts.find(p => !hasKorean(p)) || parts[0] || parts[1];
        text = lang === 'ko' ? koPart : enPart;
    }
    if (kind && typeof localizeEntity === 'function') {
        text = localizeEntity(text, kind, lang);
    }
    return text;
}

const CLINIC_PAGE_SIZE = 60;
let renderedClinicList = [];

const isPublicClinic = clinic => clinic && clinic.source === 'hira';

function localizeDepartment(dept) {
    const key = { '피부과': 'dept.dermatology', '성형외과': 'dept.plastic_surgery' }[dept];
    return key ? t(key) : dept;
}

function publicDoctorCountText(clinic) {
    if (clinic.doctor_count === null || clinic.doctor_count === undefined) return '';
    return t('public.doctor_counts')
        .replace('{doctors}', clinic.doctor_count)
        .replace('{specialists}', clinic.specialist_count || 0);
}

function publicDoctorNamesText(clinic) {
    const names = clinic.doctor_names || [];
    if (!names.length) return '';
    const shown = names.length > 1 ? t('public.doctor_names_more').replace('{name}', names[0]).replace('{count}', names.length - 1) : names[0];
    return t('public.doctor_names_card').replace('{names}', shown);
}

// Public directory entries (HIRA open data): facts only, no rating, doctor profile or safety badges
function publicClinicCardHTML(clinic) {
    const depts = (clinic.departments || []).map(d => `<span class="partner-tag">${escapeHTML(localizeDepartment(d))}</span>`).join('');
    const counts = publicDoctorCountText(clinic);
    return `
            <div class="partner-card partner-card-public" data-clinic-id="${escapeHTML(clinic.id)}">
                <div class="partner-top">
                    <div class="partner-info">
                        <h4>${escapeHTML(clinicText(clinic, 'name', 'clinic'))}</h4>
                        <span class="partner-location">${escapeHTML(clinicText(clinic, 'location', 'location'))}</span>
                    </div>
                    <span class="public-badge">${escapeHTML(t('public.badge'))}</span>
                </div>
                <div class="partner-tags">${depts}</div>
                <div class="public-meta">
                    ${(clinic.doctor_names || []).length ? `<span>${escapeHTML(publicDoctorNamesText(clinic))}</span>` : ''}
                    ${counts ? `<span>${escapeHTML(counts)}</span>` : ''}
                    ${clinic.phone ? `<span>☎ ${escapeHTML(clinic.phone)}</span>` : ''}
                </div>
            </div>`;
}

function renderClinicCards(clinics) {
    const container = document.getElementById('dynamic-partner-list');
    if (!container) return;

    const countEl = document.getElementById('filter-result-count');
    if (countEl) {
        countEl.textContent = clinics ? clinics.length : 0;
    }

    if (!clinics || clinics.length === 0) {
        // No clinics at all (MVP, before any import) reads differently from "no match for these filters"
        const message = loadedClinicsGlobal.length ? t('directory.empty') : t('directory.coming_soon');
        container.innerHTML = `<div class="text-center" style="padding:40px; color:var(--text-muted); width:100%;">${escapeHTML(message)}</div>`;
        return;
    }

    container.innerHTML = '';
    renderedClinicList = clinics;
    appendClinicCards(0);
}

// Renders the next page of cards; thousands of public entries would be too heavy to draw at once
function appendClinicCards(start) {
    const container = document.getElementById('dynamic-partner-list');
    if (!container) return;
    container.querySelector('.clinic-load-more')?.remove();
    const clinics = renderedClinicList;
    const page = clinics.slice(start, start + CLINIC_PAGE_SIZE);
    page.forEach(clinic => {
        if (isPublicClinic(clinic)) {
            container.insertAdjacentHTML('beforeend', publicClinicCardHTML(clinic));
            return;
        }
        const specs = Array.isArray(clinic.specialties) ? clinic.specialties : [];
        const tagsHTML = specs.map(spec => {
            return `<span class="partner-tag">${escapeHTML(localizeSpecialty(spec))}</span>`;
        }).join('');
        const rating = String(clinic.rating || '');
        const ratingVal = rating.includes('(') ? rating.split(' ')[1] : rating.replace('⭐', '').trim();

        let doctorTypeLabel = t(`badge.${clinic.doctor_type}`) || clinic.doctor_type;
        let anesthesiaLabel = clinic.sleep_anesthesia ? (clinic.anesthesiologist_resident ? t('badge.anesthesiologist') : t('badge.no_anesthesiologist')) : '';

        const localizedName = escapeHTML(clinicText(clinic, 'name', 'clinic'));
        const localizedLoc = escapeHTML(clinicText(clinic, 'location', 'location'));
        const localizedDocName = escapeHTML(clinicText(clinic, 'doctor_name', 'doctor'));
        const localizedDocTitle = escapeHTML(clinicText(clinic, 'doctor_title', 'title'));

        const cardHTML = `
            <div class="partner-card" data-clinic-id="${escapeHTML(clinic.id)}">
                <div class="partner-top">
                    <div class="partner-info">
                        <h4>${localizedName}</h4>
                        <span class="partner-location">${localizedLoc}</span>
                    </div>
                    <div class="partner-rating"><span>${ratingVal ? `⭐ ${escapeHTML(ratingVal)}` : escapeHTML(t('clinic.new_badge'))}</span></div>
                </div>
                <div class="partner-tags">
                    ${tagsHTML}
                    <span class="partner-tag slots">${escapeHTML(clinic.slots_tag)}</span>
                </div>
                <div class="safety-badges-row">
                    <span class="safety-badge badge-dermatologist">${escapeHTML(doctorTypeLabel)}</span>
                    ${anesthesiaLabel ? `<span class="safety-badge badge-anesthesiologist">${anesthesiaLabel}</span>` : ''}
                    ${clinic.foreign_attraction_registered ? `<span class="safety-badge badge-registered">${t('badge.foreign_attraction')}</span>` : ''}
                    ${clinic.foreigner_insurance ? `<span class="safety-badge badge-insurance">${t('badge.foreigner_insurance')}</span>` : ''}
                    ${clinic.excellent_aftercare ? `<span class="safety-badge badge-aftercare">${t('badge.aftercare_excellence')}</span>` : ''}
                </div>
                <div class="partner-doctors">
                    <div class="doctor-profile">
                        <div class="doctor-avatar">${escapeHTML(clinic.doctor_avatar)}</div>
                        <div class="doctor-meta"><h5>${localizedDocName}</h5><p>${localizedDocTitle}</p></div>
                    </div>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });

    const shown = start + page.length;
    if (shown < clinics.length) {
        const more = document.createElement('button');
        more.type = 'button';
        more.className = 'clinic-load-more';
        more.textContent = t('directory.load_more').replace('{shown}', shown.toLocaleString()).replace('{total}', clinics.length.toLocaleString());
        more.addEventListener('click', (e) => { e.stopPropagation(); appendClinicCards(shown); });
        container.appendChild(more);
    }
}

// 예리 원장님 피드백 반영: 11개 세부 평점 카테고리 시각화 동적 연동 함수
function openClinicDetailModal(clinicId) {
    const data = loadedClinicsGlobal.find(c => c.id === parseInt(clinicId));
    if (!data) return;

    activeClinicId = clinicId;
    resetBookingViews();

    const isPublic = isPublicClinic(data);
    document.querySelectorAll('#clinicModal .partner-only').forEach(el => { el.style.display = isPublic ? 'none' : ''; });
    const publicBlock = document.getElementById('clinic-detail-public');
    if (publicBlock) publicBlock.style.display = isPublic ? '' : 'none';
    if (isPublic) {
        fillPublicClinicDetails(data);
        document.getElementById('clinic-detail-name').textContent = clinicText(data, 'name', 'clinic');
        document.getElementById('clinic-detail-location').textContent = clinicText(data, 'location', 'location');
        const map = document.getElementById('clinic-detail-map-iframe');
        if (map) map.src = isSafeMapEmbedUrl(data.map_iframe) ? data.map_iframe : 'about:blank';
        const modal = document.getElementById('clinicModal');
        if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
        return;
    }

    document.getElementById('clinic-detail-name').textContent = clinicText(data, 'name', 'clinic');
    document.getElementById('clinic-detail-location').textContent = clinicText(data, 'location', 'location');
    document.getElementById('clinic-detail-rating').textContent = localizeRating(data.rating);
    document.getElementById('clinic-detail-desc').textContent = clinicText(data, 'description', 'text');
    document.getElementById('clinic-detail-hours').textContent = clinicText(data, 'hours', 'hours');

    const specialtiesContainer = document.getElementById('clinic-detail-specialties');
    specialtiesContainer.innerHTML = '';
    (data.specialties || []).forEach(spec => {
        const tag = document.createElement('span');
        tag.className = 'partner-tag';
        tag.textContent = localizeSpecialty(spec);
        specialtiesContainer.appendChild(tag);
    });

    const safetyContainer = document.getElementById('clinic-detail-safety-grid');
    const hasReviews = submittedReviews.some(r => r.clinicId === parseInt(clinicId));
    if (safetyContainer && !hasReviews) {
        safetyContainer.innerHTML = '';
        const empty = document.createElement('p');
        empty.className = 'no-reviews-note';
        empty.textContent = t('clinic.no_reviews_yet');
        safetyContainer.appendChild(empty);
    } else if (safetyContainer) {
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
        
        let goodText = '';
        if (reviewsForClinic.length > 0 && reviewsForClinic[reviewsForClinic.length - 1].good) {
            goodText = `"${escapeHTML(reviewsForClinic[reviewsForClinic.length - 1].good)}"`;
        }
        
        highlightBox.innerHTML = `
            <strong>💡 ${t('rev_sim.cat_good') || '7. Highlights'}:</strong>
            <p style="margin-top: 4px; font-style: italic; color: var(--text-secondary);">${goodText}</p>
        `;
        safetyContainer.appendChild(highlightBox);
        
        // Areas for Improvement
        let badText = "";
        if (reviewsForClinic.length > 0 && reviewsForClinic[reviewsForClinic.length - 1].bad) {
            badText = `"${escapeHTML(reviewsForClinic[reviewsForClinic.length - 1].bad)}"`;
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
    document.getElementById('clinic-detail-doc-name').textContent = clinicText(data, 'doctor_name', 'doctor');
    document.getElementById('clinic-detail-doc-title').textContent = clinicText(data, 'doctor_title', 'title');
    document.getElementById('clinic-detail-doc-bio').textContent = clinicText(data, 'doctor_bio', 'text');

    const mapIframe = document.getElementById('clinic-detail-map-iframe');
    if (mapIframe) mapIframe.src = isSafeMapEmbedUrl(data.map_iframe) ? data.map_iframe : 'about:blank';

    const modal = document.getElementById('clinicModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function fillPublicClinicDetails(data) {
    const rows = [
        ['public.doctor_from_site', (data.doctor_names || []).join(', ')],
        ['public.address', data.address],
        ['public.phone', data.phone],
        ['public.departments', (data.departments || []).map(localizeDepartment).join(', ')],
        ['public.doctors', publicDoctorCountText(data)],
        ['public.clinic_type', data.clinic_type]
    ].filter(([, value]) => value);
    const list = document.getElementById('clinic-detail-public-facts');
    list.innerHTML = '';
    rows.forEach(([key, value]) => {
        const dt = document.createElement('dt');
        dt.textContent = t(key);
        const dd = document.createElement('dd');
        dd.textContent = value;
        list.append(dt, dd);
    });
    const homepage = document.getElementById('clinic-detail-homepage');
    let safeHomepage = '';
    try {
        const url = new URL(data.homepage);
        if (url.protocol === 'http:' || url.protocol === 'https:') safeHomepage = url.href;
    } catch (e) {}
    homepage.style.display = safeHomepage ? '' : 'none';
    if (safeHomepage) homepage.href = safeHomepage;
    const synced = data.synced_at ? new Date(data.synced_at).toISOString().slice(0, 10) : '';
    document.getElementById('clinic-detail-public-source').textContent = t('public.source').replace('{date}', synced);

    // Where the director names came from, so visitors (and the clinic) can check them
    const doctorSource = document.getElementById('clinic-detail-doctor-source');
    let safeSource = '';
    try {
        const url = new URL(data.doctor_source_url);
        if (url.protocol === 'http:' || url.protocol === 'https:') safeSource = url.href;
    } catch (e) {}
    doctorSource.style.display = (data.doctor_names || []).length && safeSource ? '' : 'none';
    if (safeSource) {
        doctorSource.href = safeSource;
        const checked = data.doctor_checked_at ? new Date(data.doctor_checked_at).toISOString().slice(0, 10) : '';
        doctorSource.textContent = t('public.doctor_source').replace('{date}', checked);
    }

    // Owners can take over their listing through the partner portal, prefilled with this clinic
    const claim = document.getElementById('clinic-detail-claim');
    const params = new URLSearchParams({ claim: data.id, name: data.name || '', location: (data.location || '').replace('📍', '').trim() });
    claim.href = `clinic.html?${params.toString()}`;
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

let activeCategory = 'all';
let activeTreatment = null;

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
        skin: ["피부과", "yag", "barrier", "toning", "pigment", "acne", "peel", "skin", "피부", "스킨", "필링", "미백", "색소", "여드름", "점", "booster", "부스터", "exosome", "엑소좀", "juvelook", "쥬베룩", "water", "물광"],
        lifting: ["피부과", "lifting", "ulthera", "shurink", "inmode", "thermage", "oligio", "thread", "contour", "리프팅", "울쎄라", "슈링크", "인모드", "써마지", "올리지오", "실", "윤곽", "조각", "이중턱"],
        botox: ["피부과", "botox", "보톡스", "미간", "이마", "눈가", "입술", "자갈턱", "사각턱", "침샘", "승모근", "종아리", "다한증"],
        filler: ["피부과", "filler", "필러", "이마", "앞광대", "볼", "팔자주름", "턱끝", "코", "입술", "입꼬리", "애교살", "골반", "힙업"],
        eye: ["성형외과", "eye", "double eyelid", "canthoplasty", "ptosis", "blepharoplasty", "눈", "쌍꺼풀", "트임", "눈매", "상안검", "하안검"],
        nose: ["성형외과", "rhinoplasty", "nose", "코", "콧대", "코끝", "콧볼", "복코", "매부리코"],
        contour: ["성형외과", "contour", "jaw", "cheekbone", "orthognathic", "양악", "윤곽", "사각턱 수술", "광대축소", "돌출입"],
        fat: ["성형외과", "lipo", "fat", "지방", "지방흡입", "지방이식"],
        breast: ["성형외과", "breast", "motiva", "mentor", "nipple", "gynecomastia", "가슴", "유두", "여유증"],
        hair: ["hair", "scalp", "meso", "모발", "탈모", "두피", "헤어라인", "transplant", "이식"],
        epilation: ["피부과", "epilation", "hair removal", "제모", "겨드랑이", "인중", "비키니"],
        dental: ["dental", "teeth", "laminate", "orthodontic", "aligner", "치아", "라미네이트", "교정", "미백", "임플란트"],
        herbal: ["herbal", "diet", "acupuncture", "한방", "한약", "매선", "침", "약침"],
        others: ["tattoo", "문신", "쁘띠", "부작용", "관리"]
    };

    const keywords = categoryKeywords[categoryId] || [];
    return specialties.some(spec => keywords.some(kw => spec.includes(kw)));
}

function getClinicExperienceYears(clinic) {
    if (isPublicClinic(clinic)) return null;
    if (clinic.experience_years === undefined || clinic.experience_years === null) return null;
    return parseInt(clinic.experience_years);
}

// Review-category score from real submitted reviews; null when there are none
function getDetailedReviewRating(clinicId, category) {
    const id = parseInt(clinicId);
    const map = {
        satisfaction: 'procedure', contact_speed: 'booking', waiting_speed: 'visit',
        staff_kindness: 'kindness', aftercare: 'post_care', parking: 'parking'
    };
    if (category === 'language') {
        const barrier = getClinicCategoryScore(id, 'language_barrier');
        return barrier === null ? null : parseFloat(barrier);
    }
    if (map[category]) {
        const score = getClinicCategoryScore(id, map[category]);
        return score === null ? null : parseFloat(score);
    }
    // Categories the review form does not collect yet have no data
    return null;
}

const normalizeSearchText = text => String(text || '').toLowerCase().replace(/[\s·.,()\-|📍]/g, '');

// Everything a visitor might type to find a clinic, in the stored and the displayed language
function clinicSearchText(c) {
    const parts = [
        c.name, clinicText(c, 'name', 'clinic'),
        c.doctor_name, c.doctor_name && clinicText(c, 'doctor_name', 'doctor'), ...(c.doctor_names || []),
        c.location, clinicText(c, 'location', 'location'), c.address
    ];
    (c.specialties || []).forEach(spec => {
        parts.push(spec, localizeSpecialty(spec));
        const key = 'menu.' + spec.toLowerCase().replace(/ /g, '');
        if (t(key) !== key) parts.push(t(key));
    });
    (c.departments || []).forEach(dept => parts.push(dept, localizeDepartment(dept)));
    Object.values(c.translations || {}).forEach(tr => parts.push(tr.name, tr.doctor_name, tr.location));
    return normalizeSearchText(parts.filter(Boolean).join(' '));
}

function applyFilters() {
    const searchInput = document.getElementById('directorySearchInput');
    const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    const activeTagBtn = document.querySelector('.filter-tag.active');
    const tagFilter = activeTagBtn ? activeTagBtn.getAttribute('data-specialty') : 'all';
    
    let filtered = loadedClinicsGlobal;
    
    // 1. Category Menu & Treatment Chip Filter
    filtered = filtered.filter(c => clinicMatchesCategoryOrTreatment(c, activeCategory, activeTreatment));
    
    // 2. Tag Filter
    if (tagFilter !== 'all') {
        filtered = filtered.filter(c => (c.specialties || []).includes(tagFilter));
    }
    
    // 3. Search Input Query: clinic name, doctor name, area/address or treatment, in any shown language.
    // Spaces are ignored and every word must match somewhere ("강남 갤러리아" finds 갤러리아피부과의원 in 강남구).
    if (q) {
        const terms = q.split(/\s+/).map(normalizeSearchText).filter(Boolean);
        filtered = filtered.filter(c => {
            const haystack = clinicSearchText(c);
            return terms.every(term => haystack.includes(term));
        });
    }

    // 4. Custom Hospital Filters
    // 4.1 의사 자격 필터 (피부과 전문의 / 전문의 / 일반의)
    const isDerm = document.getElementById('filter-doc-dermatologist')?.checked;
    const isSpec = document.getElementById('filter-doc-specialist')?.checked;
    const isGp = document.getElementById('filter-doc-gp')?.checked;
    if (isDerm || isSpec || isGp) {
        filtered = filtered.filter(c => {
            if (isDerm && c.doctor_type === 'dermatologist') return true;
            if (isSpec && c.doctor_type === 'specialist') return true;
            if (isGp && c.doctor_type === 'gp') return true;
            return false;
        });
    }

    // 4.2 시술 경력 필터 (0-5년 / 5-10년 / 10년 이상)
    const isExp05 = document.getElementById('filter-exp-0-5')?.checked;
    const isExp510 = document.getElementById('filter-exp-5-10')?.checked;
    const isExp10p = document.getElementById('filter-exp-10plus')?.checked;
    if (isExp05 || isExp510 || isExp10p) {
        filtered = filtered.filter(c => {
            const years = getClinicExperienceYears(c);
            if (years === null) return false;
            if (isExp05 && years >= 0 && years <= 5) return true;
            if (isExp510 && years > 5 && years <= 10) return true;
            if (isExp10p && years > 10) return true;
            return false;
        });
    }

    // 4.3 외국인 진료 및 혜택
    const isReg = document.getElementById('filter-auth-registered')?.checked;
    const isExc = document.getElementById('filter-auth-excellent')?.checked;
    if (isReg) {
        filtered = filtered.filter(c => c.foreign_attraction_registered === true);
    }
    if (isExc) {
        filtered = filtered.filter(c => c.excellent_aftercare === true);
    }

    // 5. Custom Review Categories Star Rating Filters
    const reviewCats = [
        { id: 'r-filter-satisfaction', key: 'satisfaction' },
        { id: 'r-filter-cost', key: 'cost' },
        { id: 'r-filter-contact_speed', key: 'contact_speed' },
        { id: 'r-filter-waiting_speed', key: 'waiting_speed' },
        { id: 'r-filter-language', key: 'language' },
        { id: 'r-filter-staff_kindness', key: 'staff_kindness' },
        { id: 'r-filter-doctor_explanation', key: 'doctor_explanation' },
        { id: 'r-filter-honesty', key: 'honesty' },
        { id: 'r-filter-location', key: 'location' },
        { id: 'r-filter-facility', key: 'facility' },
        { id: 'r-filter-aftercare', key: 'aftercare' },
        { id: 'r-filter-parking', key: 'parking' }
    ];

    reviewCats.forEach(cat => {
        const el = document.getElementById(cat.id);
        const minVal = el ? parseFloat(el.value) : 0;
        if (minVal > 0) {
            // Clinics without real reviews (including all public entries) are excluded by any minimum rating
            filtered = filtered.filter(c => {
                if (isPublicClinic(c)) return false;
                const score = getDetailedReviewRating(c.id, cat.key);
                return score !== null && score >= minVal;
            });
        }
    });
    
    renderClinicCards(filtered);
}

function initSearchAndFilters() {
    // Custom Hospital & Review Filters Bindings
    const customFilterSelectors = [
        '#filter-doc-dermatologist', '#filter-doc-specialist', '#filter-doc-gp',
        '#filter-exp-0-5', '#filter-exp-5-10', '#filter-exp-10plus',
        '#filter-auth-registered', '#filter-auth-excellent',
        '#r-filter-satisfaction', '#r-filter-cost', '#r-filter-contact_speed',
        '#r-filter-waiting_speed', '#r-filter-language', '#r-filter-staff_kindness',
        '#r-filter-doctor_explanation', '#r-filter-honesty', '#r-filter-location',
        '#r-filter-facility', '#r-filter-aftercare', '#r-filter-parking'
    ];
    
    customFilterSelectors.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
            el.addEventListener('change', () => {
                applyFilters();
            });
        }
    });

    const resetBtn = document.getElementById('reset-filters-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn-check').forEach(cb => cb.checked = false);
            document.querySelectorAll('.review-filter-select').forEach(sel => sel.value = "0");
            const searchInput = document.getElementById('directorySearchInput');
            if (searchInput) searchInput.value = '';
            applyFilters();
        });
    }

    const toggleBtn = document.getElementById('reviewFilterToggle');
    const toggleContent = document.getElementById('reviewFilterContent');
    if (toggleBtn && toggleContent) {
        toggleBtn.addEventListener('click', () => {
            toggleBtn.classList.toggle('active');
            toggleContent.classList.toggle('active');
        });
    }

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

    const visualMenu = document.querySelector('.visual-category-menu');
    const tabsWrapper = document.getElementById('categoryTabsWrapper');
    const submenuPanel = document.getElementById('categorySubmenuPanel');

    // 1. Bind Category Tabs
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

                if (submenuPanel) {
                    submenuPanel.querySelectorAll('.submenu-content').forEach(c => {
                        c.classList.remove('active');
                        c.querySelectorAll('.treat-chip').forEach(chip => chip.classList.remove('active'));
                    });

                    const targetSubmenu = document.getElementById(`submenu-${activeCategory}`);
                    if (targetSubmenu) {
                        targetSubmenu.classList.add('active');
                    }
                }

                // Reset search tags if needed
                if (tagsWrapper) {
                    tagsWrapper.querySelectorAll('.filter-tag').forEach(btn => btn.classList.remove('active'));
                    const allTag = tagsWrapper.querySelector('.filter-tag[data-specialty="all"]');
                    if (allTag) allTag.classList.add('active');
                }

                applyFilters();
            });
        });
    }

    // 2. Bind Treatment Chips (using Event Delegation on the Submenu Panel)
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
                activeTreatment = null;
            } else {
                chip.classList.add('active');
                activeTreatment = chip.getAttribute('data-treatment');
            }

            applyFilters();
        });
    }

    // 3. Bind 9-Icon Visual Category Menu (Hero area etc.)
    if (visualMenu) {
        const treatmentMap = {
            epilation: 'Hair Removal',
            lifting: 'Lifting',
            filler: 'Filler',
            botox: 'Botox',
            skin_booster: 'Skin Booster',
            whitening: 'Pigmentation',
            acne: 'Acne',
            hair_loss_treat: 'Hair Transplant',
            herbal: 'Oriental Medicine'
        };

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

                // 3.1. Set active main category tab programmatically
                if (tabsWrapper) {
                    const mainTab = tabsWrapper.querySelector(`.category-tab[data-category="${targetCat}"]`);
                    if (mainTab) {
                        tabsWrapper.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                        mainTab.classList.add('active');
                        
                        activeCategory = targetCat;
                        activeTreatment = null;

                        if (submenuPanel) {
                            submenuPanel.querySelectorAll('.submenu-content').forEach(c => {
                                c.classList.remove('active');
                                c.querySelectorAll('.treat-chip').forEach(chip => chip.classList.remove('active'));
                            });

                            const targetSubmenu = document.getElementById(`submenu-${activeCategory}`);
                            if (targetSubmenu) {
                                targetSubmenu.classList.add('active');
                                
                                // 3.2. Select subcategory / treatment chip inside submenu
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
                    }
                }

                if (tagsWrapper) {
                    tagsWrapper.querySelectorAll('.filter-tag').forEach(btn => btn.classList.remove('active'));
                    const allTag = tagsWrapper.querySelector('.filter-tag[data-specialty="all"]');
                    if (allTag) allTag.classList.add('active');
                }

                applyFilters();
            });
        });
    }
    
    window.addEventListener('languageChanged', () => {
        applyFilters();
    });
}

// Global reviews state
let submittedReviews = [];


// Average of real submitted reviews only; null when a clinic has none (never a made-up default)
function getClinicCategoryScore(clinicId, categoryKey) {
    const clinicIdInt = parseInt(clinicId);
    const reviewsForClinic = submittedReviews.filter(r => r.clinicId === clinicIdInt);
    if (reviewsForClinic.length === 0) return null;
    const sum = reviewsForClinic.reduce((total, r) => total + parseFloat(r[categoryKey]), 0);
    return (sum / reviewsForClinic.length).toFixed(1);
}

function getClinicOverallRating(clinicId) {
    const categories = ['booking', 'visit', 'procedure', 'post_care', 'revisit', 'parking', 'kindness', 'language_barrier', 'recommend', 'onemonth'];
    if (getClinicCategoryScore(clinicId, categories[0]) === null) return null;
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
                alert(t('rev_sim.alert_select_doctor'));
                return;
            }
            // Validate uploads
            if (!passportUploaded || !receiptUploaded) {
                alert(t('rev_sim.alert_upload_docs'));
                return;
            }
            
            currentWriterStep = 2;
            updateWizardUI();
        } else if (currentWriterStep === 2) {
            // Validate highlights (good review)
            const textGood = document.getElementById('text-good');
            if (!textGood || !textGood.value.trim()) {
                alert(t('rev_sim.alert_highlights'));
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
            btnNext.innerHTML = t('rev_sim.next_btn');
        } else if (currentWriterStep === 2) {
            btnPrev.disabled = false;
            btnNext.innerHTML = t('rev_sim.next_btn');
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
    const clinicName = escapeHTML(clinic ? clinicText(clinic, 'name', 'clinic') : 'Selected Boutique Clinic');
    const doctorName = escapeHTML(clinic ? clinicText(clinic, 'doctor_name', 'doctor') : 'Chief Physician');
    
    const fitzType = quizData.fitzpatrickType || 3;
    const skinLabel = t('reviews.skin_type').replace('{type}', fitzType);
    const initials = 'UR';
    const reviewerName = t('reviews.verified_member');
    
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
                "${escapeHTML(review.good)}"
            </p>
            <div class="review-doctor-link">
                <span>${t('reviews.clinic_prefix')}${clinicName}</span>
                <span>${t('reviews.physician_prefix')}<strong>${doctorName}</strong></span>
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
    defaultOpt.textContent = t('rev_sim.select_doctor_placeholder');
    docSelect.appendChild(defaultOpt);
 
    // Only partner clinics with a named doctor can be reviewed; there is no sample fallback list
    (loadedClinicsGlobal || []).filter(c => !isPublicClinic(c) && c.doctor_name).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${clinicText(c, 'doctor_name', 'doctor')} (${clinicText(c, 'name', 'clinic')})`;
        docSelect.appendChild(opt);
    });
}

// ========================================================
// Expandable Reviews – Dummy Data & Rendering
// ========================================================

const DUMMY_REVIEWS = [];

const BEST_REVIEWS = [];

function updateReviewStats() {
    const all = [...BEST_REVIEWS, ...DUMMY_REVIEWS];
    const total = document.getElementById('reviewTotalCount');
    const avg = document.getElementById('reviewAvgRating');
    const verified = document.getElementById('reviewVerifiedShare');
    if (total) total.textContent = all.length;
    if (avg) avg.textContent = all.length ? (all.reduce((sum, r) => sum + r.stars, 0) / all.length).toFixed(2) : '–';
    if (verified) verified.textContent = all.length ? '100%' : '–';
    const actions = document.querySelector('.reviews-expand-actions');
    if (actions) actions.style.display = DUMMY_REVIEWS.length ? '' : 'none';
}

function initExpandableReviews() {
    const allGrid = document.getElementById('allReviewsGrid');
    const bestGrid = document.getElementById('bestReviewsGrid');
    const wrapper = document.getElementById('reviewsExpandWrapper');
    const btn = document.getElementById('btnExpandReviews');
    updateReviewStats();
    
    // Render best reviews
    if (bestGrid) {
        renderReviews(BEST_REVIEWS, bestGrid, true);
    }
    
    // Render expandable reviews
    if (allGrid) {
        renderReviews(DUMMY_REVIEWS, allGrid, false);
    }

    if (!allGrid || !wrapper || !btn) return;

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
        if (bestGrid) renderReviews(BEST_REVIEWS, bestGrid, true);
        if (allGrid) renderReviews(DUMMY_REVIEWS, allGrid, false);
    });
}

function renderReviews(reviewsData, grid, isBest = false) {
    const lang = getCurrentLang();
    grid.innerHTML = '';
    if (isBest && !reviewsData.length) {
        const empty = document.createElement('p');
        empty.className = 'reviews-empty';
        empty.textContent = t('reviews.empty');
        grid.appendChild(empty);
        return;
    }

    reviewsData.forEach((r, i) => {
        const starStr = '⭐'.repeat(r.stars);
        // Fall back to the English review body when a language has no translation
        const text = r[`text_${lang}`] || r.text_en;
        const treatmentLabel = ((window.reviewTreatmentTranslations || {})[lang] || {})[r.treatment] || r.treatment;
        const verifiedText = t('reviews.verified_badge');
        const helpfulText = t('reviews.helpful');
        const clinicPrefix = t('reviews.clinic_prefix');
        const physicianPrefix = t('reviews.physician_prefix');

        // 10가지 지표 점수
        const metrics = r.metrics || {
            friendliness: 8 + (i % 3),
            consultation: 9 - (i % 2),
            language: 8 + (i % 2),
            no_overtreatment: 9 + (i % 2 === 0 ? 1 : 0),
            pricing: 8 + (i % 3),
            accessibility: 7 + (i % 4),
            waiting: 8 - (i % 3),
            cleanliness: 9,
            pain: 7 + (i % 3),
            aftercare: 8 + (i % 2)
        };

        const metricKeys = [
            'friendliness', 'consultation', 'language', 'no_overtreatment', 'pricing',
            'accessibility', 'waiting', 'cleanliness', 'pain', 'aftercare'
        ];
        
        const metricsHTML = `<div class="review-metrics-grid">` + 
            metricKeys.map(key => {
                const label = t(`metric.${key}`);
                const score = metrics[key];
                const pct = score * 10;
                return `
                    <div class="review-metric-item">
                        <div class="metric-label-row">
                            <span class="metric-label">${label}</span>
                            <span class="metric-score">${score} / 10</span>
                        </div>
                        <div class="metric-bar-container">
                            <div class="metric-bar-fill" style="width: ${pct}%;"></div>
                        </div>
                    </div>
                `;
            }).join('') + `</div>`;

        // Review data already carries its own quote marks; strip them so the box doesn't show ""double quotes""
        const commentHTML = `<div class="review-comment-box">"${text.replace(/^"|"$/g, '')}"</div>`;

        const card = document.createElement('div');
        card.className = `review-card ${isBest ? 'review-best' : ''}`;
        card.style.animationDelay = `${i * 0.05}s`;
        
        const bestBadgeHTML = isBest ? `<div class="review-best-badge">🏆 BEST</div>` : '';

        card.innerHTML = `
            ${bestBadgeHTML}
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
            <div class="review-treatment-tag">${escapeHTML(treatmentLabel)}</div>
            
            ${metricsHTML}
            ${commentHTML}

            <div class="review-helpful">
                <button class="review-helpful-btn">👍 ${helpfulText} <span class="helpful-count">${r.helpful}</span></button>
            </div>
            <div class="review-doctor-link">
                <span class="review-clinic-link" data-clinic-id="${escapeHTML(r.clinicId)}">${clinicPrefix}<strong>${escapeHTML(getLocalizedText(r.clinic, 'clinic'))}</strong></span>
                <span>${physicianPrefix}<strong>${escapeHTML(getLocalizedText(r.doctor, 'doctor'))}</strong></span>
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

// Listen to language change to redraw clinic list immediately
window.addEventListener('languageChanged', () => {
    const progressText = document.querySelector('.quiz-progress-text');
    if (progressText) {
        progressText.textContent = t('quiz.progress').replace('{current}', progressText.dataset.step || 1);
    }
    if (typeof loadedClinicsGlobal !== 'undefined' && loadedClinicsGlobal.length > 0) {
        renderClinicCards(loadedClinicsGlobal);
    }
});
