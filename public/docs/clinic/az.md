# Klinika

Klinika həkim kabineti ilə eyni hesabda aktivləşdirilir — məlumatları köçürmək
lazım deyil. İdarəetmə `/clinic` bölməsindədir, işçilər `/clinic/staff-login`
vasitəsilə daxil olur və `/clinic/employee` zonasında işləyirlər.

## Doqquz rol

Səlahiyyətlər «admin və ya admin deyil» prinsipi ilə deyil, rollar üzrə verilir
və hər rol öz vəzifə dairəsini əhatə edir:

- **sahib** və **administrator** — klinikanın bütün bölmələrinə tam giriş;
- **idarəçi** — maliyyə və sahibin parametrləri istisna olmaqla, demək olar ki,
  hər şey;
- **həkim** — qəbul, pasiyent kartları, konsiliumlar, telemedisina, bilik bazası;
- **tibb bacısı** — həkimə yaxındır, lakin bölmələrin tərkibi daha məhduddur;
- **qeydiyyatçı** — cədvəl, qeydlər, pasiyentlər, zənglərin və müraciətlərin
  qəbulu;
- **mühasib** — hesablar, ödənişlər, maliyyə hesabatları, əməkhaqqı hesablanması,
  maliyyə analitikası;
- **farmasevt** — aptek, anbar, təyinatlar, təchizatçılar, satınalma sorğuları;
- **marketoloq** — klinikanın saytı, rəylər, müraciətlər, məqalələr, analitika.

Bölmələrin ümumi sayı qırxdır və hər biri üzrə səlahiyyət üç növ ola bilər:
**oxumaq**, **dəyişmək**, **silmək**. Rol yalnız hazır şablondur; ayrıca işçinin
səlahiyyətlərini rolun üzərindən genişləndirmək və ya məhdudlaşdırmaq mümkündür.

**Özündən yuxarı rol təyin etmək mümkün deyil** — qeydiyyatçı forma səhifəsinə
çatsa belə, özünü administrator edə bilməz. Bu, yalnız interfeysdə gizlədilmir,
serverdə yoxlanılır.

## Klinikada nələr aparılır

- **İşçilər** — dəvətlər, rollar, hər həkimin iş cədvəli və təqvimi.
- **Struktur** — şöbələr, kabinetlər, avadanlıq.
- **Xidmətlər** və qiymət cədvəli.
- **Aptek və anbar** — dərmanların verilməsi, satınalma sorğuları, təchizatçılar,
  hesabatlar.
- **Konsiliumlar** — halın birgə təhlili.
- **Telemedisina**.
- **Bilik bazası** — personal üçün daxili materiallar.
- İşçilər üçün **elanlar**.
- Pasiyentlərin **rəyləri** və saytdan gələn **müraciətlər**.
- Klinikanın fəaliyyəti üzrə **analitika**.

## Klinikada pasiyentlər

**Pasiyenti həkim deyil, qeydiyyatçı və ya administrator qeydiyyata alır.** Bu,
həkimin pasiyenti özünün əlavə etdiyi fərdi həkim kabinetindən fərqlənir.

Pasiyent kartı ilə kim nə edə bilər:

- **sahib** və **administrator** — yaratmaq, dəyişmək, silmək;
- **qeydiyyatçı** — yaratmaq və dəyişmək, lakin silməmək;
- **həkim** və **tibb bacısı** — yalnız kartı görmək. Pasiyenti qeydiyyata ala
  bilmirlər, lakin **onun kartında tibbi qeydlər apara bilərlər** — bu, ayrıca
  səlahiyyətdir;
- **idarəçi** — yalnız görmək;
- **mühasib** və **farmasevt** — kartlara girişi yoxdur.

Pasiyentlərin siyahısı — `/clinic/patients`, əlavə etmə — `/clinic/patients/new`.
İşçilərin öz zonasında həmin səhifələr belədir: `/clinic/employee/patients` və
`/clinic/employee/patients/new`.

### Əlavə edilərkən nə baş verir

Sistem bu şəxsin artıq tanınıb-tanınmadığını yoxlayır və daha sonra dörd nəticə
mümkündür:

