/* ==========================================================================
   ZenFlo (Zenifo) — Interactive Frontend Logic
   ========================================================================== */

let pageAbortController = null;

function initPageInteractions() {
  if (pageAbortController) {
    try { pageAbortController.abort(); } catch (e) {}
  }
  pageAbortController = new AbortController();
  const { signal } = pageAbortController;
  /* ------------------------------------------------------------------------
     1. Hero Word-by-Word Blur + Slide-Up Animation (Exact Framer ai / oi)
     ------------------------------------------------------------------------ */
  function animateElementWords(el, baseDelay, stepDelay) {
    if (!el || el.querySelector(".word")) return;
    const rawHtml = el.innerHTML;
    const lines = rawHtml.split(/<br\s*\/?>/i);
    let idx = 0;
    el.innerHTML = lines
      .map((lineHtml) => {
        const plain = lineHtml.replace(/<[^>]+>/g, " ").trim();
        if (!plain) return "";
        return plain
          .split(/\s+/)
          .map((w) => {
            const delay = (baseDelay + idx++ * stepDelay).toFixed(3);
            return `<span class="word" style="animation-delay:${delay}s">${w}</span>`;
          })
          .join(" ");
      })
      .filter(Boolean)
      .join("<br />");
  }

  animateElementWords(document.getElementById("heroTitle"), 0.1, 0.065);
  animateElementWords(document.getElementById("heroDesc"), 0.3, 0.03);

  /* ------------------------------------------------------------------------
     1B. Hero Dashboard 3D Perspective Scroll Tilt (.framer-3yc9ez)
         & About Section 3-Card Scroll Convergence (.framer-k7tuwz)
     ------------------------------------------------------------------------ */
  const heroDashboard = document.getElementById("heroDashboard");
  const aboutScrollTrigger = document.getElementById("aboutScrollTrigger");
  const aboutCardTop = document.getElementById("aboutCardTop");
  const aboutCardLeft = document.getElementById("aboutCardLeft");
  const aboutCardRight = document.getElementById("aboutCardRight");

  let currentDashRx = 30;
  let currentDashY = 40;
  let targetDashRx = 30;
  let targetDashY = 40;

  let currentAboutProg = 0;
  let targetAboutProg = 0;
  let animRafId = null;

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function updateScrollTargets() {
    const scrollY = window.scrollY || window.pageYOffset;
    const vh = window.innerHeight || 900;

    // 1. Hero Dashboard 3D Tilt:
    // At scrollY = 0 -> rotateX: 30deg, translateY: 40px
    // As user scrolls down so dashboard bottom enters/aligns with viewport -> rotateX: 0deg, translateY: 0px
    if (heroDashboard) {
      const scrollRange = Math.max(240, vh * 0.34);
      const prog = clamp(scrollY / scrollRange, 0, 1);
      targetDashRx = 30 * (1 - prog);
      targetDashY = 40 * (1 - prog);
    }

    // 2. About Section 3-Card Convergence into Center 3D Cube:
    if (aboutScrollTrigger && window.innerWidth > 810) {
      const rect = aboutScrollTrigger.getBoundingClientRect();
      // Trigger starts when top of .about-scroll-trigger hits bottom of viewport (rect.top <= vh)
      const totalDist = Math.max(1, rect.height);
      const scrolled = vh - rect.top;
      targetAboutProg = clamp(scrolled / totalDist, 0, 1);
    } else {
      targetAboutProg = 0;
    }

    if (!animRafId) {
      animRafId = requestAnimationFrame(stepScrollAnimations);
    }
  }

  function stepScrollAnimations() {
    // Smooth spring-like interpolation (matching Framer stiffness: 1000, damping: 100)
    const lerpFactor = 0.22;
    let needsMoreFrames = false;

    if (heroDashboard) {
      const diffRx = targetDashRx - currentDashRx;
      const diffY = targetDashY - currentDashY;

      if (Math.abs(diffRx) > 0.02 || Math.abs(diffY) > 0.02) {
        currentDashRx += diffRx * lerpFactor;
        currentDashY += diffY * lerpFactor;
        needsMoreFrames = true;
      } else {
        currentDashRx = targetDashRx;
        currentDashY = targetDashY;
      }

      heroDashboard.style.setProperty("--hero-dash-rx", `${currentDashRx.toFixed(2)}deg`);
      heroDashboard.style.setProperty("--hero-dash-y", `${currentDashY.toFixed(2)}px`);
    }

    if (aboutCardTop && aboutCardLeft && aboutCardRight && window.innerWidth > 810) {
      const diffAbout = targetAboutProg - currentAboutProg;
      if (Math.abs(diffAbout) > 0.001) {
        currentAboutProg += diffAbout * 0.2;
        needsMoreFrames = true;
      } else {
        currentAboutProg = targetAboutProg;
      }

      const p = currentAboutProg;
      const scale = Math.max(0, 1 - p);
      const isTablet = window.innerWidth < 1200;

      // Top card: x: 0 -> 0 (or -34 on tablet), y: 0 -> 270 (or 218 on tablet), scale: 1 -> 0
      const topX = (isTablet ? -34 : 0) * p;
      const topY = (isTablet ? 218 : 270) * p;
      aboutCardTop.style.setProperty("--card-tx", `${topX.toFixed(1)}px`);
      aboutCardTop.style.setProperty("--card-ty", `${topY.toFixed(1)}px`);
      aboutCardTop.style.setProperty("--card-scale", scale.toFixed(3));

      // Bottom-left card: x: 0 -> 400 (220 on tablet), y: 0 -> -179 (-185 on tablet), scale: 1 -> 0
      const leftX = (isTablet ? 220 : 400) * p;
      const leftY = (isTablet ? -185 : -179) * p;
      aboutCardLeft.style.setProperty("--card-tx", `${leftX.toFixed(1)}px`);
      aboutCardLeft.style.setProperty("--card-ty", `${leftY.toFixed(1)}px`);
      aboutCardLeft.style.setProperty("--card-scale", scale.toFixed(3));

      // Bottom-right card: x: 0 -> -400 (-220 on tablet), y: 0 -> -182 (-177 on tablet), scale: 1 -> 0
      const rightX = (isTablet ? -220 : -400) * p;
      const rightY = (isTablet ? -177 : -182) * p;
      aboutCardRight.style.setProperty("--card-tx", `${rightX.toFixed(1)}px`);
      aboutCardRight.style.setProperty("--card-ty", `${rightY.toFixed(1)}px`);
      aboutCardRight.style.setProperty("--card-scale", scale.toFixed(3));
    }

    if (needsMoreFrames) {
      animRafId = requestAnimationFrame(stepScrollAnimations);
    } else {
      animRafId = null;
    }
  }

  window.addEventListener("scroll", updateScrollTargets, { passive: true, signal });
  window.addEventListener("resize", updateScrollTargets, { passive: true, signal });
  updateScrollTargets();

  /* ------------------------------------------------------------------------
     2. Mobile Menu Toggle
     ------------------------------------------------------------------------ */
  const mobileToggle = document.getElementById("mobileToggle");
  const navLinks = document.getElementById("navLinks");

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener("click", () => {
      navLinks.classList.toggle("mobile-open");
    });
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => navLinks.classList.remove("mobile-open"));
    });
  }

  /* ------------------------------------------------------------------------
     3. Scroll-Reveal IntersectionObserver & Button Roll-Text Enhancer
     ------------------------------------------------------------------------ */
  document.querySelectorAll(".btn-primary, .btn-outline").forEach((btn) => {
    if (btn.querySelector(".btn-roll-wrap")) return;
    const span = btn.querySelector("span") || btn;
    const label = span.textContent.trim();
    if (!label) return;
    const rollHtml = `<span class="btn-roll-wrap"><span class="btn-roll-text">${label}</span><span class="btn-roll-text" aria-hidden="true">${label}</span></span>`;
    if (span !== btn) {
      span.outerHTML = rollHtml;
    } else {
      btn.innerHTML = rollHtml;
    }
  });

  const revealEls = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -20px 0px" }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ------------------------------------------------------------------------
     4. Problem Section Sticky 2-Column Accordion & Sliding Showcase (.framer-d2VJs)
     ------------------------------------------------------------------------ */
  const problemAccItems = document.querySelectorAll(".problem-acc-item");
  const problemVisualTrack = document.getElementById("problemVisualTrack");
  const problemScrollSteps = document.querySelectorAll(".problem-scroll-step");
  let currentProblemStep = 0;
  let problemClickLock = false;
  let problemLockTimer = null;

  function setProblemStep(stepIndex) {
    const idx = clamp(Number(stepIndex) || 0, 0, 2);
    currentProblemStep = idx;

    problemAccItems.forEach((item, i) => {
      const isMatch = i === idx;
      item.classList.toggle("active", isMatch);
      item.setAttribute("aria-selected", isMatch ? "true" : "false");
    });

    if (problemVisualTrack) {
      const firstSlide = problemVisualTrack.querySelector(".problem-slide");
      const slideWidth = firstSlide ? firstSlide.offsetWidth : 760;
      const gap = 24;
      const offset = idx * (slideWidth + gap);
      problemVisualTrack.style.transform = `translate3d(-${offset}px, 0px, 0px)`;
    }
  }

  problemAccItems.forEach((item, i) => {
    item.addEventListener("click", () => {
      setProblemStep(i);
      if (window.innerWidth > 810 && problemScrollSteps[i]) {
        problemClickLock = true;
        clearTimeout(problemLockTimer);
        const rect = problemScrollSteps[i].getBoundingClientRect();
        const targetScrollY = (window.scrollY || window.pageYOffset) + rect.top - window.innerHeight * 0.45;
        window.scrollTo({ top: targetScrollY, behavior: "smooth" });
        problemLockTimer = setTimeout(() => {
          problemClickLock = false;
        }, 700);
      }
    });
  });

  function updateProblemStepOnScroll() {
    if (problemClickLock || window.innerWidth <= 810 || problemScrollSteps.length === 0) return;
    const vh = window.innerHeight || 900;
    const triggerLine = vh * 0.55;
    let activeIdx = 0;

    problemScrollSteps.forEach((stepEl, i) => {
      const rect = stepEl.getBoundingClientRect();
      if (rect.top <= triggerLine) {
        activeIdx = i;
      }
    });

    if (activeIdx !== currentProblemStep) {
      setProblemStep(activeIdx);
    }
  }

  window.addEventListener("scroll", updateProblemStepOnScroll, { passive: true, signal });
  window.addEventListener("resize", () => setProblemStep(currentProblemStep), { passive: true, signal });
  setProblemStep(0);

  /* ------------------------------------------------------------------------
     5. Process Section ("How it works" Centered Sticky Orbital Dial / .framer-FZzHs)
     ------------------------------------------------------------------------ */
  const processOrbitalContainer = document.getElementById("processOrbitalContainer");
  const orbitalIcon = document.getElementById("orbitalIcon");
  const orbitalTitle = document.getElementById("orbitalTitle");
  const orbitalDesc = document.getElementById("orbitalDesc");
  const processScrollSteps = document.querySelectorAll(".process-scroll-step");

  const processStepsData = [
    {
      icon: "https://framerusercontent.com/images/YqqCch6CUg7oVrN7oajtPQnQ.svg?width=96&height=96",
      title: "1. Konsultasi",
      desc: "Ceritakan bisnis, kebutuhan, dan tujuan website Anda kepada kami. Tidak perlu memahami istilah teknis."
    },
    {
      icon: "https://framerusercontent.com/images/YqqCch6CUg7oVrN7oajtPQnQ.svg?width=96&height=96",
      title: "2. Desain",
      desc: "Kami menerjemahkan kebutuhan tersebut menjadi konsep dan tampilan website yang mengikuti karakter dan identitas bisnis Anda."
    },
    {
      icon: "https://framerusercontent.com/images/uLhGPNPbWtC0zajTUerrr4VwMc.svg?width=96&height=96",
      title: "3. Development & Online",
      desc: "Konsep yang telah disepakati mulai dikembangkan menjadi website yang disiapkan hingga online dan siap digunakan untuk mendukung bisnis Anda."
    }
  ];

  let currentProcessStep = 0;

  function setProcessStep(index) {
    const idx = clamp(Number(index) || 0, 0, processStepsData.length - 1);
    currentProcessStep = idx;
    const stepData = processStepsData[idx];

    if (processOrbitalContainer) {
      processOrbitalContainer.classList.remove("step-0", "step-1", "step-2");
      processOrbitalContainer.classList.add(`step-${idx}`);
    }
    if (orbitalIcon && stepData) {
      orbitalIcon.src = stepData.icon;
    }
    if (orbitalTitle && stepData) {
      orbitalTitle.textContent = stepData.title;
    }
    if (orbitalDesc && stepData) {
      orbitalDesc.textContent = stepData.desc;
    }
  }

  function updateProcessStepOnScroll() {
    if (processScrollSteps.length === 0) return;
    const vh = window.innerHeight || 900;
    const triggerLine = vh * 0.55;
    let activeIdx = 0;

    processScrollSteps.forEach((stepEl, i) => {
      const rect = stepEl.getBoundingClientRect();
      if (rect.top <= triggerLine) {
        activeIdx = i;
      }
    });

    if (activeIdx !== currentProcessStep) {
      setProcessStep(activeIdx);
    }
  }

  if (processOrbitalContainer) {
    processOrbitalContainer.style.cursor = "pointer";
    processOrbitalContainer.addEventListener("click", () => {
      const next = (currentProcessStep + 1) % processStepsData.length;
      setProcessStep(next);
    });
  }

  window.addEventListener("scroll", updateProcessStepOnScroll, { passive: true, signal });
  setProcessStep(0);

  /* ------------------------------------------------------------------------
     6. Services Section Sticky 2-Column Accordion & Visual Scroll (.framer-eh6iv5)
     ------------------------------------------------------------------------ */
  const serviceAccItems = document.querySelectorAll(".service-acc-item");
  const serviceVisualCards = document.querySelectorAll(".service-visual-card");
  let currentServiceIdx = 0;
  let serviceClickLock = false;
  let serviceLockTimer = null;

  function setServiceActive(index) {
    const idx = clamp(Number(index) || 0, 0, serviceAccItems.length - 1);
    currentServiceIdx = idx;
    serviceAccItems.forEach((item, i) => {
      const isMatch = i === idx;
      item.classList.toggle("active", isMatch);
      item.setAttribute("aria-selected", isMatch ? "true" : "false");
    });
  }

  serviceAccItems.forEach((item, i) => {
    item.addEventListener("click", () => {
      setServiceActive(i);
      if (window.innerWidth > 810 && serviceVisualCards[i]) {
        serviceClickLock = true;
        clearTimeout(serviceLockTimer);
        const rect = serviceVisualCards[i].getBoundingClientRect();
        const targetScrollY = (window.scrollY || window.pageYOffset) + rect.top - 110;
        window.scrollTo({ top: targetScrollY, behavior: "smooth" });
        serviceLockTimer = setTimeout(() => {
          serviceClickLock = false;
        }, 700);
      }
    });
  });

  function updateServicesOnScroll() {
    if (serviceClickLock || window.innerWidth <= 810 || serviceVisualCards.length === 0) return;
    const vh = window.innerHeight || 900;
    const triggerLine = vh * 0.52;
    let activeIdx = 0;

    serviceVisualCards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      if (rect.top <= triggerLine) {
        activeIdx = i;
      }
    });

    if (activeIdx !== currentServiceIdx) {
      setServiceActive(activeIdx);
    }
  }

  window.addEventListener("scroll", updateServicesOnScroll, { passive: true, signal });
  setServiceActive(0);

  /* ------------------------------------------------------------------------
     7. Stats Animated Number Counters
     ------------------------------------------------------------------------ */
  const counters = document.querySelectorAll(".counter");
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute("data-target") || "0", 10);
          const duration = 1400;
          const startTime = performance.now();

          function updateCount(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target);
            if (progress < 1) {
              requestAnimationFrame(updateCount);
            } else {
              el.textContent = target;
            }
          }
          requestAnimationFrame(updateCount);
          counterObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.4 }
  );
  counters.forEach((c) => counterObserver.observe(c));

  /* ------------------------------------------------------------------------
     8. Pricing Switcher (Sliding Pill + Animated Tier Prices)
     ------------------------------------------------------------------------ */
  const billingSwitcher = document.querySelector(".billing-switcher");
  const billingBtns = document.querySelectorAll(".billing-btn");
  const pricingAmounts = document.querySelectorAll(".pricing-amount");

  billingBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      billingBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.getAttribute("data-billing") || "monthly";
      if (billingSwitcher) {
        billingSwitcher.setAttribute("data-mode", mode);
      }
      pricingAmounts.forEach((priceEl) => {
        const nextVal = priceEl.getAttribute(mode === "yearly" ? "data-yearly" : "data-monthly");
        if (nextVal) {
          priceEl.textContent = nextVal;
        }
      });
    });
  });

  /* ------------------------------------------------------------------------
     9. Curved Fan Testimonial Carousel (Exact Framer _e Arc Math)
     ------------------------------------------------------------------------ */
  const tFanCards = Array.from(document.querySelectorAll(".t-fan-card"));
  const tFanPrev = document.getElementById("tFanPrev");
  const tFanNext = document.getElementById("tFanNext");
  const tFanStage = document.getElementById("testimonialFanStage");

  if (tFanCards.length > 0) {
    let activeFanIndex = 2; // Start centered on Card 2
    const totalFanCards = tFanCards.length;
    const radius = 1200;
    const angleStep = 16;
    const sizeDecrease = 0.06;

    function renderTestimonialFan() {
      tFanCards.forEach((card, idx) => {
        // Compute shortest circular offset o in [-2, -1, 0, 1, 2]
        let o = idx - activeFanIndex;
        if (o > Math.floor(totalFanCards / 2)) o -= totalFanCards;
        if (o < -Math.floor(totalFanCards / 2)) o += totalFanCards;

        const s = Math.abs(o);
        const rad = o * angleStep * (Math.PI / 180);
        const u = radius * Math.sin(rad);
        const d = radius - radius * Math.cos(rad);
        const f = o * angleStep;
        const p = 1 - s * sizeDecrease;

        const zIndex = 50 - s * 10;
        const opacity = o === 0 ? 1 : s >= 3 ? 0 : Math.max(0.15, 1 - s * 0.4);
        const filter =
          o === 0
            ? "grayscale(0%) brightness(1.05)"
            : "grayscale(100%) brightness(0.6)";

        card.style.zIndex = String(zIndex);
        card.style.opacity = String(opacity);
        card.style.filter = filter;
        card.style.transform = `translate(calc(-50% + ${u.toFixed(1)}px), calc(-50% + ${d.toFixed(1)}px)) rotate(${f.toFixed(1)}deg) scale(${p.toFixed(3)})`;
      });
    }

    function stepFan(delta) {
      activeFanIndex = (activeFanIndex + delta + totalFanCards) % totalFanCards;
      renderTestimonialFan();
    }

    if (tFanPrev) {
      tFanPrev.addEventListener("click", () => stepFan(-1));
    }
    if (tFanNext) {
      tFanNext.addEventListener("click", () => stepFan(1));
    }

    tFanCards.forEach((card, idx) => {
      card.addEventListener("click", () => {
        if (idx !== activeFanIndex) {
          activeFanIndex = idx;
          renderTestimonialFan();
        }
      });
    });

    // Pointer / Touch Drag Support
    if (tFanStage) {
      let dragStartX = null;
      tFanStage.addEventListener("pointerdown", (e) => {
        dragStartX = e.clientX;
      });
      window.addEventListener(
        "pointerup",
        (e) => {
          if (dragStartX === null) return;
          const dx = e.clientX - dragStartX;
          dragStartX = null;
          if (Math.abs(dx) > 45) {
            stepFan(dx < 0 ? 1 : -1);
          }
        },
        { signal }
      );
    }

    renderTestimonialFan();
  }

  /* ------------------------------------------------------------------------
     10. FAQ Accordion (Hover to Open Immediately — Exact Framer FAQ Tab)
     ------------------------------------------------------------------------ */
  const faqItems = Array.from(document.querySelectorAll(".faq-item"));

  function activateFaqItem(targetItem) {
    faqItems.forEach((item) => {
      const answer = item.querySelector(".faq-answer");
      const icon = item.querySelector(".faq-icon");
      if (item === targetItem) {
        item.classList.add("open");
        if (answer) {
          answer.style.maxHeight = answer.scrollHeight + "px";
        }
        if (icon) {
          icon.textContent = "−";
        }
      } else {
        item.classList.remove("open");
        if (answer) {
          answer.style.maxHeight = null;
        }
        if (icon) {
          icon.textContent = "+";
        }
      }
    });
  }

  faqItems.forEach((item) => {
    // Open immediately when cursor enters the FAQ card/text (no click needed)
    item.addEventListener("mouseenter", () => {
      activateFaqItem(item);
    });

    // Also support click/tap for mobile devices
    const btn = item.querySelector(".faq-question");
    if (btn) {
      btn.addEventListener("click", () => {
        activateFaqItem(item);
      });
    }
  });

  /* ------------------------------------------------------------------------
     10. Modal & Command Shortcut (Ctrl/Cmd + K)
     ------------------------------------------------------------------------ */
  const actionModal = document.getElementById("actionModal");
  const modalTitle = document.getElementById("modalTitle");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const modalForm = document.getElementById("modalForm");

  function openModal(titleText) {
    if (!actionModal) return;
    if (modalTitle && titleText) {
      modalTitle.textContent = titleText;
    }
    actionModal.classList.add("open");
  }

  function closeModal() {
    if (actionModal) actionModal.classList.remove("open");
  }

  document.querySelectorAll(".open-modal-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const title = btn.getAttribute("data-modal-title") || "Konsultasikan Kebutuhan Anda";
      openModal(title);
    });
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  if (actionModal) {
    actionModal.addEventListener("click", (e) => {
      if (e.target === actionModal) closeModal();
    });
  }

  window.addEventListener(
    "keydown",
    (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openModal("Konsultasikan Kebutuhan Website Anda");
      }
      if (e.key === "Escape") {
        closeModal();
      }
    },
    { signal }
  );

  if (modalForm) {
    modalForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const submitBtn = modalForm.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.innerHTML = "<span>✓ Permintaan Konsultasi Terkirim!</span>";
      }
      setTimeout(() => {
        closeModal();
        if (submitBtn) {
          submitBtn.innerHTML = "<span>Kirim &amp; Konsultasi Sekarang</span>";
        }
        modalForm.reset();
      }, 1500);
    });
  }

  /* ------------------------------------------------------------------------
     11. About Us Page: What We Believe Interactive Switcher
     ------------------------------------------------------------------------ */
  const believeItems = document.querySelectorAll("#believeItemsList .believe-item");
  const believeBadges = document.querySelectorAll(".believe-visual-card .believe-floating-badge");

  if (believeItems.length > 0) {
    function activateBelieveItem(idx) {
      believeItems.forEach((item, i) => {
        if (i === idx) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });

      believeBadges.forEach((badge) => {
        const badgeIdx = parseInt(badge.getAttribute("data-badge-index"), 10);
        if (badgeIdx === idx) {
          badge.classList.add("active");
        } else {
          badge.classList.remove("active");
        }
      });
    }

    believeItems.forEach((item, idx) => {
      item.addEventListener("mouseenter", () => activateBelieveItem(idx));
      item.addEventListener("click", () => activateBelieveItem(idx));
    });
  }

  /* ------------------------------------------------------------------------
     12. About Us Page: How We Work Timeline & Step Progress
     ------------------------------------------------------------------------ */
  const workCards = document.querySelectorAll(".about-work-card");
  const workCheckpoints = document.querySelectorAll(".work-checkpoint");
  const workFillLine = document.getElementById("workFillLine");
  const workSection = document.getElementById("work");

  if (workCards.length > 0) {
    let currentWorkStep = 0;

    function setWorkStep(step) {
      currentWorkStep = Math.max(0, Math.min(step, workCards.length - 1));

      workCards.forEach((card, idx) => {
        if (idx === currentWorkStep) {
          card.classList.add("active");
        } else {
          card.classList.remove("active");
        }
      });

      workCheckpoints.forEach((cp, idx) => {
        if (idx <= currentWorkStep) {
          cp.classList.add("active");
        } else {
          cp.classList.remove("active");
        }
      });

      if (workFillLine) {
        if (currentWorkStep === 0) {
          workFillLine.style.width = "33.333%";
        } else if (currentWorkStep === 1) {
          workFillLine.style.width = "66.666%";
        } else {
          workFillLine.style.width = "100%";
        }
      }
    }

    workCards.forEach((card, idx) => {
      card.addEventListener("mouseenter", () => setWorkStep(idx));
      card.addEventListener("click", () => setWorkStep(idx));
    });

    workCheckpoints.forEach((cp, idx) => {
      cp.addEventListener("click", () => setWorkStep(idx));
      cp.addEventListener("mouseenter", () => setWorkStep(idx));
    });

    // Scroll progress trigger for How We Work section
    if (workSection) {
      window.addEventListener(
        "scroll",
        () => {
          const rect = workSection.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const visibleHeight = windowHeight - rect.top;
          const totalDistance = rect.height + windowHeight * 0.5;
          const progress = Math.max(0, Math.min(1, visibleHeight / totalDistance));

          if (progress > 0.25 && progress < 0.55) {
            setWorkStep(0);
          } else if (progress >= 0.55 && progress < 0.78) {
            setWorkStep(1);
          } else if (progress >= 0.78) {
            setWorkStep(2);
          }
        },
        { passive: true, signal }
      );
    }
  }
}

