// ==========================================
// KOMICARE i18n Translation Engine
// ==========================================

let currentLang = 'en';

const translations = {
    en: {
        // ---- Header ----
        "header.badge": "100% Verified Boutique Only",

        // ---- Hero Section ----
        "hero.social_proof": "Join 540+ medical travelers",
        "hero.social_proof_suffix": "securing early access this month.",
        "hero.headline": "Tired of Fake Reviews and K-Beauty <br>",
        "hero.headline_gradient": "\"Factory\" Clinics?",
        "hero.subheadline": "Access Seoul's top Board-Certified Dermatologists through 100% visit-verified, unedited patient reviews. No sponsored ads. No hidden fees. Just honest medical expertise tailored to your specific skin type.",

        // ---- Quiz ----
        "quiz.step_title": "Step 1: Check Your Skin Behavior",
        "quiz.title": "Fitzpatrick Skin Type Quiz",
        "quiz.q1": "Q1. What is the color of your untreated skin?",
        "quiz.q1_a1": "Pale White / Translucent",
        "quiz.q1_a2": "Fair / Pale",
        "quiz.q1_a3": "Olive / Golden-Beige",
        "quiz.q1_a4": "Light Brown",
        "quiz.q1_a5": "Dark Brown",
        "quiz.q1_a6": "Deep Brown / Black",
        "quiz.q2": "Q2. What happens when you stay in the sun without sunscreen?",
        "quiz.q2_a1": "Always burns, blisters & peels",
        "quiz.q2_a2": "Usually burns, peels extensively",
        "quiz.q2_a3": "Burns moderately, tans gradually",
        "quiz.q2_a4": "Rarely burns, tans easily",
        "quiz.q2_a5": "Very rarely burns, tans heavily",
        "quiz.q2_a6": "Never burns, deeply pigmented",
        "quiz.q3": "Q3. How does your skin react to multiple days of sun exposure?",
        "quiz.q3_a1": "Never tans, peels immediately",
        "quiz.q3_a2": "Tans lightly, freckles often",
        "quiz.q3_a3": "Tans reasonably, burns occasionally",
        "quiz.q3_a4": "Tans deeply, rarely burns",
        "quiz.q3_a5": "Tans extremely deeply, never burns",
        "quiz.email_label": "Step 2: Where should we send your skin profile & guide?",
        "quiz.email_placeholder": "Enter your best email address",
        "quiz.submit_btn": "Send Me the Safety Guide & Access Passport",
        "quiz.disclaimer": "🔒 Anti-Spam: We hate fake reviews and spam. 100% Confidential.",
        "quiz.progress": "Step {current} of 3",
        "quiz.securing": "Securing Connection...",

        // ---- Results ----
        "results.step_title": "Skin Diagnostic Passport",
        "results.type_title": "Fitzpatrick Type",
        "results.verified": "Verified Analysis",
        "results.active": "Active",
        "results.behavior_label": "Sun Reaction Behavior:",
        "results.lasers_label": "Recommended Laser Protocol:",
        "results.warning_title": "Fitzpatrick Safety Warning:",
        "results.open_handbook": "📖 Open Safety Handbook Now",
        "results.retake": "🔄 Re-take skin diagnostic",
        "results.safety_advisory": "🛡️ Fitzpatrick {type} Safety Advisory:",

        // ---- Reality Section ----
        "reality.tag": "The Reality",
        "reality.title": "Why Factory Vouchers ",
        "reality.title_serif": "will Cook Your Barrier",
        "reality.subtitle": "Standard mass-volume clinics prioritize patient turnover rate and sales margins over actual medical safety and parameters.",
        "reality.card1_title": "The Fitzpatrick Skin Blindspot",
        "reality.card1_text": "Most mass-market clinics use hard-coded laser settings calibrated strictly for East Asian skin types. Without custom pulse calibration, Western patients (Types I-II & V-VI) suffer severe PIH (hyperpigmentation) and laser burns.",
        "reality.card2_title": "The \"Ghost Doctor\" Assembly Line",
        "reality.card2_text": "You spend an hour consulting with a commission-driven sales representative who aggressively pushes expensive packages, only for a doctor you've never met to fire lasers at your face for two minutes without analyzing your barrier.",
        "reality.card3_title": "Pay-to-Play Platform Rankings",
        "reality.card3_text": "Major K-beauty booking platforms filter reviews based on clinic advertising spends. Clinics easily delete negative reviews or bribe clients with free sheet masks to manipulate star ratings.",

        // ---- Promise Section ----
        "promise.tag": "Our Promise",
        "promise.title": "The Safe & Boutique ",
        "promise.title_serif": "Verification Standard",
        "promise.subtitle": "We vet clinics on strict physician-led parameters. No chains, no shadow doctors, no sponsored rankings.",
        "promise.card1_title": "Zero Factory Chains",
        "promise.card1_text": "We partner exclusively with independent boutique clinics that enforce strict limits on hourly appointment bookings, ensuring the physician has ample time to consult and treat you.",
        "promise.card2_title": "100% Visit-Verified & Unedited",
        "promise.card2_text": "Every review requires an official Medical Tax Refund receipt verify code. We host databases offshore to legally bypass 'Truth-Based Defamation' removal requests from clinics.",
        "promise.card3_title": "Fitzpatrick Scale Calibration",
        "promise.card3_text": "Our clinics possess validated hardware (Nd:YAG lasers, dual-cooling heads) and documented medical track records calibrated for diverse global skin types.",

        // ---- Directory Section ----
        "directory.tag": "Boutique Directory",
        "directory.title": "Verified Partner Clinics ",
        "directory.title_serif": "& Validation Engine",
        "directory.subtitle": "Explore our certified clinics and see how we verify review authenticity while preserving patient anonymity.",
        "directory.loading": "🔄 Loading verified boutique clinics...",
        "directory.empty": "⚠️ No verified boutique clinics available at the moment.",

        // ---- Receipt Masker ----
        "receipt.title": "Receipt Privacy Masker",
        "receipt.desc": "We blur sensitive financial logs client-side before review upload. Clinics can never trace bad reviews back to your passport or credit card.",
        "receipt.header_txt": "MEDICAL TAX REFUND CERTIFICATE",
        "receipt.header_sub": "(환급용 확인서)",
        "receipt.mask_btn": "🛡️ Simulate Tax Refund Masking",
        "receipt.unmask_btn": "🔒 Unmask Mock Data",
        "receipt.status_unmasked": "⚠️ Unmasked Plaintext Data Exists",
        "receipt.status_masked": "✅ Secure Client-Side Masking Active",

        // ---- Reviews Section ----
        "reviews.tag": "Patient Feedback",
        "reviews.title": "100% Visit-Verified Reviews ",
        "reviews.title_serif": "Linked to Doctors",
        "reviews.subtitle": "Every single review is matched to the exact operating physician through receipt check codes. Un-deletable.",
        "reviews.r1_name": "Jessica S.",
        "reviews.r1_skin": "Fitzpatrick Type I",
        "reviews.r1_text": "\"I had a horrible experience at a factory clinic in Gangnam where they burned my skin with IPL. Dr. Minji Kim was a lifesaver. She immediately recognized my thin Type I skin barrier, manually set the laser to a safe wavelength, and focused on recovery. Highly recommend this boutique standard.\"",
        "reviews.r1_clinic": "Clinic: Myeongdong Forest",
        "reviews.r1_doctor": "Dr. Minji Kim",
        "reviews.r2_name": "Amara M.",
        "reviews.r2_skin": "Fitzpatrick Type V",
        "reviews.r2_text": "\"As someone with dark skin, I was terrified of laser toning in Korea because of hypopigmentation risks. Dr. Ji-Yeon Lee checked my Fitzpatrick type, explained why she would use the Nd:YAG laser with a long pulse duration, and calibrated the cooling device. My skin has never looked cleaner.\"",
        "reviews.r2_clinic": "Clinic: Cheongdam Barrier Lab",
        "reviews.r2_doctor": "Dr. Ji-Yeon Lee",
        "reviews.verified_badge": "✓ Receipt Verified",

        // ---- Founder Section ----
        "founder.tag": "Founder's Mission",
        "founder.badge": "Board-Certified",
        "founder.quote": "\"I built this platform because I was tired of treating tourists whose skin barriers had been completely cooked by factory-style chains.\"",
        "founder.text": "\"As a dermatologist practicing in Seoul, I saw too many international patients suffer from preventable laser complications. You invest thousands of dollars and your precious time—you deserve absolute safety, genuine tips, and physician-led care. Komicare validates every review and clinic on clinical parameters to restore trust in Korean dermatology.\"",
        "founder.name": "Dr. Minji Kim",
        "founder.title": "Founder & Board-Certified Dermatologist",

        // ---- Clinic Detail Modal ----
        "clinic.rating_label": "Clinic Rating",
        "clinic.about_label": "About the Clinic",
        "clinic.specialties_label": "Specialties",
        "clinic.doctor_label": "Operating Physician",
        "clinic.hours_label": "Operating Hours",
        "clinic.map_label": "Clinic Location Map",
        "clinic.book_btn": "📅 Secure 1:1 Booking Slot",
        "clinic.booking_title": "Direct Premium Booking",
        "clinic.back_to_map": "← Back to Map",

        // ---- Booking Form ----
        "booking.name_label": "Your Full Name",
        "booking.name_placeholder": "Enter your full name",
        "booking.email_label": "Your Email",
        "booking.email_placeholder": "Enter your email address",
        "booking.date_label": "Date",
        "booking.time_label": "Preferred Time",
        "booking.time_placeholder": "Select time...",
        "booking.treatment_label": "Preferred Treatment",
        "booking.treatment_consult": "Consultation Only",
        "booking.treatment_pico": "Pico Toning Laser",
        "booking.treatment_barrier": "Skin Barrier Reconstruction",
        "booking.treatment_vascular": "Vascular Redness Laser",
        "booking.treatment_ulthera": "Ultherapy Premium Lifting",
        "booking.submit_btn": "Confirm Premium Booking",
        "booking.securing": "Securing Slot...",
        "booking.success_title": "Booking Successfully Locked!",
        "booking.success_msg": "We have reserved your slot with the dermatologist. A confirmation email has been dispatched to your inbox.",
        "booking.success_detail": "We have successfully reserved your premium 1:1 consultation slot with <strong>{clinic}</strong> on <strong>{date}</strong> at <strong>{time}</strong>.<br><br>🔒 Secure Receipt Code: <code>{bookingId}</code>. A confirmation receipt has been dispatched to <strong>{email}</strong>.",
        "booking.return_btn": "Return to Clinic Map",

        // ---- Reader / Handbook Modal ----
        "reader.title": "Essential K-Beauty Safety Handbook",
        "reader.subtitle": "A Dermatologist's Guide for Western Skin Types",
        "reader.ch1_title": "Chapter 1",
        "reader.ch1_name": "Decoding Your Skin Type",
        "reader.ch2_title": "Chapter 2",
        "reader.ch2_name": "5 Questions to Expose Factories",
        "reader.ch3_title": "Chapter 3",
        "reader.ch3_name": "Spotting a Factory Clinic",
        "reader.ch4_title": "Chapter 4",
        "reader.ch4_name": "The Recovery Roadmap",
        "reader.prev_btn": "← Previous",
        "reader.next_btn": "Next →",
        "reader.finish_btn": "Finish & Close ✓",
        "reader.coupon_label": "WAITLIST VIP PASSCODE:",
        "reader.copy_btn": "📋 Copy Questions Checklist to Clipboard",
        "reader.copied": "✨ Copied to Clipboard!",

        // ---- Footer ----
        "footer.about": "Komicare is the first safety-verified boutique skin matchmaking platform for medical travelers. Our database is hosted in offshore jurisdictions to protect patient reviews from Truth-Based Defamation censorship laws.",
        "footer.links_title": "Trust Resources",
        "footer.link_handbook": "Safety Handbook",
        "footer.link_privacy": "Privacy Architecture",
        "footer.link_partner": "Boutique Partner Application",
        "footer.copyright": "© 2026 KOMICARE Inc. All rights reserved.",
        "footer.server": "Offshore Jurisdiction Server Node | Data Encrypted & Anonymized",

        // ---- New Platform Restructured Keys ----
        "compare.title": "Boutique Standard vs. Factory Clinic",
        "compare.factory_title": "Factory Clinic",
        "compare.boutique_title": "Komicare Boutique",
        "compare.factory_price": "100,000 KRW",
        "compare.boutique_price": "200,000 KRW",
        "compare.factory_desc": "3-minute treatment by random doctor, no safety calibration.",
        "compare.boutique_desc": "1:1 chief physician custom design, pulse width calibration & recovery care.",
        "compare.factory_consult": "Rushed consultation with sales rep",
        "compare.boutique_consult": "In-depth medical consultation with chief physician",
        "compare.factory_care": "No post-procedure care",
        "compare.boutique_care": "Guaranteed post-departure remote care",
        "compare.factory_risk": "High burn & skin barrier damage risk",
        "compare.boutique_risk": "Optimized safety under certified specialist",
        "compare.btn": "Select Boutique Standard",

        "search.placeholder": "Search by treatment (e.g. Pico, Nd:YAG, Ulthera...)",
        "filter.all": "All Treatments",

        "badge.dermatologist": "Board-Certified Dermatologist",
        "badge.specialist": "Specialist",
        "badge.gp": "General Practitioner",
        "badge.anesthesiologist": "Anesthesiologist Residing",
        "badge.no_anesthesiologist": "Local Anesthesia Only",
        "badge.foreign_attraction": "Registered Attraction Clinic",
        "badge.foreigner_insurance": "Foreigner Liability Insured",
        "badge.aftercare_excellence": "Excellent Aftercare Selected",
        "safety.verified_title": "Safety Credentials Verified",

        "dr_view.tag": "Physician Value",
        "dr_view.title": "Reclaim Your Medical Autonomy",
        "dr_view.subtitle": "Say goodbye to price dumping and expensive broker commissions. Let your clinical skills shine.",
        "dr_view.card1_title": "1. Reward by Clinical Skill",
        "dr_view.card1_text": "Excellent hand skills and treatment results speak for themselves. Transparent, un-deletable reviews organically build your signature procedure reputation.",
        "dr_view.card2_title": "2. Price Protection",
        "dr_view.card2_text": "Foreigners fear botched procedures and complications. A signature treatment that the chief doctor confidently guarantees allows you to charge premium prices.",
        "dr_view.card3_title": "3. Broker-Free Ecosystem",
        "dr_view.card3_text": "Accumulate genuine trust data to attract international patients directly, eliminating high broker commission cuts and creating a virtuous circle.",

        "diff.tag": "Platform Integrity",
        "diff.title": "Why Komicare is Different",
        "diff.subtitle": "Unlike advertising-focused directories, we enforce legal and structural integrity rules.",
        "diff.col_feature": "Core Rule",
        "diff.col_legacy": "Existing Ticket Apps",
        "diff.col_komi": "Komicare Standard",
        "diff.row1_feature": "Review Manipulation",
        "diff.row1_legacy": "Easy to delete negative feedback / sponsored rankings",
        "diff.row1_komi": "One-strike permanent ban and delisting of clinics",
        "diff.row2_feature": "Clinic Rebates",
        "diff.row2_legacy": "Clinics bribe reviews with free sheets/vouchers",
        "diff.row2_komi": "Bribe coercion whistleblower reporting with cash rewards",
        "diff.row3_feature": "Foreigner Verification",
        "diff.row3_legacy": "Simple phone number or email checks",
        "diff.row3_komi": "Mandatory passport scan & medical tax refund receipt validation",
        "diff.row4_feature": "1-Month Long-Term Followup",
        "diff.row4_legacy": "None (Only instant review on checkout)",
        "diff.row4_komi": "1-Month-later review gets skincare point rewards",
        "diff.row5_feature": "Malicious Review Policy",
        "diff.row5_legacy": "Platform deletes them immediately upon clinic request",
        "diff.row5_komi": "Platform mediates only; clinic and client settle directly (Coupang Eats model)",

        "rev_sim.btn": "✍_ Write a Verified Review (Simulator)",
        "rev_sim.modal_title": "Visit-Verified Review Writer Simulator",
        "rev_sim.modal_subtitle": "100% authenticated review matching to the operating physician",
        "rev_sim.step1": "1. Documents Upload",
        "rev_sim.step2": "2. 11-Point Rating",
        "rev_sim.step3": "3. Long-Term & Whistleblower",
        "rev_sim.passport_label": "Passport Verification (Scan Info Page)",
        "rev_sim.passport_desc": "Used strictly for country checking and duplicated review protection. Stored client-side only.",
        "rev_sim.receipt_label": "Medical Tax Refund Receipt",
        "rev_sim.receipt_desc": "Tax Refund ID and TX codes verify your actual visitation at the selected clinic.",
        "rev_sim.doctor_select_label": "Select Treating Physician",
        "rev_sim.criteria_label": "Rate Your Experience (11 Evaluation Criteria)",
        "rev_sim.cat_booking": "1. Reservation (Language/Speed):",
        "rev_sim.cat_visit": "2. Arrival & Wait (Schedule adherence):",
        "rev_sim.cat_doc_design": "3. Procedure Consultation (Design, Explanation):",
        "rev_sim.cat_post_care": "4. Aftercare Warning Guide (Post-treatment explanation):",
        "rev_sim.cat_side_effect": "5. Side Effects & Pain Intensity (Lower is better):",
        "rev_sim.cat_revisit": "6. Intention to Revisit:",
        "rev_sim.cat_good": "7. Highlights (What went well):",
        "rev_sim.cat_bad": "8. Areas for Improvement:",
        "rev_sim.cat_kindness": "9. General Staff Kindness & Parking:",
        "rev_sim.cat_recommend": "10. Willingness to Recommend to Friends:",
        "rev_sim.cat_onemonth": "11. 1-Month Later Follow-up Opt-in:",
        "rev_sim.onemonth_opt": "I agree to submit a 1-month-later review for skincare rewards.",
        "rev_sim.revis_yes": "Yes",
        "rev_sim.revis_no": "No",
        "rev_sim.recom_yes": "Yes",
        "rev_sim.recom_no": "No",
        "rev_sim.whistleblower_label": "Whistleblower & Bribe Declaration",
        "rev_sim.whistleblower_desc": "Did the hospital request a positive review in exchange for rebates, refunds, discount coupons, or gifts?",
        "rev_sim.whistleblower_btn": "🚨 Report Bribe Attempt",
        "rev_sim.whistleblower_msg": "Your whistleblowing report is registered! Under our whistleblower reward policy, if the clinic's manipulation attempt is validated, you will receive a 500,000 KRW platform reward. The clinic will receive a 1st warning infraction.",
        "rev_sim.submit": "Upload Authenticated Review",
        "rev_sim.success_title": "Verified Review Published!",
        "rev_sim.success_desc": "Thank you for your honest data. Your review is permanently stored on our offshore database node and cannot be deleted by the clinic."
    },

    ko: {
        // ---- Header ----
        "header.badge": "100% 검증된 부티크 전용",

        // ---- Hero Section ----
        "hero.social_proof": "540명 이상의 의료 여행자",
        "hero.social_proof_suffix": "가 이번 달 얼리 액세스를 확보하고 있습니다.",
        "hero.headline": "가짜 리뷰와 K-뷰티 <br>",
        "hero.headline_gradient": "\"공장식\" 클리닉에 지치셨나요?",
        "hero.subheadline": "100% 방문 인증, 무삭제 환자 리뷰를 통해 서울 최고의 피부과 전문의를 만나보세요. 협찬 광고 없음. 숨겨진 비용 없음. 당신의 피부 타입에 맞춘 정직한 의료 전문성만을 제공합니다.",

        // ---- Quiz ----
        "quiz.step_title": "1단계: 피부 반응 확인",
        "quiz.title": "피츠패트릭 피부 타입 진단",
        "quiz.q1": "Q1. 아무 처치를 하지 않은 본래 피부색은 어떤가요?",
        "quiz.q1_a1": "매우 창백 / 투명한 피부",
        "quiz.q1_a2": "밝은 피부 / 약간 창백",
        "quiz.q1_a3": "올리브톤 / 황금빛 베이지",
        "quiz.q1_a4": "연한 갈색",
        "quiz.q1_a5": "진한 갈색",
        "quiz.q1_a6": "매우 진한 갈색 / 검정",
        "quiz.q2": "Q2. 자외선 차단제 없이 햇볕에 노출되면 어떤 반응이 나타나나요?",
        "quiz.q2_a1": "항상 화상, 물집 및 각질 벗겨짐",
        "quiz.q2_a2": "대체로 화상, 심한 각질 벗겨짐",
        "quiz.q2_a3": "보통 수준의 화상, 서서히 태닝",
        "quiz.q2_a4": "거의 화상 없음, 쉽게 태닝",
        "quiz.q2_a5": "매우 드물게 화상, 빠르게 태닝",
        "quiz.q2_a6": "절대 화상 없음, 깊은 색소 침착",
        "quiz.q3": "Q3. 여러 날 연속 햇볕에 노출되면 피부가 어떻게 반응하나요?",
        "quiz.q3_a1": "전혀 태닝되지 않음, 즉시 각질 벗겨짐",
        "quiz.q3_a2": "약간의 태닝, 주근깨 발생",
        "quiz.q3_a3": "적당한 태닝, 간헐적 화상",
        "quiz.q3_a4": "깊은 태닝, 거의 화상 없음",
        "quiz.q3_a5": "매우 깊은 태닝, 절대 화상 없음",
        "quiz.email_label": "2단계: 피부 진단서와 가이드를 어디로 보내드릴까요?",
        "quiz.email_placeholder": "이메일 주소를 입력해 주세요",
        "quiz.submit_btn": "안전 가이드 & 피부 패스포트 받기",
        "quiz.disclaimer": "🔒 스팸 방지: 가짜 리뷰와 스팸을 거부합니다. 100% 기밀 보장.",
        "quiz.progress": "{current}단계 / 3단계",
        "quiz.securing": "보안 연결 중...",

        // ---- Results ----
        "results.step_title": "피부 진단 패스포트",
        "results.type_title": "피츠패트릭 타입",
        "results.verified": "인증 완료 분석",
        "results.active": "활성",
        "results.behavior_label": "자외선 반응 특성:",
        "results.lasers_label": "권장 레이저 프로토콜:",
        "results.warning_title": "피츠패트릭 안전 경고:",
        "results.open_handbook": "📖 안전 핸드북 바로 열기",
        "results.retake": "🔄 피부 진단 다시 하기",
        "results.safety_advisory": "🛡️ 피츠패트릭 {type}형 안전 권고:",

        // ---- Reality Section ----
        "reality.tag": "현실",
        "reality.title": "공장식 바우처가 ",
        "reality.title_serif": "당신의 피부 장벽을 망치는 이유",
        "reality.subtitle": "대량 환자 수용 클리닉은 실질적인 의료 안전보다 환자 회전율과 매출 마진을 우선시합니다.",
        "reality.card1_title": "피츠패트릭 피부 사각지대",
        "reality.card1_text": "대부분의 대형 클리닉은 동아시아 피부 타입에만 맞춰 고정된 레이저 세팅을 사용합니다. 커스텀 펄스 캘리브레이션 없이 서양인 환자(Type I-II & V-VI)는 심각한 과색소침착(PIH)과 레이저 화상에 시달립니다.",
        "reality.card2_title": "\"유령 의사\" 조립 라인",
        "reality.card2_text": "1시간 동안 수수료 중심의 상담사와 고가 패키지를 떠안은 후, 한 번도 만난 적 없는 의사가 피부 장벽 분석 없이 2분간 레이저를 쏩니다.",
        "reality.card3_title": "광고비 기반 플랫폼 순위",
        "reality.card3_text": "주요 K-뷰티 예약 플랫폼은 클리닉 광고비에 따라 리뷰를 필터링합니다. 부정적 리뷰를 쉽게 삭제하거나 무료 마스크팩으로 별점을 조작합니다.",

        // ---- Promise Section ----
        "promise.tag": "우리의 약속",
        "promise.title": "안전하고 부티크한 ",
        "promise.title_serif": "검증 표준",
        "promise.subtitle": "엄격한 의사 주도 파라미터로 클리닉을 검증합니다. 체인점 없음, 유령 의사 없음, 협찬 순위 없음.",
        "promise.card1_title": "공장식 체인 제로",
        "promise.card1_text": "시간당 예약 수를 엄격히 제한하는 독립 부티크 클리닉만 파트너로 선별합니다. 의사가 충분한 시간을 갖고 상담하고 치료합니다.",
        "promise.card2_title": "100% 방문 인증 & 무편집",
        "promise.card2_text": "모든 리뷰는 공식 의료 세금 환급 영수증 인증 코드가 필요합니다. 클리닉의 '사실적시 명예훼손' 삭제 요청을 합법적으로 우회하기 위해 해외 서버에 데이터베이스를 호스팅합니다.",
        "promise.card3_title": "피츠패트릭 스케일 캘리브레이션",
        "promise.card3_text": "검증된 장비(Nd:YAG 레이저, 듀얼 쿨링 헤드)와 다양한 글로벌 피부 타입에 맞춘 문서화된 의료 실적을 보유한 클리닉입니다.",

        // ---- Directory Section ----
        "directory.tag": "부티크 디렉토리",
        "directory.title": "인증 파트너 클리닉 ",
        "directory.title_serif": "& 검증 엔진",
        "directory.subtitle": "인증된 클리닉을 살펴보고 환자 익명성을 보장하면서 리뷰 진위를 어떻게 검증하는지 확인하세요.",
        "directory.loading": "🔄 인증된 부티크 클리닉을 불러오는 중...",
        "directory.empty": "⚠️ 현재 이용 가능한 인증 부티크 클리닉이 없습니다.",

        // ---- Receipt Masker ----
        "receipt.title": "영수증 프라이버시 마스커",
        "receipt.desc": "리뷰 업로드 전에 민감한 금융 정보를 클라이언트 측에서 블러 처리합니다. 클리닉이 부정적 리뷰를 여권이나 신용카드로 추적할 수 없습니다.",
        "receipt.header_txt": "의료 세금 환급 확인서",
        "receipt.header_sub": "(환급용 확인서)",
        "receipt.mask_btn": "🛡️ 세금 환급 마스킹 시뮬레이션",
        "receipt.unmask_btn": "🔒 모의 데이터 마스크 해제",
        "receipt.status_unmasked": "⚠️ 마스킹되지 않은 원본 데이터 존재",
        "receipt.status_masked": "✅ 보안 클라이언트 측 마스킹 활성",

        // ---- Reviews Section ----
        "reviews.tag": "환자 후기",
        "reviews.title": "100% 방문 인증 리뷰 ",
        "reviews.title_serif": "의사 실명 연동",
        "reviews.subtitle": "모든 리뷰는 영수증 인증 코드를 통해 실제 시술 의사와 매칭됩니다. 삭제 불가.",
        "reviews.r1_name": "Jessica S.",
        "reviews.r1_skin": "피츠패트릭 Type I",
        "reviews.r1_text": "\"강남의 한 공장식 클리닉에서 IPL로 피부에 화상을 입은 적이 있습니다. 김민지 원장님은 구세주였어요. 제 얇은 Type I 피부 장벽을 즉시 파악하고, 레이저를 안전한 파장으로 수동 조절하여 회복에 집중해 주셨습니다. 이 부티크 수준을 강력히 추천합니다.\"",
        "reviews.r1_clinic": "클리닉: 명동 포레스트",
        "reviews.r1_doctor": "김민지 원장",
        "reviews.r2_name": "Amara M.",
        "reviews.r2_skin": "피츠패트릭 Type V",
        "reviews.r2_text": "\"어두운 피부를 가진 저는 저색소증 위험 때문에 한국에서 레이저 토닝이 두려웠어요. 이지연 원장님이 제 피츠패트릭 타입을 확인하고, 긴 펄스 지속 시간의 Nd:YAG 레이저를 사용하는 이유를 설명하며, 쿨링 장치를 정밀하게 보정해 주셨습니다. 피부가 이렇게 깨끗했던 적이 없어요.\"",
        "reviews.r2_clinic": "클리닉: 청담 배리어 랩",
        "reviews.r2_doctor": "이지연 원장",
        "reviews.verified_badge": "✓ 영수증 인증 완료",

        // ---- Founder Section ----
        "founder.tag": "창업자의 사명",
        "founder.badge": "전문의 인증",
        "founder.quote": "\"공장식 체인에서 피부 장벽이 완전히 망가진 관광객들을 치료하는 것에 지쳐 이 플랫폼을 만들었습니다.\"",
        "founder.text": "\"서울에서 피부과를 운영하면서 예방 가능한 레이저 합병증으로 고통받는 너무 많은 해외 환자를 보았습니다. 수백만 원과 소중한 시간을 투자하는 만큼, 절대적인 안전성, 정품 팁, 그리고 의사 주도 진료를 받을 자격이 있습니다. 코미케어는 임상 파라미터를 기반으로 모든 리뷰와 클리닉을 검증하여 한국 피부과에 대한 신뢰를 회복합니다.\"",
        "founder.name": "김민지 원장",
        "founder.title": "창업자 & 피부과 전문의",

        // ---- Clinic Detail Modal ----
        "clinic.rating_label": "클리닉 평점",
        "clinic.about_label": "클리닉 소개",
        "clinic.specialties_label": "전문 분야",
        "clinic.doctor_label": "담당 전문의",
        "clinic.hours_label": "운영 시간",
        "clinic.map_label": "클리닉 위치",
        "clinic.book_btn": "📅 1:1 프리미엄 예약",
        "clinic.booking_title": "프리미엄 직접 예약",
        "clinic.back_to_map": "← 지도로 돌아가기",

        // ---- Booking Form ----
        "booking.name_label": "성함",
        "booking.name_placeholder": "성함을 입력해 주세요",
        "booking.email_label": "이메일",
        "booking.email_placeholder": "이메일 주소를 입력해 주세요",
        "booking.date_label": "날짜",
        "booking.time_label": "희망 시간",
        "booking.time_placeholder": "시간 선택...",
        "booking.treatment_label": "희망 시술",
        "booking.treatment_consult": "상담만",
        "booking.treatment_pico": "피코 토닝 레이저",
        "booking.treatment_barrier": "피부 장벽 재건",
        "booking.treatment_vascular": "혈관 홍조 레이저",
        "booking.treatment_ulthera": "울쎄라 프리미엄 리프팅",
        "booking.submit_btn": "프리미엄 예약 확정",
        "booking.securing": "예약 확보 중...",
        "booking.success_title": "예약이 성공적으로 확정되었습니다!",
        "booking.success_msg": "전문의와의 예약이 확보되었습니다. 확인 이메일이 발송되었습니다.",
        "booking.success_detail": "<strong>{clinic}</strong>에서 <strong>{date}</strong> <strong>{time}</strong>에 프리미엄 1:1 상담 예약이 성공적으로 확보되었습니다.<br><br>🔒 보안 영수증 코드: <code>{bookingId}</code>. 확인 영수증이 <strong>{email}</strong>(으)로 발송되었습니다.",
        "booking.return_btn": "클리닉 지도로 돌아가기",

        // ---- Reader / Handbook Modal ----
        "reader.title": "필수 K-뷰티 안전 핸드북",
        "reader.subtitle": "서양 피부 타입을 위한 피부과 전문의 가이드",
        "reader.ch1_title": "제1장",
        "reader.ch1_name": "피부 타입 해독하기",
        "reader.ch2_title": "제2장",
        "reader.ch2_name": "공장식 클리닉을 가려내는 5가지 질문",
        "reader.ch3_title": "제3장",
        "reader.ch3_name": "공장식 클리닉 구별법",
        "reader.ch4_title": "제4장",
        "reader.ch4_name": "회복 로드맵",
        "reader.prev_btn": "← 이전",
        "reader.next_btn": "다음 →",
        "reader.finish_btn": "종료 & 닫기 ✓",
        "reader.coupon_label": "대기자 VIP 패스코드:",
        "reader.copy_btn": "📋 질문 체크리스트 클립보드에 복사",
        "reader.copied": "✨ 클립보드에 복사 완료!",

        // ---- Footer ----
        "footer.about": "코미케어는 의료 여행자를 위한 최초의 안전 검증 부티크 피부 매칭 플랫폼입니다. 사실적시 명예훼손 검열법으로부터 환자 리뷰를 보호하기 위해 해외 관할권 서버에 데이터베이스를 호스팅합니다.",
        "footer.links_title": "신뢰 자료",
        "footer.link_handbook": "안전 핸드북",
        "footer.link_privacy": "프라이버시 아키텍처",
        "footer.link_partner": "부티크 파트너 신청",
        "footer.copyright": "© 2026 KOMICARE Inc. All rights reserved.",
        "footer.server": "해외 관할권 서버 노드 | 데이터 암호화 & 익명화",

        // ---- New Platform Restructured Keys ----
        "compare.title": "부티크 디자인 시술 vs 공장식 시술",
        "compare.factory_title": "공장식 시술",
        "compare.boutique_title": "코미케어 부티크 디자인",
        "compare.factory_price": "10만 원",
        "compare.boutique_price": "20만 원",
        "compare.factory_desc": "3분 만에 끝나는 번개 시술, 안전 장비 조절 없음",
        "compare.boutique_desc": "1:1 원장 전담 디자인 시술, 피부타입 맞춤 펄스 조절 및 출국 후 케어 보장",
        "compare.factory_consult": "인센티브 위주의 상담 실장 위주 상담",
        "compare.boutique_consult": "전담 의사 직접 피부 상태 정밀 상담",
        "compare.factory_care": "출국 후 사후 케어 전무",
        "compare.boutique_care": "출국 후 케어 완벽 보장",
        "compare.factory_risk": "피부 장벽 파괴 및 화상 위험 높음",
        "compare.boutique_risk": "피부과 전문의 집도로 안전 극대화",
        "compare.btn": "안전한 부티크 시술 선택하기",

        "search.placeholder": "시술명을 검색하세요 (예: 피코, 리프팅, Nd:YAG...)",
        "filter.all": "전체 시술",

        "badge.dermatologist": "피부과 전문의",
        "badge.specialist": "전문의",
        "badge.gp": "일반의",
        "badge.anesthesiologist": "마취과 전문의 상주",
        "badge.no_anesthesiologist": "국소 마취 전용",
        "badge.foreign_attraction": "외국인환자 유치기관 등록",
        "badge.foreigner_insurance": "외국인 상대 배상보험 가입",
        "badge.aftercare_excellence": "애프터케어 우수병원 선정",
        "safety.verified_title": "안전 영역 검증 정보",

        "dr_view.tag": "의사 시각",
        "dr_view.title": "실력과 가치로 인정받는 선순환 구조",
        "dr_view.subtitle": "공격적인 가격 덤핑과 브로커 수수료 없이, 오직 치료 결과와 실력만으로 해외 환자를 유치하세요.",
        "dr_view.card1_title": "1. 실력 중심 마케팅 (실력대로)",
        "dr_view.card1_text": "손기술이 좋고 결과가 좋은 원장님들이 가격 덤핑 없이 살아남는 유일한 길입니다. 투명하고 가공 없는 후기를 통해 시그니처 시술을 자연스럽게 알리세요.",
        "dr_view.card2_title": "2. 가격 방어와 전문성 (가격 방어)",
        "dr_view.card2_text": "시술 실패 포비아를 느끼는 해외 환자들에게 원장이 100% 책임지는 디자인 시술은 비용을 충분히 올릴 수 있는 강력한 무기입니다.",
        "dr_view.card3_title": "3. 브로커 수수료 해방 (브로커 프리)",
        "dr_view.card3_text": "정직하게 쌓인 평판과 데이터는 브로커 수수료 지불 없이 환자가 스스로 찾아오게 만들어 병원 재정을 건전하게 만듭니다.",

        "diff.tag": "차별점 분석",
        "diff.title": "기존 강남언니, 여신티켓과의 차별점",
        "diff.subtitle": "단순 광고 노출 및 티켓 판매 앱과 다른 코미케어만의 정직한 데이터 생태계",
        "diff.col_feature": "운영 기준",
        "diff.col_legacy": "기존 예약 플랫폼",
        "diff.col_komi": "코미케어 표준",
        "diff.row1_feature": "후기 조작 및 댓글 조작",
        "diff.row1_legacy": "광고비 지출에 따른 리뷰 필터링 및 부정 리뷰 삭제 허용",
        "diff.row1_komi": "조작 발견 즉시 엄정 경고 및 누적 시 사이트 영구 퇴출",
        "diff.row2_feature": "병원 측 유도 및 리베이트",
        "diff.row2_legacy": "현장 리뷰 평점 유도를 위한 할인/페이백/사은품 제공 방치",
        "diff.row2_komi": "병원 리베이트 제공 신고 포상금 제도 운영 (포상금 지급)",
        "diff.row3_feature": "외국인 신원 및 실결제 인증",
        "diff.row3_legacy": "간단한 계정 가입만으로 리뷰 작성 가능 (가짜 계정 활개)",
        "diff.row3_komi": "리뷰 등록 시 여권 등록 및 면세 세금 환급 영수증 인증 필수",
        "diff.row4_feature": "1개 월 뒤 리뷰 모니터링",
        "diff.row4_legacy": "시술 직후 작성 후 사후 모니터링 부재",
        "diff.row4_komi": "1개 월 뒤 추가 후기 등록 시 화장품/포인트 특별 보상 지급",
        "diff.row5_feature": "악성 리뷰 및 명예훼손 분쟁",
        "diff.row5_legacy": "병원 요청 시 플랫폼 측에서 임의 블라인드 처리",
        "diff.row5_komi": "플랫폼은 중개만 수행하며, 사실관계 확인 전 임의 삭제 불가 (직접 해결 유도)",

        "rev_sim.btn": "✍_ 영수증·여권 인증 리뷰 작성하기 (시뮬레이터)",
        "rev_sim.modal_title": "실제 방문 검증 리뷰 작성 시뮬레이터",
        "rev_sim.modal_subtitle": "시술 원장 실명제 및 100% 실제 영수증/여권 인증 기반의 정직한 리뷰 작성 프로세스",
        "rev_sim.step1": "1. 서류 인증",
        "rev_sim.step2": "2. 11개 기준 평가",
        "rev_sim.step3": "3. 사후 케어 & 리베이트 신고",
        "rev_sim.passport_label": "여권 등록 (신원 확인용)",
        "rev_sim.passport_desc": "동일인 중복 작성 방지 및 외국인 국적 확인용으로만 수집되며 플랫폼에 평문 저장되지 않습니다.",
        "rev_sim.receipt_label": "면세 세금 환급 영수증 등록",
        "rev_sim.receipt_desc": "영수증의 승인 번호 및 환급 번호를 통해 실제 시술 방문 여부를 100% 검증합니다.",
        "rev_sim.doctor_select_label": "시술 원장님 선택",
        "rev_sim.criteria_label": "시술 경험 상세 평가 (11개 평가 기준)",
        "rev_sim.cat_booking": "1. 예약 (언어 지원, 소통, 응대 속도):",
        "rev_sim.cat_visit": "2. 방문시 (대기 시간, 예약 시간 준수):",
        "rev_sim.cat_doc_design": "3. 시술시 (원장 직접 시술 및 전후 상담 만족도):",
        "rev_sim.cat_post_care": "4. 시술 후 (사후 케어 및 병원 주의사항 안내):",
        "rev_sim.cat_side_effect": "5. 부작용 및 통증 강도 (낮을수록 좋음):",
        "rev_sim.cat_revisit": "6. 재방문 의사:",
        "rev_sim.cat_good": "7. 좋았던 점:",
        "rev_sim.cat_bad": "8. 개선이 필요했던 점:",
        "rev_sim.cat_kindness": "9. 직원 친절도, 주차 및 언어 지원 편의성:",
        "rev_sim.cat_recommend": "10. 주위 추천 의향:",
        "rev_sim.cat_onemonth": "11. 1개월 뒤 만족도 및 재방문 의향 추가 추적 예약:",
        "rev_sim.onemonth_opt": "1-month-later review를 제출하고 포인트/화장품 특별 보상을 받겠습니다.",
        "rev_sim.revis_yes": "있음",
        "rev_sim.revis_no": "없음",
        "rev_sim.recom_yes": "추천함",
        "rev_sim.recom_no": "추천안함",
        "rev_sim.whistleblower_label": "리베이트 및 후기 유도 자진 신고",
        "rev_sim.whistleblower_desc": "병원 측에서 리뷰를 좋게 작성하는 대가로 리베이트(현금 환급, 무료 시술 서비스, 특별 할인 등)를 제시받으셨나요?",
        "rev_sim.whistleblower_btn": "🚨 병원 리베이트 할인 유도 신고하기",
        "rev_sim.whistleblower_msg": "신고가 성공적으로 접수되었습니다! 리뷰 조작 시도 조사 후 병원 측의 리베이트 유도가 사실로 확인될 경우 50만 원 상당의 포상금이 지급되며, 해당 병원은 경고 조치됩니다.",
        "rev_sim.submit": "인증 리뷰 업로드",
        "rev_sim.success_title": "방문 인증 리뷰가 등록되었습니다!",
        "rev_sim.success_desc": "정직한 데이터 구축에 동참해 주셔서 감사합니다. 등록된 후기는 해외 서버에 안전하게 보관되어 병원 측의 임의 삭제나 가공이 불가합니다."
    }
};

