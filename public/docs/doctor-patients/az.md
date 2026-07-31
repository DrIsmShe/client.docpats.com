# Həkim kabinetində pasiyentlər

Bu bölmə pasiyenti necə əlavə etmək, onun kartını necə aparmaq, kabinetdən necə çıxarmaq və geri qaytarmaq barədədir. Bunların hamısı kabinetinizin **Poliklinika** bölməsində yerləşir.

## Pasiyentlərin iki tipi

**Qeydiyyatdan keçmiş** — şəxsin platformada hesabı var. O, öz məlumatlarını şəxsi kabinetində görür və kartın bölmələrinə girişinizi özü təsdiqləyir. Belə pasiyenti elektron poçt vasitəsilə tapırsınız: bu, məcburidir və onun hesabı ilə əlaqə rolunu oynayır.

**Privat** — şəxsin hesabı yoxdur, kartı özünüz aparırsınız. Kart eyni qaydada doldurulur, lakin pasiyent onu görmür və heç nəyi təsdiqləyə bilmir.

Tip pasiyent əlavə edilən anda seçilir və hansı səhifədən istifadə etdiyinizi müəyyənləşdirir. Sonradan kartlar ümumi siyahıda yanaşı yerləşir.

## Pasiyent necə əlavə edilir

1. **Poliklinika** bölməsini açın — `/dp/polyclinic` səhifəsi. Bu, pasiyentlərinizin siyahısıdır.
2. Əlavə etmə üsulunu seçin:
   - qeydiyyatdan keçmiş — `/dp/add-patient-polyclinic`;
   - privat — `/dp/add-private-patient-polyclinic`.
3. Kartı doldurun. Sahələr hər iki tip üçün eynidir:
   - elektron poçt — **məcburidir**, onsuz əlavə etmə mümkün deyil;
   - telefon, şəxsiyyəti təsdiq edən sənəd;
   - ad və soyad, cins, doğum tarixi (gg/aa/iiii formatında);
   - ölkə və ünvan;
   - peyvəndlər, allergiyalar, xroniki xəstəliklər, ailə anamnezi, keçirilmiş əməliyyatlar, zərərli vərdişlər, ixtiyari qeyd;
   - fotoşəkil — məcburi deyil, təsvir avtomatik olaraq kiçildilir.
4. Yadda saxlayın. Pasiyent siyahıda görünəcək və qəbula yazılma, müayinələr və xəstəlik tarixçəsi üçün əlçatan olacaq.

Artıq əlavə edilmiş pasiyenti axtarış səhifəsində tapmaq mümkündür — `/dp/search-patient-polyclinic`.

## Nə qədər pasiyent əlavə etmək mümkündür

Burada iki məhdudiyyət var və onlar fərqlidir:

- **Həkim hesabınız təsdiqlənməyənə qədər — 5 nəfərdən çox pasiyent olmaz.** Altıncısını əlavə etməyə cəhd edərkən sistem verifikasiyadan keçməyi xahiş edəcək. Bu, tarif məhdudiyyəti deyil, uydurma kabinetlərdən qorunma vasitəsidir.
- **Sonra tarif limiti qüvvəyə minir.** Sınaq dövründə bu, kabinetdə 600 pasiyentdir. Limit tükəndikdə tarifi dəyişmək zərurəti barədə mesaj görünəcək.

Verifikasiya və tarif fərqli şeylərdir: hesabın təsdiqlənməsi beş nəfərlik həddi aradan qaldırır, lakin tarif limitini artırmır.

## Kartda nələr aparıla bilər

Pasiyent kartı siyahı səhifəsindən açılır: qeydiyyatdan keçmiş pasiyent üçün `/dp/patient-detail/<id>`, privat pasiyent üçün `/dp/private-patient-detail/<id>`.

Kartın daxilində aşağıdakılar aparılır:

- şikayətlər;
- anamnesis morbi və anamnesis vitae;
- status praesens və status localis;
- laboratoriya müayinələrinin nəticələri;
- CT, MRI və USM rəyləri;
- tövsiyələr.

Xəstəlik tarixçəsi ayrı səhifə vasitəsilə əlavə edilir — `/dp/add-patient-medical-history/<id>`.

Təkrarlanan müayinələri yenidən yazmağa ehtiyac yoxdur: onlar özünüz üçün tənzimlədiyiniz şablonlar əsasında formalaşdırılır.

## Pasiyenti kabinetdən necə çıxarmaq olar

**Silinmə olaraq bir əməliyyat yoxdur — pasiyent arxivə göndərilir.** Bu, qəsdən belə edilmişdir: tibbi qeydlər bir düymə basmaqla yox olmamalıdır.

Kabinetdən çıxarılarkən nə baş verir:

- kart arxiv kimi işarələnir, onun arxivləşdirilmə tarixi saxlanılır;
- pasiyent əsas siyahıdan yox olur — susmaya görə yalnız aktiv olanlar göstərilir;
- qeydlərin özü heç yerə itmir.

Arxiv kartlarına siyahını dəyişməklə baxmaq olar: siyahı aktiv, arxiv və ya hamısını birlikdə göstərə bilir.

## Pasiyenti arxivdən necə qaytarmaq olar

Arxivləşdirmə geri qaytarıla biləndir: kart bərpa olunur və bütün qeydləri ilə yenidən aktiv siyahıda görünür. Hər iki tip üçün ayrı əməliyyatlar mövcuddur: qeydiyyatdan keçmiş pasiyentin bərpası və privat pasiyentin bərpası.

Kabinetdə silinmə arxivləşdirmə olduğu üçün təsadüfi düymə basmaqla pasiyentin tarixçəsini itirmək mümkün deyil.

## Pasiyentin özü nə görür

Qeydiyyatdan keçmiş pasiyent öz kartını şəxsi kabinetində görür və **hansı bölmələri sizə açacağına özü qərar verir**: allergiyalar, qəbullar, vizitlər, təsvirlər və rəylər, peyvəndlər, keçirilmiş əməliyyatlar — hər biri ayrılıqda. Bölmə açılmayana qədər siz onu görmürsünüz.

Pasiyent kartına hər müraciət dəyişdirilməsi və ya silinməsi mümkün olmayan jurnalda qeyd olunur.

Privat pasiyent öz kartını görmür: onun hesabı yoxdur və girişi təsdiqləmək üçün vasitəsi mövcud deyil.

Ayrıca elə hallar olur ki, hesabı olan pasiyent **sizi özü əlavə edir** — şəxsi kabinetindən öz həkimləri sırasına. Bu halda kart dərhal onun hesabı ilə əlaqələnir və bundan sonra o, bölmələrə girişi adi qaydada idarə edir.

<!-- translated-from-ru: 6dc02c2e379dca99d56422b318f23c229fc1b6ef -->
