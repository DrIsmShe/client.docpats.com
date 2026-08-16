# Klinika

Klinika həkim kabineti ilə eyni hesabda aktivləşdirilir — məlumatları köçürməyə
ehtiyac yoxdur. İdarəetmə `/clinic` bölməsindədir, əməkdaşlar
`/clinic/staff-login` vasitəsilə daxil olur və `/clinic/employee` zonasında
işləyirlər.

## Doqquz rol

Səlahiyyətlər «admin və ya qeyri-admin» prinsipi ilə deyil, rollar üzrə verilir
və hər rol öz vəzifə dairəsini əhatə edir:

- **sahib** və **administrator** — klinikanın bütün bölmələrinə tam giriş;
- **menecer** — maliyyə və sahibin parametrləri istisna olmaqla, demək olar ki,
  hər şey;
- **həkim** — qəbul, pasiyent kartları, konsiliumlar, telemedisina, bilik bazası;
- **tibb bacısı** — həkimə yaxın, lakin bölmələrin tərkibinə görə fərqlənir;
- **qeydiyyatçı** — cədvəl, qeydiyyatlar, pasiyentlər, zənglərin və müraciətlərin
  qəbulu;
- **mühasib** — hesablar, ödənişlər, maliyyə hesabatları, əməkhaqqının
  hesablanması, maliyyə analitikası;
- **əczaçı** — aptek, anbar, təyinatlar, təchizatçılar, satınalma sifarişləri;
- **marketoloq** — klinikanın saytı, rəylər, müraciətlər, məqalələr, analitika.

Ümumilikdə qırx bölmə var və hər biri üzrə səlahiyyət üç növ ola bilər:
**oxumaq**, **dəyişmək**, **silmək**. Rol yalnız hazır şablondur; ayrıca
əməkdaş üçün səlahiyyətlər rolun üzərindən genişləndirilə və ya məhdudlaşdırıla
bilər.

**Özündən yuxarı rol təyin etmək mümkün deyil** — qeydiyyatçı, hətta formaya
çıxsa belə, özünü administrator edə bilməz. Bu, yalnız interfeysdə gizlədilmir,
serverdə yoxlanılır.

## Klinikada nələr aparılır

- **Əməkdaşlar** — dəvətlər, rollar, hər həkimin iş cədvəli və təqvimi.
- **Struktur** — şöbələr, kabinetlər, avadanlıq.
- **Xidmətlər** və qiymət cədvəli.
- **Aptek və anbar** — buraxılış, satınalma sifarişləri, təchizatçılar,
  hesabatlar.
- **Konsiliumlar** — halın birgə müzakirəsi.
- **Telemedisina**.
- **Bilik bazası** — personal üçün daxili materiallar.
- Əməkdaşlar üçün **elanlar**.
- Pasiyentlərin **rəyləri** və saytdan gələn **müraciətlər**.
- Klinikanın fəaliyyəti üzrə **analitika**.

## Klinikada pasiyentlər

**Pasiyenti həkim deyil, qeydiyyatçı və ya administrator qeydə alır.** Bu,
həkimin pasiyenti özünün əlavə etdiyi fərdi həkim kabinetindən fərqlənir.

Pasiyent kartı ilə kim nə edə bilər:

- **sahib** və **administrator** — qeydə almaq, dəyişmək, silmək;
- **qeydiyyatçı** — qeydə almaq və dəyişmək, lakin silməmək;
- **həkim** və **tibb bacısı** — yalnız kartı görmək. Pasiyenti qeydə ala
  bilmirlər, lakin **onun kartında tibbi qeydlər apara bilərlər** — bu, ayrıca
  səlahiyyətdir;
- **menecer** — yalnız görmək;
- **mühasib** və **əczaçı** — kartlara giriş yoxdur.

Pasiyentlərin siyahısı — `/clinic/patients`, əlavə etmə —
`/clinic/patients/new`. Əməkdaşlar üçün öz zonasında eyni səhifələr mövcuddur:
`/clinic/employee/patients` və `/clinic/employee/patients/new`.

### Əlavə edilərkən nə baş verir

Sistem bu şəxsin artıq tanınıb-tanınmadığını yoxlayır və bundan sonra dörd
nəticə mümkündür:

1. **Belə pasiyent bu klinikada artıq mövcuddur** (telefon və ya e-poçt üst-üstə
   düşüb) — yeni kart yaradılmır, mövcud kart açılır.