/* --------------------------------------------------------------------------
   13. Expanding Circle Iris Page Transitions (Exact Framer Match)
       Incoming page is revealed by a circle growing from viewport center.
   -------------------------------------------------------------------------- */
const IRIS_DURATION_MS = 720;
const IRIS_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const PAGE_CONFIG = {
  home: {
    path: "index.html",
    templateId: "homePageTemplate",
    title: "WebGrow – Jasa Pembuatan Website Profesional #1"
  },
  about: {
    path: "about.html",
    templateId: "aboutPageTemplate",
    title: "WebGrow — Tentang Kami"
  },
  feature: {
    path: "feature.html",
    templateId: "featurePageTemplate",
    title: "WebGrow — Features"
  }
};
const pageCache = { home: null, about: null, feature: null };
let isTransitioning = false;
let skipNextPopTransition = false;

function resolvePageType(cleanPath, statePage) {
  if (cleanPath === "about.html" || cleanPath === "about" || (!cleanPath && statePage === "about")) {
    return "about";
  }
  if (cleanPath === "feature.html" || cleanPath === "feature" || (!cleanPath && statePage === "feature")) {
    return "feature";
  }
  if (cleanPath === "index.html" || cleanPath === "index" || (!cleanPath && statePage === "home")) {
    return "home";
  }
  return null;
}

