/**
 * UI interactions for the ThrivnMe marketing site.
 * Handles mobile nav toggle, smooth scrolling, and form submissions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── Mobile Nav Toggle ───────────────────────────────────────────────────────
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // ── Smooth Scroll for Anchor Links ──────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Newsletter Form ─────────────────────────────────────────────────────────
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterForm.querySelector('input[type="email"]')?.value;
      if (email) {
        Sankofa.track('newsletter_signup', { email });
        Sankofa.identify(email);
        alert('Thanks for subscribing!');
      }
    });
  }
});
