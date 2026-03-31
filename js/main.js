/**
 * main.js — FORTIFYD
 * Nav scroll behavior, ticker banner, mobile menu, reveal animations, contact form
 */

(function () {
  'use strict';

  /* ============================================================
     TICKER BANNER
  ============================================================ */
  const tickerItems = [
    { text: 'Backed by University of Colorado Research', highlight: false },
    { text: 'Supported by CU Venture Partners', highlight: false },
    { text: 'Patent Pending', highlight: true },
    { text: 'Additive Manufacturing Compatible', highlight: false },
    { text: 'Up to 10x Greater Energy Absorption', highlight: true },
    { text: 'Advanced Metamaterial Systems', highlight: false },
    { text: 'Pre-Launch — Partner With Us', highlight: true },
  ];

  function buildTicker() {
    const track = document.getElementById('tickerTrack');
    if (!track) return;

    // Duplicate 3× for seamless looping
    const total = [...tickerItems, ...tickerItems, ...tickerItems];
    total.forEach(item => {
      const span = document.createElement('span');
      span.className = 'ticker-item';
      span.innerHTML = `<span class="ticker-dot"></span><span class="${item.highlight ? 'ticker-highlight' : ''}">${item.text}</span>`;
      track.appendChild(span);
    });
  }

  /* ============================================================
     NAVBAR — scroll state + smooth active highlighting
  ============================================================ */
  function initNav() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* ============================================================
     MOBILE HAMBURGER
  ============================================================ */
  function initHamburger() {
    const btn = document.getElementById('hamburger');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
      // Animate spans
      const spans = btn.querySelectorAll('span');
      if (open) {
        spans[0].style.transform = 'translateY(6.5px) rotate(45deg)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'translateY(-6.5px) rotate(-45deg)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });

    // Close on link click
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', false);
        btn.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      });
    });
  }

  /* ============================================================
     SCROLL REVEAL
  ============================================================ */
  function initReveal() {
    const targets = document.querySelectorAll(
      '.feature-card, .industry-card, .tech-credentials, .tech-text p, .partners-text, .looking-for-list li, .stat-bar-inner'
    );
    targets.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${(i % 4) * 0.08}s`;
    });

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    targets.forEach(t => obs.observe(t));
  }

  /* ============================================================
     CONTACT FORM
  ============================================================ */
  function initContact() {
    const btn = document.getElementById('contactSubmit');
    const confirm = document.getElementById('contactConfirm');
    const emailInput = document.getElementById('contactEmail');
    const orgInput = document.getElementById('contactOrg');
    const msgInput = document.getElementById('contactMsg');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const email = emailInput ? emailInput.value.trim() : '';
      if (!email || !email.includes('@')) {
        emailInput.style.borderColor = '#e84519';
        emailInput.focus();
        setTimeout(() => { emailInput.style.borderColor = ''; }, 2000);
        return;
      }
      // Simulate submission
      btn.textContent = 'SENDING...';
      btn.style.opacity = '0.6';
      btn.disabled = true;
      setTimeout(() => {
        btn.style.display = 'none';
        if (confirm) confirm.classList.add('visible');
        if (emailInput) emailInput.value = '';
        if (orgInput) orgInput.value = '';
        if (msgInput) msgInput.value = '';
      }, 900);
    });
  }

  /* ============================================================
     SMOOTH SCROLL for all anchor links
  ============================================================ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;
        const top = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ============================================================
     HERO LATTICE — subtle mouse parallax
  ============================================================ */
  function initParallax() {
    const heroSvg = document.querySelector('.hero-bg-lattice svg');
    if (!heroSvg) return;
    document.addEventListener('mousemove', e => {
      const mx = (e.clientX / window.innerWidth - 0.5) * 18;
      const my = (e.clientY / window.innerHeight - 0.5) * 12;
      heroSvg.style.transform = `translate(${mx}px, ${my}px)`;
    }, { passive: true });
  }

  /* ============================================================
     INIT
  ============================================================ */
  function init() {
    buildTicker();
    initNav();
    initHamburger();
    initReveal();
    initContact();
    initSmoothScroll();
    initParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