function getCurrentPageType() {
  if (document.body.dataset.page && PAGE_CONFIG[document.body.dataset.page]) {
    return document.body.dataset.page;
  }
  if (document.getElementById("story")) return "about";
  if (document.getElementById("capabilities")) return "feature";
  return "home";
}

function cacheCurrentPage() {
  const appRoot = document.getElementById("appRoot");
  if (appRoot) {
    pageCache[getCurrentPageType()] = appRoot.innerHTML;
  }
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getCachedPageHtml(targetType) {
  const cfg = PAGE_CONFIG[targetType] || PAGE_CONFIG.home;
  if (pageCache[targetType]) return Promise.resolve(pageCache[targetType]);

  const tmpl = document.getElementById(cfg.templateId);
  if (tmpl && tmpl.innerHTML.trim()) {
    pageCache[targetType] = tmpl.innerHTML;
    return Promise.resolve(pageCache[targetType]);
  }

  return fetch(cfg.path)
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    })
    .then((htmlText) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");
      const root = doc.getElementById("appRoot") || doc.body;
      pageCache[targetType] = root.innerHTML;
      return pageCache[targetType];
    });
}

function applyPageChrome(targetType, targetHash, { pushHistory }) {
  const cfg = PAGE_CONFIG[targetType] || PAGE_CONFIG.home;
  document.body.className = "page-dark is-page-transitioning";
  document.body.dataset.page = targetType;
  document.title = cfg.title;
  if (pushHistory) {
    try {
      window.history.pushState(
        { page: targetType },
        "",
        cfg.path + (targetHash ? "#" + targetHash : "")
      );
    } catch (e) {}
  }
}