// ---- Fitzpatrick Profiles (Korean) ----
const fitzpatrickProfiles_ko = {
    1: {
        name: "피츠패트릭 Type I (매우 창백 / 밝은 피부)",
        behavior: "항상 화상을 입으며, 절대 태닝되지 않음. 주근깨가 많음.",
        lasers: "부드러운 커스텀 에너지 세팅만 가능. 표준 프랙셔널 레이저로 인한 화상 위험 높음.",
        warning: "극심한 화상 & 홍조 위험. 대형 공장식 클리닉의 표준 세팅은 동아시아 피부(Type III-IV)에 맞춰져 있습니다. 이 고강도 세팅을 Type I 피부에 적용하면 피부 장벽이 쉽게 손상되어 만성 홍조, 물집 또는 흉터를 유발합니다. 반드시 낮은 플루언스와 긴 펄스 지속 시간을 요구해야 합니다."
    },
    2: {
        name: "피츠패트릭 Type II (밝은 피부 / 금발)",
        behavior: "쉽게 화상을 입으며, 최소한으로 태닝됨. 매우 민감.",
        lasers: "커스텀 펄스 지속 시간 필요. 낮은 세팅에서 전문 혈관/색소 레이저 사용 시 안전.",
        warning: "높은 화상 & 장벽 손상 위험. 표준 '서울 공장식' 프리셋 세팅은 Type II 피부에 심각한 레이저 홍조 또는 미세 흉터를 유발할 가능성이 높습니다. 테크니션이 자동 프리셋을 사용하는 대신, 의사가 직접 에너지 출력을 수동 캘리브레이션하는 것이 필수입니다."
    },
    3: {
        name: "피츠패트릭 Type III (베이지 / 올리브 톤)",
        behavior: "보통 수준의 화상을 입으며, 점차 연한 갈색으로 태닝됨.",
        lasers: "색소 리바운드에 대한 세심한 캘리브레이션 필요. 염증 후 과색소침착(PIH) 위험 보통.",
        warning: "보통 수준의 색소 리바운드 위험. Type III 피부가 더 회복력이 좋지만, 15분 사이클로 운영하는 공장식 체인은 세팅을 급하게 처리합니다. 이는 종종 리바운드 기미나 PIH를 유발합니다. 클리닉이 정품 팁과 EMR 로깅을 사용하여 파라미터를 추적하는지 확인하세요."
    },
    4: {
        name: "피츠패트릭 Type IV (연한 갈색 / 올리브)",
        behavior: "최소한의 화상을 입으며, 쉽게 보통 갈색으로 태닝됨.",
        lasers: "중간 위험의 색소 반응성. Nd:YAG 또는 보수적 플루언스로 설정된 프랙셔널 장비 필요.",
        warning: "PIH(과색소침착) 위험. 밝은 피부를 위한 표준 세팅이 Type IV 피부에서 대규모 멜라닌 반응을 유발하여 수개월 동안 지속되는 어두운 반점을 남길 수 있습니다. 의사가 활성 태닝 상태를 확인하고 쿨링 파라미터를 그에 맞게 조절해야 합니다."
    },
    5: {
        name: "피츠패트릭 Type V (진한 갈색)",
        behavior: "거의 화상을 입지 않으며, 쉽게 진한 갈색으로 태닝됨.",
        lasers: "제모/토닝에는 Nd:YAG 레이저만 사용 가능. 표준 IPL 또는 알렉산드라이트 레이저는 금기.",
        warning: "심각한 과색소침착 & 화상 위험. Type V 피부는 멜라닌이 매우 활성화되어 있습니다. 표준 알렉산드라이트 또는 IPL 파장을 사용하는 공장식 클리닉은 레이저가 모발/색소와 주변 피부를 구분하지 못해 표피를 말 그대로 태울 수 있습니다. 안전한 시술을 위해서는 전문 Nd:YAG 레이저가 필요합니다."
    },
    6: {
        name: "피츠패트릭 Type VI (깊은 색소 침착 / 검정)",
        behavior: "절대 화상을 입지 않으며, 깊은 색소 침착.",
        lasers: "긴 펄스 폭의 Nd:YAG 레이저만 사용 가능. 쿨링 메커니즘을 최대로 설정해야 함.",
        warning: "심각한 멜라닌 반응성 경고. 공장식 체인은 Type VI 피부에 매우 위험합니다. 표준 레이저 세팅은 영구적인 색소 손실(저색소증 흰 반점) 또는 심각한 화학적 화상을 초래합니다. 특정 Nd:YAG 하드웨어와 긴 펄스 캘리브레이션 실적을 보유한 클리닉을 반드시 선택해야 합니다."
    }
};

