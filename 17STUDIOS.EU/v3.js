/* =========================================================
   17 STUDIOS · V3 (2027)
   · clona pri odoslaní formulára
   · náhľad fotky pri službách
   · názov aktuálnej sekcie v lište
   · okamžitá odozva tlačidiel na dotyk
   · mozaika prác (otvorí správnu službu a video/fotku)
   · ručne kreslený ovál
   · dopyt priamo z galérie
   · úvod podľa odkazu (?pre=svadby) a pokračovanie v kalkulačke
========================================================= */
(() => {
    'use strict';
    const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const store = { get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} } };

    /* 1 · Clona pri odoslaní formulára (nahrádza biely záblesk) */
    const irisFlash = () => {
        if (reduced) return;
        const el = document.createElement('div'); el.className = 'iris-flash'; el.setAttribute('aria-hidden', 'true');
        el.innerHTML = [0, 1, 2, 3, 4, 5].map(k => `<i style="--k:${k}"></i>`).join('');
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 700);
    };
    window.cameraFlash = irisFlash;

    /* 3 · Náhľad fotky pri prechode myšou cez služby */
    if (fine && !reduced) {
        const prev = document.createElement('div'); prev.className = 'catprev'; prev.setAttribute('aria-hidden', 'true');
        prev.innerHTML = '<img alt="" decoding="async">'; document.body.appendChild(prev);
        const img = $('img', prev);
        let x = 0, y = 0, tx = 0, ty = 0, raf = 0, on = false;
        const loop = () => {
            x += (tx - x) * 0.2; y += (ty - y) * 0.2;
            prev.style.transform = `translate3d(${(x + 24).toFixed(1)}px, ${(y - 70).toFixed(1)}px, 0) rotate(-3deg)`;
            raf = (on || Math.abs(tx - x) > 0.5) ? requestAnimationFrame(loop) : 0;
        };
        $$('.cat-tab').forEach(tab => {
            const item = tab.closest('.cat-item');
            const first = item && $('.cat-gallery [data-img], .cat-gallery [data-poster]', item);
            const src = first && (first.dataset.img || first.dataset.poster);
            if (!src) return;
            const thumb = 'thumbs/' + src.split('/').pop();
            tab.addEventListener('pointerenter', (e) => {
                if (item.classList.contains('open')) return;
                img.src = thumb; x = tx = e.clientX; y = ty = e.clientY; on = true; prev.classList.add('on');
                if (!raf) raf = requestAnimationFrame(loop);
            });
            tab.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; });
            tab.addEventListener('pointerleave', () => { on = false; prev.classList.remove('on'); });
            tab.addEventListener('click', () => { on = false; prev.classList.remove('on'); });
        });
    }

    /* 4 · Názov aktuálnej sekcie v lište */
    const navSec = $('#nav-sec');
    const LABELS = { praca: 'Najnovšia práca', kategorie: 'Služby a práce', hra: 'Ostrá hra', 'hviezdna-prievidza': 'Hviezdna Prievidza', odovzdanie: 'Čo dostanete',
        tipy: 'Tipy', ponuka: 'Ponuka', poukazky: 'Poukážky', bundles: 'Balíky', services: 'Cenník', 'bez-obav': 'Bez obáv', faq: 'Otázky', checklist: 'Checklist', contact: 'Kontakt' };
    if (navSec && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((en) => {
            en.forEach(e => {
                if (!e.isIntersecting) return;
                const t = LABELS[e.target.id] || '';
                if (navSec.textContent !== t) {
                    navSec.classList.remove('on');
                    setTimeout(() => { navSec.textContent = t; navSec.classList.toggle('on', !!t); }, 160);
                }
            });
        }, { rootMargin: '-45% 0px -54% 0px' });
        $$('main > section[id]').forEach(s => io.observe(s));
        const hero = $('#home'); if (hero) io.observe(hero);
    }

    /* 5 · Okamžitá odozva tlačidiel na dotyk */
    if (!fine && !reduced) {
        document.addEventListener('pointerdown', (e) => {
            const b = e.target.closest('.btn'); if (!b) return;
            const r = b.getBoundingClientRect();
            b.style.setProperty('--px', (e.clientX - r.left) + 'px'); b.style.setProperty('--py', (e.clientY - r.top) + 'px');
            b.classList.remove('is-press'); void b.offsetWidth; b.classList.add('is-press');
            setTimeout(() => b.classList.remove('is-press'), 600);
        }, { passive: true });
    }

    /* 6 · Mozaika prác: otvorí správnu službu a spustí video alebo fotku */
    document.addEventListener('click', (e) => {
        const go = e.target.closest('.bt-go[data-cat], .bt-go[data-work]'); if (!go) return;
        if (go.dataset.work) { window.openWork?.(go.dataset.work, go.dataset.src); return; }
        window.openCat?.(go.dataset.cat, { scroll: true });
        const sel = go.dataset.tile;
        if (sel) setTimeout(() => { $(`#cat-${go.dataset.cat} .cat-tile${sel}`)?.click(); }, 650);
    });

    /* 7 · Ručne kreslený ovál sa dokreslí, keď ho uvidíte */
    const ovals = $$('.hn-oval');
    if (ovals.length && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((en) => en.forEach(e => { if (e.isIntersecting) { e.target.classList.add('drawn'); io.unobserve(e.target); } }), { threshold: 0.6 });
        ovals.forEach(o => io.observe(o));
    } else ovals.forEach(o => o.classList.add('drawn'));

    /* 12 · Dopyt priamo z galérie */
    const CAT = { 'cat-svadby': 'Svadba', 'cat-eventy': 'Event / koncert', 'cat-hudba': 'Hudba / klip', 'cat-portrety': 'Portrét', 'cat-art': 'Digital Art', 'cat-weby': 'Web', 'hviezdna-prievidza': 'Event / koncert' };
    document.addEventListener('click', (e) => {
        const b = e.target.closest('.fb-ask'); if (!b) return;
        const cat = CAT[b.dataset.panel] || 'Neurčené';
        window.Fancybox?.close?.();
        const msg = `Dobrý deň,\n\nna vašom webe sa mi páčila táto fotka (${b.dataset.file}) a chcel/a by som niečo podobné.\n\nTermín:\nMiesto:`;
        setTimeout(() => window.selectService?.(cat, 'Fotenie ako na fotke z galérie', msg), 250);
    });

    /* 13 · Úvod podľa odkazu a pokračovanie v kalkulačke */
    const HERO = {
        svadby:   ['Svadobné fotky a film z Prievidze.', 'Zachytím váš deň taký, aký naozaj bol: bez strojených póz, s emóciami a ľuďmi, na ktorých vám záleží.', 'Pozrieť svadby a ceny', 'svadby'],
        eventy:   ['Fotky a aftermovie z vašej akcie.', 'Koncerty, festivaly aj firemné akcie. Energia davu, ľudia na pódiu a detaily, ktoré organizátor nestihne vidieť.', 'Pozrieť eventy a ceny', 'eventy'],
        hudba:    ['Videoklipy a vizuál k vydaniu.', 'Od nápadu a scenára po finálny strih, plus fotky do médií a obal skladby v jednom štýle.', 'Pozrieť klipy a ceny', 'hudba'],
        portrety: ['Portréty, na ktorých ste naozaj vy.', 'Osobné fotenie, páry aj fotenie ako z magazínu. Poradím vám s pózami, aj keď sa necítite fotogenicky.', 'Pozrieť portréty a ceny', 'portrety'],
    };
    const pre = new URLSearchParams(location.search).get('pre');
    const lead = $('#hero-lead'), cta = $('.hero-actions .btn-light');
    if (pre && HERO[pre] && lead && cta) {
        const [strong, text, btn, cat] = HERO[pre];
        lead.innerHTML = `<strong>${strong}</strong> ${text}`;
        cta.textContent = btn;
        cta.addEventListener('click', (e) => { e.preventDefault(); window.openCat?.(cat, { scroll: true }); });
        store.set('pre', pre);
    }
    // Rozpracovaná zostava v kalkulačke
    let saved = [];
    try { saved = JSON.parse(store.get('calc-ids') || '[]'); } catch (_) {}
    const heroEl = $('#home');
    if (Array.isArray(saved) && saved.length && heroEl && store.get('resume-off') !== '1') {
        const n = saved.length;
        const pill = document.createElement('div'); pill.className = 'resume';
        pill.innerHTML = `<span>Máte rozpracovanú zostavu (${n} ${n === 1 ? 'služba' : n < 5 ? 'služby' : 'služieb'})</span><button type="button" class="go">Pokračovať</button><button type="button" class="x" aria-label="Skryť">✕</button>`;
        (heroEl.querySelector('.hero-actions') || heroEl).after(pill);
        requestAnimationFrame(() => pill.classList.add('on'));
        $('.go', pill).addEventListener('click', () => { document.getElementById('services')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); pill.remove(); });
        $('.x', pill).addEventListener('click', () => { store.set('resume-off', '1'); pill.remove(); });
    }
})();

