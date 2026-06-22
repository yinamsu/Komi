// KOMICARE Core Application Script

document.addEventListener('DOMContentLoaded', () => {
    initQuiz();
    initReceiptMasker();
    initReader();
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
        document.getElementById('res-warning').innerHTML = `<strong>🛡️ Fitzpatrick ${quizData.fitzpatrickType} Safety Advisory:</strong> ${profile.warning}`;

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
