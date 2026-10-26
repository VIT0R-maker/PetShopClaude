(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 1000px)');
  const toggle = document.querySelector('#menu-toggle');
  const navigation = document.querySelector('#site-nav');
  let menuOpen = false;

  function focusDestination(element) {
    if (!element) return;
    const temporary = !element.hasAttribute('tabindex');
    if (temporary) element.setAttribute('tabindex', '-1');
    element.focus({ preventScroll: true });
    if (temporary) element.addEventListener('blur', () => element.removeAttribute('tabindex'), { once: true });
  }

  function setMenu(open, restoreFocus = false) {
    if (!toggle || !navigation) return;
    menuOpen = open && !desktop.matches;
    if (!menuOpen && navigation.contains(document.activeElement) && !desktop.matches) toggle.focus({ preventScroll: true });
    navigation.classList.toggle('is-open', menuOpen);
    navigation.inert = !desktop.matches && !menuOpen;
    if (desktop.matches) navigation.removeAttribute('aria-hidden');
    else navigation.setAttribute('aria-hidden', String(!menuOpen));
    toggle.setAttribute('aria-expanded', String(menuOpen));
    toggle.setAttribute('aria-label', menuOpen ? 'Fechar menu' : 'Abrir menu');
    toggle.classList.toggle('is-open', menuOpen);
    if (restoreFocus && !desktop.matches) toggle.focus({ preventScroll: true });
  }

  if (toggle && navigation) {
    toggle.addEventListener('click', () => setMenu(!menuOpen));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menuOpen) {
        event.preventDefault();
        setMenu(false, true);
      }
    });
    document.addEventListener('click', event => {
      if (menuOpen && !navigation.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
    });
    document.addEventListener('focusin', event => {
      if (menuOpen && !navigation.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
    });
    desktop.addEventListener('change', () => {
      const buttonHadFocus = document.activeElement === toggle;
      setMenu(false);
      if (desktop.matches && buttonHadFocus) navigation.querySelector('a')?.focus({ preventScroll: true });
    });
    document.documentElement.classList.add('menu-ready');
    setMenu(false);
  }

  // O conteúdo permanece visível no CSS base. Uma falha de animação não o oculta.
  const animations = new Set();
  function reveal(element, duration = 450) {
    if (!element || reducedMotion.matches || typeof element.animate !== 'function') return;
    try {
      const animation = element.animate([
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration, easing: 'cubic-bezier(.2,.7,.2,1)' });
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    } catch { /* A apresentação estática já está disponível. */ }
  }
  reveal(document.querySelector('.hero-content'));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        reveal(entry.target);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach(section => observer.observe(section));
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  }
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      animations.forEach(animation => animation.cancel());
      animations.clear();
    }
  });

  const openDialogs = new Set();
  const returnFocus = new WeakMap();
  let previousOverflow = '';
  function openDialog(dialog, origin) {
    if (!dialog || typeof dialog.showModal !== 'function') return false;
    returnFocus.set(dialog, origin || document.activeElement);
    if (!openDialogs.size) previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    openDialogs.add(dialog);
    document.body.style.overflow = 'hidden';
    return true;
  }
  function prepareDialog(dialog, closeButton) {
    if (!dialog) return;
    closeButton?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      openDialogs.delete(dialog);
      if (!openDialogs.size) document.body.style.overflow = previousOverflow;
      const origin = returnFocus.get(dialog);
      if (origin?.isConnected && origin.getClientRects().length && !origin.closest('[inert]')) origin.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  }

  const galleryLinks = [...document.querySelectorAll('a[data-gallery-index]')];
  const lightbox = document.querySelector('#lightbox');
  const lightboxImage = document.querySelector('#lightbox-image');
  let galleryIndex = 0;
  prepareDialog(lightbox, document.querySelector('#lightbox-close'));
  function renderGallery(index) {
    galleryIndex = (index + galleryLinks.length) % galleryLinks.length;
    const link = galleryLinks[galleryIndex];
    const photo = link.querySelector('img');
    const caption = link.dataset.caption || photo?.alt || 'Fotografia da Mimo Pet';
    lightboxImage.src = link.href;
    lightboxImage.alt = photo?.alt || caption;
    document.querySelector('#lightbox-caption').textContent = caption;
    document.querySelector('#lightbox-count').textContent = `${galleryIndex + 1} de ${galleryLinks.length}`;
  }
  function showGallery(index, origin) {
    if (!galleryLinks.length || !lightboxImage || typeof lightbox?.showModal !== 'function') return false;
    renderGallery(index);
    return openDialog(lightbox, origin);
  }
  galleryLinks.forEach((link, index) => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (showGallery(index, link)) event.preventDefault();
  }));
  document.querySelector('#open-gallery')?.addEventListener('click', event => {
    if (showGallery(0, event.currentTarget)) event.preventDefault();
  });
  if (galleryLinks.length && lightboxImage && typeof lightbox?.showModal === 'function') {
    const galleryButton = document.querySelector('#open-gallery');
    if (galleryButton) galleryButton.hidden = false;
  }
  document.querySelector('#lightbox-prev')?.addEventListener('click', () => renderGallery(galleryIndex - 1));
  document.querySelector('#lightbox-next')?.addEventListener('click', () => renderGallery(galleryIndex + 1));
  lightbox?.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      renderGallery(galleryIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });

  const form = document.querySelector('#contact-form');
  const service = document.querySelector('#care-service');
  const intentStatus = document.querySelector('#form-intent-status');
  let intent = 'care';
  function setIntent(value) {
    intent = value;
    if (intentStatus) intentStatus.textContent = value === 'location'
      ? 'Sua mensagem incluirá um pedido de localização e horários de atendimento.' : '';
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (link.dataset.service && service) {
      if ([...service.options].some(option => option.value === link.dataset.service)) service.value = link.dataset.service;
      setIntent('care');
    }
    if (link.dataset.intent === 'location') setIntent('location');
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (target) {
      if (menuOpen) setMenu(false);
      focusDestination(target);
    }
  });
  service?.addEventListener('change', () => setIntent('care'));

  const preview = document.querySelector('#message-preview');
  const message = document.querySelector('#message-text');
  const whatsapp = document.querySelector('#whatsapp-link');
  const feedback = document.querySelector('#message-feedback');
  prepareDialog(preview, document.querySelector('#message-close'));
  const configuredNumber = String(window.MIMO_PET_CONFIG?.whatsappNumber || '').trim();
  const validNumber = /^\d{10,15}$/.test(configuredNumber) && !/^0+$/.test(configuredNumber);

  function syncWhatsappLink() {
    if (!whatsapp || !message) return;
    const available = validNumber && message.value.trim().length > 0;
    whatsapp.hidden = !available;
    if (available) whatsapp.href = `https://wa.me/${configuredNumber}?text=${encodeURIComponent(message.value.trim())}`;
    else whatsapp.removeAttribute('href');
  }
  message?.addEventListener('input', syncWhatsappLink);
  if (form && message && preview && typeof preview.showModal === 'function') {
    const owner = document.querySelector('#owner-name');
    const pet = document.querySelector('#pet-name');
    const species = document.querySelector('#pet-kind');
    const notes = document.querySelector('#pet-notes');
    [owner, pet].forEach(field => {
      const validate = () => field.setCustomValidity(field.value.trim() ? '' : 'Preencha este campo com um nome.');
      field.addEventListener('input', validate);
      field.addEventListener('blur', validate);
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      [owner, pet].forEach(field => field.setCustomValidity(field.value.trim() ? '' : 'Preencha este campo com um nome.'));
      if (!form.reportValidity()) return;
      const lines = [
        `Olá, equipe Mimo Pet! Meu nome é ${owner.value.trim()}.`,
        `Meu pet se chama ${pet.value.trim()} (${species.value}).`,
        `Cuidado desejado: ${service.value}.`
      ];
      if (notes.value.trim()) lines.push(`Sobre meu pet: ${notes.value.trim()}`);
      if (intent === 'location') lines.push('Gostaria de solicitar a localização e os horários de atendimento.');
      else lines.push('Gostaria de saber mais e consultar a disponibilidade para agendamento.');
      message.value = lines.join('\n\n');
      if (feedback) feedback.textContent = '';
      const demo = document.querySelector('#message-demo');
      if (demo) demo.textContent = validNumber
        ? 'Revise a mensagem. O WhatsApp será aberto somente quando você escolher continuar; nada foi enviado.'
        : 'Projeto demonstrativo: o número comercial ainda não foi informado. Você pode revisar e copiar a mensagem. Nada foi enviado.';
      syncWhatsappLink();
      openDialog(preview, document.querySelector('#prepare-message'));
    });
    document.querySelector('#prepare-message').disabled = false;
  }
  document.querySelector('#copy-message')?.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Área de transferência indisponível');
      await navigator.clipboard.writeText(message.value);
      feedback.textContent = 'Mensagem copiada. Nenhuma mensagem foi enviada.';
    } catch {
      message.focus();
      message.select();
      feedback.textContent = 'Selecione e copie a mensagem com Ctrl+C ou com a opção Copiar do seu dispositivo. Nada foi enviado.';
    }
  });
})();
