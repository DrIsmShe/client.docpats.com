# Klinik

Klinik, hekim kabinetiyle aynı hesap üzerinden etkinleştirilir; verilerin
taşınması gerekmez. Yönetim `/clinic` bölümünde yer alır, çalışanlar
`/clinic/staff-login` üzerinden giriş yapar ve `/clinic/employee` alanında
çalışır.

## Dokuz rol

Yetkiler «yönetici ya da yönetici değil» şeklinde değil, roller üzerinden
verilir ve her rol kendi görev alanını kapsar:

- **sahip** ve **yönetici** — kliniğin tüm bölümlerine tam erişim;
- **işletme sorumlusu** — finans ve sahip ayarları dışında neredeyse her şey;
- **hekim** — muayene, hasta dosyaları, konsültasyon kurulları, teletıp, bilgi
  bankası;
- **hemşire** — hekime yakın, ancak bölüm kapsamı bakımından daha sınırlı;
- **kayıt görevlisi** — takvim, randevular, hastalar, çağrı ve talep kabulü;
- **muhasebeci** — faturalar, ödemeler, finansal raporlar, bordro hesaplaması,
  finansal analitik;
- **eczacı** — eczane, depo, reçeteler, tedarikçiler, satın alma talepleri;
- **pazarlama sorumlusu** — klinik web sitesi, değerlendirmeler, talepler,
  makaleler, analitik.

Toplamda kırk bölüm bulunur ve her bölüm için yetki üç türde olabilir:
**okuma**, **değiştirme**, **silme**. Rol bir şablondur; tek bir çalışanın
yetkileri, rolünün üzerine genişletilebilir veya kısıtlanabilir.

**Kendi rolünden üst bir rol atanamaz** — kayıt görevlisi ilgili forma erişse
bile kendisini yönetici yapamaz. Bu, yalnızca arayüzde gizlenmekle kalmaz,
sunucu tarafında da denetlenir.

## Klinikte neler yürütülür

- **Çalışanlar** — davetler, roller, her hekimin çalışma programı ve takvimi.
- **Yapı** — bölümler, muayene odaları, cihazlar.
- **Hizmetler** ve fiyat listesi.
- **Eczane ve depo** — teslim, satın alma talepleri, tedarikçiler, raporlar.
- **Konsültasyon kurulları** — vakanın birlikte değerlendirilmesi.
- **Teletıp**.
- **Bilgi bankası** — personel için kurum içi materyaller.
- Çalışanlara yönelik **duyurular**.
- Hastaların **değerlendirmeleri** ve web sitesinden gelen **talepler**.
- Kliniğin işleyişine ilişkin **analitik**.

## Klinikte hastalar

**Hastayı kayıt görevlisi veya yönetici oluşturur, hekim değil.** Bu durum,
hekimin hastayı kendisinin eklediği tek hekimli kabinetten farklıdır.

Hasta dosyası üzerinde kim ne yapabilir:

- **sahip** ve **yönetici** — oluşturma, değiştirme, silme;
- **kayıt görevlisi** — oluşturma ve değiştirme, ancak silme yetkisi yok;
- **hekim** ve **hemşire** — yalnızca dosyayı görüntüleme. Hasta oluşturamazlar,
  ancak **hastanın dosyasında tıbbi kayıt tutabilirler** — bu ayrı bir
  yetkidir;
- **işletme sorumlusu** — yalnızca görüntüleme;
- **muhasebeci** ve **eczacı** — hasta dosyalarına erişimi yok.

Hasta listesi — `/clinic/patients`, ekleme — `/clinic/patients/new`.
Çalışanların kendi alanlarında aynı sayfalar bulunur:
`/clinic/employee/patients` ve `/clinic/employee/patients/new`.

### Ekleme sırasında neler olur

Sistem, bu kişinin daha önce kayıtlı olup olmadığını denetler ve sonrasında dört
olasılık ortaya çıkar:

1. **Bu hasta bu klinikte hâlihazırda kayıtlıdır** (telefon veya e-posta
   eşleşmiştir) — yeni dosya oluşturulmaz, mevcut dosya açılır.
2. **Kişinin platformda bir hesabı vardır.** Dosya, başkasına ait bir hesaba
   doğrudan bağlanamaz: önce hastanın onay verdiğinin doğrulanması gerekir. Onay
   sonrasında dosya, kişinin hesabıyla ilişkilendirilir ve kişi kayıtları kendi
   hesabında görür.
3. **Kişinin başka bir klinikten teslim edilmemiş bir kartı vardır.** Bu da onay
   doğrulaması üzerinden yürür; ardından, girişe yönelik yeni geçici bilgilerle
   yeni bir hasta kartı düzenlenir.
4. **Kişi sistemde kayıtlı değildir** — dosya oluşturulur ve gerekirse kişiye,
   sisteme girip kendi kayıtlarını görebilmesi için girişe yönelik geçici
   bilgileri içeren bir hasta kartı verilir.

İkinci ve üçüncü durumlar, ekleme sırasında karşılaşılan reddetmelerin en sık
nedenidir: sistem bu kişinin hâlihazırda kayıtlı olduğunu bildirir ve onayın
doğrulanmasını ister. Bu bir giriş hatası değil, bir korumadır: başkasına ait
bir tıbbi dosya, hesap sahibinin bilgisi olmaksızın o hesaba bağlanmamalıdır.

### Hasta dosyasına erişim

Klinik erişimi ayrıca talep eder ve sonrasında her şey tek hekimli kabinetteki
gibi işler: hasta bölümleri tek tek açar, erişimi geri alabilir ve her erişim
girişiminde denetim yapılır.

## Klinik web sitesi

Web sitesi platform içinde oluşturulur, ayrı bir barındırma hizmetine gerek
yoktur.

- **Genel vitrin** — `/clinics/<адрес клиники>`: hizmetler, hekimler,
  değerlendirmeler, talep kabulü.
- **Kendi sayfalarınız** — düzenleyici aracıyla eklenir ve
  `/clinics/<адрес клиники>/<страница>` adresinde yayınlanır.
- Sayfa **taslak** veya **yayımlanmış** durumda bulunur: yayımlamadığınız
  sürece sayfayı dışarıdan hiç kimse görmez.

Yönetim — `/clinic/pages`, vitrin ön izlemesi — `/clinic/public-page`. Web
sitesinden gelen talepler e-postaya değil, talepler bölümüne düşer.

## Tarifeler

- **Start — ayda 99 $.** En fazla 5 hekim, ayda 100 yapay zekâ değerlendirmesi
  ve 100 epikriz, 30 materyal, 1500 dakika video. Komisyon %10.
- **Business — ayda 249 $.** En fazla 15 hekim, sınırsız değerlendirme ve
  epikriz, 5000 dakika video. Komisyon %7. **Analitik** ve hastalara yönelik
  **önerilerde öncelik** etkinleşir.
- **Enterprise — ayda 499 $.** Hekim sayısında ve diğer limitlerde kısıtlama
  yok. Komisyon %5.

Tarife yükseldikçe muayene komisyonu düşer: %10, %7, %5. Analitik ve önerilerde
öncelik, Business tarifesinden itibaren kullanılabilir.

## Veriler ve erişim

Hasta dosyalarına erişimle ilgili her şey, tek hekimli kabinette olduğu gibi
işler: hasta bölümleri tek tek açar ve erişimi geri alabilir; her erişim
girişiminde denetim yapılır.

Bir kliniğin verileri bir başkasına erişilebilir değildir: bu ayrım yalnızca
arayüzde değil, veritabanı sorguları düzeyinde de denetlenir. Hasta dosyasına
yapılan her erişim, değiştirilemeyen ve silinemeyen bir denetim kaydına
(audit) yazılır.

<!-- translated-from-ru: eed93cd79b0b44eabd76fa019afc9e5959646060 -->
