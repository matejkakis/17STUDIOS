/* 17 Studios — skripty */
(function () {
    'use strict';
    const $  = (sel, ctx = document) => ctx.querySelector(sel);
    // Meranie udalostí (funguje, keď je v hlavičke vložený skript Umami alebo Plausible; inak nerobí nič)
    window.track = (name, data) => { try { window.umami?.track?.(name, data); window.plausible?.(name, data ? { props: data } : undefined); } catch (_) {} };
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
    const body = document.body;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer   = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function scrollToSection(id) { document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' }); }
    window.scrollToSection = scrollToSection;
    window.navTo = (id) => { closeMenu(); scrollToSection(id); };

    /* ── GALÉRIA (Fancybox, ak sa načítal) ── */
    if (window.Fancybox) Fancybox.bind('[data-fancybox]', {
        Hash: false,
        on: { init: () => window.irisOpen?.() },          // galéria sa otvorí cez clonu
        // Dopyt priamo z galérie: pod fotkou je tlačidlo, ktoré vyplní formulár
        caption: (fb, slide) => {
            const cap = slide.caption || '';
            const el = slide.triggerEl;
            if (!el || slide.type === 'video' || slide.type === 'iframe' || slide.type === 'html5video') return cap;
            const file = String(slide.src || '').split('/').pop();
            return `${cap ? `<span class="fb-cap">${cap}</span>` : ''}<button type="button" class="fb-ask" data-file="${file}" data-panel="${el.closest('.cat-panel')?.id || el.closest('section')?.id || ''}">I want a shoot like this</button>`;
        },
    });

    /* ── NAVIGÁCIA ── */
    const nav = $('#nav'), hero = $('#home');
    const toggle = $('#nav-toggle'), menu = $('#mobile-menu');
    // Menu sa otvára a zatvára ako závierka fotoaparátu
    $$('#mobile-menu .mm-link, #mobile-menu .mm-cta').forEach((a, i) => a.style.setProperty('--i', i));
    let menuTimer = 0;
    function closeMenu() {
        if (!menu || menu.hidden) return;
        toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Menu';
        body.classList.remove('modal-open'); nav.classList.remove('menu-open');
        clearTimeout(menuTimer);
        menu.classList.remove('is-opening');
        if (reducedMotion) { menu.hidden = true; return; }
        menu.classList.add('is-closing');
        menuTimer = setTimeout(() => { menu.hidden = true; menu.classList.remove('is-closing'); }, 340);
    }
    window.closeMenu = closeMenu;
    toggle?.addEventListener('click', () => {
        if (!menu.hidden && !menu.classList.contains('is-closing')) { closeMenu(); return; }
        clearTimeout(menuTimer);
        menu.classList.remove('is-closing');
        menu.hidden = false;
        void menu.offsetWidth;
        menu.classList.add('is-opening');
        toggle.setAttribute('aria-expanded', 'true'); toggle.textContent = 'Close';
        body.classList.add('modal-open'); nav.classList.add('menu-open');
    });
    $$('#mobile-menu a').forEach(a => a.addEventListener('click', closeMenu));

    /* ── SVETLO V ÚVODE (kurzor = svetlo, inak sa pomaly pohybuje samo) ── */
    const heroTitle = $('.hero-title');
    if (hero && heroTitle && finePointer && !reducedMotion) {
        // Počúvame na celom okne, nie len na úvode: svetlo nezamrzne, keď kurzor prejde
        // cez menu, stupnicu ostrenia alebo okraj stránky.
        let raf = 0, px = 0, py = 0, hb = null, tb = null;
        const measure = () => { hb = hero.getBoundingClientRect(); tb = heroTitle.getBoundingClientRect(); };
        window.addEventListener('resize', () => { hb = null; }, { passive: true });
        window.addEventListener('scroll', () => { hb = null; }, { passive: true });
        window.addEventListener('pointermove', (e) => {
            px = e.clientX; py = e.clientY;
            if (raf) return;
            raf = requestAnimationFrame(() => {
                raf = 0;
                if (!hb) measure();
                if (hb.bottom <= 0) return;                 // úvod je mimo obrazovky
                hero.classList.remove('is-auto');
                hero.style.setProperty('--lx', ((px - hb.left) / hb.width * 100).toFixed(1) + '%');
                hero.style.setProperty('--ly', ((py - hb.top) / hb.height * 100).toFixed(1) + '%');
                hero.style.setProperty('--sx', (px - hb.left).toFixed(0) + 'px');
                hero.style.setProperty('--sy', (py - hb.top).toFixed(0) + 'px');
                heroTitle.style.setProperty('--lx', ((px - tb.left) / tb.width * 100).toFixed(1) + '%');
                heroTitle.style.setProperty('--ly', ((py - tb.top) / tb.height * 100).toFixed(1) + '%');
            });
        }, { passive: true });
    }
    if (reducedMotion) hero?.classList.remove('is-auto');

    /* ── ROZSVIETENIE ŠTÚDIA pri odchode z úvodu + navigácia + stupnica ostrenia ── */
    const scale = $('#focus-scale');
    const mobileCta = $('#mobile-cta');
    const contactSec = $('#contact');
    const needle = $('.fs-needle');
    let ticking = false, heroH = hero ? hero.offsetHeight : 0, docMax = 1, contactIn = false;
    const measureScroll = () => { heroH = hero ? hero.offsetHeight : 0; docMax = document.documentElement.scrollHeight - window.innerHeight; };
    if (contactSec && 'IntersectionObserver' in window) new IntersectionObserver(([e]) => { contactIn = e.isIntersecting; onScroll(); }).observe(contactSec);
    window.addEventListener('load', measureScroll);
    if ('ResizeObserver' in window) new ResizeObserver(() => measureScroll()).observe(document.body);
    function onScroll() {
        ticking = false;
        const y = window.scrollY, vh = window.innerHeight;
        if (hero) {
            const hh = heroH;
            const p = Math.min(1, Math.max(0, (y - hh * 0.5) / (hh * 0.45)));   // zosvetlí sa až keď úvod skoro zmizne
            if (!reducedMotion) hero.style.setProperty('--on', p.toFixed(3));
            nav.classList.toggle('is-solid', y > hh * 0.7);
            nav.classList.toggle('is-moving', y > 8);
        }
        if (scale && needle) needle.style.setProperty('--fs', docMax > 0 ? Math.min(1, y / docMax).toFixed(4) : 0);
        if (mobileCta) mobileCta.classList.toggle('visible', y > vh * 0.8 && !contactIn);
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    window.addEventListener('resize', () => { measureScroll(); onScroll(); }, { passive: true });
    measureScroll(); onScroll();

    // Aktívna sekcia v menu aj na stupnici
    const spyLinks = $$('.nav-links a, .focus-scale a[href^="#"]');
    const spy = new IntersectionObserver((entries) => {
        entries.forEach(en => {
            if (!en.isIntersecting) return;
            const id = '#' + en.target.id;
            spyLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach(sec => spy.observe(sec));

    /* ── ZAOSTRENIE nadpisov pri príchode ── */
    const fpObs = new IntersectionObserver((entries) => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-sharp'); fpObs.unobserve(en.target); } });
    }, { threshold: 0.3, rootMargin: '0px 0px -8% 0px' });
    $$('.fp').forEach(el => reducedMotion ? el.classList.add('is-sharp') : fpObs.observe(el));

    /* ── OKNÁ ── */
    let lastFocus = null;
    window.openModal = (id) => {
        const m = document.getElementById(id); if (!m) return;
        lastFocus = document.activeElement;
        m.classList.add('open'); body.classList.add('modal-open');
        setTimeout(() => m.querySelector('button, a, [tabindex="0"]')?.focus(), 60);
    };
    window.closeModal = (id) => {
        const m = document.getElementById(id); if (!m) return;
        m.classList.remove('open');
        if (!$('.modal-backdrop.open, #contact-modal.open, #gdpr-modal.open, #video-lightbox.open')) body.classList.remove('modal-open');
        lastFocus?.focus?.({ preventScroll: true });
    };
    $$('.modal-backdrop').forEach(m => m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); }));

    /* ── SELECT SERVICE → CONTACT FORM ── */
    // Doplňujúce otázky podľa kategórie — klient hneď napíše, čo potrebujete vedieť
    const CAT_HINTS = {
        'Svadba':          'Wedding date:\nVenue:\nWe are interested in: photo / video / both',
        'Event / koncert': 'Event name and date:\nVenue:\nLength of the event:',
        'Hudba / klip':    'Artist / track:\nIdea for the video:\nPlanned release date:',
        'Portrét':         'Type of shoot (personal / couple / editorial):\nPreferred date:',
        'Firma / reklama': 'Company / brand:\nWhat you need the content for (campaign, social media, website...):\nDeadline:',
        'Produkty':        'Number of products:\nUse (online shop, social media...):\nDeadline:',
        'Web':             'What the website is for:\nApproximate size (number of pages):\nLaunch date:',
        'Digital Art':     'What you need (cover, poster, photo editing):\nDeadline:',
        'Bundle':          'Date and venue:\nApproximate number of guests / visitors:',
    };
    const MSG_TEMPLATE = (service, category) =>
        `Hello,\n\nI'm interested in: ${String(service).replace(/\s+—.*$/, '')}. Could you send me a quote, please?` +
        (CAT_HINTS[category] ? `\n\n${CAT_HINTS[category]}` : '');

    let toastTimer = 0;
    function prefillToast(service) {
        let el = $('#prefill-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'prefill-toast'; el.className = 'prefill-toast'; el.setAttribute('role', 'status');
            body.appendChild(el);
        }
        const clean = String(service).replace(/\s+—.*$/, '');
        el.innerHTML = `<i aria-hidden="true"></i><div><b>Selected: ${clean.replace(/[<>&]/g, '')}</b><span>Add your name and contact.</span></div>`;
        requestAnimationFrame(() => el.classList.add('show'));
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
    }
    window.selectService = (category, service, customMsg) => {
        window.playSfx?.('shutter');
        $$('.modal-backdrop.open').forEach(m => closeModal(m.id));
        window.setCatStep?.(3);
        if (!reducedMotion) {
            let sh = $('#shutter');
            if (!sh) { sh = document.createElement('div'); sh.id = 'shutter'; sh.className = 'shutter'; sh.setAttribute('aria-hidden', 'true'); sh.innerHTML = '<i></i><i></i>'; body.appendChild(sh); }
            sh.classList.remove('fire'); void sh.offsetWidth; sh.classList.add('fire');
            setTimeout(() => sh.classList.remove('fire'), 400);
        }
        // Strih: kým je závierka zatvorená, stránka skočí rovno na formulár
        const jump = () => {
            const form = $('.slate-wrap') || $('#contact');
            const y = window.scrollY + form.getBoundingClientRect().top - navH() - 12;
            window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
        };
        setTimeout(jump, reducedMotion ? 0 : 150);
        setTimeout(() => {
            const sel = $('#f-service'), msg = $('#f-msg'), name = $('#f-name'), contact = $('#f-contact');
            sel.value = category;
            msg.value = customMsg || MSG_TEMPLATE(service, category);
            [sel, msg].forEach(el => { el.classList.remove('is-prefilled'); void el.offsetWidth; el.classList.add('is-prefilled'); });
            [name, contact].forEach(el => el.classList.toggle('needs-you', !el.value.trim()));
            (name.value.trim() ? (contact.value.trim() ? msg : contact) : name).focus({ preventScroll: true });
            prefillToast(service);
        }, reducedMotion ? 50 : 360);
    };
    ['input', 'change'].forEach(ev => document.addEventListener(ev, (e) => { if (e.target.classList?.contains('needs-you') && e.target.value.trim()) e.target.classList.remove('needs-you'); }));

    /* ── VIDEO LIGHTBOX ── */
    const vlBox    = $('#video-lightbox');
    const vlIframe = $('#vl-iframe');

    window.openVideo = (id) => {
        vlIframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
        vlBox.classList.add('open');
        body.classList.add('modal-open');
    };
    window.closeVideo = () => {
        vlBox.classList.remove('open');
        body.classList.remove('modal-open');
        setTimeout(() => { vlIframe.src = ''; }, 300);
    };
    vlBox.addEventListener('click', (e) => { if (e.target === vlBox) closeVideo(); });

    /* ── VIDEO NÁHĽAD → prehrávač až po kliknutí ── */
    $$('.yt-facade').forEach(btn => btn.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
        iframe.title = btn.dataset.title || 'Video';
        iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;';
        btn.replaceWith(iframe);
    }));

    $$('.yt-facade').forEach(btn => btn.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
        iframe.title = btn.dataset.title || 'Video';
        iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;';
        btn.replaceWith(iframe);
    }));

    /* ── RÝCHLY KONTAKT a OCHRANA SÚKROMIA ── */
    const contactModal = $('#contact-modal');
    window.openContactModal = () => { lastFocus = document.activeElement; contactModal.classList.add('open'); body.classList.add('modal-open'); setTimeout(() => contactModal.querySelector('a')?.focus(), 60); };
    window.closeContactModal = () => { contactModal.classList.remove('open'); body.classList.remove('modal-open'); lastFocus?.focus?.({ preventScroll: true }); };
    contactModal.addEventListener('click', (e) => { if (e.target === contactModal) closeContactModal(); });
    const gdprModal = $('#gdpr-modal');
    window.openGdprModal = (anchor) => { lastFocus = document.activeElement; gdprModal.classList.add('open'); body.classList.add('modal-open'); setTimeout(() => { gdprModal.querySelector('button')?.focus(); const a = anchor && document.getElementById(anchor); if (a) a.scrollIntoView({ block: 'start' }); }, 60); };
    window.closeGdprModal = () => { gdprModal.classList.remove('open'); body.classList.remove('modal-open'); lastFocus?.focus?.({ preventScroll: true }); };
    gdprModal.addEventListener('click', (e) => { if (e.target === gdprModal) closeGdprModal(); });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        closeMenu();
        $$('.modal-backdrop.open').forEach(m => closeModal(m.id));
        if ($('#video-lightbox').classList.contains('open')) closeVideo();
        if (gdprModal.classList.contains('open')) closeGdprModal();
        if (contactModal.classList.contains('open')) closeContactModal();
    });

    /* ── KATEGÓRIE (ČO PLÁNUJETE?) ── */
    const SHOW_PLACEHOLDERS = true;   // false = chýbajúce ukážky sa namiesto placeholderu skryjú
    const CAT_MAX_CELLS     = 6;      // koľko políčok galérie je vidieť naraz (video = 2 políčka)
    const IG_URL            = 'https://www.instagram.com/donorvisuals';

    const catSection = $('#kategorie');
    const catTabs    = $$('.cat-tab[data-cat]');
    const catPanels  = $$('.cat-panel');
    const pad2 = (n) => String(n).padStart(2, '0');

    function slotHTML(kind, n) {
        const video = kind === 'video';
        const ico = video
            ? '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="13" height="12" rx="1.5"/><path d="M15.5 10.5 21.5 7v10l-6-3.5"/></svg>'
            : '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3l3.5 6M21 12h-7M16.5 19.8 13 14M7.5 19.8 11 14M3 12h7M8.5 4.2 12 10"/></svg>';
        return `<div class="cat-slot" aria-hidden="true">${ico}<span class="cat-slot-txt">${video ? 'Video' : 'Photo'} coming soon</span></div>`;
    }

    function makeSlot(tile, kind, n) {
        tile.classList.remove('is-loading', 'is-ready');
        tile.classList.add('is-slot');
        tile.removeAttribute('href');
        tile.removeAttribute('data-fancybox');
        tile.setAttribute('aria-hidden', 'true');
        tile.innerHTML = slotHTML(kind, n);
        tile.dataset.state = 'slot';
    }

    function initTile(tile, label, idx, gal) {
        if (tile.dataset.state) return;
        tile.dataset.idx = idx;
        const n       = idx + 1;
        const group   = 'cat-' + gal.dataset.group;
        const caption = tile.dataset.caption || `${label} — ${pad2(n)}`;

        /* VLASTNÉ VIDEO (mp4 na webe): data-vid="subor.mp4" data-poster="obrazok.jpg", na výšku pridajte data-vertical */
        if ('vid' in tile.dataset) {
            const src = tile.dataset.vid.trim();
            const vertical = 'vertical' in tile.dataset;
            if (!src) { makeSlot(tile, 'video', n); return; }
            if (!vertical) tile.classList.add('is-video'); else tile.classList.add('is-vvideo');
            const title = tile.dataset.title || caption;
            tile.href = src;
            tile.dataset.fancybox = group;
            tile.dataset.caption  = title;
            tile.dataset.type     = 'html5video';
            tile.setAttribute('aria-label', 'Play video: ' + title);
            tile.dataset.state = 'real';
            const poster = tile.dataset.poster || '';
            tile.innerHTML = `<img src="${poster}" alt="" decoding="async">
                              <span class="cat-play" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg></span>
                              <span class="cat-label">${title}</span>`;
            const im = tile.querySelector('img');
            im.onload = () => tile.classList.add('is-ready');
            if (im.complete) tile.classList.add('is-ready');
            // Náhľad pohybu pri prejdení myšou (iba počítač)
            if (finePointer && !reducedMotion) {
                let v = null;
                tile.addEventListener('mouseenter', () => {
                    if (!v) {
                        v = document.createElement('video');
                        v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
                        v.src = src; v.className = 'cat-vprev'; v.setAttribute('aria-hidden', 'true');
                        tile.insertBefore(v, im.nextSibling);
                    }
                    v.play().then(() => tile.classList.add('is-previewing')).catch(() => {});
                });
                tile.addEventListener('mouseleave', () => { if (v) { v.pause(); tile.classList.remove('is-previewing'); } });
            }
            return;
        }

        /* VIDEO */
        if ('yt' in tile.dataset) {
            tile.classList.add('is-video');
            const id = tile.dataset.yt.trim();
            if (!id) { makeSlot(tile, 'video', n); return; }
            const title = tile.dataset.title || caption;
            tile.href = `https://www.youtube.com/watch?v=${id}`;
            tile.dataset.fancybox = group;
            tile.dataset.caption  = title;
            tile.setAttribute('aria-label', 'Play video: ' + title);
            tile.dataset.state = 'real';
            const srcs = [`https://img.youtube.com/vi/${id}/maxresdefault.jpg`, `https://img.youtube.com/vi/${id}/hqdefault.jpg`];
            const img  = new Image();
            let tries  = 0;
            img.alt = ''; img.decoding = 'async';
            img.onload  = () => {
                if (img.naturalWidth <= 120 && tries === 0) { tries++; img.src = srcs[1]; return; }
                tile.classList.add('is-ready');
            };
            img.onerror = () => { if (tries === 0) { tries++; img.src = srcs[1]; } };
            tile.innerHTML = `<span class="cat-play" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg></span>
                              <span class="cat-label">${title}</span>`;
            tile.prepend(img);
            img.src = srcs[0];
            return;
        }

        /* FOTO */
        const src = (tile.dataset.img || '').trim();
        if (!src) { makeSlot(tile, 'foto', n); return; }
        tile.dataset.state = 'loading';
        tile.classList.add('is-loading');
        tile.innerHTML = slotHTML('foto', n);
        const img = new Image();
        img.alt = caption; img.decoding = 'async';
        img.onload = () => {
            tile.querySelector('.cat-slot')?.remove();
            tile.classList.remove('is-loading');
            tile.classList.add('is-ready');
            tile.href = src;
            tile.dataset.fancybox = group;
            tile.dataset.caption  = caption;
            tile.setAttribute('aria-label', 'Enlarge photo: ' + caption);
            tile.dataset.state = 'real';
            layoutGallery(gal);
        };
        // v mriežke stačí zmenšenina (thumbs/), plná fotka sa načíta až v galérii
        const thumb = /^(\.\.\/)?[\w-]+\.webp$/.test(src) ? src.replace(/([\w-]+\.webp)$/, 'thumbs/$1') : src;
        img.onerror = () => { if (img.src.includes('thumbs/')) { img.src = src; return; } makeSlot(tile, 'foto', n); layoutGallery(gal); };
        tile.prepend(img);
        img.src = thumb;
    }

    function layoutGallery(gal) {
        // Placeholdery idú na koniec, skutočné ukážky si držia poradie
        $$('.cat-tile', gal).filter(t => t.dataset.state === 'slot')
            .sort((a, b) => a.dataset.idx - b.dataset.idx)
            .forEach(t => gal.appendChild(t));
        gal.querySelector('.cat-more')?.remove();
        gal.querySelector('.cat-empty')?.remove();

        let cells = 0, hiddenReal = 0, shown = 0;
        const visiblePhotos = [], visibleReal = [];

        $$('.cat-tile', gal).forEach(t => {
            t.classList.remove('is-overflow', 'is-wide');
            const state = t.dataset.state;
            if (state === 'slot' && !SHOW_PLACEHOLDERS) { t.classList.add('is-overflow'); return; }
            const size = t.classList.contains('is-video') ? 2 : 1;
            if (cells + size > CAT_MAX_CELLS) {
                t.classList.add('is-overflow');
                if (state === 'real') hiddenReal++;
                return;
            }
            cells += size; shown++;
            if (size === 1) visiblePhotos.push(t);
            if (state === 'real') visibleReal.push(t);
        });

        // Nepárna fotka by nechala dieru → posledná sa roztiahne na šírku
        if (visiblePhotos.length % 2 === 1) visiblePhotos[visiblePhotos.length - 1].classList.add('is-wide');

        // "+N ďalších" na poslednej viditeľnej ukážke
        if (hiddenReal > 0 && visibleReal.length) {
            const host = [...visibleReal].reverse().find(t => !t.classList.contains('is-video')) || visibleReal[visibleReal.length - 1];
            host.insertAdjacentHTML('beforeend', `<span class="cat-more" aria-hidden="true"><b>+${hiddenReal}</b><span>more in the gallery</span></span>`);
        }

        if (!shown) {
            gal.insertAdjacentHTML('beforeend', `<div class="cat-empty">I'm preparing examples for this category right now.<br>Meanwhile, see my latest work on <a href="${IG_URL}" target="_blank" rel="noopener">Instagram</a>.</div>`);
        }
    }

    function loadPanel(panel) {
        if (!panel || panel.dataset.loaded) return;
        panel.dataset.loaded = '1';
        $$('.cat-gallery', panel).forEach(gal => {
            $$('.cat-tile', gal).forEach((t, i) => initTile(t, panel.dataset.label || '', i, gal));
            layoutGallery(gal);
        });
    }

    /* ── Výber služby: akordeón (mobil) / zoznam + obsah (desktop) ── */
    const catItems  = $$('.cat-item');
    const catSteps  = $('.cat-steps');
    const desktopMQ = window.matchMedia('(min-width: 1000px)');
    const EASE      = 'cubic-bezier(.2,.7,.1,1)';
    let catAnims = [];

    // Sprievodca 1 → 2 → 3: ide len dopredu
    function setStep(n) {
        if (!catSteps) return;
        const at = Math.max(+(catSteps.dataset.at || 1), n);
        catSteps.dataset.at = at;
        $$('li', catSteps).forEach(li => {
            const s = +li.dataset.step;
            li.classList.toggle('is-on', s <= at);
            li.classList.toggle('is-now', s === at && at < 3);
        });
    }
    window.setCatStep = setStep;

    const catSw = $('#cat-switch');
    function navH() { return (nav?.offsetHeight || 64) + 8 + (catSw && !desktopMQ.matches && document.body.classList.contains('cat-sw-on') ? catSw.offsetHeight : 0); }

    function scrollToItem(item) {
        const tab = item.querySelector('.cat-tab'), panel = item.querySelector('.cat-panel');
        let y;
        if (desktopMQ.matches) {
            const top = panel.getBoundingClientRect().top;
            if (top > navH() && top < window.innerHeight * 0.45) return;
            y = window.scrollY + top - navH() - 24;
        } else {
            y = window.scrollY + tab.getBoundingClientRect().top - navH();
        }
        window.scrollTo({ top: Math.max(0, y), behavior: reducedMotion ? 'auto' : 'smooth' });
    }

    // Plynulé otvorenie: iba posun a priehľadnosť (to zvládne každý telefón bez sekania)
    function animatePanel(panel, dir) {
        catAnims.forEach(a => a.cancel());
        catAnims = [];
        const side = desktopMQ.matches;
        [...panel.children].forEach((el, i) => {
            if (i > 3) return;                                    // ďalšie časti sú aj tak pod okrajom obrazovky
            const from = side ? `translate3d(${dir * 24}px,0,0)` : 'translate3d(0,14px,0)';
            catAnims.push(el.animate(
                [{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }],
                { duration: 480, delay: 40 + i * 60, easing: EASE, fill: 'backwards' }));
        });
        const batch = catAnims.slice();
        setTimeout(() => batch.forEach(a => { try { a.finish(); } catch (_) {} }), 1400);
    }

    // Nadpis služby „vyskočí“: zväčší sa cez transform (FLIP), nie cez veľkosť písma
    function growTitle(item, before) {
        const tab = item.querySelector('.cat-tab'), name = item.querySelector('.cat-tab-name');
        if (!name || !before) return;
        const tr = tab.getBoundingClientRect(), nr = name.getBoundingClientRect();
        if (!nr.height) return;
        const s = before.h / nr.height;
        if (Math.abs(1 - s) < 0.05) return;
        catAnims.push(name.animate(
            [{ transform: `translate3d(${before.x - (nr.left - tr.left)}px, ${before.y - (nr.top - tr.top)}px, 0) scale(${s})` }, { transform: 'none' }],
            { duration: 520, easing: 'cubic-bezier(.2,.9,.2,1.05)' }));
    }

    function setOpen(item) {
        catItems.forEach(i => {
            const on = i === item;
            i.classList.toggle('open', on);
            i.querySelector('.cat-tab').setAttribute('aria-expanded', on ? 'true' : 'false');
        });
        syncSwitch(item);
    }
    // Prepínač služieb: na mobile a tablete stále po ruke, kým je otvorená niektorá služba
    let swInView = false;
    function syncSwitch(item) {
        if (!catSw) return;
        $$('.cat-sw', catSw).forEach(b => { const on = !!item && b.dataset.go === item.dataset.cat; b.setAttribute('aria-selected', String(on)); if (on) { const inn = b.parentElement; inn.scrollTo({ left: b.offsetLeft - (inn.clientWidth - b.offsetWidth) / 2, behavior: reducedMotion ? 'auto' : 'smooth' }); } });
        const show = !!item && swInView;
        if (nav) catSw.style.top = nav.offsetHeight + 'px';
        catSw.hidden = false;
        document.body.classList.toggle('cat-sw-on', show);
    }
    if (catSw) {
        $('.cat-switch-in', catSw).innerHTML = catItems.map(i => `<button type="button" role="tab" class="cat-sw" data-go="${i.dataset.cat}" aria-selected="false">${i.querySelector('.cat-tab-name').textContent}</button>`).join('')
            + `<a class="cat-sw cat-sw-all" href="#services">Prices</a>`;
        $$('.cat-sw[data-go]', catSw).forEach(b => b.addEventListener('click', () => openCat(b.dataset.go, { scroll: true })));
        $('.cat-sw-all', catSw).addEventListener('click', (e) => { e.preventDefault(); scrollToSection('services'); });
        const lst = $('.cat-list');
        if (lst && 'IntersectionObserver' in window) new IntersectionObserver((en) => { swInView = en[0].isIntersecting; syncSwitch(catItems.find(i => i.classList.contains('open'))); }, { rootMargin: '-30% 0px -40% 0px' }).observe(lst);
    }

    function openCat(key, opts = {}) {
        const item = catItems.find(i => i.dataset.cat === key);
        if (!item) return;
        const prev = catItems.find(i => i.classList.contains('open'));
        if (prev === item) {
            if (opts.toggle && !desktopMQ.matches) {          // na mobile druhé ťuknutie zatvorí
                setOpen(null);
                history.replaceState(null, '', location.pathname + location.search);
                const tab = item.querySelector('.cat-tab');
                if (tab.getBoundingClientRect().top < navH()) window.scrollTo({ top: window.scrollY + tab.getBoundingClientRect().top - navH() - 8 });
                return;
            }
            if (opts.scroll) scrollToItem(item);
            return;
        }
        const dir = prev && catItems.indexOf(item) < catItems.indexOf(prev) ? -1 : 1;
        const tabEl = item.querySelector('.cat-tab'), nameEl = item.querySelector('.cat-tab-name');
        const tb = tabEl.getBoundingClientRect(), nb = nameEl.getBoundingClientRect();
        const nameBefore = { x: nb.left - tb.left, y: nb.top - tb.top, h: nb.height };
        // Na počítači: prechod cez View Transitions (nový panel sa otvorí ako clona)
        if (document.startViewTransition && desktopMQ.matches && !reducedMotion && !opts.instant && prev) {
            const panelVT = item.querySelector('.cat-panel');
            document.documentElement.classList.add('vt-cat');
            const vt = document.startViewTransition(() => { setOpen(item); loadPanel(panelVT); });
            vt.finished.finally(() => document.documentElement.classList.remove('vt-cat'));
            setStep(2);
            if (opts.hash !== false) history.replaceState(null, '', '#' + key);
            if (opts.scroll) scrollToItem(item);
            return;
        }
        setOpen(item);
        if (!reducedMotion && !opts.instant) {
            const tab = item.querySelector('.cat-tab');
            tab.classList.remove('snap'); void tab.offsetWidth; tab.classList.add('snap');
            setTimeout(() => tab.classList.remove('snap'), 700);
        }
        const panel = item.querySelector('.cat-panel');
        loadPanel(panel);
        setStep(2);
        if (opts.hash !== false) history.replaceState(null, '', '#' + key);
        if (!reducedMotion && !opts.instant) { animatePanel(panel, dir); if (!desktopMQ.matches) growTitle(item, nameBefore); }
        if (opts.scroll) scrollToItem(item);
    }
    window.openCat = openCat;

    // Desktop má vždy jednu službu otvorenú
    function ensureDesktopOpen() {
        if (desktopMQ.matches && !catItems.some(i => i.classList.contains('open')) && catItems[0]) openCat(catItems[0].dataset.cat, { hash: false, instant: true });
    }

    if (catSection) {
        catItems.forEach(item => {
            const tab = item.querySelector('.cat-tab');
            tab.addEventListener('click', () => openCat(item.dataset.cat, { scroll: true, toggle: true }));
            tab.addEventListener('pointerenter', () => loadPanel(item.querySelector('.cat-panel')), { passive: true });
        });
        $$('.cat-pg[data-go]', catSection).forEach(b => b.addEventListener('click', () => openCat(b.dataset.go, { scroll: true })));
        // Šípky hore/dole medzi službami
        catSection.addEventListener('keydown', (e) => {
            const tab = e.target.closest('.cat-tab');
            if (!tab || !['ArrowDown', 'ArrowUp'].includes(e.key)) return;
            const tabs = catItems.map(i => i.querySelector('.cat-tab'));
            const next = tabs[(tabs.indexOf(tab) + (e.key === 'ArrowDown' ? 1 : -1) + tabs.length) % tabs.length];
            e.preventDefault(); next.focus();
        });

        ensureDesktopOpen();
        desktopMQ.addEventListener?.('change', ensureDesktopOpen);

        // Galériu otvorenej služby načítaj, až keď sa k sekcii priblíži scroll
        const catLoadObserver = new IntersectionObserver((entries) => {
            if (entries.some(en => en.isIntersecting)) {
                loadPanel($('.cat-item.open .cat-panel'));
                catLoadObserver.disconnect();
            }
        }, { rootMargin: '600px 0px' });
        catLoadObserver.observe(catSection);

        // Bez Fancyboxu otvor video aspoň vo vlastnom prehrávači
        catSection.addEventListener('click', (e) => {
            const tile = e.target.closest('.cat-tile');
            if (!tile) return;
            if (tile.dataset.state !== 'real') { e.preventDefault(); return; }
            if (!window.Fancybox && tile.classList.contains('is-video')) {
                e.preventDefault();
                openVideo(tile.dataset.yt.trim());
            }
        });

        // Svetlo a jemný náklon fotky pod kurzorom
        if (finePointer && !reducedMotion) {
            catSection.addEventListener('pointermove', (e) => {
                const tile = e.target.closest('.cat-tile');
                if (!tile) return;
                const r = tile.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
                tile.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
                tile.style.setProperty('--my', (y * 100).toFixed(1) + '%');
                tile.style.setProperty('--ry', ((x - .5) * 7).toFixed(2) + 'deg');
                tile.style.setProperty('--rx', ((.5 - y) * 7).toFixed(2) + 'deg');
            }, { passive: true });
            catSection.addEventListener('pointerout', (e) => {
                const tile = e.target.closest('.cat-tile');
                if (tile && !tile.contains(e.relatedTarget)) { tile.style.setProperty('--rx', '0deg'); tile.style.setProperty('--ry', '0deg'); }
            });
        }

        // Priamy odkaz na službu: 17studios.eu/#svadby, #eventy, #hudba, #portrety, #art
        const openFromHash = (smooth) => {
            const key = location.hash.slice(1);
            const item = catItems.find(i => i.dataset.cat === key);
            if (!item) return false;
            openCat(key, { hash: false, instant: true });
            catSection.classList.add('visible');
            setTimeout(() => scrollToItem(item), smooth ? 60 : 0);
            return true;
        };
        if (catItems.some(i => i.dataset.cat === location.hash.slice(1))) setTimeout(() => openFromHash(true), 120);
        window.addEventListener('hashchange', () => openFromHash(true));
    }

    /* ── Filmové pásy: posúvajú sa so scrollom, počítajú sa len tie, ktoré sú práve vidieť ── */
    if (!reducedMotion && 'IntersectionObserver' in window) {
        const vis = new Set();
        const runs = $$('.film').map((f, k) => ({ f, r: $('.film-run', f), d: f.classList.contains('film-rev') ? 1 : -1 }));
        const io = new IntersectionObserver((en) => en.forEach(e => { const o = runs.find(x => x.f === e.target); if (!o) return; e.isIntersecting ? vis.add(o) : vis.delete(o); }), { rootMargin: '80px 0px' });
        runs.forEach(o => io.observe(o.f));
        let ft = false;
        const draw = () => { ft = false; const y = window.scrollY * 0.4; vis.forEach(o => { const x = ((o.d * y) % 30 + 30) % 30; o.r.style.transform = `translate3d(${(x - 30).toFixed(2)}px,0,0)`; }); };
        window.addEventListener('scroll', () => { if (!ft) { ft = true; requestAnimationFrame(draw); } }, { passive: true });
        draw();
    }

    /* ── Klapka pri kontakte: klapne, keď sa sekcia objaví ── */
    const slate = $('.slate');
    if (slate) {
        if (reducedMotion) slate.classList.add('clap');
        else {
            const so = new IntersectionObserver((en) => {
                if (!en.some(e => e.isIntersecting)) return;
                so.disconnect();
                setTimeout(() => slate.classList.add('clap'), 350);
            }, { threshold: 0.6 });
            so.observe(slate);
        }
    }

    /* ── Fotky sa „vyvolajú“, keď sa objavia ── */
    if (!reducedMotion) {
        const dev = new IntersectionObserver((entries) => {
            entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('developed'); dev.unobserve(en.target); } });
        }, { threshold: 0.4 });
        $$('.cat-review-img, .service-card').forEach(el => dev.observe(el));
    }

    /* ── Blesk fotoaparátu ── */
    window.cameraFlash = () => {
        const fl = $('#flash');
        if (!fl || reducedMotion) return;
        fl.animate([{ opacity: 0 }, { opacity: .85, offset: .12 }, { opacity: 0 }], { duration: 520, easing: 'ease-out' });
    };

    /* ── Postup: kroky sa rozsvecujú pri scrollovaní ── */
    const proc = $('.process');
    if (proc) {
        const steps = $$('li', proc);
        let pt = false;
        const upd = () => {
            const lit = steps.filter(li => li.classList.contains('lit')).length;
            proc.style.setProperty('--pp', (lit / steps.length).toFixed(3));
        };
        if ('IntersectionObserver' in window) {
            // krok sa rozsvieti, keď jeho horný okraj prejde 78 % výšky okna (bez merania pri každom scrolle)
            const procIO = new IntersectionObserver((en) => {
                en.forEach(e => e.target.classList.toggle('lit', e.isIntersecting || e.boundingClientRect.top < 0));
                upd();
            }, { rootMargin: '0px 0px -22% 0px' });
            steps.forEach(li => procIO.observe(li));
        } else steps.forEach(li => li.classList.add('lit'));
        upd();
    }

    /* ── Balíky: preškrtnutie a napočítanie úspory ── */
    const bGrid = $('.bundles-grid');
    if (bGrid && !reducedMotion) {
        $$('.bundle-card .bundle-save', bGrid).forEach(el => {
            el.innerHTML = el.innerHTML.replace(/you save €(\d+)/, 'you save <span class="cnt" data-to="$1">€0</span>');
        });
        bGrid.classList.add('pre');
        const bObs = new IntersectionObserver((entries) => {
            if (!entries.some(en => en.isIntersecting)) return;
            bObs.disconnect();
            bGrid.classList.remove('pre');
            $$('.cnt', bGrid).forEach(c => {
                const to = +c.dataset.to, t0 = performance.now();
                const step = (now) => {
                    const k = Math.min(1, (now - t0) / 1100), e = 1 - Math.pow(1 - k, 3);
                    c.textContent = '€' + Math.round(to * e);
                    if (k < 1) requestAnimationFrame(step);
                };
                setTimeout(() => requestAnimationFrame(step), 350);
                setTimeout(() => { c.textContent = '€' + to; }, 2200);   // poistka
            });
        }, { threshold: 0.35 });
        bObs.observe(bGrid);
        if (finePointer) bGrid.addEventListener('pointermove', (e) => {
            const card = e.target.closest('.bundle-card'); if (!card) return;
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
            card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
        }, { passive: true });
    }

    /* ── CONTACT FORM — AJAX ── */
    const contactForm = $('#contact-form');
    const formSuccess = $('#form-success');
    const submitBtn   = $('#submit-btn');

    const formError = $('#form-error');
    const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const isPhone   = (v) => /^\+?[\d\s\-\/()]{9,}$/.test(v) && v.replace(/\D/g, '').length >= 9;

    function showFormError(msg, field) {
        formError.innerHTML = msg;
        formError.classList.add('visible');
        if (field) { field.classList.add('is-invalid'); field.focus(); }
    }
    if (contactForm) {
        contactForm.addEventListener('input', (e) => {
            e.target.classList.remove('is-invalid');
            formError.classList.remove('visible');
        });
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameF = $('#f-name'), contactF = $('#f-contact'), msgF = $('#f-msg');
            const contact = contactF.value.trim();
            if (!nameF.value.trim())  return showFormError('Please tell me your name.', nameF);
            if (!contact)             return showFormError('I need an e-mail or phone number to reply.', contactF);
            if (!EMAIL_RE.test(contact) && !isPhone(contact))
                                      return showFormError('Please check your e-mail or phone number.', contactF);
            if (!msgF.value.trim())   return showFormError('Please write a few words about what you are planning.', msgF);

            submitBtn.textContent = 'Sending…';
            submitBtn.disabled = true;
            try {
                const data = new FormData(contactForm);
                if (EMAIL_RE.test(contact)) data.append('_replyto', contact);
                const res = await fetch('https://formsubmit.co/ajax/matejkakis@gmail.com', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                    body: data
                });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                contactForm.style.display = 'none';
                formSuccess.classList.add('visible');
                document.dispatchEvent(new CustomEvent('contact-sent'));
                window.playSfx?.('clap');
                window.track('Dopyt odoslaný', { sluzba: $('#f-service')?.value || '' });
                window.cameraFlash?.();
                const sl = $('.slate'); if (sl) { sl.classList.remove('clap'); void sl.offsetWidth; setTimeout(() => sl.classList.add('clap'), 60); }
            } catch (_) {
                submitBtn.textContent = 'Send message';
                submitBtn.disabled = false;
                showFormError('The message could not be sent. Please write to <a href="mailto:matejkakis@gmail.com">matejkakis@gmail.com</a> or call <a href="tel:+421950592956">+421 950 592 956</a>.');
            }
        });
    }

    /* ── CAROUSEL — šípky ── */
    const bundlesGrid = $('.bundles-grid');
    const arrowLeft   = $('#arrow-left');
    const arrowRight  = $('#arrow-right');

    function getCardWidth() {
        const card = bundlesGrid ? bundlesGrid.querySelector('.bundle-card') : null;
        return card ? card.offsetWidth + 14 : 300;
    }
    function updateCarouselArrows() {
        if (!bundlesGrid || !arrowLeft || !arrowRight) return;
        const atStart = bundlesGrid.scrollLeft <= 10;
        const atEnd   = bundlesGrid.scrollLeft >= bundlesGrid.scrollWidth - bundlesGrid.clientWidth - 10;
        arrowLeft.classList.toggle('disabled', atStart);
        arrowRight.classList.toggle('disabled', atEnd);
    }
    if (bundlesGrid) {
        bundlesGrid.addEventListener('scroll', updateCarouselArrows, { passive: true });
        setTimeout(updateCarouselArrows, 200);
        if (arrowLeft) arrowLeft.addEventListener('click', () => bundlesGrid.scrollBy({ left: -getCardWidth(), behavior: 'smooth' }));
        if (arrowRight) arrowRight.addEventListener('click', () => bundlesGrid.scrollBy({ left: getCardWidth(), behavior: 'smooth' }));
        let touchStartX = 0, touchStartY = 0, lockAxis = null;
        bundlesGrid.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            lockAxis = null;
        }, { passive: true });
        bundlesGrid.addEventListener('touchmove', e => {
            const dx = Math.abs(e.touches[0].clientX - touchStartX);
            const dy = Math.abs(e.touches[0].clientY - touchStartY);
            if (!lockAxis && (dx > 8 || dy > 8)) lockAxis = dx > dy ? 'x' : 'y';
            if (lockAxis === 'x') e.preventDefault();
        }, { passive: false });
    }

    /* ── OVERENIE VOĽNÉHO TERMÍNU (svadby) ── */
    const dcForm = $('#date-check');
    if (dcForm) {
        const dcDate = $('#dc-date'), dcErr = $('#dc-err');
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dcDate.min = iso(today);
        dcForm.addEventListener('submit', (e) => {
            e.preventDefault();
            dcErr.textContent = '';
            if (!dcDate.value) { dcErr.textContent = 'Please choose your wedding date.'; dcDate.focus(); return; }
            const [y, m, d] = dcDate.value.split('-').map(Number);
            const picked = new Date(y, m - 1, d);
            if (picked < today) { dcErr.textContent = 'That date has passed. Please choose a future date.'; dcDate.focus(); return; }
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const label = `${d}. ${m}. ${y} (${days[picked.getDay()]})`;
            const msg = `Hello,\n\nwe are planning our wedding on ${label}. Is this date available?\n\nVenue:\nWe are interested in: photo / video / both`;
            window.selectService('Svadba', `Date check ${d}. ${m}. ${y}`, msg);
        });
    }

    /* ── SEZÓNNA PONUKA: po dátume v data-until sa karta skryje ── */
    (() => {
        const now = new Date();
        const cards = $$('[data-until]');
        cards.forEach(c => {
            const [y, m, d] = c.dataset.until.split('-').map(Number);
            if (now > new Date(y, m - 1, d, 23, 59, 59)) c.hidden = true;
        });
        const sec = $('#ponuka');
        if (sec && cards.length && cards.every(c => c.hidden)) sec.hidden = true;
    })();

    /* ── SVADOBNÝ CHECKLIST (e-mail → stiahnutie) ── */
    const lmForm = $('#lm-form');
    if (lmForm) {
        const lmEmail = $('#lm-email'), lmOk = $('#lm-ok'), lmErr = $('#lm-err'), lmBtn = $('#lm-btn'), lmDone = $('#lm-done');
        const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        lmForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            lmErr.textContent = '';
            const em = lmEmail.value.trim();
            if (!EMAIL_OK.test(em)) { lmErr.textContent = 'Please check your e-mail address.'; lmEmail.focus(); return; }
            if (!lmOk.checked) { lmErr.textContent = 'Please tick the consent box so I can send you tips.'; lmOk.focus(); return; }
            lmBtn.disabled = true; lmBtn.textContent = 'One moment…';
            window.track('Checklist stiahnutý');
            const done = () => { lmForm.hidden = true; lmDone.hidden = false; lmDone.querySelector('a')?.focus(); };
            try {
                const data = new FormData(lmForm);
                data.append('_replyto', em);
                data.append('zdroj', 'Svadobný checklist (17studios.eu/en)');
                const res = await fetch('https://formsubmit.co/ajax/matejkakis@gmail.com', { method: 'POST', headers: { 'Accept': 'application/json' }, body: data });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                done();
            } catch (_) {
                // Checklist dostane aj tak, len e-mail sa neuložil.
                done();
            }
        });
    }

    /* ── PLÁVAJÚCE TLAČIDLO „NAPÍŠTE MI“ ── */
    const fab = $('#chat-fab'), fabBtn = $('#chat-fab-btn');
    if (fab && fabBtn) {
        const setFab = (open) => { fab.classList.toggle('open', open); fabBtn.setAttribute('aria-expanded', String(open)); };
        fabBtn.addEventListener('click', (e) => { e.stopPropagation(); setFab(!fab.classList.contains('open')); });
        document.addEventListener('click', (e) => { if (!fab.contains(e.target)) setFab(false); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setFab(false); });
        // pri formulári je tlačidlo zbytočné, schová sa
        const contactSec = $('#contact');
        if (contactSec && 'IntersectionObserver' in window) {
            new IntersectionObserver(([en]) => { fab.style.display = en.isIntersecting ? 'none' : ''; if (en.isIntersecting) setFab(false); }, { threshold: .25 }).observe(contactSec);
        }
    }

    /* ── SLNKO: západ, zlatá a modrá hodinka pre Prievidzu ── */
    const SUN_LAT = 48.7745, SUN_LON = 18.6243;
    const rad = Math.PI / 180;
    // Čas (UTC, ms), keď má slnko večer/ráno danú výšku nad obzorom (stupne). null = nenastane.
    function sunTimeAt(y, m, d, alt, evening) {
        const noonUTC = Date.UTC(y, m - 1, d, 12);
        const n = (noonUTC - Date.UTC(2000, 0, 1, 12)) / 864e5;
        const L = (280.46 + 0.9856474 * n) % 360;
        const g = ((357.528 + 0.9856003 * n) % 360) * rad;
        const lam = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
        const eps = (23.439 - 0.0000004 * n) * rad;
        const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
        const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) / rad;
        let eot = (L - ((ra + 360) % 360)); eot = ((eot + 540) % 360) - 180; // stupne
        const solarNoonMin = 720 - 4 * SUN_LON - 4 * eot;          // minúty UTC
        const cosH = (Math.sin(alt * rad) - Math.sin(SUN_LAT * rad) * Math.sin(dec)) / (Math.cos(SUN_LAT * rad) * Math.cos(dec));
        if (cosH < -1 || cosH > 1) return null;
        const H = Math.acos(cosH) / rad;
        const min = solarNoonMin + (evening ? 4 * H : -4 * H);
        return Date.UTC(y, m - 1, d) + min * 6e4;
    }
    const fmtT = t => t == null ? '–' : new Intl.DateTimeFormat('sk-SK', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bratislava' }).format(new Date(t));
    window.sunInfo = (iso) => {
        const [y, m, d] = iso.split('-').map(Number);
        const gold0 = sunTimeAt(y, m, d, 6, true), sunset = sunTimeAt(y, m, d, -0.833, true);
        const blue0 = sunTimeAt(y, m, d, -4, true), blue1 = sunTimeAt(y, m, d, -6, true);
        return { gold: `${fmtT(gold0)} – ${fmtT(sunset)}`, sunset: fmtT(sunset), blue: `${fmtT(blue0)} – ${fmtT(blue1)}`, portraitStart: fmtT(gold0 - 0), raw: { gold0, sunset } };
    };
    const lightDate = $('#light-date'), lightOut = $('#light-out');
    if (lightDate && lightOut) {
        const t = new Date(); const pad = v => String(v).padStart(2, '0');
        const show = () => {
            if (!lightDate.value) return;
            const s = window.sunInfo(lightDate.value);
            lightOut.querySelector('[data-k="gold"]').textContent = s.gold;
            lightOut.querySelector('[data-k="sunset"]').textContent = s.sunset;
            lightOut.querySelector('[data-k="blue"]').textContent = s.blue;
            lightOut.querySelector('[data-k="tip"]').textContent = `Tip: portréty vo dvojici si naplánujte okolo ${s.portraitStart}. Stačí 25 minút a máte najkrajšie svetlo dňa.`;
        };
        // predvolene najbližšia júnová sobota budúceho roka
        let def = new Date(t.getFullYear() + (t.getMonth() > 5 ? 1 : 0), 5, 14);
        while (def.getDay() !== 6) def.setDate(def.getDate() + 1);
        lightDate.value = `${def.getFullYear()}-${pad(def.getMonth() + 1)}-${pad(def.getDate())}`;
        lightDate.addEventListener('change', show); lightDate.addEventListener('input', show);
        show();
    }
    const dcDateEl = $('#dc-date'), dcLight = $('#dc-light');
    if (dcDateEl && dcLight) {
        dcDateEl.addEventListener('change', () => {
            if (!dcDateEl.value) { dcLight.textContent = ''; return; }
            const s = window.sunInfo(dcDateEl.value);
            dcLight.innerHTML = `V ten deň zapadá slnko o <b>${s.sunset}</b>. Najkrajšie svetlo na portréty: <b>${s.gold}</b>.`;
        });
    }

    /* ── AKO VZNIKOL KLIP (záložky) ── */
    const bts = $('#bts');
    if (bts) {
        const tabs = $$('[role="tab"]', bts);
        const sel = (t, focus) => {
            const idx = tabs.indexOf(t);
            bts.style.setProperty('--step', idx);
            tabs.forEach((x, k) => { const on = x === t; x.classList.toggle('is-done', k < idx); x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
            if (focus) t.focus();
        };
        tabs.forEach((t, i) => {
            t.addEventListener('click', () => sel(t));
            t.addEventListener('keydown', e => {
                if (e.key === 'ArrowRight') sel(tabs[(i + 1) % tabs.length], true);
                if (e.key === 'ArrowLeft') sel(tabs[(i - 1 + tabs.length) % tabs.length], true);
            });
        });
    }

    /* ── ZA KAMEROU: deň / noc ── */
    const me = $('#me');
    if (me) {
        $$('[data-me]', me).forEach(b => b.addEventListener('click', () => {
            const night = b.dataset.me === 'night';
            me.classList.toggle('is-night', night);
            $$('[data-me]', me).forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
        }));
    }

    /* ── PORTRÉTY: prepínač Portréty / Fantasy v jednej službe ── */
    function setSub(panel, key) {
        $$('.cat-sub-b', panel).forEach(b => { const on = b.dataset.sub === key; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); });
        $$('[data-sub]:not(.cat-sub-b)', panel).forEach(el => {
            const on = el.dataset.sub === key; el.hidden = !on;
            if (on && el.classList.contains('cat-gallery')) { el.classList.remove('sub-in'); void el.offsetWidth; el.classList.add('sub-in'); }
        });
    }
    $$('.cat-sub').forEach(bar => bar.addEventListener('click', e => {
        const b = e.target.closest('.cat-sub-b'); if (!b) return;
        setSub(bar.closest('.cat-panel'), b.dataset.sub);
    }));

    /* ── RECENZIA → otvoriť konkrétnu ukážku ── */
    window.openWork = (panelId, src) => {
        const panel = document.getElementById(panelId);
        const tile = panel && $$('.cat-tile', panel).find(t => (t.dataset.img || '') === src || (t.dataset.yt || '') === src);
        const subGal = tile && tile.closest('.cat-gallery[data-sub]');
        if (subGal && subGal.hidden) setSub(panel, subGal.dataset.sub);
        if (tile && tile.dataset.state === 'real') { tile.click(); return; }
        if (window.Fancybox && src) window.Fancybox.show([{ src, type: 'image' }]);
    };

    /* ── KALKULAČKA ZOSTAVY ── */
    const calc = $('#calc');
    if (calc) {
        const ITEMS = {
            film:   { n: 'Wedding film', p: 600, cat: 'Svadba' },
            svfoto: { n: 'Wedding photography, full day', p: 550, cat: 'Svadba' },
            after:  { n: 'Event aftermovie', p: 400, cat: 'Event / koncert' },
            rep4:   { n: 'Photo coverage (4 h)', p: 350, cat: 'Event / koncert' },
            rep8:   { n: 'Photo coverage, full day (8 h)', p: 550, cat: 'Event / koncert' },
            reelsE: { n: 'Event Reels', p: 150, cat: 'Event / koncert' },
            klip:   { n: 'Music video', p: 500, cat: 'Hudba / klip' },
            promo:  { n: 'Promo shoot (1 h)', p: 150, cat: 'Hudba / klip' },
            cover:  { n: 'Obal skladby', p: 150, cat: 'Hudba / klip' },
            teaser: { n: 'Teasers for Reels and TikTok', p: 150, cat: 'Hudba / klip' },
            portret:{ n: 'Portrait session (1 h)', p: 150, cat: 'Portrét' },
            edit:   { n: 'Editorial', p: 500, cat: 'Portrét' },
            plagat: { n: 'Event poster', p: 150, cat: 'Digital Art' },
            uprava: { n: 'Creative photo editing', p: 250, cat: 'Digital Art' },
            web1:   { n: 'One-page website', p: 400, cat: 'Web' },
            web2:   { n: 'Multi-page website', p: 800, cat: 'Web' },
        };
        const BUNDLES = [
            { name: 'Eternal Frame', ids: ['film', 'svfoto'], save: 160 },
            { name: 'Pulse Record', ids: ['after', 'rep4'], save: 110 },
            { name: 'Release Pack', ids: ['klip', 'promo', 'cover', 'teaser'], save: 160 },
        ];
        const COMBO = 0.10; // zvýhodnenie pri 2+ službách mimo balíka
        const list = $('#calc-list'), total = $('#calc-total'), saveEl = $('#calc-save'), send = $('#calc-send');
        const eur = v => '€' + Math.round(v).toLocaleString('sk-SK');
        const peek = $('#calc-peek'), peekV = $('#calc-peek-v'), peekN = $('#calc-peek-n'), sumBox = $('.calc-sum', calc);
        let calcVisible = false, sumVisible = false;
        const peekSync = () => { if (peek) peek.classList.toggle('on', calcVisible && !sumVisible && $$('input:checked', calc).length > 0); };
        if (peek && 'IntersectionObserver' in window) {
            new IntersectionObserver(([en]) => { calcVisible = en.isIntersecting; peekSync(); }, { threshold: 0 }).observe(calc);
            new IntersectionObserver(([en]) => { sumVisible = en.isIntersecting; peekSync(); }, { threshold: 0.35 }).observe(sumBox);
            peek.addEventListener('click', () => sumBox.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' }));
        }
        let state = { ids: [], sum: 0, final: 0, notes: [] };
        let prevIds = [];
        const update = () => {
            const ids = $$('input:checked', calc).map(i => i.value);
            const sum = ids.reduce((a, id) => a + ITEMS[id].p, 0);
            let rest = [...ids], save = 0; const notes = [];
            BUNDLES.forEach(b => { if (b.ids.every(id => rest.includes(id))) { save += b.save; rest = rest.filter(id => !b.ids.includes(id)); notes.push(`${b.name} package`); } });
            if (ids.length >= 2 && rest.length) {
                const r = rest.reduce((a, id) => a + ITEMS[id].p, 0) * COMBO;
                if (r > 0) { save += r; notes.push(`combined services −10\u00a0%`); }
            }
            const final = sum - save;
            list.innerHTML = ids.length ? ids.map(id => `<li${prevIds.includes(id) ? '' : ' class="new"'}><span>${ITEMS[id].n}</span><span>${eur(ITEMS[id].p)}</span></li>`).join('') : '<li class="calc-empty">Nothing yet. Tick the services you need.</li>';
            setOdo(total, ids.length ? 'od ' + eur(final) : '€0');
            saveEl.classList.toggle('on', !!save);
            if (save) saveEl.firstElementChild.innerHTML = `<span class="sv-n">Discount: ${notes.join(' + ')}</span><span class="sv-v">You save ${eur(save)}</span>`;
            send.disabled = !ids.length;
            if (peekV) peekV.textContent = ids.length ? 'od ' + eur(final) : '€0';
            if (peekN) peekN.textContent = `${ids.length} ${ids.length === 1 ? 'service' : 'services'} selected`;
            if (peek && ids.length > prevIds.length) { peek.classList.remove('bump'); void peek.offsetWidth; peek.classList.add('bump'); }
            peekSync();
            prevIds = ids;
            state = { ids, sum, final, notes, save };
            try { localStorage.setItem('calc-ids', JSON.stringify(ids)); } catch (_) {}
        };
        // Číselník: súčet sa „pretočí“ ako počítadlo
        function setOdo(el, str) {
            const chars = [...str];
            const sig = chars.map(c => /\d/.test(c) ? 'd' : c).join('');
            if (el.dataset.sig !== sig) {
                el.innerHTML = chars.map(c => /\d/.test(c)
                    ? '<span class="odo" aria-hidden="true"><span>' + [...'0123456789'].map(d => '<b>' + d + '</b>').join('') + '</span></span>'
                    : '<span class="odo-c" aria-hidden="true">' + (c === ' ' ? '&nbsp;' : c) + '</span>').join('');
                el.dataset.sig = sig;
                void el.offsetWidth;
            }
            const cols = el.querySelectorAll('.odo > span');
            let k = 0;
            chars.forEach(c => { if (/\d/.test(c)) cols[k++].style.transform = `translateY(-${+c}em)`; });
            el.setAttribute('aria-label', str);
        }
        calc.addEventListener('change', () => { update(); window.playSfx?.('tick'); });
        // Rozpracovaná zostava z minulej návštevy
        try {
            const saved = JSON.parse(localStorage.getItem('calc-ids') || '[]');
            if (Array.isArray(saved) && saved.length) { $$('input', calc).forEach(i => { if (saved.includes(i.value)) i.checked = true; }); update(); }
        } catch (_) {}
        send.addEventListener('click', () => {
            if (!state.ids.length) return;
            sumBox?.classList.remove('tear'); void sumBox?.offsetWidth; sumBox?.classList.add('tear');   // účtenka sa „odtrhne“
            const cats = [...new Set(state.ids.map(id => ITEMS[id].cat))];
            const lines = state.ids.map(id => `• ${ITEMS[id].n} (${eur(ITEMS[id].p)})`).join('\n');
            const msg = `Hello,\n\nI'm interested in this selection:\n${lines}\n\nEstimate from ${eur(state.final)}${state.save ? ` (including a ${eur(state.save)} discount)` : ''}.\nCould you send me a quote, please?\n\nDate:\nVenue:`;
            window.track('Kalkulačka odoslaná', { suma: state.final });
            window.selectService(cats.length === 1 ? cats[0] : 'Neurčené', 'Custom selection', msg);
        });
        update();
    }

    /* =====================================================
       WOW EFEKTY
    ===================================================== */
    const root = document.documentElement;

    /* 1 + 3 · Odpočítavanie (prvá návšteva) a doostrenie nadpisu */
    const fsNeedle = $('.fs-needle');
    const startFocus = () => {
        if (!root.classList.contains('focus-pre')) return;
        fsNeedle?.classList.add('pull');
        requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('focus-pre')));
        setTimeout(() => fsNeedle?.classList.remove('pull'), 1900);
    };
    const leader = $('#leader');
    if (leader && root.classList.contains('leader-on')) {
        // Prvá návšteva: clona fotoaparátu sa otvorí (asi 1 sekunda) a odhalí stránku
        let done = false;
        const finish = () => {
            if (done) return; done = true;
            try { localStorage.setItem('leader-seen', '1'); } catch (_) {}
            leader.classList.add('iris-go');
            setTimeout(() => { root.classList.remove('leader-on'); leader.classList.remove('iris-go'); startFocus(); }, 950);
        };
        setTimeout(finish, 280);
        leader.addEventListener('click', finish);
        document.addEventListener('keydown', finish, { once: true });
    } else {
        setTimeout(startFocus, 250);
    }

    /* 2 · Časový kód v úvode */
    const tc = $('#hud-tc');
    if (tc && hero) {
        const t0 = performance.now(); let last = -1;
        const p2 = v => String(v).padStart(2, '0');
        let heroVis = true;
        if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => {
            const was = heroVis; heroVis = e.isIntersecting;
            hero.classList.toggle('is-off', !heroVis);
            if (heroVis && !was) requestAnimationFrame(loop);
        }).observe(hero);
        const loop = (now) => {
            if (!heroVis) return;                                  // mimo obrazovky slučka stojí
            {
                const fr = Math.floor((now - t0) * 24 / 1000);     // 24 snímok za sekundu
                if (fr !== last) {
                    last = fr;
                    const s = Math.floor(fr / 24);
                    tc.textContent = `${p2(Math.floor(s / 3600))}:${p2(Math.floor(s / 60) % 60)}:${p2(s % 60)}:${p2(fr % 24)}`;
                }
            }
            requestAnimationFrame(loop);
        };
        if (!reducedMotion) requestAnimationFrame(loop);
    }

    /* 5 · Showreel pod svetlom: hrá len keď je úvod viditeľný */
    const reel = $('#hero-reel');
    if (reel) {
        const saveData = navigator.connection && navigator.connection.saveData;
        if (reducedMotion || saveData) { reel.removeAttribute('autoplay'); reel.pause(); if (saveData) { reel.querySelectorAll('source').forEach(s => s.remove()); reel.load(); } }
        else if ('IntersectionObserver' in window) {
            new IntersectionObserver(([en]) => { if (en.isIntersecting) reel.play().catch(() => {}); else reel.pause(); }, { threshold: 0.05 }).observe(hero);
        }
    }

    /* 6 · Balíky ako filmový pás (počítač) */
    const bsec = $('#bundles'), bgrid2 = $('.bundles-grid');
    if (bsec && bgrid2) {
        const cards = $$('.bundle-card', bgrid2), dots = $$('.reel-dots i', bsec);
        const wide = window.matchMedia('(min-width: 1000px)');
        let active = false, rt = false; const bm = { cw: 0, gap: 0, wrapW: 0 };
        const update = () => {
            rt = false;
            if (!active) return;
            const r = bsec.getBoundingClientRect(), total = r.height - window.innerHeight;
            const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
            const x = p * (cards.length - 1), i = Math.min(cards.length - 1, Math.floor(x));
            const t = Math.min(1, Math.max(0, (x - i - 0.2) / 0.6)), e = t * t * (3 - 2 * t);
            const pos = i + e;
            const cw = bm.cw, gap = bm.gap, wrapW = bm.wrapW;
            const rx = (wrapW - cw) / 2 - pos * (cw + gap);
            bgrid2.style.setProperty('--rx', rx.toFixed(1) + 'px');
            bgrid2.parentElement.style.setProperty('--perf', (rx * 0.6).toFixed(1) + 'px');
            const g = Math.round(pos);
            cards.forEach((c, k) => c.classList.toggle('in-gate', k === g));
            dots.forEach((d, k) => d.classList.toggle('on', k === g));
        };
        const setup = () => {
            const on = wide.matches && window.innerHeight >= 700 && !reducedMotion;
            if (on !== active) {
                active = on;
                bsec.classList.toggle('is-reel', on);
                bsec.style.setProperty('--reel-n', cards.length);
                if (!on) { bgrid2.style.removeProperty('--rx'); cards.forEach(c => c.classList.remove('in-gate')); }
            }
            bm.cw = cards[0].offsetWidth; bm.gap = parseFloat(getComputedStyle(bgrid2).columnGap) || 0; bm.wrapW = bgrid2.parentElement.clientWidth;
            update();
        };
        window.addEventListener('scroll', () => { if (!rt) { rt = true; requestAnimationFrame(update); } }, { passive: true });
        window.addEventListener('resize', setup, { passive: true });
        setup();
    }

    /* 7 · Magnetické tlačidlá + záblesk pri kliknutí */
    if (finePointer && !reducedMotion) {
        $$('.btn-primary, .btn-light, .nav-cta, .glow-btn, .chat-fab-btn').forEach(b => {
            if (b.closest('.mobile-cta')) return;
            b.classList.add('is-mag');
            b.addEventListener('pointermove', (e) => {
                const r = b.getBoundingClientRect();
                const dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
                b.style.transform = `translate(${(dx * 12).toFixed(1)}px, ${(dy * 10).toFixed(1)}px)`;
            });
            b.addEventListener('pointerleave', () => { b.style.transform = ''; });
        });
    }
    document.addEventListener('click', (e) => {
        const b = e.target.closest('.btn, .glow-btn');
        if (!b || b.disabled || reducedMotion) return;
        const r = b.getBoundingClientRect();
        b.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100 || 50).toFixed(0) + '%');
        b.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100 || 50).toFixed(0) + '%');
        b.classList.remove('zap'); void b.offsetWidth; b.classList.add('zap');
        setTimeout(() => b.classList.remove('zap'), 520);
    });

    /* 8 · Hviezdy v pätičke */
    const sky = $('#foot-sky');
    if (sky && sky.getContext) {
        const foot = sky.parentElement, cx = sky.getContext('2d');
        let stars = [], W = 0, H = 0, dpr = 1, running = false, meteor = null, nextMeteor = 0;
        const build = () => {
            dpr = Math.min(2, window.devicePixelRatio || 1);
            W = foot.clientWidth; H = foot.clientHeight;
            sky.width = W * dpr; sky.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const count = Math.round(W * H / 3800);
            stars = Array.from({ length: count }, () => {
                // viac hviezd vpravo, pri Kúsku Nekonečna
                const x = Math.pow(Math.random(), .7) * W;
                return { x: W - x, y: Math.random() * H, r: Math.random() < .08 ? 1.4 : Math.random() * .9 + .3, p: Math.random() * 6.28, s: .6 + Math.random() * 1.6, c: Math.random() < .15 ? '255,214,180' : (Math.random() < .2 ? '200,215,255' : '255,255,255') };
            });
        };
        const draw = (now) => {
            if (!running) return;
            cx.clearRect(0, 0, W, H);
            const t = now / 1000;
            for (const s of stars) {
                const a = reducedMotion ? .7 : .35 + .65 * (0.5 + 0.5 * Math.sin(t * s.s + s.p));
                cx.fillStyle = `rgba(${s.c},${a.toFixed(3)})`;
                cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 6.283); cx.fill();
            }
            if (!reducedMotion) {
                if (!meteor && now > nextMeteor) meteor = { x: W * (.45 + Math.random() * .5), y: H * Math.random() * .4, vx: -(380 + Math.random() * 260), vy: 160 + Math.random() * 120, life: 0, t: now };
                if (meteor) {
                    const dt = (now - meteor.t) / 1000; meteor.t = now; meteor.life += dt;
                    meteor.x += meteor.vx * dt; meteor.y += meteor.vy * dt;
                    const k = Math.min(1, meteor.life / .15) * Math.max(0, 1 - meteor.life / .9);
                    const g = cx.createLinearGradient(meteor.x, meteor.y, meteor.x - meteor.vx * .22, meteor.y - meteor.vy * .22);
                    g.addColorStop(0, `rgba(255,240,225,${(.9 * k).toFixed(3)})`); g.addColorStop(1, 'rgba(255,240,225,0)');
                    cx.strokeStyle = g; cx.lineWidth = 1.6; cx.lineCap = 'round';
                    cx.beginPath(); cx.moveTo(meteor.x, meteor.y); cx.lineTo(meteor.x - meteor.vx * .22, meteor.y - meteor.vy * .22); cx.stroke();
                    if (meteor.life > .9) { meteor = null; nextMeteor = now + 4000 + Math.random() * 5000; }
                }
            }
            requestAnimationFrame(draw);
        };
        build();
        window.addEventListener('resize', () => { build(); }, { passive: true });
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(([en]) => {
                if (en.isIntersecting && !running) { running = true; sky.classList.add('on'); nextMeteor = performance.now() + 1500; requestAnimationFrame(draw); }
                else if (!en.isIntersecting) running = false;
            }, { threshold: 0.1 }).observe(foot);
        }
    }

    /* 10 · Zvuky stránky (predvolene vypnuté) */
    const sndBtn = $('#snd');
    let soundOn = false, actx = null;
    try { soundOn = localStorage.getItem('snd') === '1'; } catch (_) {}
    const ac = () => actx || (actx = new (window.AudioContext || window.webkitAudioContext)());
    // Jemné, prirodzené zvuky: krátke tlmené cvaknutia namiesto ostrého šumu
    let master = null;
    const out = () => {
        const c = ac();
        if (!master) {
            const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500;
            const comp = c.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
            master = c.createGain(); master.gain.value = .55;
            master.connect(lp).connect(comp).connect(c.destination);
        }
        return master;
    };
    const click = (at, dur, freq, q, gain) => {            // krátky mechanický klik
        const c = ac(), len = Math.max(1, Math.ceil(c.sampleRate * dur));
        const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * .18));
        const src = c.createBufferSource(); src.buffer = buf;
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
        const g = c.createGain(); g.gain.value = gain;
        src.connect(f).connect(g).connect(out()); src.start(c.currentTime + at);
    };
    const thump = (at, f0, f1, dur, gain) => {               // tlmený „ťukot“ tela fotoaparátu
        const c = ac(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime + at;
        o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + .003); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(out()); o.start(t); o.stop(t + dur + .02);
    };
    window.playSfx = (type) => {
        if (!soundOn) return;
        try {
            const c = ac(); if (c.state === 'suspended') c.resume();
            if (type === 'shutter') {                          // zrkadlo hore, uzávierka, zrkadlo dole
                click(0, .012, 2600, .8, .32);   thump(0, 170, 90, .045, .16);
                click(.058, .009, 3400, .9, .2); thump(.058, 140, 80, .035, .09);
            }
            else if (type === 'clap') { click(0, .02, 1600, .7, .35); thump(0, 230, 120, .07, .2); }
            else if (type === 'tick') { click(0, .004, 2200, 1.2, .1); }
        } catch (_) {}
    };
    const setSnd = (on) => {
        soundOn = on;
        if (sndBtn) { sndBtn.setAttribute('aria-pressed', String(on)); sndBtn.setAttribute('aria-label', on ? 'Turn off site sounds' : 'Turn on site sounds'); }
        try { localStorage.setItem('snd', on ? '1' : '0'); } catch (_) {}
    };
    if (sndBtn) {
        setSnd(soundOn);
        sndBtn.addEventListener('click', () => { setSnd(!soundOn); window.playSfx('shutter'); });
    }
    document.addEventListener('click', (e) => {
        if (e.target.closest('.cat-tile[data-state="real"], .case-strip a, .case-art a, .cs-media a, .cat-review-link')) window.playSfx?.('shutter');
    }, true);

    /* ── HRA: ZAOSTRI A STLAČ ── */
    const cam = $('#cam');
    if (cam) {
        const GAME_CODE = 'DONOR5', GAME_GOAL = 240, ROUNDS = 3;
        const PHOTOS = ['../portrety_3.webp', '../svadby_6.webp', '../hudba_3.webp', '../eventy_1.webp', '../hp_7.webp', '../svadby_h4.webp', '../art_6.webp', '../portrety_2.webp', '../svadby_v5.webp', '../hp_14.webp', '../portrety_7.webp', '../eventy_5.webp'];
        const img = $('#cam-img'), ring = $('#cam-ring'), shutter = $('#cam-shutter'), view = $('#cam-view');
        const roundEl = $('#cam-round'), distEl = $('#cam-dist'), timeEl = $('#cam-time'), resEl = $('#cam-result'), flashEl = $('#cam-flash');
        const startEl = $('#cam-start'), endEl = $('#cam-end');
        let round = 0, target = 50, t0 = 0, scores = [], playing = false, timer = 0, deck = [];
        const fmt1 = v => v.toFixed(1).replace('.', ',');
        const distLabel = f => { if (f > 96) return '∞'; const m = 0.5 * Math.pow(2, f / 100 * 7.2); return (m < 10 ? fmt1(m) : Math.round(m)) + ' m'; };
        const render = () => {
            const f = +ring.value, err = Math.abs(f - target);
            img.style.setProperty('--blur', Math.min(22, err * 0.55).toFixed(2) + 'px');
            ring.style.setProperty('--ringx', (f * 3).toFixed(1) + 'px');
            distEl.textContent = distLabel(f);
            cam.classList.toggle('is-sharp', playing && err < 2.5);
        };
        const shuffle = arr => arr.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
        const best = () => { try { return +localStorage.getItem('game-best') || 0; } catch (_) { return 0; } };
        const nextRound = () => {
            round++;
            const src = deck[(round - 1) % deck.length];
            img.src = src;
            target = 12 + Math.random() * 76;
            let start; do { start = Math.random() * 100; } while (Math.abs(start - target) < 30);
            ring.value = start.toFixed(1);
            roundEl.textContent = `Shot ${round}/${ROUNDS}`;
            resEl.classList.remove('on');
            playing = true; ring.disabled = false; shutter.disabled = false;
            render();
            t0 = performance.now();
            clearInterval(timer);
            timer = setInterval(() => { timeEl.textContent = fmt1((performance.now() - t0) / 1000) + ' s'; }, 100);
            ring.focus({ preventScroll: true });
        };
        const start = () => {
            scores = []; round = 0;
            deck = shuffle(PHOTOS).slice(0, ROUNDS);
            deck.forEach(s => { const i = new Image(); i.src = s; });
            startEl.hidden = true; endEl.hidden = true;
            cam.classList.remove('is-over', 'is-idle');
            nextRound();
        };
        const finish = () => {
            playing = false; ring.disabled = true; shutter.disabled = true; clearInterval(timer);
            resEl.classList.remove('on');
            img.style.setProperty('--blur', '16px');            // rozmazať, aby bolo vidno výsledok
            const total = scores.reduce((x, y) => x + y, 0);
            const prev = best();
            if (total > prev) { try { localStorage.setItem('game-best', String(total)); } catch (_) {} }
            $('#cam-total').textContent = total;
            const won = total >= GAME_GOAL;
            $('#cam-end-k').textContent = won ? 'Razor sharp' : 'Result';
            $('#cam-end-t').textContent = won
                ? 'Great eye! The 5 % discount is yours.'
                : (total >= 180 ? `So close! You were ${GAME_GOAL - total} points short of the discount.` : 'Focusing takes practice. Try again.');
            cam.classList.add('is-over');
            $('#cam-code-v').textContent = GAME_CODE;
            $('#cam-code').hidden = !won;
            $('#cam-use').hidden = !won;
            $('#cam-best').textContent = `Your best score: ${Math.max(total, prev)} points`;
            endEl.hidden = false;
            window.track(won ? 'Hra vyhraná' : 'Hra dohraná', { body: total });
            if (won) window.cameraFlash?.();
        };
        const shoot = () => {
            if (!playing) return;
            playing = false; ring.disabled = true; shutter.disabled = true; clearInterval(timer);
            const secs = (performance.now() - t0) / 1000;
            const err = Math.abs(+ring.value - target);
            const acc = Math.max(0, 100 - err * 4);
            const speed = secs <= 4 ? 1 : Math.max(.6, 1 - (secs - 4) * .04);
            const pts = Math.round(acc * speed);
            scores.push(pts);
            window.playSfx?.('shutter');
            if (!reducedMotion) flashEl.animate([{ opacity: .9 }, { opacity: 0 }], { duration: 380, easing: 'ease-out' });
            ring.value = target.toFixed(1); render();           // ukážeme ostrú fotku
            cam.classList.remove('is-sharp');
            const label = acc >= 92 ? 'Sharp!' : acc >= 70 ? 'Nice' : acc >= 40 ? 'A bit off' : 'Blurry';
            resEl.innerHTML = `<b>+${pts}</b>${label} · sharpness ${Math.round(acc)} % · ${fmt1(secs)} s`;
            resEl.classList.add('on');
            setTimeout(() => { if (round < ROUNDS) nextRound(); else finish(); }, 1700);
        };
        ring.addEventListener('input', render);
        shutter.addEventListener('click', shoot);
        $('#cam-go').addEventListener('click', start);
        $('#cam-again').addEventListener('click', start);
        $('#cam-use').addEventListener('click', () => {
            window.selectService('Neurčené', 'Game discount', `Hello,\n\nI won the code ${GAME_CODE} for 5 % off in the Sharp Game. I'm interested in:\n\nDate:\nVenue:`);
        });
        view.addEventListener('wheel', (e) => {
            if (!playing) return;
            e.preventDefault();
            ring.value = Math.min(100, Math.max(0, +ring.value + (e.deltaY > 0 ? -1.2 : 1.2) * (e.shiftKey ? .3 : 1)));
            render();
        }, { passive: false });
        cam.addEventListener('keydown', (e) => {
            if (!playing) return;
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); shoot(); }
        });
        img.style.setProperty('--blur', '14px');
        cam.classList.add('is-idle');
    }

    // Kliknutia na kontakt (telefón, WhatsApp, Messenger, e-mail)
    document.addEventListener('click', (e) => {
        const l = e.target.closest('a[href]'); if (!l) return;
        const u = l.getAttribute('href');
        if (u.startsWith('tel:')) window.track('Klik: telefón');
        else if (u.includes('wa.me')) window.track('Klik: WhatsApp');
        else if (u.includes('m.me')) window.track('Klik: Messenger');
        else if (u.startsWith('mailto:')) window.track('Klik: e-mail');
    }, true);

    /* ── DARČEKOVÉ POUKÁŽKY ── */
    const vf = $('#voucher-form');
    if (vf) {
        const vcT = $('#vc-t'), vcV = $('#vc-v'), vcN = $('#vc-n'), vfFor = $('#vf-for'), vfEmail = $('#vf-email'), vfErr = $('#vf-err'), vfBtn = $('#vf-btn');
        const sync = () => {
            const [t, v] = (vf.querySelector('input[name="poukazka"]:checked')?.value || '|').split('|');
            vcT.textContent = t.replace(' (1 h)', ''); vcV.textContent = '€' + v;
            vcN.textContent = 'for: ' + (vfFor.value.trim() || 'Someone special');
        };
        vf.addEventListener('input', sync); vf.addEventListener('change', sync); sync();
        vf.addEventListener('submit', async (e) => {
            e.preventDefault(); vfErr.textContent = '';
            if (!vfFor.value.trim()) { vfErr.textContent = 'Please enter the recipient\'s name.'; vfFor.focus(); return; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(vfEmail.value.trim())) { vfErr.textContent = 'Please check your e-mail, that is where I will send the voucher.'; vfEmail.focus(); return; }
            vfBtn.disabled = true; vfBtn.textContent = 'Sending…';
            try {
                const data = new FormData(vf); data.append('_replyto', vfEmail.value.trim());
                const res = await fetch('https://formsubmit.co/ajax/matejkakis@gmail.com', { method: 'POST', headers: { 'Accept': 'application/json' }, body: data });
                if (!res.ok) throw new Error();
                $('#vf-done').hidden = false; vfBtn.hidden = true; window.playSfx?.('clap'); window.cameraFlash?.();
                window.track('Poukážka objednaná', { typ: vcT.textContent, hodnota: vcV.textContent });
            } catch (_) {
                vfBtn.disabled = false; vfBtn.textContent = 'Order the voucher';
                vfErr.innerHTML = 'The order could not be sent. Please write to me at <a href="mailto:matejkakis@gmail.com" target="_top">matejkakis@gmail.com</a>.';
            }
        });
    }

    /* ── COOKIE LIŠTA ── */
    const cookieBanner = $('#cookie-banner');
    const store = { get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} } };
    window.closeCookieBanner = () => { cookieBanner.classList.remove('visible'); store.set('cookie-consent', '1'); };
    if (cookieBanner && !store.get('cookie-consent')) setTimeout(() => cookieBanner.classList.add('visible'), 1500);
})();