function swapToPage(targetHtml, targetType, targetHash, { pushHistory }) {
  const appRoot = document.getElementById("appRoot");
  if (appRoot) {
    appRoot.innerHTML = targetHtml;
  } else {
    document.body.innerHTML = targetHtml;
  }

  applyPageChrome(targetType, targetHash, { pushHistory });
  window.scrollTo(0, 0);
  pageCache[targetType] = targetHtml;
}

function finishTransition(targetHash) {
  document.body.classList.remove("is-page-transitioning");
  isTransitioning = false;
  initPageInteractions();
  if (targetHash && targetHash !== "top") {
    const el = document.getElementById(targetHash);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }
}

function waitForAnimation(animation) {
  if (!animation) return Promise.resolve();
  return animation.finished.catch(() => {});
}

function runOverlayIris(targetHtml, targetType, targetHash, { pushHistory }) {
  let iris = document.getElementById("pageTransitionIris");
  if (!iris) {
    iris = document.createElement("div");
    iris.id = "pageTransitionIris";
    document.body.appendChild(iris);
  }

  iris.style.backgroundColor = "#0a0a0b";
  iris.innerHTML = "";
  const clone = document.createElement("div");
  clone.className = "iris-content-clone page-dark";
  clone.innerHTML = targetHtml;
  iris.appendChild(clone);

  iris.getAnimations().forEach((a) => a.cancel());
  iris.style.clipPath = "circle(0% at 50% 50%)";

  const animation = iris.animate(
    [
      { clipPath: "circle(0% at 50% 50%)" },
      { clipPath: "circle(150% at 50% 50%)" },
    ],
    { duration: IRIS_DURATION_MS, easing: IRIS_EASING, fill: "forwards" }
  );

  return waitForAnimation(animation).then(() => {
    swapToPage(targetHtml, targetType, targetHash, { pushHistory });
    iris.getAnimations().forEach((a) => a.cancel());
    iris.style.clipPath = "circle(0% at 50% 50%)";
    iris.innerHTML = "";
    finishTransition(targetHash);
  });
}