1. **Belə pasiyent bu klinikada artıq mövcuddur** (telefon və ya e-poçt üst-üstə
   düşdü) — yeni kart yaradılmır, mövcud olan açılır.
2. **Şəxsin platformada hesabı var.** Kartı sadəcə başqasının hesabına bağlamaq
   olmaz: əvvəlcə pasiyentin razılığını təsdiqləmək lazımdır. Təsdiqdən sonra
   kart onun hesabı ilə əlaqələndirilir və o, qeydləri öz profilində görür.
3. **Şəxsin başqa klinikadan verilməmiş kartı var.** Burada da razılıq təsdiqi
   tələb olunur; bundan sonra girişə dair yeni müvəqqəti məlumatlarla yeni
   pasiyent kartı verilir.
4. **Şəxs sistemdə yoxdur** — kart yaradılır və zərurət olduqda ona girişə dair
   müvəqqəti məlumatlarla pasiyent kartı verilir ki, daxil olub öz qeydlərini
   görə bilsin.

İkinci və üçüncü hallar əlavə etmə zamanı imtinanın ən çox rast gəlinən
səbəbidir: sistem bildirir ki, belə şəxs artıq tanınır və razılığın
təsdiqlənməsini xahiş edir. Bu, giriş səhvi deyil, müdafiə tədbiridir: başqasına
məxsus tibbi kart onun sahibinin xəbəri olmadan hesaba bağlanmamalıdır.

### Pasiyent kartına giriş

Klinika girişi ayrıca sorğulayır və bundan sonra hər şey fərdi həkimdə olduğu
kimi işləyir: pasiyent bölmələri ayrı-ayrılıqda açır, girişi geri götürə bilər,
yoxlama isə hər müraciət zamanı aparılır.

## Klinikanın saytı

Sayt platformanın daxilində qurulur, ayrıca hostinq lazım deyil.

- **İctimai vitrin** — `/clinics/<klinikanın ünvanı>`: xidmətlər, həkimlər,
  rəylər, müraciətlərin qəbulu.
- **Öz səhifələri** — konstruktorda əlavə olunur və
  `/clinics/<klinikanın ünvanı>/<səhifə>` ünvanında yerləşir.
- Səhifə **qaralama** və ya **dərc edilmiş** vəziyyətdə olur: dərc etməyincə,
  onu kənardan heç kim görmür.

İdarəetmə — `/clinic/pages`, vitrinin öncədən baxışı — `/clinic/public-page`.
Saytdan gələn müraciətlər e-poçta deyil, müraciətlər bölməsinə düşür.

## Tariflər

- **Start — ayda 99 $.** 5 həkimə qədər, ayda 100 süni intellekt təhlili və 100
  epikriz, 30 material, 1500 dəqiqə video. Komissiya 10 %.
- **Business — ayda 249 $.** 15 həkimə qədər, təhlillər və epikrizlər
  məhdudiyyətsiz, 5000 dəqiqə video. Komissiya 7 %. **Analitika** və pasiyentlərə
  **tövsiyələrdə prioritet** aktivləşir.
- **Enterprise — ayda 499 $.** Həkimlərin sayına və qalan limitlərə görə
  məhdudiyyət yoxdur. Komissiya 5 %.

Tarif nə qədər yuxarıdırsa, qəbuldan tutulan komissiya bir o qədər aşağıdır:
10 %, 7 %, 5 %. Analitika və tövsiyələrdə prioritet Business tarifindən
başlayaraq mövcuddur.

## Məlumatlar və giriş

Pasiyent kartlarına girişə aid olan hər şey fərdi həkimdə olduğu kimi işləyir:
pasiyent bölmələri ayrı-ayrılıqda açır və girişi geri götürə bilər, yoxlama isə
hər müraciət zamanı aparılır.

Bir klinikanın məlumatları digərinə əlçatan deyil: bölgü yalnız interfeysdə
deyil, verilənlər bazasına sorğular səviyyəsində yoxlanılır. Pasiyent kartına hər
müraciət dəyişdirilməsi və ya silinməsi mümkün olmayan audit jurnalına yazılır.

<!-- translated-from-ru: eed93cd79b0b44eabd76fa019afc9e5959646060 -->
