# DocPats Surgical Simulation — Kullanıcı Kılavuzu

**Doküman sürümü:** 1.0 (MVP)
**Kimler için:** Uygulayıcı plastik cerrahlar, ENT uzmanları, kozmetologlar

---

## İçindekiler

1. [Surgical Simulation nedir](#surgical-simulation-nedir)
2. [2 dakikada iş akışı](#2-dakikada-iş-akışı)
3. [Yeni plan oluşturma](#yeni-plan-oluşturma)
4. [Hasta fotoğrafı gereksinimleri](#hasta-fotoğrafı-gereksinimleri)
5. [Editör arayüzü](#editör-arayüzü)
6. [Control points ile çalışma](#control-points-ile-çalışma)
7. [İleri düzey deformasyon teknikleri](#ileri-düzey-deformasyon-teknikleri)
8. [Hasta ile konsültasyon](#hasta-ile-konsültasyon)
9. [Dışa aktarma ve dokümantasyon](#dışa-aktarma-ve-dokümantasyon)
10. [Kaydetme, kopyalar, silme](#kaydetme-kopyalar-silme)
11. [Kısayol tuşları](#kısayol-tuşları)
12. [Gizlilik ve PHI](#gizlilik-ve-phi)
13. [Sorun giderme](#sorun-giderme)
14. [Workflow önerileri](#workflow-önerileri)
15. [Sürüm yol haritası](#sürüm-yol-haritası)

---

## Surgical Simulation nedir

Surgical Simulation modülü, plastik cerrahi girişiminin öngörülen sonucunu, müdahale öncesinde hastanın fotoğrafı üzerinde görselleştirmeye yönelik bir araçtır. Fotoğrafı yüklersiniz, planlanan düzeltme bölgelerine control points yerleştirirsiniz, bunları istenen konuma sürüklersiniz — görüntü gerçek zamanlı olarak deforme olur ve beklenen sonucu gösterir.

Araç, Radial Basis Function ve Gaussian filtresi uygulanan 2D deformasyon (liquify / mesh warp) temelinde çalışır. Tüm hesaplamalar WebWorker kullanılarak tarayıcıda gerçekleştirilir; hasta verileri, plan korumalı DocPats sunucusuna kaydedilene kadar cihazınızdan ayrılmaz.

**Bu modülü şu amaçlarla kullanın:**

- Ameliyat kararı verilmeden önce hasta ile konsültasyon
- Beklentilerin netleştirilmesi (expectation management)
- Preoperatif planın belgelenmesi
- Hastanın onamı (informed consent) için görsel materyal oluşturulması
- Klinik ekibi içinde seçeneklerin tartışılması

**Modül şunların yerini almaz:**

- Hastanın klinik değerlendirmesi
- Radyolojik planlama
- 3D tarama (endikasyon varsa)
- Hukuken bağlayıcı tıbbi rapor

Simülasyon sonucu **yaklaşık bir görselleştirmedir**, belirli bir ameliyat sonucunun garantisi değildir.

---

## 2 dakikada iş akışı

**Adım 1.** Ana menü → "Simülasyon" → sağ üst köşedeki `+ Yeni plan` düğmesi.

**Adım 2.** Açılan pencerede hastanın fotoğrafını sürükleyin veya yükleme alanına tıklayın. Kabul edilen formatlar: JPG, PNG, WebP. Maksimum boyut: 20 MB. Minimum çözünürlük: 200×200 px.

**Adım 3.** Modal pencerenin 2. adımında plan adını girin (örneğin: "İvanov İ.A. — rinoplasti, seçenek 1") ve isteğe bağlı olarak hasta kimliğini yazın. "Oluştur"a basın.

**Adım 4.** Editör açılır. Modu "Nokta ekle" olarak değiştirin (üst paneldeki `+●` simgesi). Planlanan düzeltme bölgelerine tıklayın — control points görünecektir.

**Adım 5.** "Seçim" moduna geçin (imleç-ok simgesi). Her noktanın mavi dairesini istenen konuma sürükleyin. Görüntü gerçek zamanlı olarak deforme olur.

**Adım 6.** Sonuç ameliyat planına uygun hâle geldiğinde sağ üst köşedeki "Önce / Sonra" sekmesine geçin. Kaydırıcı karşılaştırmayı gösterir.

**Adım 7.** "Dışa aktarma" panelinde formatı (JPG/PNG) ve modu (önce / sonra / side-by-side) seçip "İndir"e basın. Dosya yerel olarak kaydedilir.

Tüm değişiklikler her 2 saniyede bir otomatik olarak kaydedilir. Kaydetme göstergesi toolbar'ın sağ kısmında yer alır.

---

## Yeni plan oluşturma

### Planın adlandırılması

Plan adı veritabanında şifrelenir ve yalnızca sizin erişiminize açıktır. Önerilen ad yapısı:

`[Soyadı A.S.] — [ameliyat tipi], [seçenek]`

Örnekler:

- `Petrova A.B. — rinoplasti, konservatif`
- `Petrova A.B. — rinoplasti, agresif`
- `Sidorov V.K. — blepharoplasty, her iki göz`

**Seçenekleri** tartışıyorsanız — konservatif / ılımlı / agresif — aynı hasta için birden fazla plan oluşturun. Bu, hastanın konsültasyonda bunları karşılaştırmasına olanak tanır.

### Hasta kimliği

Bu alan isteğe bağlıdır. Şunları kullanabilirsiniz:

- Kliniğin tıbbi dosya numarası
- Baş harfler
- Dahili kod

Bu alan da şifrelenir. Klinik GDPR/HIPAA gerekliliklerine tabi çalışıyorsa tam ad-soyad kullanmayın — dosya numarası yeterlidir.

### Planlarda arama ve sıralama

Plan listesinde şunlar mevcuttur:

- Plan adına veya hasta kimliğine göre **arama** (büyük/küçük harf duyarsız)
- **Sıralama**: yeniden eskiye, eskiden yeniye, alfabetik

---

## Hasta fotoğrafı gereksinimleri

Simülasyonun doğruluğu, girdi fotoğrafının kalitesine kritik ölçüde bağlıdır.

### Zorunlu koşullar

**Çözünürlük.** Kısa kenarda en az 1000×1500 px. Optimum 2000×3000 px. Akıllı telefonun standart modunda çekilen fotoğraf uygundur. Selfie ve web kamerası fotoğrafları, geniş açılı objektifin yol açtığı perspektif bozulması nedeniyle önerilmez.

**Aydınlatma.** Önden ve homojen olmalı, yüzde keskin gölge bulunmamalıdır. Bright sunlight kontra aydınlatmadan kaçının. Optimum olan stüdyo softbox'ı veya pencereden gelen dağınık gün ışığıdır.

**Kameraya uzaklık.** 1.5 metreden yakın olmamalıdır. Bu, burun ve çenenin perspective distortion'unu en aza indirir. 50-85 mm focal length eşdeğerini kullanın (iPhone'da wide değil, 2× telephoto objektif).

**Nötr yüz ifadesi.** Hasta gülümsemez, dudaklar kapalı ancak sıkılmamış olmalıdır. Gözler açık ve kameraya bakmalıdır. Hiçbir mimik kasılması olmamalıdır.

**Saçlar.** Yüzden uzaklaştırılmış olmalıdır. Alnı, kulakları ve mandibula hattını kapatmamalıdır. İdeal olarak arkada toplanmış olmalıdır.

**Takı ve makyaj.** Çıkarılmış olmalıdır. Piercing, büyük küpeler, parlak ruj — hepsi referansı bozar.

**Nötr arka plan.** Açık ve tek renkli (gri, beyaz, soluk mavi). Baş arkasında desen, doku veya parlak nesne olmamalıdır.

### Çekim açıları

Tam kapsamlı planlama için aynı hastanın üç fotoğrafının bulunması tercih edilir:

1. **Frontal** (önden) — simetri, nazal ala genişliği ve dudak formunun değerlendirilmesi için
2. **Profile** (profil, sol ve sağ) — nazofasiyal açı, nazal dorsum, nazal tip ve çenenin değerlendirilmesi için
3. **3/4** (yarım profil) — orta yüz bölgesi volümü ve zigomanın değerlendirilmesi için

**Önemli:** mevcut sürümde (MVP) her fotoğraf = ayrı bir plan. Sonraki sürümde (v2) tek plan içinde multi-view desteği planlanmaktadır.

### Fotoğraf gereksinimleri karşılamıyorsa ne yapmalı

Yüklemeyin. Hastadan yeniden çekmesini isteyin veya klinikte kendiniz çekin. Kötü bir fotoğraf üzerindeki deformasyon yanlış beklenti oluşturur ve bu da ameliyat sonrası anlaşmazlığa yol açar.

---

## Editör arayüzü

### Sayfa başlığı

- **"← Plan listesine" oku** — tüm planların listesine dönüş.
- **Plan adı ve hasta ID'si** — okun altında gösterilir.
- **"Editör / Önce-Sonra" sekmeleri** — çalışma modunun değiştirilmesi.

### Editörün üst paneli (toolbar)

Canvas'ın sağ üst köşesinde yer alır. Öğeler soldan sağa:

**1. "Seçim" modu** (imleç-ok simgesi). Etkin olduğunda mavi vurgulanır. Bu modda:

- Canvas arka planına tıklayıp sürükleme — panoramik kaydırma (pan)
- Noktanın mavi dairesine tıklama — seçim + sürükleme (drag)
- Sarı kareye tıklama — noktanın seçimi
- Alt + sarı kareyi sürükleme — anchor'ın taşınması

**2. "Nokta ekle" modu** (`+●` simgesi). Etkin olduğunda mavi. Bu modda fotoğrafa tıklamak yeni bir control point oluşturur.

**3. Undo / Redo** (↶ / ↷ simgeleri). Son işlemin geri alınması ve yeniden uygulanması. Geri alınacak bir şey yoksa etkin değildir. Kısayol: Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y).

**4. Zoom −** / yüzde / **Zoom +**. Ölçeğin küçültülmesi ve büyütülmesi. Geçerli yüzde ortada gösterilir. Fare tekerleğiyle de kullanılabilir — zoom imlece bağlıdır (Figma'daki gibi).

**5. "Fit"** — fotoğrafı canvas boyutuna sığdırma.

**6. "1:1"** — zoom'u %100'e sıfırlama, fotoğrafı ortalama.

**7. Kaydetme göstergesi** — en sağdaki öğe:

- `●` mavi ve yanıp sönüyor — kaydetme sürüyor
- `✓` yeşil — kaydedildi
- `✕` kırmızı — kaydetme hatası (internet bağlantısını kontrol edin)

### Alt bilgi şeridi

Sol alt köşede şunları gösterir:

- Fotoğrafın çözünürlüğü (örnek: `677×1200`)
- Deformasyon noktalarının sayısı

### Nokta özellikleri paneli

Herhangi bir nokta seçildiğinde sağ alt köşede görünür. İçeriği:

- **Radius (Etki yarıçapı)** — 1–50% kaydırıcısı. Nokta çevresindeki deformasyon bölgesini belirler. Radius küçüldükçe değişim daha lokal olur. Değer, görüntünün uzun kenarına göre yüzde olarak gösterilir. Canvas üzerindeki kesikli çember radius'u görselleştirir.

- **Strength (Güç)** — −1.00 ile +1.00 arasında kaydırıcı. 1.00 değerinde nokta pikselleri yer değiştirme yönünde tam güçle çeker. 0.50'de ise yarım güçle. Negatif değerlerde nokta pikselleri yer değiştirmeden **iter** (ters yönlü düzeltme etkileri için kullanılır).

- **Başlıktaki × işareti** — noktanın silinmesi.

- Panelin altındaki **ipuçları**:
  - `Alt + kareyi sürükleme — merkezi kaydırma`
  - `Del — sil`

---

## Control points ile çalışma

### Bir control point'in anatomisi

Her nokta dört öğeden oluşur:

1. **Sarı kare (Anchor)** — deformasyonun başlangıç merkezi. Genellikle ilk tıklama noktasıyla çakışır. Varsayılan olarak hareket etmez.

2. **Mavi daire (Current)** — hedef nokta. Anchor konumunda bulunan pikseli "taşımak istediğiniz" yer. Sürükleme için kullanılan temel öğedir.

3. Anchor ile current arasındaki **kesikli çizgi** — yer değiştirme vektörü. Deformasyonun yönünü ve büyüklüğünü gösterir.

4. Anchor çevresindeki **kesikli çember** — noktanın etki bölgesi. Piksel merkezden uzaklaştıkça yer değiştirmesi azalır. Çemberin dışında deformasyon yoktur.

### Nokta ekleme

1. `+●` moduna geçin.
2. Düzeltme planlanan bölgelere tıklayın. Her tıklama yeni bir nokta oluşturur.
3. Oluşturulduğunda noktanın anchor'ı = current'ıdır (yani yer değiştirme sıfırdır). Varsayılan radius 8%, strength 1.00'dir.

### Noktayı taşıma

1. "Seçim" moduna geçin.
2. Farenin sol tuşuyla mavi daireyi basılı tutup istenen konuma sürükleyin.
3. Fotoğraf hareket boyunca gerçek zamanlı olarak deforme olur.

### İnce ayar

1. Noktayı seçin (mavi daireye veya sarı kareye tıklayın).
2. Sağ alt panelde şunları düzenleyin:
   - Radius — etki bölgesinin genişliği
   - Strength — deformasyonun gücü

### Noktayı silme

Üç yol:

- Noktayı seçin → özellikler panelinde × işaretine basın
- Noktayı seçin → klavyeden Delete veya Backspace
- Noktayı seçin → Escape seçimi kaldırır (silmez)

### Nokta sınırı

Teknik maksimum plan başına 200 noktadır. Pratikte kaliteli bir rinoplasti için 10–25 nokta yeterlidir; daha karmaşık girişimlerde (tam yüz rekonstrüksiyonu) 50–70'e kadar çıkabilir.

---

## İleri düzey deformasyon teknikleri

Mevcut MVP motoru global RBF deformasyonu kullanır. Bu, lokal değişimlerde iyi sonuç verir ancak hassas kontrol için belirli bir teknik gerektirir.

### Teknik 1 — Lokal değişimler için küçük noktalar

Sorun: büyük radius yalnızca hedef bölgeyi değil, komşu yapıları da deforme eder. Çözüm — hassas değişiklikler için küçük radius (2-4%) kullanmak.

**Örnek: nazal hump'ın alınması**

1. Doğrudan hump'ın tepesine bir nokta oluşturun.
2. radius = 2-3% olarak ayarlayın.
3. Strength = 1.00.
4. Mavi daireyi 3-5 piksel **dikey olarak aşağı** sürükleyin.
5. Hump düzleşir, nazal dorsumun komşu bölümleri neredeyse hiç hareket etmez.

### Teknik 2 — Bir hat boyunca nokta zincirleri

Sorun: tek nokta dairesel (radyal) bir bozulma oluşturur. **Doğrusal** bir yapının (nazal dorsum, mandibula hattı, dudak hattı) düzeltilmesi için nokta zinciri gerekir.

**Örnek: nazal dorsumun düzeltilmesi**

1. Nazal dorsum boyunca, burun uzunluğunun 10-15%'i aralıklarla 4-5 nokta oluşturun.
2. Her nokta için radius 2-3%.
3. Mavi daireleri, istenen düz hat üzerinde dizilecek şekilde sürükleyin.
4. Sonuç: nazal dorsum düzleştirilir, yüzün geri kalanı etkilenmez.

### Teknik 3 — Sabitleme noktaları (anchors)

Sorun: bir bölge deforme edilirken komşu bölge (örneğin burnun yanındaki yanaklar) da RBF alanının yayılması nedeniyle biraz hareket eder.

Çözüm — düzeltme bölgesinin çevresine **sabitleme noktaları** yerleştirmek. Sabitleme noktalarında anchor = current'tır (mavi daire hareket ettirilmez) ancak bunlar warp hesaplamasına dahil olur ve komşu pikselleri hareketten alıkoyar.

**Örnek: dudaklar hareket etmeden nazal tip düzeltmesi**

1. Nazal tip üzerinde çalışma noktası oluşturun, radius 5%, yukarı sürükleyin.
2. Filtrum üzerinde (burun ile dudak arasında) bir sabitleme noktası oluşturun, radius 4%, **hareket ettirmeyin**.
3. Nazal alaların her iki yanında sabitleme noktaları oluşturun, radius 3%, **hareket ettirmeyin**.
4. Nazal tip yükselir, filtrum ve dudak yerinde kalır.

### Teknik 4 — "Şişirme" için negatif strength

Bazen noktayı kaydırmak değil, bir alanı "şişirmek" gerekir (daha geniş nazal ala, daha dolgun dudaklar).

1. İstenen genişleme bölgesinin merkezinde bir nokta oluşturun.
2. Mavi daireyi istenen sınırın **dışına** sürükleyin.
3. Strength'i **−0.3 ile −0.5** arasına (negatif değere) ayarlayın.
4. Radius = 5-10%.
5. Bölge noktadan itilir = genişleme etkisi.

### Teknik 5 — Kopyalar aracılığıyla çoklu seçenekler

Konsültasyon için aynı ameliyatın birkaç seçeneğine sahip olmak elverişlidir. Plan listesindeki "Kopyala" işlevini kullanın:

1. "Petrova A.B. — rinoplasti, seçenek 1 (konservatif)" planını oluşturun.
2. Düzenleyin: küçük yer değiştirmeler, ince değişiklikler.
3. Plan listesinde → bu plandaki "Kopyala" düğmesi.
4. Kopyayı yeniden adlandırın: "Petrova A.B. — rinoplasti, seçenek 2 (ılımlı)".
5. Açın, deformasyonları güçlendirin.
6. "Seçenek 3 (agresif)" için tekrarlayın.

Konsültasyonda hastaya üç seçeneğin tümünü sırayla gösterin.

### Kaçınılması gerekenler

**Çok büyük radius ile çok büyük yer değiştirmeleri aynı anda kullanmayın.** Bu, arka planda ve saç çizgisinde dalga artefaktları oluşturur.

**Arka planı deforme etmeyin.** Saç çizgisi / kulak / omuz radius içine giriyorsa bunlar da bozulur. Arka planı "kilitlemek" için çevreye sabitleme noktaları yerleştirin.

**Aşırı uzaklaştırılmış zoom ile çalışmayın.** Noktaların hassas yerleştirilmesi 100% veya daha yüksek zoom gerektirir. Toolbar'daki `+` ve `1:1` düğmelerini kullanın.

**Simetriyi göz ardı etmeyin.** Hasta burun düzeltmesi istiyorsa her iki tarafı uyumlu şekilde deforme edin. Mevcut MVP'de bu manuel olarak yapılır (mirror mode v2'de gelecektir).

---

## Hasta ile konsültasyon

"Önce / Sonra" sekmesi **hastaya gösterim** için tasarlanmıştır. Bu sekmede teknik öğe minimumda, görsel karşılaştırma maksimumdadır.

### Bölücü kaydırıcı

Merkezdeki görüntü, yuvarlak tutamaklı dikey bir çizgiyle ayrılmıştır. Hasta bunu sola-sağa sürüklerken şunları görür:

- Sol kısım — "Önce" fotoğrafı (orijinal)
- Sağ kısım — "Sonra" fotoğrafı (deformasyon uygulanmış)

Karışıklık olmaması için köşelerde "ÖNCE" ve "SONRA" etiketleri bulunur.

### Önerilen konsültasyon senaryosu

1. Planı fullscreen olarak açın (tam ekran için tarayıcıda F11).
2. Hastaya "Editör" sekmesini gösterin — noktaları görsel işaretleyici olarak kullanarak tam olarak neyi değiştirmeyi planladığınızı açıklayın.
3. "Önce / Sonra"ya geçin, kaydırıcıyı hastanın kendisinin oynatmasına izin verin.
4. Tartışın — bu, hastanın beklentilerine uyuyor mu.
5. Başka seçenekler varsa (konservatif / agresif) — mevcut planı kapatın, sonraki planı açın.
6. Sonuç olarak tek bir seçeneği nihai olarak belirleyin.
7. Bilgilendirilmiş onama eklenmek üzere PDF (veya JPG + baskı) olarak dışa aktarın.

### Hastaya söylenmesi önemli olanlar

Simülasyon, **beklenen sonucun görselleştirmesidir, garanti değildir**. Ameliyatın gerçek sonucu şunlara bağlıdır:

- Dokuların bireysel özellikleri (cilt kalınlığı, elastikiyet, kartilaj kalınlığı)
- İyileşme ve skarlaşma süreci
- Cerrahın tekniği
- Hastanın postoperatif rejime uyumu

Simülasyondan ±10-20% sapmalar normaldir ve ameliyatın kusuru sayılmaz. Bu ifadeyi bilgilendirilmiş onamda kullanın.

---

## Dışa aktarma ve dokümantasyon

### "Dışa aktarma" paneli

"Önce / Sonra" sekmesinde sağda yer alır.

### Neler dışa aktarılabilir

**1. Ameliyat öncesi (orijinal)** — hastanın deformasyon uygulanmamış özgün fotoğrafı. Medical record için ve sonuçla karşılaştırmada "önce durumu" olarak kullanılır.

**2. Ameliyat sonrası (deformasyonlu)** — warp uygulanmış fotoğraf. Hastaya gösterim ve plan dokümantasyonu için kullanılır.

**3. Yan yana: Önce ve Sonra** — "ÖNCE" ve "SONRA" etiketleriyle tek bir görüntüde side-by-side kompozisyon. Baskı ve bilgilendirilmiş onam için en elverişli format.

### Format

**JPG** — çoğu durumda önerilir. Küçük dosya boyutu, 85-92%'de kabul edilebilir kalite.

**PNG** — sıkıştırmasız, maksimum kalite. Sonuç daha sonra Photoshop'ta düzenlenecekse veya büyük formatta basılacaksa kullanın.

### JPG kalitesi

40-100% kaydırıcısı. Öneriler:

- 60-70% — e-posta ve mesajlaşma uygulamaları için
- 80-90% — document print için standart
- 95-100% — arşiv ve yayın için

### İndirme

Parametreleri ayarladıktan sonra "İndir"e basın. Dosya, tarayıcınızın Downloads klasörüne `plan-2026-04-24-rinoplasti.jpg` biçiminde bir adla kaydedilir.

### Dokümantasyon önerisi

Her ameliyat için hastanın elektronik dosyasına şunları kaydedin:

1. Orijinal fotoğraf ("Önce" dışa aktarımı)
2. Sonucun simülasyonu ("Sonra" dışa aktarımı)
3. Side-by-side ("Yan yana" dışa aktarımı)
4. Control points görünür durumdaki editörün ekran görüntüsü (Print Screen ile) — tam olarak neyin planlandığının anlaşılması için

Bu, pre-op planlamanın tam dokümantasyonunu oluşturur ve hastayla post-op anlaşmazlıklara karşı koruma sağlar.

---

## Kaydetme, kopyalar, silme

### Otomatik kaydetme

Tüm değişiklikler (nokta ekleme/silme, parametrelerinin değiştirilmesi, sürükleme) son işlemden **2 saniye sonra otomatik olarak** kaydedilir. Elle bir şey yapmanız gerekmez.

Üst toolbar'daki kaydetme göstergesi geçerli durumu gösterir:

- `●` mavi ve yanıp sönüyor — kaydetme sürüyor
- `✓` yeşil — kaydedildi
- `✕` kırmızı — hata (internet bağlantınızı kontrol edin)

Sayfa kapatıldığında veya başka bir sekmeye geçildiğinde kaydetme zorunlu olarak yapılır. Veriler kaybolmaz.

### Planın kopyalanması

Plan listesinde her kartta üç düğme bulunur: "Aç", "Kopyala", "Sil".

**Kopyala**, aynı fotoğraf ve tüm control points ile planın tam bir kopyasını oluşturur. Kopya listenin en üstünde görünür. Düzenlemeye başlamadan önce yeniden adlandırın (örneğin adına "(seçenek 2)" ekleyin).

Şu amaçlarla kullanılır:

- Ameliyatın birkaç seçeneğinin oluşturulması
- Deneysel değişiklikler öncesinde planın backup'ı
- Ayarların benzer anatomiye aktarılması

### Planın silinmesi

"Sil" düğmesi onay ister. Onay verildikten sonra:

- Plan veritabanında silinmiş olarak işaretlenir (soft delete)
- Hastanın fotoğrafı 24 saat içinde R2 deposundan silinir (kopyalardan bu fotoğrafa başka referans yoksa)
- Plan listeden kaybolur

**Dikkat:** silme işlemi geri alınamaz. Güvence gerekiyorsa — orijinali silmeden önce planı kopyalayın.

---

## Kısayol tuşları

Giriş alanları dışında sayfanın her yerinde çalışır.

- **`Ctrl + Z`** — Undo (geri alma)
- **`Ctrl + Shift + Z`** veya **`Ctrl + Y`** — Redo (yeniden uygulama)
- **`Delete`** veya **`Backspace`** — Seçili noktayı sil
- **`Escape`** — Seçimi kaldır + "Seçim" moduna geç
- **`Fare tekerleği`** — İmleç konumuna göre zoom
- **`Alt + sarı kareyi sürükleme`** — Seçili noktanın anchor'ını taşıma

Sonraki sürümlerde şunların eklenmesi planlanmaktadır:

- `V` — "Seçim" modu
- `A` — "Ekle" modu
- `+` / `−` — zoom
- `0` — fit to view
- `1` — 100% zoom
- `Space + drag` — geçici pan modu

---

## Gizlilik ve PHI

DocPats Surgical Simulation, hasta tıbbi verilerine ilişkin HIPAA (ABD) ve GDPR (AB) gereklilikleri gözetilerek geliştirilmiştir.

### Neler şifrelenir

- **Plan adı** — AES-256-GCM, veritabanında şifrelenir
- **Hasta kimliği** — AES-256-GCM, veritabanında şifrelenir
- **Fotoğraf** — R2'de sunucu tarafı şifreleme ile saklanır, erişim yalnızca yetkilendirilmiş session ile sağlanır

### Neler şifrelenmez

- Control points (koordinatlar, radius, strength) — bunlar HIPAA anlamında PHI değildir, çünkü fotoğraf ve üstverilerden bağımsız olarak hastayı tanımlamazlar
- Planın oluşturulma/güncellenme tarihleri

### Erişim

- Planlarınıza yalnızca DocPats hesap sahibi olarak siz erişebilirsiniz
- Ne Anthropic ne de DocPats ekibi planlarınızın içeriğini okuyamaz
- Mahkeme talebi hâlinde şifrelenmiş veriler sunulur, anahtar klinikte kalır

### Öneriler

**DocPats hesabınız için karmaşık şifreler ve 2FA kullanın.** Hesabınızın ele geçirilmesi = hastaların PHI'sinin ifşası.

**Ekran görüntülerini PIN/şifre olmadan korumasız local disk'e kaydetmeyin.** Dışa aktarılan JPG/PNG dosyaları otomatik olarak şifrelenmez.

**Kliniğin bilgisayarını hizmet dışı bırakmadan önce** tarayıcı cache'inde fotoğraf kopyalarının bulunmadığından emin olun. Browser privacy tools kullanın (örneğin Chrome'da Cleanup Cache).

**Avrupalı hastalarla çalışırken** (GDPR) — fotoğrafı sisteme yüklemeden **önce** biyometrik verilerin işlenmesi için yazılı onam alın.

---

## Sorun giderme

### Fotoğraf yüklenmiyor, "Görsel okunamadı" veya "Image cannot be read" görünüyor

**Neden 1:** Format desteklenmiyor. Yalnızca JPG, PNG, WebP desteklenir. HEIC (iPhone native) **çalışmaz**.

**Çözüm:** HEIC'i JPG'ye dönüştürün (Mac'te Photos, çevrimiçi dönüştürücü).

**Neden 2:** Fotoğraf 200×200 px'den küçük.

**Çözüm:** Thumbnail veya preview değil, orijinal fotoğrafı kullanın.

**Neden 3:** Dosya bozuk veya gerçek bir görüntü değil (örneğin .docx'ten .jpg olarak yeniden adlandırılmış).

**Çözüm:** Dosyayı standart görüntüleyicide açın (Photos, Preview). Açılmıyorsa dosya bozuktur, başka bir dosya kullanın.

### Editör yükleniyor ancak canvas boş

**Neden:** Fotoğraf R2 deposundan yüklenirken CORS hatası. Genellikle Cloudflare doğru header'ları henüz önbelleğe almadığında, ilk yüklemede meydana gelir.

**Çözüm:** 30 saniye bekleyin, Hard Refresh yapın (Ctrl+Shift+R). Sorun devam ederse DocPats teknik desteğine bildirin.

### Noktalar görünüyor ancak sürüklenmiyor

**Neden:** Tarayıcı pointer capture event'lerini almıyor. Bu genellikle eski bir tarayıcıdan veya tablet/stylus'a özgü bir ayardan kaynaklanır.

**Çözüm:** Tarayıcıyı en son sürüme güncelleyin (Chrome 120+, Firefox 115+, Edge 120+, Safari 17+). Touchpad'de fare kullanın.

### Deformasyon fotoğrafa uygulanmıyor (noktalar hareket ediyor ancak fotoğraf değişmiyor)

**Neden:** WebWorker yüklenmemiş. Chrome, cihaz belleği düşük olduğunda worker'ı engelleyebilir.

**Çözüm:** Gereksiz sekmeleri kapatın, editörü yeniden yükleyin (F5). Tekrarlanıyorsa başka bir tarayıcı veya 8GB+ RAM'e sahip bir bilgisayar kullanın.

### Kaydetme göstergesi kırmızı (✕)

**Neden:** DocPats sunucusuyla bağlantı yok veya session süresi dolmuş.

**Çözüm:** İnterneti kontrol edin. Her şey normalse sayfayı yeniden yükleyin (son 2 saniyedeki değişiklikler kaybolabilir, geri kalan her şey kaydedilmiştir).

### Plan oluşturduğum hâlde plan listesi boş

**Neden:** Başka bir hesapla oturum açmışsınız veya yanlışlıkla dev/staging ortamına geçmişsiniz.

**Çözüm:** URL'yi (kliniğin production-URL'si olmalıdır) ve hesap ayarlarındaki e-postayı kontrol edin.

### Fotoğraf düşük çözünürlükte dışa aktarılıyor

**Neden:** Full-resolution orijinal yerine fotoğrafın preview sürümünü (maksimum 1200 px) kullanıyorsunuz.

**Çözüm:** Dışa aktarma sırasında sistem warp'ı otomatik olarak tam çözünürlüğe uygular — yükleme göstergesi kaybolana kadar bekleyin (dışa aktarma panelinin sağ üst köşesinde). Beklemeden "İndir"e basmayın.

### Editör yavaş çalışıyor, takılıyor

**Neden:** 50+ noktalı ve 4000×6000 px fotoğraflı planlarda deformasyon, low-end cihazlar için ağır hâle gelir.

**Çözüm:**

- Fit modunda çalışın (küçük preview hesaplama açısından daha hafiftir)
- Nokta sayısını azaltın (birbirine yakın olanları birleştirin)
- Dedicated GPU'ya sahip bir cihaz kullanın

---

## Workflow önerileri

Kullanım pratiğinden yola çıkarak, konsültasyon için en uygun workflow:

### Hasta gelmeden önce (10-15 dakika)

1. Hastanın fotoğrafını açın (önceden e-posta ile alınmış veya ön muayenede çekilmiş).
2. DocPats'te 2-3 seçenek planı oluşturun:
   - `[Hasta] — konservatif`
   - `[Hasta] — ılımlı`
   - `[Hasta] — agresif`
3. Her birinde noktaları önceden yerleştirin ve kaydedin.

### Konsültasyon sırasında (30-40 dakika)

1. Hastaya ameliyatın olanaklarını ve sınırlılıklarını görselleştirme olmadan açıklayın.
2. DocPats'i büyük bir monitörde açın (en az 24").
3. Noktaların yerleştirilmiş olduğu **editörü** gösterin — anatomiyi açıklayın.
4. **Önce/Sonra**'ya geçin — hastanın kaydırıcıyla oynamasına izin verin.
5. **3 seçeneğin tümünü** sırayla gösterin. Her biri için 5-10 dakika tartışma süresi ayırın.
6. Hastanın beklentilerini ve tereddütlerini tartışın.
7. Nihai seçeneği birlikte belirleyin.

### Konsültasyondan sonra (5 dakika)

1. Nihai planı 3 formatta (önce / sonra / side-by-side) JPG 90% olarak dışa aktarın.
2. Hastanın electronic medical record'una kaydedin.
3. Hastanın fiziksel dosyası için side-by-side görüntüyü yazdırın.
4. Hastanın imzasıyla bilgilendirilmiş onama ekleyin: "_Beklenen sonucun simülasyonunu gördüm ve bunun yaklaşık bir görselleştirme olduğunu anlıyorum_".
5. Ameliyat günü (veya bir gün öncesinde) — ekiple birlikte güncel bir kez daha gözden geçirmek için nihai planı DocPats'te açın.

---

## Sürüm yol haritası

Mevcut sürüm (MVP) — temel işlev kümesi.

### v2.0 "Assisted" (önümüzdeki 3-4 hafta içinde planlanıyor)

- MediaPipe Face Mesh aracılığıyla **otomatik yüz işaretlemesi** — plan açıldığında 468 anatomical landmark otomatik olarak görünür
- **Nokta grupları** — burun / dudaklar / gözler / kaşları ayrı ayrı gösterme/gizleme
- **Kalibrasyon** — pupiller arası mesafeyi girerek tüm ölçümleri milimetre cinsinden alma
- **Tıbbi ölçümler** — nasofrontal angle, nasolabial angle, tip projection (Goode's ratio), alar base width
- **Symmetry lock** — sağ yarının sol yarıya yansıtılması
- **Nasal surgery presets** — hump reduction / tip refinement / nostril narrowing için pre-configured nokta setleri
- **Mask protection** — deformation saçları ve arka planı otomatik olarak etkilemez

### v3.0 "Professional"

- **Liquify brush** — noktalara ek olarak etkileşimli Photoshop-style araç
- **Reference library** — hızlı matching için "hedef burunlar" veritabanı
- **Multi-view** — tek planda 3-5 çekim açısı, senkron deformasyon
- Hasta için klinik logosu, measurements ve consent text içeren **PDF rapor**
- **Consultation mode** — sunum için fullscreen UI

### v4.0 "3D"

- ML aracılığıyla 2D→3D reconstruction
- 3D mesh editing
- Hastanın akıllı telefonunda AR preview

---

_Bu doküman, Dr. İsmailov'un yönetiminde DocPats yayın kurulu tarafından hazırlanmıştır, Nisan 2026._

<!-- translated-from-ru: 65848d708c47ec27f7c2babbb9fcaac9b390bb72 -->
