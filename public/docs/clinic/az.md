# Klinika

Klinika həkim kabinetinin yerləşdiyi eyni hesabda aktivləşdirilir — məlumatları
köçürmək lazım deyil. İdarəetmə `/clinic` bölməsindədir, əməkdaşlar
`/clinic/staff-login` vasitəsilə daxil olur və `/clinic/employee` zonasında
işləyirlər.

## Doqquz rol

Səlahiyyətlər «admin və ya admin deyil» prinsipi ilə deyil, rollara görə verilir
və hər rol öz vəzifə dairəsini əhatə edir:

- **sahib** və **administrator** — klinikanın bütün bölmələrinə tam giriş;
- **idarəedici** — maliyyə və sahib parametrləri istisna olmaqla, demək olar ki,
  hər şey;
- **həkim** — qəbul, pasiyent kartları, konsiliumlar, telemedisina, bilik bazası;
- **tibb bacısı** — həkimə yaxın, lakin bölmələrin tərkibi daha məhduddur;
- **qeydiyyatçı** — cədvəl, qeydiyyatlar, pasiyentlər, zənglərin və müraciətlərin
  qəbulu;
- **mühasib** — hesablar, ödənişlər, maliyyə hesabatları, əməkhaqqı hesablanması,
  maliyyə analitikası;
- **farmasevt** — aptek, anbar, təyinatlar, tədarükçülər, satınalma sifarişləri;
- **marketoloq** — klinikanın saytı, rəylər, müraciətlər, məqalələr, analitika.

Ümumilikdə qırx bölmə var və hər biri üzrə səlahiyyət üç cür olur: **oxumaq**,
**dəyişmək**, **silmək**. Rol — hazır şablondur; ayrıca əməkdaş üçün səlahiyyətlər
rolun üzərindən genişləndirilə və ya məhdudlaşdırıla bilər.

**Özündən yuxarı rol təyin etmək mümkün deyil** — qeydiyyatçı, forma səhifəsinə
çatsa belə, özünü administrator edə bilməz. Bu, yalnız interfeysdə gizlədilmir,
serverdə yoxlanılır.

## Klinikada nələr aparılır

- **Əməkdaşlar** — dəvətlər, rollar, hər həkimin iş cədvəli və təqvimi.
- **Struktur** — şöbələr, kabinetlər, avadanlıq.
- **Xidmətlər** və qiymət cədvəli.
- Klinikanın **pasiyentləri** və onların kartları.
- **Aptek və anbar** — buraxılış, satınalma sifarişləri, tədarükçülər, hesabatlar.
- **Konsiliumlar** — halın birgə təhlili.
- **Telemedisina**.
- **Bilik bazası** — personal üçün daxili materiallar.
- Əməkdaşlar üçün **elanlar**.
- Pasiyent **rəyləri** və saytdan gələn **müraciətlər**.
- Klinikanın işi üzrə **analitika**.

## Klinikanın saytı

Sayt platformanın daxilində yığılır, ayrıca hostinq lazım deyil.

- **Publik vitrin** — `/clinics/<адрес клиники>`: xidmətlər, həkimlər, rəylər,
  müraciətlərin qəbulu.
- **Öz səhifələriniz** — konstruktorda əlavə olunur və
  `/clinics/<адрес клиники>/<страница>` ünvanında yerləşir.
- Səhifə ya **qaralama**, ya da **dərc edilmiş** vəziyyətdə olur: dərc
  etməyincə, onu kənardan heç kim görməyəcək.

İdarəetmə — `/clinic/pages`, vitrinin ilkin baxışı — `/clinic/public-page`.
Saytdan gələn müraciətlər e-poçta deyil, müraciətlər bölməsinə düşür.

## Tariflər

- **Start — ayda 99 $.** 5 həkimə qədər, ayda 100 Sİ təhlili və 100 epikriz,
  30 material, 1500 dəqiqə video. Komissiya 10 %.
- **Business — ayda 249 $.** 15 həkimə qədər, təhlillər və epikrizlər
  məhdudiyyətsiz, 5000 dəqiqə video. Komissiya 7 %. **Analitika** və pasiyentlərə
  təqdim olunan **tövsiyələrdə prioritet** qoşulur.
- **Enterprise — ayda 499 $.** Həkimlərin sayına və qalan limitlərə görə
  məhdudiyyət yoxdur. Komissiya 5 %.

Tarif nə qədər yüksəkdirsə, qəbuldan tutulan komissiya bir o qədər aşağıdır:
10 %, 7 %, 5 %. Analitika və tövsiyələrdə prioritet Business tarifindən
başlayaraq əlçatandır.

## Məlumatlar və giriş

Pasiyent kartlarına girişə aid olan hər şey təkbaşına çalışan həkimdə olduğu kimi
işləyir: pasiyent bölmələri ayrı-ayrılıqda açır və girişi geri götürə bilər,
yoxlama isə hər müraciətdə aparılır.

Bir klinikanın məlumatları digərinə əlçatan deyil: ayırma yalnız interfeysdə
deyil, verilənlər bazasına sorğular səviyyəsində yoxlanılır. Pasiyent kartına hər
müraciət audit jurnalına yazılır və bu jurnalı dəyişmək və ya silmək mümkün
deyil.

<!-- translated-from-ru: 8aa4b76798723b01abccfa5dc5d1e527f4b19eb9 -->