// ---- Clinic Details (Korean) ----
const clinicDetails_ko = {
    1: {
        name: "청담 배리어 랩",
        location: "📍 청담동, 강남구",
        rating: "⭐ 4.9 (120+ 인증 리뷰)",
        description: "민감한 피부 타입을 위한 비침습적 피부 장벽 회복과 색소 레이저를 전문으로 합니다. 초보수적 에너지 캘리브레이션과 인증된 정품 팁으로 유명합니다.",
        specialties: ["Nd:YAG 레이저 캘리브레이션", "피부 장벽 재건", "피코 토닝"],
        doctor_name: "이지연 원장",
        doctor_avatar: "JY",
        doctor_title: "피부과 전문의 | Nd:YAG 전문가",
        doctor_bio: "이지연 원장은 12년 이상의 임상 피부과 경험을 보유하고 있으며, 얇고 반응성이 높은 피부 장벽을 위한 레이저를 전문으로 합니다. Nd:YAG 커스터마이제이션 분야의 인정받는 연자입니다.",
        hours: "월-금: 오전 10:00 - 오후 7:00 | 토: 오전 10:00 - 오후 4:00",
        slots_tag: "시간당 최대 3건"
    },
    2: {
        name: "명동 포레스트 피부과",
        location: "📍 명동, 중구",
        rating: "⭐ 4.8 (94+ 인증 리뷰)",
        description: "명동 한복판의 안식처 클리닉으로, 공장식 시술보다 장벽 안전을 우선시합니다. 시간당 최대 2건의 예약만 엄격히 제한합니다.",
        specialties: ["혈관 레이저 캘리브레이션", "주사 & 홍조 회복", "초음파 리쥬버네이션"],
        doctor_name: "김민지 원장",
        doctor_avatar: "MK",
        doctor_title: "피부과 전문의 | 장벽 회복 전문",
        doctor_bio: "김민지 원장은 여행과 기후 변화로 인해 자주 장벽 손상을 경험하는 해외 여행자를 위한 맞춤 의료 시술을 제공하기 위해 명동 포레스트를 설립했습니다.",
        hours: "월, 수, 목: 오전 10:00 - 오후 8:00 (야간진료) | 화, 금: 오전 10:00 - 오후 7:00",
        slots_tag: "시간당 최대 2건"
    },
    3: {
        name: "한남 에스테틱 & 레이저 하우스",
        location: "📍 한남동, 용산구",
        rating: "⭐ 4.9 (78+ 인증 리뷰)",
        description: "한남동의 대사관과 외국인을 위한 부티크 클리닉입니다. 프리미엄 듀얼 쿨링 레이저 시스템을 갖추고 맞춤형 파장 진단을 제공합니다.",
        specialties: ["1:1 파장 튜닝", "듀얼 쿨링 안전 프로토콜", "고강도 색소 관리"],
        doctor_name: "박태영 원장",
        doctor_avatar: "TP",
        doctor_title: "피부과 전문의 | 커스텀 파장 전문",
        doctor_bio: "박태영 원장은 서울대학교 병원에서 펠로우십을 수료했습니다. 영어에 능통하며, 다양한 피츠패트릭 피부 타입에 안전한 레이저 시술을 위해 전념하고 있습니다.",
        hours: "화-금: 오전 11:00 - 오후 8:00 | 토: 오전 10:00 - 오후 5:00 | 일, 월: 휴진",
        slots_tag: "시간당 최대 3건"
    },
    4: {
        name: "신사 글로우 피부과",
        location: "📍 신사동, 강남구",
        rating: "⭐ 4.7 (112+ 인증 리뷰)",
        description: "인증된 정품 소모품 로깅을 통한 고급 안티에이징 시술을 전문으로 합니다. 모든 환자에게 일회용 팁 인증서와 시리얼 코드를 제공합니다.",
        specialties: ["정품 소모품 로깅", "울쎄라 & 슈링크 커스텀 셋업", "표피 두께 진단"],
        doctor_name: "최서준 원장",
        doctor_avatar: "SC",
        doctor_title: "피부과 전문의 | 안티에이징 전문",
        doctor_bio: "최서준 원장은 비수술 리프팅 전문가입니다. 시술 후 신경 합병증과 과도한 부기를 예방하기 위해 신사 글로우의 '장벽 우선' 리프팅 프로토콜을 개발했습니다.",
        hours: "월-금: 오전 10:00 - 오후 7:00 | 토: 오전 9:30 - 오후 3:00",
        slots_tag: "시간당 최대 2건"
    },
    5: {
        name: "홍대 캄 스킨 클리닉",
        location: "📍 서교동, 마포구",
        rating: "⭐ 4.8 (85+ 인증 리뷰)",
        description: "홍대의 트렌디하면서도 의학적으로 엄격한 클리닉입니다. 절대적인 전문의 상주 하에 젊은 글로벌 환자를 위한 레이저 토닝과 혈관 시술에 집중합니다.",
        specialties: ["Nd:YAG & 피코 레이저 인증", "100% 전문의 상담", "청소년 여드름 장벽 치유"],
        doctor_name: "송은지 원장",
        doctor_avatar: "ES",
        doctor_title: "피부과 전문의 | 색소 전문가",
        doctor_bio: "송은지 원장은 부드럽고 레이어드된 레이저 접근법으로 높이 평가받고 있습니다. 빠른 '모든 피부에 동일한' 레이저 프로토콜을 거부하며, 환자당 30분 이상의 시술 시간을 배정합니다.",
        hours: "월, 화, 금: 오전 10:00 - 오후 7:00 | 목: 오전 10:00 - 오후 9:00 (야간진료) | 토: 오전 10:00 - 오후 4:00",
        slots_tag: "시간당 최대 4건"
    }
};