/* =========================================================
   PRACOVNÝ STÔL: triedy pridáva skript, takže bez neho je všetko normálne viditeľné
========================================================= */
(() => {
    const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const add = (sel, ...c) => $$(sel).forEach(e => e.classList.add(...c));
    add('.delivery-grid', 'desk'); add('.delivery-card', 'taped');
    add('.delivery-times', 'timeline'); 
    add('.light-tips', 'notebook'); 
    add('.offers-grid', 'desk'); add('.offer-card', 'taped'); add('.offer-k', 'stamp');
    add('.calc-sum', 'receipt');
    // zvýrazňovač patrí na samotný text, nie na celý blok
    $$('.delivery-times dd, .light-tips li > b').forEach(e => { e.innerHTML = `<span class="hl">${e.innerHTML}</span>`; });
    add('.worries-grid', 'desk'); add('.worry', 'taped');
    add('.lm-k', 'stamp');
    add('.section-head .lead, .services-head .services-hint', 'rv');
    // Každý papier sa položí až vtedy, keď k nemu naozaj dôjdete (nie celá skupina naraz)
    const targets = [...$$('.timeline, .notebook, .rv, .contact-info'), ...$$('.desk > *')];
    if (!('IntersectionObserver' in window)) { targets.forEach(t => t.classList.add('in')); return; }
    const io = new IntersectionObserver((en) => en.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -28% 0px' });
    targets.forEach(t => io.observe(t));
})();

/* =========================================================
   ŽIVÉ DETAILY (10 animácií). Každá sa spustí raz, keď ju uvidíte,
   alebo keď na ňu ťuknete. Pri scrollovaní sa nič neprepočítava.
========================================================= */
(() => {
    const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const once = (els, opt = {}) => {
        if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
        const io = new IntersectionObserver((en) => en.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -28% 0px', ...opt });
        els.forEach(e => io.observe(e));
    };
    const OVAL = '<svg class="hn-oval" viewBox="0 0 200 90" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M20 50 C 14 22, 72 8, 114 10 C 162 12, 196 28, 189 52 C 182 76, 120 87, 76 82 C 32 78, 4 62, 15 39 C 24 21, 60 13, 100 15"/></svg>';

    /* 6 · Galéria sa otvorí cez clonu */
    window.irisOpen = () => {
        if (reduced) return;
        const el = document.createElement('div'); el.className = 'iris-flash open'; el.setAttribute('aria-hidden', 'true');
        el.innerHTML = [0, 1, 2, 3, 4, 5].map(k => `<i style="--k:${k}"></i>`).join('');
        document.body.appendChild(el); setTimeout(() => el.remove(), 720);
    };
    if (reduced) return;

    /* 1 · Ručné poznámky sa napíšu */
    const notes = $$('.hn'); notes.forEach(n => n.classList.add('hn-hide')); once(notes);

    /* 2 · Polaroidy dopadnú na stôl */
    const bento = $('.bento');
    if (bento) { bento.classList.add('anim'); once([bento], { threshold: .15 }); bento.addEventListener('transitionend', () => bento.classList.add('done'), { once: true }); }

    /* 3 + 4 · Páska a pečiatka: riadia sa triedou .desk.in; checklist dostane vlastný spúšťač */
    $$('.desk').forEach(d => d.classList.add('anim'));
    const lm = $('.lm-card'); if (lm) { lm.classList.add('anim'); once([lm]); }

    /* 7 · Zakrúžkovanie rukou: úspora v balíkoch a „Do 24 hodín“ pri kontakte */
    const c24 = $('#contact .lead em'); if (c24) { c24.classList.add('hn-wrap', 'hn-inline'); c24.insertAdjacentHTML('beforeend', OVAL); }
    const ovals = $$('#contact .hn-oval');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((en) => en.forEach(e => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('drawn'), 450); io.unobserve(e.target); } }), { threshold: .8, rootMargin: '0px 0px -25% 0px' });
        ovals.forEach(o => io.observe(o));
    } else ovals.forEach(o => o.classList.add('drawn'));

    /* 8 · Fixka: ťuknutím (alebo prejdením myšou) sa dôležitá fráza zvýrazní */
    $$('main p em, main li em').forEach(em => {
        if (em.closest('.calc, .hero, .cat-panel, form, .bundles-section, .bundle-card')) return;
        em.classList.add('tap-hl');
        em.addEventListener('click', () => em.classList.toggle('on'));
    });

    /* 9 · Kartička sa otočí na odpoveď */
    $$('.worry').forEach(w => {
        const q = $('.worry-q', w); if (!q) return;
        const rest = [...w.children].filter(x => x !== q);
        const front = document.createElement('div'); front.className = 'wf wf-front taped';
        front.append(q); front.insertAdjacentHTML('beforeend', '<span class="wf-hint">ťuknite pre odpoveď ↻</span>');
        const back = document.createElement('div'); back.className = 'wf wf-back';
        back.insertAdjacentHTML('beforeend', `<p class="wf-q">${q.textContent}</p>`); rest.forEach(x => back.append(x));
        const inner = document.createElement('div'); inner.className = 'wf-in'; inner.append(front, back);
        w.append(inner); w.classList.remove('taped'); w.classList.add('flipcard');
        w.setAttribute('role', 'button'); w.tabIndex = 0; w.setAttribute('aria-pressed', 'false');
        const flip = () => { const on = !w.classList.contains('flipped'); w.classList.toggle('flipped', on); w.setAttribute('aria-pressed', String(on)); };
        w.addEventListener('click', flip);
        w.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    });

    /* 10 · Podpis pod formulárom sa dopíše; po odoslaní sa zmení na poďakovanie */
    const sign = $('#sign');
    if (sign) {
        once([sign], { threshold: 0.5, rootMargin: '0px 0px -20% 0px' });
        document.addEventListener('contact-sent', () => {
            sign.classList.remove('in'); void sign.offsetWidth;
            sign.firstElementChild.textContent = 'Ďakujem! — Matej';
            setTimeout(() => sign.classList.add('in'), 500);
        });
    }
})();
