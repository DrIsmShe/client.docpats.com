# Klinik

Klinik, hekim kabinetiyle aynı hesap üzerinden etkinleştirilir; verilerin aktarılması gerekmez. Yönetim `/clinic` bölümünde yer alır, çalışanlar `/clinic/staff-login` üzerinden giriş yapar ve `/clinic/employee` alanında çalışır.

## Dokuz rol

Yetkiler «yönetici ya da değil» şeklinde değil, roller üzerinden verilir ve her rol kendi görev alanını kapsar:

- **sahip** ve **yönetici** — kliniğin tüm bölümlerine tam erişim;
- **işletme müdürü** — finans ve sahip ayarları dışında neredeyse her şey;
- **hekim** — muayene, hasta kartları, konseyler, teletıp, bilgi tabanı;
- **hemşire** — hekime yakın, ancak bölüm kapsamı daha sınırlı;
- **kayıt görevlisi** — randevu takvimi, kayıtlar, hastalar, çağrı ve talep kabulü;
- **muhasebeci** — faturalar, ödemeler, finansal raporlar, bordro hesaplaması, finansal analitik;
- **eczacı** — eczane, depo, reçeteler, tedarikçiler, satın alma talepleri;
- **pazarlama uzmanı** — klinik sitesi, değerlendirmeler, talepler, makaleler, analitik.

Toplam kırk bölüm bulunur ve her biri için yetki üç türde olabilir: **okuma**, **değiştirme**, **silme**. Rol bir şablondur; ayrı bir çalışanın yetkileri rolün üzerine genişletilebilir veya kısıtlanabilir.

**Kendi rolünden üst bir rol atanamaz** — kayıt görevlisi, ilgili forma erişse bile kendisini yönetici yapamaz. Bu, yalnızca arayüzde gizlenmekle kalmaz, sunucu tarafında da denetlenir.

## Klinikte neler yürütülür

- **Çalışanlar** — davetler, roller, her hekimin çalışma programı ve takvimi.
- **Yapı** — bölümler, muayene odaları, cihazlar.
- **Hizmetler** ve fiyat listesi.
- Kliniğin **hastaları** ve kartları.
- **Eczane ve depo** — teslim, satın alma talepleri, tedarikçiler, raporlar.
- **Konseyler** — vakanın ortak değerlendirilmesi.
- **Teletıp**.
- **Bilgi tabanı** — personel için kurum içi materyaller.
- Çalışanlara yönelik **duyurular**.
- Hastaların **değerlendirmeleri** ve siteden gelen **talepler**.
- Klinik faaliyetine ilişkin **analitik**.

## Klinik sitesi

Site platform içinde oluşturulur, ayrı bir barındırma hizmetine gerek yoktur.

- **Herkese açık vitrin** — `/clinics/<адрес клиники>`: hizmetler, hekimler, değerlendirmeler, talep kabulü.
- **Kendi sayfalarınız** — sayfa oluşturucuda eklenir ve `/clinics/<адрес клиники>/<страница>` adresinde yayınlanır.
- Sayfa **taslak** veya **yayınlanmış** durumda bulunur: yayınlamadığınız sürece dışarıdan kimse göremez.

Yönetim — `/clinic/pages`, vitrin ön izlemesi — `/clinic/public-page`. Siteden gelen talepler e-postaya değil, talepler bölümüne düşer.

## Tarifeler

- **Start — ayda 99 $.** En fazla 5 hekim, ayda 100 yapay zekâ değerlendirmesi ve 100 epikriz, 30 materyal, 1500 dakika video. Komisyon %10.
- **Business — ayda 249 $.** En fazla 15 hekim, sınırsız değerlendirme ve epikriz, 5000 dakika video. Komisyon %7. **Analitik** ve hastalara yönelik **öneri önceliği** etkinleştirilir.
- **Enterprise — ayda 499 $.** Hekim sayısında ve diğer limitlerde sınırlama yoktur. Komisyon %5.

Tarife yükseldikçe muayene komisyonu düşer: %10, %7, %5. Analitik ve öneri önceliği Business tarifesinden itibaren kullanılabilir.

## Veriler ve erişim

Hasta kartlarına erişime ilişkin her şey, tek başına çalışan hekimde olduğu gibi işler: hasta bölümleri ayrı ayrı açar ve erişimi geri alabilir, denetim ise her erişim talebinde yapılır.

Bir kliniğin verileri diğerine kapalıdır: ayrım yalnızca arayüzde değil, veritabanı sorguları düzeyinde denetlenir. Hasta kartına yapılan her erişim, değiştirilemeyen ve silinemeyen denetim günlüğüne kaydedilir.

<!-- translated-from-ru: 8aa4b76798723b01abccfa5dc5d1e527f4b19eb9 -->
