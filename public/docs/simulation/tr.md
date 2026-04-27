# DocPats Surgical Simulation — Kullanıcı Kılavuzu

**Belge sürümü:** 1.0 (MVP)
**Hedef kitle:** Uygulamalı plastik cerrahlar, KBB uzmanları, estetik hekimler

---

## İçindekiler

1. [Surgical Simulation Nedir](#surgical-simulation-nedir)
2. [2 Dakikalık İş Akışı](#2-dakikalık-iş-akışı)
3. [Yeni Plan Oluşturma](#yeni-plan-oluşturma)
4. [Hasta Fotoğrafı Gereksinimleri](#hasta-fotoğrafı-gereksinimleri)
5. [Editör Arayüzü](#editör-arayüzü)
6. [Kontrol Noktalarıyla Çalışma](#kontrol-noktalarıyla-çalışma)
7. [Gelişmiş Deformasyon Teknikleri](#gelişmiş-deformasyon-teknikleri)
8. [Hasta Konsültasyonu](#hasta-konsültasyonu)
9. [Dışa Aktarma ve Dokümantasyon](#dışa-aktarma-ve-dokümantasyon)
10. [Kaydetme, Kopyalama, Silme](#kaydetme-kopyalama-silme)
11. [Klavye Kısayolları](#klavye-kısayolları)
12. [Gizlilik ve PHI](#gizlilik-ve-phi)
13. [Sorun Giderme](#sorun-giderme)
14. [İş Akışı Önerileri](#iş-akışı-önerileri)
15. [Sürüm Yol Haritası](#sürüm-yol-haritası)

---

## Surgical Simulation Nedir

Surgical Simulation modülü, cerrahi girişim öncesinde hastanın fotoğrafı üzerinde öngörülen operasyon sonucunu görselleştirmeye yarayan bir araçtır. Fotoğrafı yükler, planlanan düzeltme bölgelerine kontrol noktaları yerleştirir ve bunları istenen konuma sürüklersiniz; görüntü gerçek zamanlı olarak deforme olarak beklenen sonucu gösterir.

Araç, Radial Basis Function ve Gaussian filtresi kullanılarak gerçekleştirilen 2B deformasyon (liquify / mesh warp) teknolojisi üzerine kuruludur. Tüm hesaplamalar WebWorker aracılığıyla tarayıcı içinde gerçekleştirilir; hasta verileri, plan DocPats güvenli sunucusuna kaydedilene kadar cihazınızı terk etmez.

**Bu modülü şu amaçlarla kullanın:**

- Operasyon kararı öncesinde hasta konsültasyonu
- Beklenti yönetimi (expectation management)
- Preoperatif planın dokümante edilmesi
- Hasta onamı (informed consent) için görsel materyal oluşturma
- Klinik ekibi içi seçeneklerin tartışılması

**Bu modülün yerini alamayacağı uygulamalar:**

- Hastanın klinik değerlendirmesi
- Radyolojik planlama
- 3B tarama (endike olduğu durumlarda)
- Hukuken geçerli tıbbi rapor

Simülasyon sonucu, **yönlendirici bir görselleştirmedir**; belirli bir operasyon çıktısının garantisi değildir.

---

## 2 Dakikalık İş Akışı

**Adım 1.** Ana menü → "Simülasyon" → sağ üst köşedeki `+ Yeni Plan` düğmesi.

**Adım 2.** Açılan pencerede hasta fotoğrafını sürükleyin veya yükleme alanına tıklayın. Desteklenen formatlar: JPG, PNG, WebP. Maksimum boyut: 20 MB. Minimum çözünürlük: 200×200 px.

**Adım 3.** Modal pencerenin 2. adımında plan adını girin (örneğin: "Yılmaz A. — rinoplasti, varyant 1") ve isteğe bağlı olarak hasta kimliğini ekleyin. "Oluştur" düğmesine tıklayın.

**Adım 4.** Editör açılacaktır. Üst paneldeki `+●` simgesine tıklayarak "Nokta Ekle" moduna geçin. Planlanan düzeltme bölgelerine tıklayın; kontrol noktaları oluşacaktır.

**Adım 5.** Ok-imleç simgesine tıklayarak "Seçim" moduna geçin. Her noktanın mavi dairesini istenen konuma sürükleyin. Görüntü gerçek zamanlı olarak deforme olur.

**Adım 6.** Sonuç operasyon planına uygun göründüğünde sağ üst köşedeki "Önce / Sonra" sekmesine geçin. Kaydırıcı karşılaştırmayı gösterir.

**Adım 7.** "Dışa Aktar" panelinde formatı (JPG/PNG), modu (önce / sonra / side-by-side) seçin ve "İndir" düğmesine tıklayın. Dosya yerel olarak kaydedilir.

Tüm değişiklikler her 2 saniyede bir otomatik olarak kaydedilir. Kaydetme göstergesi toolbar'ın sağ tarafında yer almaktadır.

---

## Yeni Plan Oluşturma

### Plan Adlandırma

Plan adı veri tabanında şifrelenerek yalnızca size görünür olacaktır. Önerilen adlandırma yapısı:

`[Soyadı A.O.] — [operasyon türü], [varyant]`

Örnekler:

- `Demir A.B. — rinoplasti, konservatif`
- `Demir A.B. — rinoplasti, agresif`
- `Kaya V.K. — blepharoplasty, her iki göz`

Aynı hasta için **seçenekleri** (konservatif / orta / agresif) tartışırken birden fazla plan oluşturun. Bu, hastanın konsültasyon sırasında bunları karşılaştırmasına olanak tanır.

### Hasta Kimliği

Alan isteğe bağlıdır. Şunlar kullanılabilir:

- Klinik tıbbi kayıt numarası
- Ad-soyadın baş harfleri
- Dahili kod

Bu alan da şifrelenmektedir. Klinik GDPR/HIPAA gereksinimleri kapsamında faaliyet gösteriyorsa, tam ad yerine kayıt numarasını kullanmak yeterlidir.

### Plan Arama ve Sıralama

Plan listesinde şunlar kullanılabilir:

- **Arama:** plan adına veya hasta kimliğine göre (büyük/küçük harf duyarsız)
- **Sıralama:** en yeniden en eskiye, en eskiden en yeniye, alfabetik

---

## Hasta Fotoğrafı Gereksinimleri

Simülasyonun doğruluğu, girdi fotoğrafının kalitesine kritik düzeyde bağlıdır.

### Zorunlu Koşullar

**Çözünürlük.** Kısa kenar için minimum 1000×1500 px. Optimum 2000×3000 px. Normal modda çekilen akıllı telefon fotoğrafı uygundur. Selfie ve web kamerası fotoğrafları, geniş açılı objektifin yol açtığı perspektif bozulması nedeniyle önerilmez.

**Aydınlatma.** Önden eşit, yüzde sert gölge olmaksızın. Karşı yönden gelen bright sunlight ışıktan kaçının. Optimum aydınlatma: stüdyo softbox'ı veya pencereden gelen dağınık gün ışığı.

**Kameraya mesafe.** En az 1,5 metre. Bu, burun ve çene bölgesindeki perspective distortion'ı en aza indirir. 50-85 mm odak uzaklığı eşdeğeri kullanın (iPhone'da wide değil, 2× telephoto objektif).

**Nötr yüz ifadesi.** Hasta gülümsemez, dudaklar kapalı ancak sıkılmamış. Gözler açık, kameraya bakıyor. Mimik kasılması yok.

**Saç.** Yüzden uzakta. Alnı, kulakları, çene hattını kapatmamalı. İdeal olarak arkaya toplanmış.

**Takı ve makyaj.** Çıkarılmış. Piercing, büyük küpeler, parlak ruj — bunların tümü referansı bozar.

**Nötr arka plan.** Açık, tek renkli (gri, beyaz, açık mavi). Kafa arkasında herhangi bir desen, doku veya parlak nesne olmamalı.

### Çekim Açıları

Kapsamlı planlama için tek hastadan üç fotoğraf bulunması önerilir:

1. **Frontal** (önden) — simetri, burun kanatlarının genişliği, dudak şeklini değerlendirmek için
2. **Profil** (sol ve sağ profil) — açı, burun sırtı, burun ucu, çeneyi değerlendirmek için
3. **3/4** (yarım profil) — orta yüz hacmini, elmacık kemiklerini değerlendirmek için

**Önemli:** Mevcut sürümde (MVP) her fotoğraf ayrı bir plan olarak işlenir. Bir sonraki sürümde (v2) tek plan içinde çok görüş (multi-view) özelliği planlanmaktadır.

### Fotoğraf Gereksinimleri Karşılamıyorsa Ne Yapmalı

Yüklemeyin. Hastadan yeniden fotoğraf çektirmesini isteyin ya da klinikte kendiniz çekin. Kalitesiz fotoğraf üzerindeki deformasyon yanlış beklentilere yol açar ve bu durum operasyon sonrasında çatışmaya neden olabilir.

---

## Editör Arayüzü

### Sayfa Başlığı

- **"← Plan Listesine" geri oku** — tüm planların listesine geri dönüş.
- **Plan adı ve hasta kimliği** — okun altında görüntülenir.
- **"Editör / Önce-Sonra" sekmeleri** — çalışma modu değiştirme.

### Editör Üst Paneli (Toolbar)

Canvas'ın sağ üst köşesinde yer alır. Soldan sağa öğeler:

**1. "Seçim" modu** (ok-imleç simgesi). Aktifken mavi renkte vurgulanır. Bu modda:

- Canvas arka planına tıklayıp sürükleme — kaydırma (pan)
- Noktanın mavi dairesine tıklama — seçim ve sürükleme (drag)
- Sarı kareye tıklama — noktayı seçme
- Alt + sarı kareyi sürükleme — anchor'ı taşıma

**2. "Nokta Ekle" modu** (`+●` simgesi). Aktifken mavi. Bu modda fotoğrafa tıklamak yeni kontrol noktası oluşturur.

**3. Geri Al / Yinele** (↶ / ↷ simgeleri). Son işlemi geri alma ve yeniden uygulama. Geri alınacak işlem yoksa pasif kalır. Kısayol: Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y).

**4. Zoom −** / yüzde / **Zoom +**. Görüntüyü küçültme ve büyütme. Mevcut yüzde ortada görüntülenir. Fare tekerleği ile de kullanılabilir — zoom imlece bağlıdır (Figma'daki gibi).

**5. "Fit"** — fotoğrafı canvas boyutuna sığdır.

**6. "1:1"** — zoom'u %100'e sıfırla, fotoğrafı ortala.

**7. Kaydetme göstergesi** — sağdaki son öğe:

- `●` mavi titreşimli — kaydediliyor
- `✓` yeşil — kaydedildi
- `✕` kırmızı — kaydetme hatası (internet bağlantısını kontrol edin)

### Alt Bilgi Çubuğu

Sol alt köşede şunları gösterir:

- Fotoğraf çözünürlüğü (örnek: `677×1200`)
- Deformasyon noktalarının sayısı

### Nokta Özellikleri Paneli

Herhangi bir nokta seçildiğinde sağ alt köşede belirir. İçeriği:

- **Radius (Etki Yarıçapı)** — %1–50 aralığında kaydırıcı. Noktanın çevresindeki deformasyon bölgesini belirler. Radius ne kadar küçükse değişiklik o kadar lokalize olur. Değer, görüntünün uzun kenarının yüzdesi olarak gösterilir. Canvas üzerindeki noktalı çember radius'u görselleştirir.

- **Strength (Kuvvet)** — −1,00 ile +1,00 arasında kaydırıcı. 1,00'de nokta pikselleri kaydırma yönünde tam kuvvetle çeker. 0,50'de yarım kuvvette. Negatif değerlerde nokta pikselleri kaydırmanın tersine **iter** (ters düzeltme efektleri için kullanılır).

- **Başlıktaki × işareti** — noktayı sil.

- **Panel altındaki ipuçları:**
  - `Alt + kare sürükleme — merkezi kaydır`
  - `Del — sil`

---

## Kontrol Noktalarıyla Çalışma

### Kontrol Noktasının Anatomisi

Her nokta dört öğeden oluşur:

1. **Sarı kare (Anchor)** — deformasyonun başlangıç merkezi. Genellikle ilk tıklama noktasıyla çakışır. Varsayılan olarak hareket etmez.

2. **Mavi daire (Current)** — hedef nokta. Anchor konumundaki pikseli "nereye taşımak istediğinizi" gösterir. Sürükleme için kullanılan temel öğedir.

3. **Anchor ile current arasındaki noktalı çizgi** — kaydırma vektörü. Deformasyonun yönünü ve büyüklüğünü gösterir.

4. **Anchor etrafındaki noktalı çember** — noktanın etki bölgesi. Piksel merkezden uzaklaştıkça kaydırma azalır. Çember dışında deformasyon yoktur.

### Nokta Ekleme

1. `+●` moduna geçin.
2. Düzeltme planlandığı bölgelere tıklayın. Her tıklama yeni nokta oluşturur.
3. Oluşturulduğunda nokta anchor = current durumundadır (yani kaydırma sıfırdır). Varsayılan radius %8, strength 1,00'dir.

### Nokta Taşıma

1. "Seçim" moduna geçin.
2. Sol fare düğmesiyle mavi daireyi basılı tutun ve istenen konuma sürükleyin.
3. Hareket sırasında fotoğraf gerçek zamanlı olarak deforme olur.

### İnce Ayar

1. Noktayı seçin (mavi daire veya sarı kareye tıklayın).
2. Sağ alt panelde şunları düzenleyin:
   - Radius — etki bölgesinin genişliği
   - Strength — deformasyon kuvveti

### Nokta Silme

Üç yöntem:

- Noktayı seçin → özellikler panelindeki × düğmesine tıklayın
- Noktayı seçin → klavyede Delete veya Backspace tuşuna basın
- Noktayı seçin → Escape seçimi iptal eder (silmez)

### Nokta Limiti

Teknik maksimum: plan başına 200 nokta. Pratikte kaliteli bir rinoplasti için 10–25 nokta yeterlidir; daha karmaşık girişimler (tam yüz rekonstrüksiyonu) için 50–70 noktaya kadar çıkılabilir.

---

## Gelişmiş Deformasyon Teknikleri

Mevcut MVP motoru global RBF deformasyonu kullanmaktadır. Bu yaklaşım lokal değişiklikler için iyi sonuçlar vermekle birlikte, hassas kontrol için belirli tekniklerin uygulanmasını gerektirir.

### Teknik 1 — Lokal Değişiklikler için Küçük Noktalar

Sorun: büyük radius yalnızca hedef bölgeyi değil, komşu yapıları da deforme eder. Çözüm — hassas değişiklikler için küçük radius (%2-4) kullanmak.

**Örnek: burun hörgücünü düzleştirme**

1. Hörgücün tam tepesine bir nokta oluşturun.
2. Radius = %2-3 olarak ayarlayın.
3. Strength = 1,00.
4. Mavi daireyi **dikey olarak aşağı** doğru 3-5 piksel sürükleyin.
5. Hörgüç düzleşir, burun sırtının komşu bölümleri neredeyse hareket etmez.

### Teknik 2 — Çizgi Boyunca Nokta Zincirleri

Sorun: tek nokta dairesel (radyal) bozulma yaratır. **Lineer** bir yapının düzeltilmesi için (burun sırtı, çene hattı, dudak hattı) nokta zinciri gereklidir.

**Örnek: burun sırtını düzleştirme**

1. Burun sırtı boyunca, burun uzunluğunun %10-15'i aralıklarla 4-5 nokta oluşturun.
2. Her nokta için radius %2-3.
3. Mavi daireleri istenen düz çizgi üzerinde hizalanacak şekilde sürükleyin.
4. Sonuç: burun sırtı düzleşir, yüzün geri kalanı etkilenmez.

### Teknik 3 — Ankraj Noktaları (Anchors)

Sorun: bir bölge deforme edildiğinde komşu bölge (örneğin burun yanındaki yanak) RBF alanının yayılması nedeniyle de hafifçe hareket eder.

Çözüm — düzeltme bölgesinin çevresine **ankraj noktaları** yerleştirmek. Ankraj noktalarında anchor = current konumundadır (mavi daire hareket ettirilmez), ancak warp hesaplamasına dahil olarak komşu piksellerin kaymasını engeller.

**Örnek: dudaklar hareket etmeden burun ucunu düzeltme**

1. Burun ucuna çalışma noktası oluşturun, radius %5, yukarı sürükleyin.
2. Filtrum üzerine (burun ile dudak arasına) radius %4 olan bir ankraj noktası oluşturun, **hareket ettirmeyin**.
3. Burun kanatlarının her iki yanına radius %3 olan ankraj noktaları oluşturun, **hareket ettirmeyin**.
4. Burun ucu yükselir, filtrum ve dudak yerinde kalır.

### Teknik 4 — "Genişletme" için Negatif Strength

Bazen bir noktayı kaydırmak yerine bölgeyi "genişletmek" gerekebilir (daha geniş burun kanatları, daha dolgun dudaklar).

1. İstenen genişleme bölgesinin merkezine bir nokta oluşturun.
2. Mavi daireyi istenen sınırın **ötesine** sürükleyin.
3. Strength değerini **−0,3 ile −0,5** arasında ayarlayın (negatif değer).
4. Radius = %5-10.
5. Bölge noktadan itilir = genişleme etkisi oluşur.

### Teknik 5 — Kopyalar Aracılığıyla Çoklu Varyantlar

Konsültasyon için aynı operasyonun birkaç varyantına sahip olmak pratiktir. Plan listesindeki "Kopyala" işlevini kullanın:

1. "Demir A.B. — rinoplasti, varyant 1 (konservatif)" planı oluşturun.
2. Düzenleyin: küçük kaydırmalar, ince değişiklikler.
3. Plan listesinde → bu planın "Kopyala" düğmesine tıklayın.
4. Kopyayı yeniden adlandırın: "Demir A.B. — rinoplasti, varyant 2 (orta)".
5. Açın, deformasyonları artırın.
6. "Varyant 3 (agresif)" için tekrarlayın.

Konsültasyonda hastaya üç varyantı sırayla gösterin.

### Kaçınılması Gerekenler

**Büyük radius ve büyük kaydırmayı aynı anda kullanmayın.** Bu durum arka planda ve saç çizgisinde dalga artefaktları oluşturur.

**Arka planı deforme etmeyin.** Saç çizgisi / kulak / omuz radius içine giriyorsa bunlar da bozulur. Arka planı "kilitlemek" için çevreye ankraj noktaları yerleştirin.

**Çok uzaktan (zoom out) çalışmayın.** Hassas nokta yerleştirme için %100 veya daha fazla zoom gereklidir. Toolbar'daki `+` ve `1:1` düğmelerini kullanın.

**Simetriyi göz ardı etmeyin.** Hasta burun düzeltmesi istiyorsa her iki tarafı uyumlu şekilde deforme edin. Mevcut MVP'de bu işlem manuel olarak yapılmaktadır (mirror modu v2'de eklenecektir).

---

## Hasta Konsültasyonu

"Önce / Sonra" sekmesi **hastaya gösterim** amacıyla tasarlanmıştır. Teknik öğeler en aza indirilmiş, görsel karşılaştırma ön plana çıkarılmıştır.

### Bölücü Kaydırıcı

Merkezi görüntü, yuvarlak tutacaklı dikey bir çizgiyle ikiye bölünmüştür. Sola veya sağa sürükleyerek hasta şunları görebilir:

- Sol bölüm — "Önce" fotoğrafı (orijinal)
- Sağ bölüm — "Sonra" fotoğrafı (deformasyon uygulanmış)

Karışıklık olmaması için köşelerde "ÖNCE" ve "SONRA" etiketleri bulunur.

### Önerilen Konsültasyon Senaryosu

1. Planı tam ekranda açın (tam ekran için tarayıcıda F11).
2. Hastaya "Editör" sekmesini gösterin — noktaları görsel işaretçi olarak kullanarak ne planladığınızı açıklayın.
3. "Önce / Sonra" sekmesine geçin, kaydırıcıyı hastanın kendisinin kullanmasına izin verin.
4. Bunun beklentileriyle örtüşüp örtüşmediğini tartışın.
5. Başka varyantlar varsa (konservatif / agresif) mevcut planı kapatın, bir sonrakini açın.
6. Sonuç olarak bir varyantı nihai olarak seçin.
7. Aydınlatılmış onam formuna eklemek üzere PDF (veya JPG+baskı) formatında dışa aktarın.

### Hastaya Söylenmesi Gerekenler

Simülasyon, **beklenen sonucun görselleştirmesidir, bir garanti değildir**. Gerçek operasyon sonucu şu faktörlere bağlıdır:

- Doku özellikleri (cilt kalınlığı, elastikiyet, kıkırdak kalınlığı)
- İyileşme ve skar oluşum süreci
- Cerrahın tekniği
- Hastanın postoperatif rejime uyumu

Simülasyondan ±%10-20 oranında sapma normaldir ve operasyon kusuru sayılmaz. Bu ifadeyi aydınlatılmış onam belgesinde kullanın.

---

## Dışa Aktarma ve Dokümantasyon

### "Dışa Aktar" Paneli

"Önce / Sonra" sekmesinin sağ tarafında yer alır.

### Ne Dışa Aktarılmalı

**1. Operasyon öncesi (orijinal)** — deformasyon uygulanmamış hastanın orijinal fotoğrafı. Tıbbi kayıt için ve sonuçla karşılaştırılacak "öncesi" belgesi olarak kullanılır.

**2. Operasyon sonrası (deformasyonlu)** — warp uygulanmış fotoğraf. Hastaya gösterim ve plan dokümantasyonu için kullanılır.

**3. Yan yana: Önce ve Sonra** — "ÖNCE" ve "SONRA" etiketleriyle tek görüntüde side-by-side kompozisyon. Baskı almak ve aydınlatılmış onam için en pratik formattır.

### Format

**JPG** — çoğu durum için önerilir. Küçük dosya boyutu, %85-92'de kabul edilebilir kalite.

**PNG** — sıkıştırmasız, maksimum kalite. Sonucun Photoshop'ta düzenleneceği veya büyük formatta baskı alınacağı durumlarda kullanın.

### JPG Kalitesi

%40-100 arasında kaydırıcı. Öneriler:

- %60-70 — e-posta ve mesajlaşma uygulamaları için
- %80-90 — belge baskısı standardı
- %95-100 — arşiv ve yayın için

### İndirme

Parametreleri ayarladıktan sonra "İndir" düğmesine tıklayın. Dosya, tarayıcınızın İndirilenler klasörüne `plan-2026-04-24-rinoplasti.jpg` biçiminde bir adla kaydedilir.

### Dokümantasyon Önerisi

Her operasyon için hastanın elektronik kayıtlarına şunları kaydedin:

1. Orijinal fotoğraf ("Önce" dışa aktarımı)
2. Sonuç simülasyonu ("Sonra" dışa aktarımı)
3. Yan yana karşılaştırma ("Yan Yana" dışa aktarımı)
4. Neyin planlandığını anlamak için görünür kontrol noktalarıyla editörün ekran görüntüsü (Print Screen ile)

Bu, preoperatif planlama için eksiksiz bir dokümantasyon oluşturur ve hasta ile postoperatif anlaşmazlıklara karşı koruma sağlar.

---

## Kaydetme, Kopyalama, Silme

### Otomatik Kaydetme

Tüm değişiklikler (nokta ekleme/silme, parametrelerini değiştirme, sürükleme) son işlemden **2 saniye sonra otomatik olarak** kaydedilir. Manuel bir işlem gerekmez.

Üst toolbar'daki kaydetme göstergesi mevcut durumu gösterir:

- `●` mavi titreşimli — kaydediliyor
- `✓` yeşil — kaydedildi
- `✕` kırmızı — hata (internet bağlantısını kontrol edin)

Sayfa kapatıldığında veya başka bir sekmeye geçildiğinde — zorunlu kaydetme gerçekleşir. Veriler kaybolmaz.

### Plan Kopyalama

Plan listesinde her kartın üç düğmesi bulunur: "Aç", "Kopyala", "Sil".

**Kopyala** işlevi, aynı fotoğraf ve tüm kontrol noktalarıyla planın tam bir kopyasını oluşturur. Kopya listenin en üstünde görünür. Düzenlemeden önce yeniden adlandırın (örneğin adın sonuna "(varyant 2)" ekleyin).

Şu amaçlarla kullanılır:

- Operasyonun birden fazla varyantını oluşturma
- Deneysel değişikliklerden önce planı yedekleme
- Benzer anatomiye sahip hastalara ayarları aktarma

### Plan Silme

"Sil" düğmesi onay ister. Onaylandıktan sonra:

- Plan veritabanında silindi olarak işaretlenir (soft delete)
- Hastanın fotoğrafı, R2 deposundan 24 saat içinde silinir (bu fotoğrafa kopyalardan başka bağlantı yoksa)
- Plan listeden kaybolur

**Uyarı:** Silme işlemi geri alınamaz. Güvence gerekiyorsa orijinali silmeden önce planı kopyalayın.

---

## Klavye Kısayolları

Giriş alanları dışında sayfanın her yerinde çalışır.

- **`Ctrl + Z`** — Geri Al (Undo)
- **`Ctrl + Shift + Z`** veya **`Ctrl + Y`** — Yinele (Redo)
- **`Delete`** veya **`Backspace`** — Seçili noktayı sil
- **`Escape`** — Seçimi iptal et ve "Seçim" moduna geç
- **`Fare tekerleği`** — İmleç konumuna zoom
- **`Alt + sarı kare sürükleme`** — Seçili noktanın anchor'ını taşı

Sonraki sürümlerde şunların eklenmesi planlanmaktadır:

- `V` — "Seçim" modu
- `A` — "Ekle" modu
- `+` / `−` — zoom
- `0` — görünüme sığdır
- `1` — %100 zoom
- `Space + sürükleme` — geçici pan modu

---

## Gizlilik ve PHI

DocPats Surgical Simulation, hasta tıbbi verileri bakımından HIPAA (ABD) ve GDPR (AB) gereksinimlerine uygun şekilde tasarlanmıştır.

### Şifrelenenler

- **Plan adı** — AES-256-GCM, veri tabanında şifrelenir
- **Hasta kimliği** — AES-256-GCM, veri tabanında şifrelenir
- **Fotoğraf** — R2'de sunucu taraflı şifrelemeyle depolanır, yalnızca yetkili oturum aracılığıyla erişilebilir

### Şifrelenmeyenler

- Kontrol noktaları (koordinatlar, radius, strength) — bunlar HIPAA kapsamında PHI sayılmaz; zira fotoğraf ve meta verilerden bağımsız olarak hastayı tanımlamazlar
- Plan oluşturma/güncelleme tarihleri

### Erişim

- Yalnızca DocPats hesabının sahibi olarak siz kendi planlarınıza erişebilirsiniz
- Ne Anthropic ne de DocPats ekibi planlarınızın içeriğini okuyabilir
- Mahkeme talebi durumunda — şifrelenmiş veriler sunulur, anahtar kliniktedir

### Öneriler

**DocPats hesabınız için güçlü parola ve 2FA kullanın.** Hesabınızın ele geçirilmesi hasta PHI'sinin ifşası anlamına gelir.

**Ekran görüntülerini PIN/parola koruması olmayan yerel diske kaydetmeyin.** Dışa aktarılan JPG/PNG dosyaları otomatik olarak şifrelenmez.

**Klinik bilgisayarı elden çıkarmadan önce** tarayıcı önbelleğinin fotoğraf kopyaları içermediğinden emin olun. Tarayıcı gizlilik araçlarını kullanın (örneğin Chrome'da Önbelleği Temizle).

**Avrupalı hastalarla çalışırken** (GDPR) — fotoğrafı sisteme yüklemeden **önce** biyometrik veri işleme için yazılı onam alın.

---

## Sorun Giderme

### Fotoğraf yüklenmiyor, "Görsel okunamadı" veya "Image cannot be read" hatası görünüyor

**Neden 1:** Format desteklenmiyor. Yalnızca JPG, PNG, WebP desteklenmektedir. HEIC (iPhone yerel formatı) **çalışmaz**.

**Çözüm:** HEIC'i JPG'ye dönüştürün (Mac'te Fotoğraflar uygulaması veya çevrimiçi dönüştürücü).

**Neden 2:** Fotoğraf 200×200 px'den küçük.

**Çözüm:** Küçük resim (thumbnail) veya önizleme yerine orijinal fotoğrafı kullanın.

**Neden 3:** Dosya bozuk ya da gerçek bir görüntü dosyası değil (örneğin .docx'ten yeniden adlandırılmış .jpg).

**Çözüm:** Dosyayı standart görüntüleyicide açın (Fotoğraflar, Preview). Açılmıyorsa dosya bozuktur; başka bir dosya kullanın.

### Editör yükleniyor ancak canvas boş

**Neden:** R2 deposundan fotoğraf yüklenirken CORS hatası. Genellikle Cloudflare'in doğru header'ları henüz önbelleğe almadığı ilk yüklemede yaşanır.

**Çözüm:** 30 saniye bekleyin, Hard Refresh yapın (Ctrl+Shift+R). Sorun devam ederse DocPats teknik desteğine bildirin.

### Noktalar görünüyor ancak sürüklenemiyor

**Neden:** Tarayıcı pointer capture event'larını almıyor. Çoğunlukla eski tarayıcı veya tablet/stylus'a özgü ayardan kaynaklanır.

**Çözüm:** Tarayıcıyı son sürüme güncelleyin (Chrome 120+, Firefox 115+, Edge 120+, Safari 17+). Dokunmatik yüzeyde (touchpad) — fare kullanın.

### Deformasyon fotoğrafa uygulanmıyor (noktalar hareket ediyor ancak fotoğraf değişmiyor)

**Neden:** WebWorker yüklenmemiş. Chrome, cihaz belleği yetersizse worker'ı engelleyebilir.

**Çözüm:** Gereksiz sekmeleri kapatın, editörü yeniden yükleyin (F5). Sorun tekrarlarsa başka bir tarayıcı veya 8 GB+ RAM'li bilgisayar kullanın.

### Kaydetme göstergesi kırmızı (✕)

**Neden:** DocPats sunucusuna bağlantı yok ya da oturum süresi dolmuş.

**Çözüm:** İnternet bağlantısını kontrol edin. Her şey normalse sayfayı yeniden yükleyin (son 2 saniyedeki değişiklikler kaybolabilir, geri kalan her şey kaydedilmiştir).

### Plan listesi boş, oysa planlar oluşturmuştum

**Neden:** Farklı bir hesapla oturum açtınız ya da yanlışlıkla geliştirme/test ortamına geçiş yaptınız.

**Çözüm:** URL'yi (klinikteki production URL'si olmalı) ve hesap ayarlarındaki e-posta adresini kontrol edin.

### Fotoğraf düşük çözünürlükte dışa aktarılıyor

**Neden:** Tam çözünürlüklü orijinal yerine önizleme sürümünü (maks. 1200 px) kullanıyorsunuz.

**Çözüm:** Dışa aktarma sırasında sistem warp'ı otomatik olarak tam çözünürlüğe uygular — dışa aktarma panelinin sağ üst köşesindeki yükleme göstergesi kaybolana kadar bekleyin. Beklemeden "İndir" düğmesine tıklamayın.

### Editör yavaş çalışıyor, takılıyor

**Neden:** 50+ nokta ve 4000×6000 px fotoğraf içeren planlarda deformasyon, düşük donanımlı cihazlar için ağır hale gelir.

**Çözüm:**

- Fit modunda çalışın (daha küçük önizleme hesaplama açısından daha ekonomiktir)
- Nokta sayısını azaltın (yakın noktaları birleştirin)
- Dedicated GPU'lu cihaz kullanın

---

## İş Akışı Önerileri

Kullanım deneyiminden elde edilen optimum konsültasyon iş akışı:

### Hasta Gelmeden Önce (10-15 dakika)

1. Hastanın fotoğrafını açın (önceden e-posta ile alınmış veya ön ziyarette çekilmiş).
2. DocPats'te 2-3 varyant planı oluşturun:
   - `[Hasta] — konservatif`
   - `[Hasta] — orta`
   - `[Hasta] — agresif`
3. Her birinde noktaları önceden yerleştirin, kaydedin.

### Konsültasyon Sırasında (30-40 dakika)

1. Görselleştirme olmaksızın operasyonun olanaklarını ve sınırlılıklarını hastaya açıklayın.
2. DocPats'i büyük monitörde açın (minimum 24").
3. Yerleştirilmiş noktalarla **editörü** gösterin — anatomisini açıklayın.
4. **Önce/Sonra** sekmesine geçin — kaydırıcıyı hastanın kendisinin kullanmasına izin verin.
5. **3 varyantı** sırayla gösterin. Her birini tartışmak için 5-10 dakika ayırın.
6. Hastanın beklentilerini ve kaygılarını tartışın.
7. Nihai varyantı birlikte seçin.

### Konsültasyon Sonrasında (5 dakika)

1. Nihai planı %90 JPG kalitesinde 3 formatta dışa aktarın (önce / sonra / side-by-side).
2. Hastanın elektronik tıbbi kayıtlarına kaydedin.
3. Hastanın fiziksel klasörü için side-by-side baskı alın.
4. Aydınlatılmış onam formuna hasta imzasıyla ekleyin: "_Beklenen sonucun simülasyonunu gördüm ve bunun yaklaşık bir görselleştirme olduğunu anlıyorum_".
5. Operasyon günü (veya bir gün önce) — ekiple taze bir tekrar inceleme için DocPats'te nihai planı açın.

---

## Sürüm Yol Haritası

Mevcut sürüm (MVP) — temel işlev seti.

### v2.0 "Assisted" (önümüzdeki 3-4 haftada planlanıyor)

- **MediaPipe Face Mesh aracılığıyla otomatik yüz işaretlemesi** — plan açıldığında 468 anatomik landmark otomatik olarak belirir
- **Nokta grupları** — burun / dudaklar / gözler / kaşlar ayrı ayrı göster/gizle
- **Kalibrasyon** — pupillalar arası mesafeyi belirterek tüm ölçümleri milimetre cinsinden alma
- **Tıbbi ölçümler** — nasofrontal açı, nazolabiyal açı, burun ucu projeksiyonu (Goode oranı), alar taban genişliği
- **Symmetry lock** — sağ yarıyı sol yarıya yansıtma
- **Nazal cerrahi ön ayarları (presets)** — hump reduction / tip refinement / nostril narrowing için önceden yapılandırılmış nokta setleri
- **Maske koruması** — deformasyon saç ve arka planı otomatik olarak etkilemez

### v3.0 "Professional"

- **Liquify brush** — noktalara ek olarak Photoshop tarzı interaktif araç
- **Referans kütüphanesi** — hızlı eşleştirme için "hedef burun" veritabanı
- **Multi-view** — tek planda 3-5 çekim açısı, eş zamanlı deformasyon
- **Hasta için PDF raporu** — klinik logosu, ölçümler ve onam metniyle
- **Konsültasyon modu** — sunum için tam ekran kullanıcı arayüzü

### v4.0 "3D"

- Makine öğrenmesi ile 2B'den 3B'ye yeniden yapılandırma
- 3B mesh düzenleme
- Hastanın akıllı telefonunda AR önizleme

---

_Belge, DocPats editörlüğü tarafından Dr. İsmail'in gözetiminde hazırlanmıştır, Nisan 2026._