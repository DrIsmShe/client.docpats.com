# Sınavlara hazırlık

Sınav programlarına yönelik soru bankası ve alıştırma imkânı. Bölüme
`/education` adresinden ulaşılır.

## Nelere hazırlanılabilir

Programlar **sınav türüne** göre gruplandırılmıştır:

- mesleki uygulama yetkisi — SMLE, DHA, MOH, devlet akreditasyonu;
- uzmanlık eğitimine giriş — TUS, akreditasyon;
- uzmanlık alanı sertifikasyonu;
- uluslararası sertifikalar;
- sürekli tıp eğitimi ve kredileri;
- üniversite sınavları ve devlet sınavları;
- klinik personelinin kurum içi eğitimi.

Ayrıca **bölgeye** göre: BDT, Avrupa, Orta Doğu ve Kuzey Afrika, Asya, Afrika,
Amerika, Okyanusya ve ülkeye bağlı olmayan programlar.

Program kataloğu — `/education`, belirli bir programın sayfası —
`/education/programs/<id программы>`.

## Dört çalışma modu

Mod, başlamadan önce seçilir ve alıştırmanın nasıl ilerleyeceğini belirler. Bu,
bölümdeki temel ayardır:

- **Rehber** — açıklama her yanıttan hemen sonra görüntülenir, süre sınırı
  yoktur. Konuyu incelemeye yönelik bir moddur, ölçmeye değil.
- **Süreli** — süre işler, açıklamalar sonda gösterilir. Tempo çalışmasıdır.
- **Deneme sınavı** — tam simülasyon: sorular gerçek sınavın yapısına göre
  seçilir, süre sınırı ve sonunda bir rapor bulunur.
- **Zayıf konuların takviyesi** — sorular, önceki denemelerinize ait
  istatistiklere, yani zorlandığınız konulara göre seçilir.

Son mod, hataların üzerinden geçme işlevini görür: nerede hata yaptığınızı
kendiniz hatırlamanız gerekmez — seçki kendiliğinden oluşturulur.

## Soru türleri

- tek doğru seçenekli;
- birden çok doğru seçenekli;
- doğru veya yanlış;
- klinik vinyet — tetkik verileriyle birlikte verilen olgu;
- görüntü üzerinden soru — radyografi, ECG, histoloji;
- klinik olgu.

Her sorunun bir zorluk düzeyi vardır: kolay, orta, zor.

## Bir deneme nasıl ilerler

1. Program sayfasında modu seçin ve denemeyi başlatın.
2. Soruları yanıtlayın; deneme `/education/attempts/<id попытки>`
   adresinde açılır.
3. Denemeyi tamamlayın — sonuç kaydedilir.

Deneme şu durumlardan birinde bulunur: **devam ediyor**, **tamamlandı**,
**süre doldu** veya **yarıda bırakıldı**. Süre dolduğunda deneme otomatik
olarak değerlendirmeye alınır — yanıtlar kaybolmaz.

Tüm denemeler saklanır; bunlara geri dönebilir, neyi nasıl yanıtladığınızı
inceleyebilirsiniz.

## Sınava hazırlık düzeyi

Her program için bir **hazırlık yüzdesi** hesaplanır ve bu, yalnızca doğru
yanıt oranı değildir:

- her konudaki sonuç, o konunun gerçek sınav yapısındaki payına göre
  ağırlıklandırılır — sınavda daha çok yer tutan konuların ağırlığı daha
  fazladır;
- ayrıca **kapsam** gösterilir: kaç konuda anlamlı bir istatistiğinizin
  oluştuğu;
- tanımlanmışsa, programın geçme notu da yanında belirtilir.

Bu nedenle konuların üçte birlik bir kapsamıyla elde edilen %80 hazırlık,
tam kapsamdaki %80'den farklı bir anlam taşır — ve bu, sınavda değil, hemen
görülür.

## Kaç soru kullanılabilir

- **Lite** — ayda 500 soru.
- **Deneme süresi ve Start tarifesi** — ayda 1500 soru.
- **Growth ve Pro** — sınırsız.

Sorular, platformun sunması hiçbir maliyet doğurmayan tek kalemdir: banka
platforma aittir ve çözüm sırasında dil modeline herhangi bir başvuru yapılmaz.
Bu nedenle buradaki limitler cömerttir, tarifeler arasındaki fark ise çalışma
**modlarına** taşınmıştır.

Bankanın bir bölümü, tanıtım amaçlı bir hacimde abonelik olmadan da
kullanılabilir.

## Hangi dilde

Sorular platformun desteklediği dillerde mevcuttur: çevirisi hazırsa, program
ve soruları arayüz dilinizde sunulur.

<!-- translated-from-ru: 8a630e4e3b6d397bd32091c0095ced0a2b5a553c -->
