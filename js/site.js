(function () {
  'use strict';

  var KOK = document.documentElement;
  var DIL_ANAHTARI = 'dil';
  var TEMA_ANAHTARI = 'tema';
  var API_ONBELLEK = 'depolar-onbellek';
  var ONBELLEK_MS = 10 * 60 * 1000;

  var dil = 'tr';
  var projeler = [];
  var apiDepolar = null; // { ad: { yildiz } } ya da null (alınamadı)

  // --- tarayıcı deposu: kapalı olabilir, hata vermesin ---------------------------------------------
  function oku(anahtar) {
    try { return localStorage.getItem(anahtar); } catch (e) { return null; }
  }
  function yaz(anahtar, deger) {
    try { localStorage.setItem(anahtar, deger); } catch (e) { /* önemli değil */ }
  }

  // --- dil -----------------------------------------------------------------------------------------
  var METIN = {
    tr: {
      baslik: 'Sercan Eşiktaş · Yazılım geliştirici',
      dugme: 'EN', dugmeEtiket: 'Dili değiştir: English',
      tema: 'Temayı değiştir', anaGezinme: 'Ana gezinme',
      eposta: 'E-posta adresini göster', epostaYazi: 'E-posta gönder',
      proje: function (n) { return n + ' proje yayında'; },
      repo: 'Depo', canli: 'Canlı demo', etiketler: {}
    },
    en: {
      baslik: 'Sercan Eşiktaş · Software developer',
      dugme: 'TR', dugmeEtiket: 'Switch language: Türkçe',
      tema: 'Toggle theme', anaGezinme: 'Main navigation',
      eposta: 'Show email address', epostaYazi: 'Send an email',
      proje: function (n) { return n + (n === 1 ? ' project published' : ' projects published'); },
      repo: 'Repository', canli: 'Live demo', etiketler: { 'Veri': 'Data', 'Şablon': 'Template' }
    }
  };

  function dilUygula(yeni) {
    dil = yeni;
    KOK.setAttribute('lang', yeni);
    document.title = METIN[yeni].baslik;

    var ogeler = document.querySelectorAll('[data-en]');
    for (var i = 0; i < ogeler.length; i++) {
      var o = ogeler[i];
      if (o.getAttribute('data-tr') === null) o.setAttribute('data-tr', o.innerHTML);
      o.innerHTML = yeni === 'en' ? o.getAttribute('data-en') : o.getAttribute('data-tr');
    }

    var d = document.getElementById('dilDugmesi');
    d.textContent = METIN[yeni].dugme;
    d.setAttribute('aria-label', METIN[yeni].dugmeEtiket);
    document.getElementById('temaDugmesi').setAttribute('aria-label', METIN[yeni].tema);
    document.querySelector('.gezinme').setAttribute('aria-label', METIN[yeni].anaGezinme);

    epostaGuncelle();
    projeCiz();
  }

  // --- tema ----------------------------------------------------------------------------------------
  function gecerliTema() {
    var secili = KOK.getAttribute('data-tema');
    if (secili) return secili;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'koyu' : 'acik';
  }

  function temaDegistir() {
    var yeni = gecerliTema() === 'koyu' ? 'acik' : 'koyu';
    KOK.setAttribute('data-tema', yeni);
    yaz(TEMA_ANAHTARI, yeni);
  }

  // --- e-posta: adres sayfa kaynağında düz yazı olarak yer almaz -------------------------------------
  var epostaAcik = false;
  function adres() {
    return ['sercanesiktas', 'gmail.com'].join('@');
  }
  function epostaGuncelle() {
    var a = document.getElementById('epostaBaglantisi');
    if (epostaAcik) {
      a.textContent = adres();
      a.setAttribute('href', 'mailto:' + adres());
      a.setAttribute('aria-label', METIN[dil].epostaYazi + ': ' + adres());
      a.removeAttribute('data-en');
      a.removeAttribute('data-tr');
    } else {
      a.removeAttribute('aria-label');
      a.textContent = METIN[dil].eposta;
    }
  }

  // --- projeler ------------------------------------------------------------------------------------
  function bosalt(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function olustur(etiket, sinif, metin) {
    var el = document.createElement(etiket);
    if (sinif) el.className = sinif;
    if (metin !== undefined) el.textContent = metin;
    return el;
  }

  function projeCiz() {
    var liste = document.getElementById('projeListesi');
    var sayi = document.getElementById('projeSayisi');
    if (!liste || !projeler.length) return; // henüz yüklenmediyse "yükleniyor" yazısı kalsın
    bosalt(liste);

    for (var i = 0; i < projeler.length; i++) {
      var p = projeler[i];
      var li = olustur('li', 'proje');

      var baslik = olustur('h3', 'proje-ad');
      var a = olustur('a', '', p.ad);
      a.setAttribute('href', 'https://github.com/' + p.kullanici + '/' + p.ad);
      a.setAttribute('rel', 'noopener');
      a.appendChild(olustur('span', 'ok', '↗'));
      a.lastChild.setAttribute('aria-hidden', 'true');
      baslik.appendChild(a);
      li.appendChild(baslik);

      li.appendChild(olustur('p', '', p[dil] || p.tr));

      var alt = olustur('div', 'proje-alt');
      var etiketler = olustur('ul', 'etiketler');
      for (var j = 0; j < p.etiketler.length; j++) etiketler.appendChild(olustur('li', '', METIN[dil].etiketler[p.etiketler[j]] || p.etiketler[j]));
      alt.appendChild(etiketler);

      if (p.yildiz > 0) {
        var y = olustur('span', 'yildiz', '★ ' + p.yildiz);
        y.setAttribute('title', 'GitHub');
        alt.appendChild(y);
      }
      if (p.demo) {
        var d = olustur('a', 'proje-baglanti', METIN[dil].canli + ' →');
        d.setAttribute('href', p.demo);
        d.setAttribute('rel', 'noopener');
        alt.appendChild(d);
      }
      li.appendChild(alt);
      liste.appendChild(li);
    }

    sayi.textContent = projeler.length ? METIN[dil].proje(projeler.length) : '';
  }

  function secilenProjeler(veri) {
    var kullanici = veri.kullanici;
    var sonuc = [];
    for (var i = 0; i < veri.projeler.length; i++) {
      var p = veri.projeler[i];
      var apidaVar = apiDepolar && Object.prototype.hasOwnProperty.call(apiDepolar, p.ad);
      // Yayında olduğunu JSON söylüyorsa ya da GitHub'da gerçekten varsa göster
      if (p.yayinda || apidaVar) {
        sonuc.push({
          ad: p.ad, kullanici: kullanici, tr: p.tr, en: p.en, etiketler: p.etiketler || [],
          demo: p.demo || null, yildiz: apidaVar ? apiDepolar[p.ad].yildiz : 0
        });
      }
    }
    return sonuc;
  }

  function apidenOku() {
    // Tarayıcı oturumunda 10 dakika önbellek: GitHub API'sinin saatlik istek sınırını zorlamamak için
    var onbellek = null;
    try { onbellek = JSON.parse(sessionStorage.getItem(API_ONBELLEK) || 'null'); } catch (e) { onbellek = null; }
    if (onbellek && Date.now() - onbellek.zaman < ONBELLEK_MS) return Promise.resolve(onbellek.depolar);

    return fetch('https://api.github.com/users/sercanesiktas/repos?per_page=100&type=owner', { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (liste) {
        var depolar = {};
        liste.forEach(function (d) {
          if (!d.fork && !d.private) depolar[d.name] = { yildiz: d.stargazers_count || 0 };
        });
        try { sessionStorage.setItem(API_ONBELLEK, JSON.stringify({ zaman: Date.now(), depolar: depolar })); } catch (e) { /* önemli değil */ }
        return depolar;
      });
  }

  function projeleriYukle() {
    fetch('data/projeler.json')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (veri) {
        projeler = secilenProjeler(veri); // önce yalnızca bilinen yayındakiler, hemen çiz
        projeCiz();
        // sonra GitHub'a sor, yeni yayınlananları ekle
        return apidenOku().then(function (depolar) {
          apiDepolar = depolar;
          projeler = secilenProjeler(veri);
          projeCiz();
        }).catch(function () { /* API yoksa elimizdeki liste yeter */ });
      })
      .catch(function () {
        var liste = document.getElementById('projeListesi');
        bosalt(liste);
        var li = olustur('li', 'yukleniyor', 'Projeler yüklenemedi. Hepsi GitHub\'da: github.com/sercanesiktas');
        liste.appendChild(li);
      });
  }

  // --- başlat --------------------------------------------------------------------------------------
  document.getElementById('yil').textContent = String(new Date().getFullYear());

  document.getElementById('temaDugmesi').addEventListener('click', temaDegistir);
  document.getElementById('dilDugmesi').addEventListener('click', function () {
    var yeni = dil === 'tr' ? 'en' : 'tr';
    yaz(DIL_ANAHTARI, yeni);
    dilUygula(yeni);
  });
  document.getElementById('epostaBaglantisi').addEventListener('click', function (olay) {
    if (!epostaAcik) {
      olay.preventDefault();
      epostaAcik = true;
      epostaGuncelle();
    }
  });

  var kayitli = oku(DIL_ANAHTARI);
  var baslangic = kayitli === 'tr' || kayitli === 'en' ? kayitli : ((navigator.language || 'tr').slice(0, 2) === 'tr' ? 'tr' : 'en');
  dilUygula(baslangic);
  projeleriYukle();
})();
