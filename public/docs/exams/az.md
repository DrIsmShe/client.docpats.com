# İmtahanlara hazırlıq

Sual bankı və imtahan proqramları üzrə məşq. Bölmə `/education` ünvanında
yerləşir.

## Nəyə hazırlaşmaq olar

Proqramlar **imtahan növünə** görə bölünüb:

- praktikaya buraxılış — SMLE, DHA, MOH, dövlət akkreditasiyası;
- rezidenturaya və ordinaturaya qəbul — TUS, akkreditasiya;
- ixtisas üzrə sertifikatlaşdırma;
- beynəlxalq sertifikatlar;
- fasiləsiz tibbi təhsil, fasiləsiz təhsil balları;
- ali məktəb imtahanları və dövlət imtahanları;
- klinika personalının daxili təlimi.

Həmçinin **regiona** görə: MDB, Avropa, Yaxın Şərq və Şimali Afrika, Asiya, Afrika,
Amerika, Okeaniya, eləcə də ölkəyə bağlı olmayan proqramlar.

Proqramlar kataloqu — `/education`, konkret proqramın səhifəsi —
`/education/programs/<id программы>`.

## Keçidin dörd rejimi

Rejim başlamazdan əvvəl seçilir və məşqin necə getdiyini müəyyən edir. Bu, bölmədəki
əsas parametrdir:

- **Mentor** — izah hər cavabdan dərhal sonra göstərilir, taymer
  yoxdur. Bu rejim mövzunun təhlili üçündür, yoxlama üçün deyil.
- **Vaxta qarşı** — taymer işləyir, izahlar sonda göstərilir. Temp
  məşqi.
- **Sınaq imtahanı** — tam simulyasiya: suallar həqiqi imtahanın strukturuna
  uyğun toplanır, taymer və sonda hesabat var.
- **Zəif mövzuların möhkəmləndirilməsi** — suallar keçmiş cəhdlərinizin statistikası
  əsasında, yəni çətinlik çəkdiyiniz mövzular üzrə seçilir.

Sonuncu rejim məhz səhvlər üzərində iş deməkdir: harada səhv etdiyinizi özünüz
xatırlamağa ehtiyac yoxdur — seçim avtomatik formalaşır.

## Sualların növləri

- bir düzgün variant;
- bir neçə düzgün variant;
- doğru və ya yanlış;
- klinik vinyet — müayinə məlumatları ilə məsələ;
- təsvir üzrə sual — rentgen, ECG, histologiya;
- klinik hal.

Hər sualın çətinlik səviyyəsi var: asan, orta, çətin.

## Cəhd necə keçir

1. Proqram səhifəsində rejimi seçin və cəhdə başlayın.
2. Suallara cavab verin; cəhd `/education/attempts/<id попытки>`
   ünvanında açılır.
3. Cəhdi tamamlayın — nəticə saxlanılacaq.

Cəhd bu vəziyyətlərdən birində olur: **davam edir**, **təhvil verilib**, **vaxt bitib**
və ya **yarımçıq qoyulub**. Vaxt bitərsə, cəhd avtomatik hesablanır — cavablar
itmir.

Bütün cəhdlər saxlanılır, onlara qayıdıb nəyi və necə cavablandırdığınıza baxa
bilərsiniz.

## İmtahana hazırlıq səviyyəsi

Proqram üzrə **hazırlıq faizi** hesablanır və bu, sadəcə düzgün cavabların payı
deyil:

- hər mövzu üzrə nəticə onun real imtahanın strukturundakı payına görə
  çəkilənir — imtahanda daha çox yer tutan mövzuların çəkisi daha böyükdür;
- ayrıca **əhatə** göstərilir: ümumiyyətlə neçə mövzu üzrə mənalı statistika
  toplanıb;
- yanında proqramın keçid balı göstərilir, əgər təyin edilibsə.

Buna görə də mövzuların üçdə biri əhatə olunduqda 80 % hazırlıq tam əhatə zamanı
80 %-dən fərqli məna daşıyır — və bu, dərhal görünür, imtahanda üzə çıxmır.

## Neçə sual mövcuddur

- **Lite** — ayda 500 sual.
- **Sınaq dövrü və Start tarifi** — ayda 1500 sual.
- **Growth və Pro** — məhdudiyyətsiz.

Suallar platformaya heç bir xərcə başa gəlməyən yeganə mövqedir:
bank özümüzündür, keçid zamanı dil modelinə müraciət yoxdur. Buna görə də burada
limitlər səxavətlidir, tariflər arasındakı fərq isə keçid **rejimlərinə** köçürülüb.

Bankın bir hissəsi abunə olmadan da, tanışlıq həcmində əlçatandır.

## Hansı dildə

Suallar platformanın dillərində mövcuddur: proqram və onun sualları tərcümə hazırdırsa,
interfeysinizin dilində gəlir.

<!-- translated-from-ru: 8a630e4e3b6d397bd32091c0095ced0a2b5a553c -->
