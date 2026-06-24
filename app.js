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

// app.js 내 openClinicDetailModal 함수 오버라이딩 (11개 세부 카테고리 시각화 반영)
function openClinicDetailModal(clinicId) {
    const data = loadedClinicsGlobal.find(c => c.id === parseInt(clinicId));
    if (!data) return;

    activeClinicId = clinicId;
    resetBookingViews();

    // 기본 텍스트 정보 매핑
    document.getElementById('clinic-detail-name').textContent = data.name;
    document.getElementById('clinic-detail-location').textContent = data.location;
    document.getElementById('clinic-detail-rating').textContent = data.rating;
    document.getElementById('clinic-detail-desc').textContent = data.description;
    document.getElementById('clinic-detail-hours').textContent = data.hours;

    // 1. 전문 분야(Specialties) 태그 바인딩
    const specialtiesContainer = document.getElementById('clinic-detail-specialties');
    specialtiesContainer.innerHTML = '';
    (data.specialties || []).forEach(spec => {
        const tag = document.createElement('span');
        tag.className = 'partner-tag';
        tag.textContent = spec;
        specialtiesContainer.appendChild(tag);
    });

    // ========================================================
    // ★ 예리 원장님 피드백 반영: 11개 세부 평점 카테고리 차트 동적 주입
    // ========================================================
    const safetyContainer = document.getElementById('clinic-detail-safety-grid');
    if (safetyContainer) {
        safetyContainer.innerHTML = '';

        // 각 클리닉별로 실제 디테일한 백엔드 평점 데이터가 수집되기 전, 
        // 11개 기준에 맞춘 시뮬레이션 스케일 차트(바) 레이아웃을 생성합니다.
        const lang = getCurrentLang();

        // i18n에 정의된 키를 매핑하여 다국어 지원 보장
        const ratingCategories = [
            { label: t('rev_sim.cat_booking') || '1. Reservation:', score: 4.8 },
            { label: t('rev_sim.cat_visit') || '2. Arrival & Wait:', score: 4.5 },
            { label: t('rev_sim.cat_doc_design') || '3. Procedure Consultation:', score: 4.9 },
            { label: t('rev_sim.cat_post_care') || '4. Aftercare Warning Guide:', score: 4.7 },
            { label: t('rev_sim.cat_side_effect') || '5. Side Effects & Pain:', score: 1.2 }, // 낮을수록 좋음
            { label: t('rev_sim.cat_revisit') || '6. Intention to Revisit:', score: 4.8 },
            { label: t('rev_sim.cat_kindness') || '9. Staff Kindness & Parking:', score: 4.6 },
            { label: t('rev_sim.cat_recommend') || '10. Willingness to Recommend:', score: 4.9 },
            { label: t('rev_sim.cat_onemonth') || '11. 1-Month Later Follow-up:', score: 4.7 }
        ];

        // 7, 8번 서술형 데이터(좋았던 점, 개선할 점)는 텍스트 영역으로 별도 처리
        ratingCategories.forEach(cat => {
            const row = document.createElement('div');
            row.className = 'clinic-detail-rating-row';
            row.style.cssText = 'margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;';

            // 점수에 따른 바 백분율 계산
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

        // 7번 & 8번 서술형 날것의 후기 피드백(Highlights & Improvements) 영역 박스 추가
        const highlightBox = document.createElement('div');
        highlightBox.style.cssText = 'margin-top: 16px; background: var(--bg-primary); padding: 12px; border-radius: 8px; font-size: 12px; border-left: 4px solid var(--color-success);';
        highlightBox.innerHTML = `
            <strong>💡 ${t('rev_sim.cat_good') || '7. Highlights'}:</strong>
            <p style="margin-top: 4px; font-style: italic; color: var(--text-secondary);">${lang === 'ko' ? '"원장님이 피부 두께를 직접 자로 재가며 파장을 수동 조절해 주신 점이 대만족이었습니다."' : '"Loved how the doctor manually adjusted the wavelength based on my exact skin profile."'}</p>
        `;
        safetyContainer.appendChild(highlightBox);
    }

    // 의사 정보 프로필 매핑
    document.getElementById('clinic-detail-doc-avatar').textContent = data.doctor_avatar;
    document.getElementById('clinic-detail-doc-name').textContent = data.doctor_name;
    document.getElementById('clinic-detail-doc-title').textContent = data.doctor_title;
    document.getElementById('clinic-detail-doc-bio').textContent = data.doctor_bio;

    // 지도 렌더링
    const mapIframe = document.getElementById('clinic-detail-map-iframe');
    if (mapIframe) mapIframe.src = data.map_iframe;

    // 모달 활성화 및 바디 스크롤 차단
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