// ---- Handbook Chapter Content (Korean) ----
const handbookContent_ko = {
    1: {
        title: "제1장: 피부 타입 해독하기 (피츠패트릭 스케일)",
        content: `<p><strong>피츠패트릭 스케일</strong>은 인간의 피부색과 자외선 및 레이저 파장에 대한 반응을 분류하는 의학적 표준입니다. Type I(매우 창백, 쉽게 화상)부터 Type VI(깊은 색소 침착, 절대 화상 없음)까지 분류됩니다.</p>
        <p>대량 환자 수용 클리닉의 핵심 문제는 <strong>멜라닌 농도 불일치</strong>입니다. 표준 한국 레이저 프로토콜은 일반적으로 Type III과 IV에 해당하는 동아시아 피부 타입에 맞춰 캘리브레이션되어 있습니다.</p>
        <blockquote>
            <strong>표준 세팅이 위험한 이유:</strong>
            Type I-II 피부를 가진 분은 표준 세팅이 너무 높아 얇은 보호 장벽을 파괴하고 만성 혈관 홍조나 물집을 유발합니다. Type V-VI 피부를 가진 분은 활성 표피 멜라닌이 레이저 열을 너무 빠르게 흡수하여 영구적인 레이저 화상이나 염증 후 저색소증(흰 반점)을 유발합니다.
        </blockquote>
        <p>특정 피츠패트릭 타입에 맞춰 펄스 지속 시간과 에너지 플루언스를 수동 조절하는 것은 기본적인 의학적 필수 사항이며, 선택적 고급 패키지가 아닙니다.</p>`
    },
    2: {
        title: "제2장: 공장식 클리닉을 가려내는 5가지 질문",
        intro: `<p>서울에서 레이저가 얼굴에 닿기 전, 프론트 데스크 상담사를 무시하고 실제 시술 의사에게 다음 답변을 요구하세요:</p>`,
        questions: [
            { q: "Q1. \"지금 저와 상담하고 있는 의사 선생님이 실제로 시술하시는 분인가요?\"", a: "유령 의사 교체 수법을 밝혀냅니다." },
            { q: "Q2. \"제 피츠패트릭 피부 타입에 기반하여 어떤 정확한 파장과 펄스 지속 시간 세팅을 사용하시나요?\"", a: "시술자가 피부 생리학을 이해하는지, 단순히 자동 프리셋을 누르는지 확인합니다." },
            { q: "Q3. \"시작 전에 정품 일회용 팁 포장과 활성화 로그를 보여주실 수 있나요?\"", a: "불안정한 에너지 스파이크를 출력하는 불법, 재충전 또는 위조 팁으로부터 보호합니다." },
            { q: "Q4. \"화상에 대한 클리닉의 즉각적인 의료 프로토콜과 긴급 연락처는 무엇인가요?\"", a: "판매 전략만 있는 게 아니라 실제 응급 피부과적 백업이 있는지 확인합니다." },
            { q: "Q5. \"이 의사의 서양 피부 프로필에 대한 포트폴리오/실적을 볼 수 있나요?\"", a: "피츠패트릭 Type I-II 및 V-VI 피부 타입 시술 경험을 확인합니다." }
        ]
    },
    3: {
        title: "제3장: '공장식' 클리닉 구별법",
        content: `<p>관광 밀집 지역에 위치한 \"피부 클리닉\"의 80% 이상이 정식 피부과 전문의 수련 없이 일반 개원의(GP)에 의해 운영됩니다. 다음 세 가지 적신호를 주의하면 공장식 클리닉을 구별할 수 있습니다:</p>
        <blockquote>
            <strong>적신호 #1: 선불 결제</strong><br>
            카드를 긁고 패키지에 서명할 때까지 의사와 대화하는 것을 거부한다면, 그곳은 공장식 클리닉입니다.
        </blockquote>
        <p><strong>적신호 #2: 극단적 가격 덤핑</strong><br>
        고가 소모성 팁 카트리지(울쎄라 또는 슈링크 등)의 가격이 시장 평균보다 50-70% 낮다면, 해당 클리닉은 위조 팁, 재충전 카트리지를 사용하거나 안전 진단을 생략하고 있을 가능성이 높습니다.</p>
        <p><strong>적신호 #3: 추상적 리뷰 지표</strong><br>
        클리닉 리뷰가 \"친절한 통역 직원\"이나 \"빠른 서비스\"만 언급하고 특정 의사 이름이나 정확한 임상 파라미터에 대한 언급이 없다면, 평점이 조작되었을 가능성이 높습니다.</p>`
    },
    4: {
        title: "제4장: 귀국 후 회복 로드맵",
        content: `<p>한국에서 피부과 레이저 시술 직후 귀국하는 경우, 다음 응급 회복 체크리스트를 따라 피부 장벽을 보호하세요:</p>
        <p><strong>1. 시술 후 기내 키트:</strong> 비행기 기내 습도는 20% 이하입니다. 탑승 전 두꺼운 세라마이드 기반 장벽 크림과 물리적 자외선 차단제(산화아연/이산화티타늄)를 바르세요. 신선한 미세 상처에 화학적 자외선 필터를 피하세요.</p>
        <p><strong>2. 염증 후 과색소침착(PIH) 예방:</strong> 시술 후 14일간 직사광선 노출을 피하세요. 어두운 반점(PIH)이 발생하면 공격적인 화학 필링을 적용하지 마세요. 장벽을 쉬게 하고 순한 시카(센텔라 아시아티카) 또는 판테놀 유도체를 바르세요.</p>
        <blockquote>
            <strong>긴급 지원:</strong><br>
            귀국 후 심각한 물집, 지속적인 부기 또는 레이저 유발 화상이 나타나면, 코미케어 앱을 통해 원격 상담 라인에 즉시 연락하여 안내를 받으세요.
        </blockquote>`
    }
};