2. **Şəxsin platformada hesabı var.** Kartı sadəcə başqasının hesabına bağlamaq
   olmaz: əvvəlcə pasiyentin razılığını təsdiqləmək lazımdır. Təsdiqdən sonra
   kart onun hesabı ilə əlaqələndirilir və o, qeydləri öz hesabında görür.
3. **Şəxsin başqa klinikadan verilməmiş kartı var.** Bu da razılığın təsdiqi ilə
   həyata keçirilir; bundan sonra giriş üçün yeni müvəqqəti məlumatlarla yeni
   pasiyent kartı buraxılır.
4. **Şəxs sistemdə yoxdur** — kart yaradılır və zərurət olduqda ona giriş üçün
   müvəqqəti məlumatlarla pasiyent kartı verilir ki, daxil olub öz qeydlərini
   görə bilsin.

İkinci və üçüncü hallar əlavə edilərkən imtinanın ən çox rast gəlinən
səbəbidir: sistem belə şəxsin artıq tanındığını bildirir və razılığın
təsdiqlənməsini xahiş edir. Bu, daxiletmə xətası deyil, müdafiə tədbiridir:
başqasının tibbi kartı sahibinin xəbəri olmadan hesaba bağlanmamalıdır.

### Pasiyent kartına giriş

Klinika girişi ayrıca sorğulayır və bundan sonra hər şey fərdi həkimdə olduğu
kimi işləyir: pasiyent bölmələri ayrı-ayrılıqda açır, girişi geri ala bilər,
yoxlama isə hər müraciətdə aparılır.

## Klinikanın saytı

Sayt platformanın daxilində qurulur, ayrıca hostinq tələb olunmur.

- **İctimai vitrin** — `/clinics/<адрес клиники>`: xidmətlər, həkimlər, rəylər,
  müraciətlərin qəbulu.
- **Öz səhifələriniz** — konstruktorda əlavə olunur və
  `/clinics/<адрес клиники>/<страница>` ünvanında yerləşir.
- Səhifə **qaralama** və ya **dərc olunmuş** vəziyyətdə mövcud olur: dərc
  etməyincə onu kənardan heç kim görməyəcək.

İdarəetmə — `/clinic/pages`, vitrinin ilkin baxışı — `/clinic/public-page`.
Saytdan gələn müraciətlər e-poçta deyil, müraciətlər bölməsinə düşür.

## Tariflər

- **Start — ayda 99 $.** 5 həkimə qədər, ayda 120 Aİ təhlili və 90 epikriz,
  25 material, 1500 dəqiqə video.
- **Business — ayda 249 $.** 15 həkimə qədər, 280 təhlil və 300 epikriz,
  80 material, 5000 dəqiqə video. **Analitika** və pasiyentlərə
  **tövsiyələrdə prioritet** qoşulur.
- **Enterprise — ayda 499 $.** 50 həkimə qədər: 480 təhlil və 550 epikriz,
  150 material, 15 000 dəqiqə video. 50 həkimdən çox — ayrıca müqavilə əsasında.

**Platforma qəbullardan faiz götürmür** — heç bir tarifdə; pasiyentin ödənişi
tamamilə həkimə gedir. Klinika yalnız abunə haqqını ödəyir.

Təhlillər və epikrizlər bütün klinika üzrə aylıq hesablanır: onların hər biri
dil modelinə müraciətdir və platforma bunun üçün pul ödəyir. Rəqəmlər ştatın
adi iş yükünə ehtiyatla götürülüb və işi məhdudlaşdırmaq üçün deyil, nasazlıq
halı üçün nəzərdə tutulub. Analitika və tövsiyələrdə prioritet Business
tarifindən etibarən mövcuddur.

## Məlumatlar və giriş

Pasiyent kartlarına girişə aid olan hər şey fərdi həkimdə olduğu kimi işləyir:
pasiyent bölmələri ayrı-ayrılıqda açır və girişi geri ala bilər, yoxlama isə
hər müraciətdə aparılır.

Bir klinikanın məlumatları digəri üçün əlçatan deyil: ayırma yalnız interfeysdə
deyil, verilənlər bazasına sorğular səviyyəsində yoxlanılır. Pasiyent kartına
hər müraciət dəyişdirilməsi və ya silinməsi mümkün olmayan audit jurnalına
yazılır.

<!-- translated-from-ru: 93c8a522dc85661d192852ad3228b3c218a42e6e -->
