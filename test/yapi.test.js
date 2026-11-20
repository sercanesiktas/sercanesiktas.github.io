import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(kok, 'index.html'), 'utf8');
const js = readFileSync(join(kok, 'js', 'site.js'), 'utf8');
const veri = JSON.parse(readFileSync(join(kok, 'data', 'projeler.json'), 'utf8'));

test('projeler.json: her projenin Türkçe ve İngilizce açıklaması, etiketi ve geçerli adı var', () => {
  assert.ok(veri.projeler.length > 0);
  const adlar = new Set();
  for (const p of veri.projeler) {
    assert.match(p.ad, /^[a-z0-9][a-z0-9.-]*$/, `geçersiz repo adı: ${p.ad}`);
    assert.ok(!adlar.has(p.ad), `yinelenen proje: ${p.ad}`);
    adlar.add(p.ad);
    for (const dil of ['tr', 'en']) {
      assert.ok(typeof p[dil] === 'string' && p[dil].length > 10, `${p.ad}: ${dil} açıklaması eksik`);
      assert.ok(p[dil].length <= 140, `${p.ad}: ${dil} açıklaması çok uzun`);
    }
    assert.ok(Array.isArray(p.etiketler) && p.etiketler.length > 0, `${p.ad}: etiket yok`);
    assert.equal(typeof p.yayinda, 'boolean', `${p.ad}: yayinda true/false olmalı`);
    if (p.demo) assert.match(p.demo, /^https:\/\//, `${p.ad}: demo https olmalı`);
  }
  assert.equal(veri.kullanici, 'sercanesiktas');
});

test('etiketler: çevirisi gereken Türkçe etiketler site.js içinde tanımlı', () => {
  const trOnly = new Set(veri.projeler.flatMap((p) => p.etiketler).filter((e) => /[ğüşıöçĞÜŞİÖÇ]|^Veri$|^Şablon$/.test(e)));
  for (const e of trOnly) assert.ok(js.includes(`'${e}'`), `"${e}" etiketinin İngilizce çevirisi yok`);
});

test('index.html: sayfa içi bağlantıların hepsi var olan bir kimliğe gider', () => {
  const kimlikler = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const hedefler = [...html.matchAll(/href="#([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
  assert.ok(hedefler.length >= 6);
  for (const h of hedefler) assert.ok(kimlikler.has(h), `#${h} kimliği yok`);
});

test('index.html: yerel dosya başvurularının hepsi var', () => {
  const yollar = [...html.matchAll(/(?:href|src)="((?!https?:|#|mailto:)[^"]+)"/g)].map((m) => m[1]);
  assert.ok(yollar.length >= 3);
  for (const y of yollar) assert.ok(existsSync(join(kok, y)), `${y} yok`);
});

test('site.js: kullandığı kimliklerin hepsi index.html içinde var', () => {
  const kullanilan = [...js.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]);
  assert.ok(kullanilan.length >= 5);
  for (const k of new Set(kullanilan)) assert.match(html, new RegExp(`\\sid="${k}"`), `${k} kimliği index.html'de yok`);
});

test('e-posta adresi sayfa kaynağında düz yazı olarak geçmez', () => {
  const tum = [html, js, readFileSync(join(kok, 'data', 'projeler.json'), 'utf8'), readFileSync(join(kok, '404.html'), 'utf8')].join('\n');
  assert.doesNotMatch(tum, /[\w.+-]+@[\w-]+\.[\w.]+/, 'düz e-posta adresi var');
});

test('index.html: temel başlıklar, dil ve erişilebilirlik öğeleri', () => {
  assert.match(html, /<html lang="tr">/);
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, 'tek h1 olmalı');
  assert.match(html, /<meta name="description" content="[^"]{40,}"/);
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /class="atla"/);
  assert.match(html, /<main id="icerik">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/sercanesiktas\.github\.io\/">/);
});

test('harici bağlantılar rel="noopener" taşır ve http değil https kullanır', () => {
  for (const m of html.matchAll(/<a\s[^>]*href="(https?:\/\/[^"]+)"[^>]*>/g)) {
    assert.match(m[1], /^https:/, `${m[1]} https olmalı`);
    assert.match(m[0], /rel="noopener"/, `${m[1]} rel="noopener" taşımıyor`);
  }
});

test('hiçbir yerde üçüncü taraf betik ya da yazı tipi yüklenmez', () => {
  assert.doesNotMatch(html, /<script[^>]+src="https?:/);
  assert.doesNotMatch(html, /fonts\.googleapis|cdn\./);
});