// ---- Korean Checklist Text for Clipboard ----
const checklistText_ko = `--- K-뷰티 5가지 핵심 안전 질문 ---
레이저가 얼굴에 닿기 전, 피부과 전문의에게 다음 다섯 가지 질문을 반드시 하세요:

Q1. 의사 직접 상담:
"지금 저와 상담하고 있는 의사 선생님이 실제로 레이저 시술하시는 분인가요?" (유령 의사 교체 수법 밝히기)

Q2. 피츠패트릭 맞춤 커스터마이제이션:
"제 피츠패트릭 피부 타입에 기반하여 PIH나 화상을 피하기 위해 어떤 정확한 파장과 펄스 지속 시간 세팅을 사용하시나요?" (공장식 프리셋 vs 의학 전문성 테스트)

Q3. 정품 팁 확인:
"시작 전에 정품 일회용 팁(정품팁) 포장과 장비의 활성화 로그를 보여주실 수 있나요?" (불법, 재충전 또는 위조 팁 사용 방지)

Q4. 부작용 프로토콜:
"시술 후 이상 반응이나 화상이 발생하면 클리닉의 즉각적인 의료 프로토콜과 긴급 연락처는 무엇인가요?" (판매 목표가 아닌 안전망 확인)

Q5. 시술자 배정 & 실적:
"이 의사의 서양 피부 타입에 대한 구체적인 실적이나 포트폴리오를 볼 수 있나요?" (클리닉 브랜드가 아닌 시술자의 실력 확인)`;


// ==========================================
// Translation Engine Functions
// ==========================================

function t(key) {
    const dict = translations[currentLang] || translations['en'];
    return dict[key] || translations['en'][key] || key;
}

function getCurrentLang() {
    return currentLang;
}

function setLanguage(lang) {
    currentLang = lang;
    try {
        localStorage.setItem('komicare-lang', lang);
    } catch (e) {
        console.warn("localStorage setItem failed:", e);
    }

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Swap all data-i18n elements (textContent)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    // Swap all data-i18n-html elements (innerHTML)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        el.innerHTML = t(key);
    });

    // Swap all data-i18n-placeholder elements
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });

    // Update active language button
    const langSwitcher = document.getElementById('langSwitcher');
    if (langSwitcher) {
        langSwitcher.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Dispatch custom event for app.js to handle dynamic content
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

// Note: Initialization is handled by app.js initLanguage() to avoid race conditions
