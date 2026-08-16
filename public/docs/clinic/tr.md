# Klinik

Klinik, hekim kabinetiyle aynı hesap üzerinde etkinleştirilir; verilerin
taşınmasına gerek yoktur. Yönetim `/clinic` bölümünde yer alır, çalışanlar
`/clinic/staff-login` üzerinden giriş yapar ve `/clinic/employee` alanında
çalışır.

## Dokuz rol

Yetkiler «yönetici ya da değil» şeklinde değil, rollere göre verilir ve her rol
kendi görev alanını kapsar:

- **sahip** ve **yönetici** — kliniğin tüm bölümlerine tam erişim;
- **işletme müdürü** — finans ve sahip ayarları dışında neredeyse her şey;
- **hekim** — muayene, hasta dosyaları, konsültasyonlar, teletıp, bilgi bankası;
- **hemşire** — hekime yakın, ancak bölüm kapsamı daha dardır;
- **kayıt görevlisi** — randevu takvimi, kayıtlar, hastalar, çağrı ve talep
  kabulü;
- **muhasebeci** — faturalar, ödemeler, mali raporlar, maaş hesaplamaları,
  finansal analiz;
- **eczacı** — eczane, depo, reçeteler, tedarikçiler, satın alma talepleri;
- **pazarlama uzmanı** — klinik web sitesi, değerlendirmeler, talepler,
  makaleler, analitik.

Toplam kırk bölüm bulunur ve her biri için yetki üç türlüdür: **okuma**,
**değiştirme**, **silme**. Rol bir şablondur; tek tek çalışanlar için yetkiler
rolün üzerine genişletilebilir ya da kısıtlanabilir.

**Kendi rolünden üst bir rol atanamaz** — kayıt görevlisi ilgili forma ulaşsa
bile kendisini yönetici yapamaz. Bu, yalnızca arayüzde gizlenmekle kalmaz,
sunucu tarafında da denetlenir.

## Klinikte neler yürütülür

- **Çalışanlar** — davetler, roller, her hekimin çalışma programı ve takvimi.
- **Yapı** — bölümler, muayene odaları, cihazlar.
- **Hizmetler** ve fiyat listesi.
- **Eczane ve depo** — çıkışlar, satın alma talepleri, tedarikçiler, raporlar.
- **Konsültasyonlar** — vakanın birlikte değerlendirilmesi.
- **Teletıp**.
- **Bilgi bankası** — personele yönelik kurum içi materyaller.
- Çalışanlara yönelik **duyurular**.
- Hasta **değerlendirmeleri** ve web sitesinden gelen **talepler**.
- Klinik işleyişine ilişkin **analitik**.

## Klinikte hastalar

**Hastayı kayıt görevlisi ya da yönetici oluşturur, hekim değil.** Bu durum,
hekimin hastayı kendisinin eklediği tek hekimli kabinetten farklıdır.

Hasta dosyası üzerinde kimin ne yapabileceği:

- **sahip** ve **yönetici** — oluşturma, değiştirme, silme;
- **kayıt görevlisi** — oluşturma ve değiştirme, ancak silme yetkisi yok;
- **hekim** ve **hemşire** — yalnızca dosyayı görüntüleme. Hasta oluşturamazlar,
  ancak **dosyasında tıbbi kayıt tutabilirler** — bu ayrı bir yetkidir;
- **işletme müdürü** — yalnızca görüntüleme;
- **muhasebeci** ve **eczacı** — hasta dosyalarına erişimi yoktur.

Hasta listesi — `/clinic/patients`, ekleme — `/clinic/patients/new`.
Çalışanlar için kendi alanlarında aynı sayfalar bulunur:
`/clinic/employee/patients` ve `/clinic/employee/patients/new`.

### Ekleme sırasında neler olur

Sistem, bu kişinin daha önce tanımlı olup olmadığını denetler ve ardından dört
olası sonuç ortaya çıkar:

1. **Bu hasta bu klinikte zaten kayıtlıdır** (telefon numarası veya e-posta
   eşleşmiştir) — yeni dosya oluşturulmaz, mevcut dosya açılır.
