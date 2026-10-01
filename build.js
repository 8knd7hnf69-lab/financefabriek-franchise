// Bouwt de franchisesite van De Finance Fabriek.
// Gebruik: node build.js            -> live site in de map dist (Netlify doet dit automatisch)
//          node build.js --preview  -> één voorbeeldbestand preview.html
const fs = require('fs');
const path = require('path');

const SITE = 'https://franchise.financefabriek.nl';
const PREVIEW = process.argv.includes('--preview');
const read = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, 'content', f), 'utf8'));
const site = read('website.json');
const gever = read('franchisegevers.json');
const diensten = read('diensten.json').diensten || [];
const gidsen = read('gidsen.json').gidsen || [];
const layout = fs.readFileSync(path.join(__dirname, 'templates', 'layout.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'templates', 'style.css'), 'utf8');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const list = (a) => (Array.isArray(a) ? a : []);
const img = (src) => esc(src || '');
const bg = (src) => (src ? `url('${img(src)}')` : 'none');
const C = site.contact || {};
const mail = esc(C.email || 'info@financefabriek.nl');

// ---------- vaste onderdelen ----------
function header() {
  return `<header class="top">
  <nav class="wrap nav" aria-label="Hoofdmenu">
    <a class="logo-wrap" href="/"><span class="logo"><img src="/images/logo.png" width="188" height="70" alt="De Finance Fabriek" onerror="this.parentNode.classList.add('noimg')"><span class="logo-text" aria-hidden="true"><b>DE FINANCE</b><span>FABRIEK</span></span></span><span class="intl-tag">Franchise</span></a>
    <ul>
      <li><a href="/#werkwijze">Franchisenemers</a></li>
      <li><a href="/franchisegevers/">Franchisegevers</a></li>
      <li><a href="/#diensten">Diensten</a></li>
      <li><a href="/#prijzen">Prijzen</a></li>
      <li><a href="/#gidsen">Gidsen</a></li>
      <li><a href="/#vragen">Vragen</a></li>
    </ul>
    <div class="nav-right"><a class="btn btn-primary" href="#contact">Kennismaken</a></div>
  </nav>
</header>`;
}

function footer() {
  const co = site.company || {};
  return `<footer class="wrap">
  <div class="foot">
    <span>© ${new Date().getFullYear()} De Finance Fabriek · Onderdeel van De Finance Fabriek (<a href="https://financefabriek.nl/">financefabriek.nl</a>) · ${esc(co.legal)}</span>
    <span>KvK ${esc(co.kvk)} · Btw ${esc(co.btw)} · <a href="mailto:${mail}">${mail}</a></span>
  </div>
</footer>`;
}

function contactSection(o) {
  // o: { formName, page, title, text, options, placeholder, companyLabel, extraLabel, extraName }
  return `<section class="contact" id="contact">
  <div class="wrap contact-grid">
    <div>
      <p class="label">${esc(C.label)}</p>
      <h2 style="margin-top:.9rem">${esc(o.title)}</h2>
      <p style="margin-top:1rem;color:var(--muted)">${esc(o.text)}</p>
      <p style="margin-top:1.4rem"><strong>De Finance Fabriek</strong><br>${esc(C.address_line)}<br><a href="mailto:${mail}">${mail}</a></p>
      ${C.booking_url ? `<div class="booking">
        <p class="booking-title">${esc(C.booking_title)}</p>
        <p>${esc(C.booking_text)}</p>
        <a class="btn btn-primary" href="${esc(C.booking_url)}" target="_blank" rel="noopener">${esc(C.booking_button)} &rarr;</a>
      </div>` : ''}
      ${C.image ? `<img class="photo contact-photo" src="${img(C.image)}" alt="" loading="lazy">` : ''}
    </div>
    <form name="${o.formName}" method="POST" data-netlify="true" netlify-honeypot="bot-field">
      <input type="hidden" name="form-name" value="${o.formName}">
      <input type="hidden" name="page" value="${esc(o.page)}">
      <p class="hp"><label>Niet invullen <input name="bot-field"></label></p>
      <div class="two">
        <label>Naam<input name="name" required autocomplete="name"></label>
        <label>${esc(o.companyLabel)}<input name="company" autocomplete="organization"></label>
      </div>
      <div class="two">
        <label>E-mail<input name="email" type="email" required autocomplete="email"></label>
        <label>${esc(o.extraLabel)}<input name="${o.extraName}"></label>
      </div>
      <label>Ik ben of zoek
        <select name="interest">${list(o.options).map((x) => `<option>${esc(x)}</option>`).join('')}</select>
      </label>
      <label>Bericht<textarea name="message" placeholder="${esc(o.placeholder)}"></textarea></label>
      <button class="btn btn-primary" type="submit" style="justify-self:start">Verstuur</button>
      <p class="form-msg" role="status"></p>
    </form>
  </div>
</section>`;
}
const nemerContact = (page) => contactSection({
  formName: 'contact-franchise', page, title: C.title, text: C.text, options: C.form_options, placeholder: C.form_message_placeholder,
  companyLabel: 'Naam van je bedrijf', extraLabel: 'Formule', extraName: 'formula',
});
const geverContact = (page) => {
  const g = gever.contact || {};
  return contactSection({
    formName: 'contact-franchisegever', page, title: g.title, text: g.text, options: g.form_options, placeholder: g.form_message_placeholder,
    companyLabel: 'Franchiseorganisatie', extraLabel: 'Aantal vestigingen', extraName: 'locations',
  });
};

const svcCard = (d, base = '/diensten/') => `<a class="svc" href="${base}${esc(d.slug)}/"><span class="code">${esc(d.code)}</span><h3>${esc(d.title)}</h3><p>${esc(d.summary)}</p><span class="more">Lees meer &rarr;</span></a>`;
const guideCard = (g) => `<a class="svc" href="/gidsen/${esc(g.slug)}/"><span class="code">${esc(g.code)}</span><h3>${esc(g.title)}</h3><p>${esc(g.summary)}</p><span class="more">Lees de gids &rarr;</span></a>`;
const ticks = (a) => `<ul class="ticks">${list(a).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
const stations = (items, cls) => `<ol class="stations ${cls}"><li class="token" aria-hidden="true"></li>${list(items).map((s, i) => `<li class="station"><span class="st-no">${String(i + 1).padStart(2, '0')}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}</ol>`;
const faqList = (items) => `<div class="faq-list">${list(items).map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>`;

// ---------- homepage ----------
function home() {
  const h = site.hero, ch = site.choice, w = site.why, how = site.how, s = site.services, b = site.band, p = site.points, pr = site.pricing, fr = site.franchisor, gd = site.guides, fq = site.faq;
  const core = diensten.filter((d) => d.group === 'kern'), extra = diensten.filter((d) => d.group !== 'kern');
  return `<div class="hero-band" style="--hero-img:${bg(h.image)}"><section class="wrap hero">
    <div>
      <p class="label">${esc(h.label)}</p>
      <h1 style="margin-top:1rem">${esc(h.title)} <em>${esc(h.title_accent)}</em></h1>
      <p class="lead">${esc(h.intro)}</p>
      <div class="cta">
        <a class="btn btn-primary" href="#werkwijze">${esc(h.button_primary)}</a>
        <a class="btn btn-ghost" href="/franchisegevers/">${esc(h.button_secondary)}</a>
      </div>
    </div>
  </section></div>

  <section class="wrap choice" aria-label="Kies wat bij je past">
    <div class="choice-grid">
      <a class="choice-card" href="#werkwijze"><p class="label">${esc(ch.nemer.label)}</p><h2 style="font-size:clamp(1.4rem,2.6vw,1.8rem)">${esc(ch.nemer.title)}</h2><p>${esc(ch.nemer.text)}</p><span class="more">${esc(ch.nemer.button)} &rarr;</span></a>
      <a class="choice-card dark" href="/franchisegevers/"><p class="label">${esc(ch.gever.label)}</p><h2 style="font-size:clamp(1.4rem,2.6vw,1.8rem)">${esc(ch.gever.title)}</h2><p>${esc(ch.gever.text)}</p><span class="more">${esc(ch.gever.button)} &rarr;</span></a>
    </div>
  </section>

  <section class="wrap onestop">
    <div class="split">
      <div class="sec-head">
        <p class="label">${esc(w.label)}</p>
        <h2>${esc(w.title)}</h2>
        <p>${esc(w.text)}</p>
        ${ticks(w.points)}
      </div>
      ${w.image ? `<img class="photo" src="${img(w.image)}" alt="" loading="lazy">` : ''}
    </div>
  </section>

  <section class="line-sec" id="werkwijze">
    <div class="wrap">
      <div class="sec-head"><p class="label">${esc(how.label)}</p><h2>${esc(how.title)}</h2><p>${esc(how.text)}</p></div>
      ${stations(how.steps, list(how.steps).length === 4 ? 'four' : '')}
    </div>
  </section>

  <section class="wrap services" id="diensten">
    <div class="sec-head"><p class="label">${esc(s.label)}</p><h2>${esc(s.title)}</h2></div>
    ${core.length ? `<div class="group-head"><p class="label">${esc(s.core_label)}</p></div><div class="svc-grid core ${core.length === 2 ? 'two' : ''}">${core.map((d) => svcCard(d)).join('')}</div>` : ''}
    ${extra.length ? `<div class="group-head"><p class="label">${esc(s.extra_label)}</p></div><div class="svc-grid ${extra.length % 3 && extra.length % 2 === 0 ? 'two' : ''}">${extra.map((d) => svcCard(d)).join('')}</div>` : ''}
  </section>

  <section class="band" style="--band-img:${bg(b.image)}" aria-label="Onze aanpak"><div class="wrap"><p>${esc(b.line1)}<br><span>${esc(b.line2)}</span></p></div></section>

  <section class="wrap bv" id="aandachtspunten">
    <div class="sec-head"><p class="label">${esc(p.label)}</p><h2>${esc(p.title)}</h2><p>${esc(p.text)}</p></div>
    <div>
      <dl class="facts">${list(p.items).map((f) => `<div><dt>${esc(f.title)}</dt><dd>${esc(f.text)}</dd></div>`).join('')}</dl>
      <p class="small-note">${esc(p.note)}</p>
    </div>
  </section>

  <section class="pricing" id="prijzen">
    <div class="wrap">
      <div class="sec-head"><p class="label">${esc(pr.label)}</p><h2>${esc(pr.title)}</h2></div>
      <div class="price-grid">${list(pr.cards).map((c) => `<div class="price-card">
        <h3>${esc(c.title)}</h3>
        <div class="price">${esc(c.price)}<small>${esc(c.price_note)}</small></div>
        <p>${esc(c.text)}</p>
        <ul>${list(c.items).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <a class="btn" href="#contact">Plan een kennismaking</a>
      </div>`).join('')}</div>
    </div>
  </section>

  <section class="wrap franchisor" id="franchisegevers">
    <div class="fr-card">
      <div>
        <p class="label">${esc(fr.label)}</p>
        <h2>${esc(fr.title)}</h2>
        <p>${esc(fr.text)}</p>
        <a class="btn" href="/franchisegevers/">${esc(fr.button)} &rarr;</a>
      </div>
      <div>${ticks(fr.points)}</div>
    </div>
  </section>

  ${gidsen.length ? `<section class="wrap guides" id="gidsen">
    <div class="sec-head"><p class="label">${esc(gd.label)}</p><h2>${esc(gd.title)}</h2><p>${esc(gd.text)}</p></div>
    <div class="svc-grid">${gidsen.map(guideCard).join('')}</div>
  </section>` : ''}

  <section class="wrap faq" id="vragen">
    <div class="sec-head"><p class="label">${esc(fq.label)}</p><h2>${esc(fq.title)}</h2></div>
    ${faqList(fq.items)}
  </section>

  ${nemerContact('/')}`;
}

// ---------- franchisegevers ----------
function geverPage() {
  const h = gever.hero, b = gever.benefits, st = gever.steps, of = gever.offer, pr = gever.principles, fq = gever.faq;
  const core = diensten.filter((d) => d.group === 'kern');
  return `<div class="hero-band" style="--hero-img:${bg(h.image)}"><section class="wrap hero">
    <div>
      <p class="label">${esc(h.label)}</p>
      <h1 style="margin-top:1rem">${esc(h.title)} <em>${esc(h.title_accent)}</em></h1>
      <p class="lead">${esc(h.intro)}</p>
      <div class="cta">
        <a class="btn btn-primary" href="#contact">${esc(h.button_primary)}</a>
        <a class="btn btn-ghost" href="#samenwerking">${esc(h.button_secondary)}</a>
      </div>
    </div>
  </section></div>

  <section class="wrap onestop">
    <div class="split">
      <div class="sec-head"><p class="label">${esc(b.label)}</p><h2>${esc(b.title)}</h2><p>${esc(b.text)}</p>${ticks(b.points)}</div>
      ${b.image ? `<img class="photo" src="${img(b.image)}" alt="" loading="lazy">` : ''}
    </div>
  </section>

  <section class="line-sec" id="samenwerking">
    <div class="wrap">
      <div class="sec-head"><p class="label">${esc(st.label)}</p><h2>${esc(st.title)}</h2><p>${esc(st.text)}</p></div>
      ${stations(st.items, list(st.items).length === 4 ? 'four' : '')}
    </div>
  </section>

  <section class="wrap services">
    <div class="sec-head"><p class="label">${esc(of.label)}</p><h2>${esc(of.title)}</h2></div>
    <div class="svc-grid core ${core.length === 2 ? 'two' : ''}">${core.map((d) => svcCard(d)).join('')}</div>
  </section>

  <section class="wrap" style="padding-bottom:clamp(3rem,7vw,5rem)">
    <div class="sec-head"><p class="label">${esc(pr.label)}</p><h2>${esc(pr.title)}</h2></div>
    <div class="principles">${list(pr.items).map((x) => `<div class="principle"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div>`).join('')}</div>
  </section>

  <section class="wrap faq" id="vragen" style="padding-top:0">
    <div class="sec-head"><p class="label">${esc(fq.label)}</p><h2>${esc(fq.title)}</h2></div>
    ${faqList(fq.items)}
  </section>

  ${geverContact('/franchisegevers/')}`;
}

// ---------- dienstpagina ----------
function sideCard() {
  return `<div class="side-card">
    <h3>Direct aan de slag?</h3>
    <p>Plan een kennismaking. We nemen binnen één werkdag contact op.</p>
    <a class="btn btn-primary" href="#contact">Plan een kennismaking</a>
    <p class="side-mail">${mail}</p>
    ${C.booking_url ? `<a class="side-book" href="${esc(C.booking_url)}" target="_blank" rel="noopener">${esc(C.booking_button)} &rarr;</a>` : ''}
  </div>`;
}
function dienstPage(d) {
  const others = diensten.filter((x) => x.slug !== d.slug);
  return `<div class="page-hero" style="--page-img:${bg(d.image)}">
    <div class="wrap">
      <nav class="crumbs" aria-label="Kruimelpad"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/#diensten">Diensten</a><span aria-hidden="true">/</span><span aria-current="page">${esc(d.title)}</span></nav>
      <p class="label">${esc(d.code)}</p>
      <h1>${esc(d.title)}</h1>
      <p class="lead">${esc(d.intro)}</p>
      <a class="btn btn-primary" href="#contact">Plan een kennismaking</a>
    </div>
  </div>
  <section class="wrap svc-page">
    <div>
      <h2>Wat we voor je doen</h2>
      <ul class="points">${list(d.points).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      ${d.note ? `<div class="note"><p class="label">Goed om te weten</p><p>${esc(d.note)}</p></div>` : ''}
    </div>
    <aside class="svc-side">
      ${sideCard()}
      <div class="side-list"><p class="label">Andere diensten</p><ul>${others.map((x) => `<li><a href="/diensten/${esc(x.slug)}/">${esc(x.title)}</a></li>`).join('')}</ul></div>
    </aside>
  </section>
  ${nemerContact(`/diensten/${d.slug}/`)}`;
}

// ---------- gidspagina ----------
function gidsPage(g) {
  const others = gidsen.filter((x) => x.slug !== g.slug);
  return `<div class="page-hero" style="--page-img:${bg(g.image)}">
    <div class="wrap">
      <nav class="crumbs" aria-label="Kruimelpad"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/#gidsen">Gidsen</a><span aria-hidden="true">/</span><span aria-current="page">${esc(g.title)}</span></nav>
      <p class="label">${esc(g.code)}</p>
      <h1>${esc(g.title)}</h1>
      <p class="lead">${esc(g.summary)}</p>
    </div>
  </div>
  <section class="wrap svc-page">
    <article class="article">${list(g.sections).map((s) => `<h2>${esc(s.heading)}</h2><p>${esc(s.text)}</p>`).join('')}
      <div class="note"><p class="label">Goed om te weten</p><p>Deze gids geeft algemene uitleg, geen advies voor jouw situatie. Wat voor jou geldt, hangt af van je franchiseovereenkomst en je persoonlijke situatie.</p></div>
    </article>
    <aside class="svc-side">
      ${sideCard()}
      ${others.length ? `<div class="side-list"><p class="label">Andere gidsen</p><ul>${others.map((x) => `<li><a href="/gidsen/${esc(x.slug)}/">${esc(x.title)}</a></li>`).join('')}</ul></div>` : ''}
    </aside>
  </section>
  ${nemerContact(`/gidsen/${g.slug}/`)}`;
}

// ---------- alle pagina's ----------
const pages = [
  { url: '/', title: site.seo.title, description: site.seo.description, main: home() },
  { url: '/franchisegevers/', title: gever.seo.title, description: gever.seo.description, main: geverPage() },
  ...diensten.map((d) => ({ url: `/diensten/${d.slug}/`, title: `${d.title} voor franchisenemers | De Finance Fabriek`, description: d.summary, main: dienstPage(d) })),
  ...gidsen.map((g) => ({ url: `/gidsen/${g.slug}/`, title: `${g.title} | De Finance Fabriek`, description: g.summary, main: gidsPage(g) })),
];

const fill = (tpl, vars) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');

if (!PREVIEW) {
  const out = path.join(__dirname, 'dist');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  for (const pg of pages) {
    const dir = path.join(out, pg.url);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), fill(layout, {
      title: esc(pg.title), description: esc(pg.description), canonical: SITE + pg.url, header: header(), main: pg.main, footer: footer(),
    }));
  }
  fs.writeFileSync(path.join(out, 'style.css'), css);
  if (fs.existsSync(path.join(__dirname, 'images'))) fs.cpSync(path.join(__dirname, 'images'), path.join(out, 'images'), { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${SITE}${p.url}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
  console.log(`Klaar: ${pages.length} pagina's in dist/`);
} else {
  // Eén bestand met alle pagina's, voor de preview. Foto's worden vervangen door een vlak in de huisstijl.
  const ph = (n) => {
    const hue = ['#4D3708', '#5C4410', '#3E2C06', '#6B5018'][n % 4];
    return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hue}"/><stop offset="1" stop-color="#2B1F04"/></linearGradient></defs><rect width="1600" height="1000" fill="url(#g)"/><g fill="none" stroke="#FFB81C" stroke-opacity=".16" stroke-width="3"><circle cx="1250" cy="300" r="220"/><circle cx="1250" cy="300" r="140"/><path d="M0 820h1600M0 870h1600"/></g></svg>`);
  };
  let k = 0;
  const route = (html) => html
    .replace(/<img class="photo contact-photo"[^>]*>/g, '')
    .replace(/url\('\/images\/[^']+'\)/g, () => `url('${ph(k++)}')`)
    .replace(/src="\/images\/logo\.png"/g, 'src="data:," data-logo')
    .replace(/src="\/images\/[^"]+"/g, () => `src="${ph(k++)}"`)
    .replace(/href="\/#([\w-]+)"/g, 'href="#/@$1"')
    .replace(/href="(\/[\w\-/]*)"/g, 'href="#$1"');
  const body = pages.map((pg, i) => `<div class="pv" data-url="${pg.url}"${i ? ' hidden' : ''}>${route(header())}<main>${route(pg.main)}</main>${route(footer())}</div>`).join('\n');
  const html = `<title>De Finance Fabriek Franchise</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Quando&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>${css}\n[hidden]{display:none!important}.logo img[data-logo]{display:none}.logo .logo-text{display:block;line-height:1.05}</style>
${body}
<script>
function show(){var h=location.hash||'#/';var pvs=document.querySelectorAll('.pv');
 if(h.indexOf('#/')!==0){var cur=document.querySelector('.pv:not([hidden])');var el=cur&&cur.querySelector(h);if(el)el.scrollIntoView();return;}
 var p=h.slice(1),anchor=null;if(p.indexOf('/@')===0){anchor=p.slice(2);p='/';}
 var hit=false;pvs.forEach(function(d){var on=d.getAttribute('data-url')===p;d.hidden=!on;if(on)hit=true;});
 if(!hit){pvs.forEach(function(d,i){d.hidden=i!==0;});}
 var cur=document.querySelector('.pv:not([hidden])');var el=anchor&&cur.querySelector('#'+anchor);
 if(el){el.scrollIntoView();}else{window.scrollTo(0,0);}}
window.addEventListener('hashchange',show);show();
document.querySelectorAll('form').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();f.querySelector('.form-msg').textContent='Dit is de preview. Op de live site komt je bericht direct bij ons binnen.';});});
</script>`;
  fs.writeFileSync(path.join(__dirname, 'preview.html'), html);
  console.log(`Preview: ${pages.length} pagina's in preview.html`);
}
