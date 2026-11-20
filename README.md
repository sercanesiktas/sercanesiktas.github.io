# sercanesiktas.github.io

Kişisel site. Çerçevesiz tek sayfa: HTML, CSS ve bir küçük JavaScript dosyası. Dışarıdan betik, yazı tipi ya da çerez yüklemez. GitHub Pages'te yayınlanır.

## Yapı

```
index.html          sayfa
css/stil.css        stil, açık ve koyu tema
js/site.js          dil, tema, proje listesi, e-posta
data/projeler.json  proje açıklamaları
favicon.svg
404.html
```

## Projeler listesi nasıl güncellenir

`data/projeler.json` içindeki her proje için iki dilde bir açıklama ve etiketler yazılıdır. Listeye girmenin iki yolu var:

1. Projenin `yayinda` alanı `true` ise her zaman gösterilir.
2. Ya da GitHub'da bu adla bir depo varsa sayfa, ziyaretçinin tarayıcısında GitHub'a sorup bulunca kendiliğinden gösterir. Yeni bir proje yüklediğinde siteye dokunmana gerek yoktur.

Yeni bir projeyi listeye eklemek için `projeler.json` dosyasına bir kayıt ekle:

```json
{
  "ad": "repo-adi",
  "tr": "Türkçe açıklama (en fazla 140 karakter).",
  "en": "English description (at most 140 characters).",
  "etiketler": ["TypeScript"],
  "yayinda": false
}
```

GitHub'a ulaşılamazsa (ağ, istek sınırı) yalnızca `yayinda: true` olan projeler görünür. GitHub yanıtı tarayıcı oturumunda 10 dakika önbelleğe alınır.

## Yerelde çalıştırma

```bash
npm run sunucu      # http://localhost:8000
npm test
```

Testler `data/projeler.json`'un bütünlüğünü, sayfa içi bağlantıların hedeflerini, yerel dosya başvurularını, e-posta adresinin düz yazı olarak yer almadığını ve üçüncü taraf kaynak yüklenmediğini denetler.

## Notlar

- **E-posta:** adres sayfa kaynağında düz yazı olarak yoktur, tıklanınca JavaScript ile oluşturulur. Bu, e-posta toplayan botlara karşı basit bir önlemdir, kararlı bir saldırgana karşı değil.
- **Renkler:** metin renklerinin zemine oranları WCAG AA (4,5:1) üzerindedir. Açık tema: yazı 15,17, soluk yazı 6,30, vurgu 5,45. Koyu tema: yazı 15,60, soluk yazı 6,98, vurgu 7,36.
- **Tema ve dil:** tarayıcının tercihine göre açılır, düğmelerle değiştirilebilir ve tarayıcıda hatırlanır.
- **Yazı tipleri:** sistem yazı tipleri kullanılır, bu yüzden görünüm işletim sistemine göre hafifçe değişir.