2. **Kişinin platformda bir hesabı vardır.** Dosya başkasının hesabına doğrudan
   bağlanamaz: önce hastanın rızasının bulunduğu doğrulanmalıdır. Onaydan sonra
   dosya kişinin hesabıyla ilişkilendirilir ve kişi kayıtları kendi tarafında
   görür.
3. **Kişinin başka bir klinikten teslim edilmemiş bir hasta kartı vardır.** Bu
   durumda da rıza onayı gerekir; ardından girişe yönelik yeni geçici bilgileri
   içeren yeni bir hasta kartı düzenlenir.
4. **Kişi sistemde yoktur** — dosya oluşturulur ve gerektiğinde kişiye, giriş
   yapıp kendi kayıtlarını görebilmesi için geçici giriş bilgilerini içeren bir
   hasta kartı verilir.

İkinci ve üçüncü durumlar, ekleme sırasında karşılaşılan reddedilmelerin en sık
nedenidir: sistem, bu kişinin halihazırda tanımlı olduğunu bildirir ve rıza
onayı ister. Bu bir giriş hatası değil, bir korumadır: başkasına ait tıbbi dosya,
hesap sahibinin bilgisi olmaksızın o hesaba bağlanmamalıdır.

### Hasta dosyasına erişim

Klinik erişimi ayrıca talep eder ve sonrasında her şey tek hekimli kabinettekiyle
aynı şekilde işler: hasta bölümleri tek tek açar, erişimi geri çekebilir ve
denetim her erişim talebinde yeniden yapılır.

## Klinik web sitesi

Site platformun içinde oluşturulur, ayrı bir barındırma hizmetine gerek yoktur.

- **Herkese açık vitrin** — `/clinics/<klinik adresi>`: hizmetler, hekimler,
  değerlendirmeler, talep kabulü.
- **Kendi sayfalarınız** — düzenleyici aracılığıyla eklenir ve
  `/clinics/<klinik adresi>/<sayfa>` adresinde yayımlanır.
- Sayfa **taslak** ya da **yayımlanmış** durumda bulunur: yayımlanmadığı sürece
  dışarıdan kimse göremez.

Yönetim — `/clinic/pages`, vitrin önizlemesi — `/clinic/public-page`.
Siteden gelen talepler e-postaya değil, talepler bölümüne düşer.

## Tarifeler

- **Start — ayda 99 $.** En fazla 5 hekim, ayda 120 YZ analizi ve 90 epikriz,
  25 materyal, 1500 dakika video.
- **Business — ayda 249 $.** En fazla 15 hekim, 280 analiz ve 300 epikriz,
  80 materyal, 5000 dakika video. **Analitik** ve hastalara yapılan
  **önerilerde öncelik** devreye girer.
- **Enterprise — ayda 499 $.** En fazla 50 hekim: 480 analiz ve 550 epikriz,
  150 materyal, 15 000 dakika video. 50 hekimden fazlası için ayrı sözleşme
  yapılır.

**Platform muayenelerden yüzde almaz** — hiçbir tarifede; hastanın ödemesi
tümüyle hekime gider. Klinik yalnızca abonelik bedelini öder.

Analizler ve epikrizler tüm klinik için aylık olarak hesaplanır: her biri, dil
modeline yapılan ve platformun bedelini parayla ödediği bir çağrıdır. Rakamlar,
kadronun olağan iş yüküne göre paylı belirlenmiştir ve çalışmayı kısıtlamak için
değil, olası bir aksaklık ihtimaline karşı öngörülmüştür. Analitik ve önerilerde
öncelik, Business tarifesinden itibaren kullanılabilir.

## Veriler ve erişim

Hasta dosyalarına erişimle ilgili her şey, tek hekimli kabinettekiyle aynı
şekilde işler: hasta bölümleri tek tek açar ve erişimi geri çekebilir; denetim
ise her erişim talebinde yeniden yapılır.

Bir kliniğin verilerine başka bir klinik erişemez: ayrım yalnızca arayüzde değil,
veritabanı sorguları düzeyinde denetlenir. Hasta dosyasına yapılan her erişim,
değiştirilemeyen veya silinemeyen bir denetim günlüğüne kaydedilir.

<!-- translated-from-ru: 93c8a522dc85661d192852ad3228b3c218a42e6e -->