function runIrisTransition(targetType, targetHash, { pushHistory = true } = {}) {
  if (isTransitioning) return;
  const cfg = PAGE_CONFIG[targetType] || PAGE_CONFIG.home;
  const currentType = getCurrentPageType();

  if (currentType === targetType) {
    if (targetHash) {
      if (targetHash === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const el = document.getElementById(targetHash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }
    return;
  }

  isTransitioning = true;
  document.body.classList.add("is-page-transitioning");
  cacheCurrentPage();

  getCachedPageHtml(targetType)
    .then((targetHtml) => {
      if (prefersReducedMotion()) {
        swapToPage(targetHtml, targetType, targetHash, { pushHistory });
        finishTransition(targetHash);
        return;
      }

      if (typeof document.startViewTransition === "function") {
        const transition = document.startViewTransition(() => {
          swapToPage(targetHtml, targetType, targetHash, { pushHistory });
        });
        if (transition.updateCallbackDone) transition.updateCallbackDone.catch(() => {});
        if (transition.ready) transition.ready.catch(() => {});
        return transition.finished
          .catch(() => {})
          .then(() => finishTransition(targetHash));
      }

      return runOverlayIris(targetHtml, targetType, targetHash, { pushHistory });
    })
    .catch(() => {
      window.location.href = cfg.path + (targetHash ? "#" + targetHash : "");
    });
}

function setupPageTransitions() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href) return;

    // Ignore mailto, tel, target="_blank", or modal trigger buttons
    if (href.startsWith("mailto:") || href.startsWith("tel:") || link.target === "_blank") {
      return;
    }
    if (link.classList.contains("open-modal-btn")) {
      return;
    }

    // Ignore external origin links
    if (href.startsWith("http://") || href.startsWith("https://")) {
      try {
        const urlObj = new URL(href, window.location.href);
        if (urlObj.origin !== window.location.origin) return;
      } catch (err) {
        return;
      }
    }

    const [pathPart, hashPart] = href.split("#");
    const cleanPath = (pathPart || "").split("/").pop().toLowerCase();

    // Determine target page type
    const targetType = cleanPath === ""
      ? getCurrentPageType()
      : resolvePageType(cleanPath, null);

    if (!targetType) return;

    const currentType = getCurrentPageType();

    // Same-page click -> smooth scroll without reload
    if (targetType === currentType) {
      if (hashPart) {
        e.preventDefault();
        if (hashPart === "top") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          const targetEl = document.getElementById(hashPart);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: "smooth" });
          }
        }
        try {
          window.history.pushState(null, "", `#${hashPart}`);
        } catch (err) {}
      }
      return;
    }

    // Different page -> expanding circle iris transition
    e.preventDefault();
    runIrisTransition(targetType, hashPart, { pushHistory: true });
  });

  window.addEventListener("popstate", (e) => {
    if (skipNextPopTransition) {
      skipNextPopTransition = false;
      return;
    }
    const cleanPath = window.location.pathname.split("/").pop().toLowerCase();
    const hash = window.location.hash.replace("#", "");
    const statePage = e.state && e.state.page ? e.state.page : null;
    const targetType = resolvePageType(cleanPath, statePage) || "home";
    runIrisTransition(targetType, hash, { pushHistory: false });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  cacheCurrentPage();
  initPageInteractions();
  setupPageTransitions();
});
