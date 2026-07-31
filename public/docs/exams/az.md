# İmtahanlara hazırlıq

Sual bankı və imtahan proqramları üzrə məşq. Bölmə `/education` ünvanında
yerləşir.

## Nələrə hazırlaşmaq olar

Proqramlar **imtahan növünə** görə bölünüb:

- praktikaya buraxılış — SMLE, DHA, MOH, dövlət akkreditasiyası;
- rezidenturaya və ordinaturaya qəbul — TUS, akkreditasiya;
- ixtisas üzrə sertifikatlaşdırma;
- beynəlxalq sertifikatlar;
- fasiləsiz tibbi təhsil, NMO balları;
- ali məktəb imtahanları və dövlət imtahanları;
- klinika işçilərinin daxili təlimi.

Həmçinin **regiona** görə: MDB, Avropa, Yaxın Şərq və Şimali Afrika, Asiya,
Afrika, Amerika, Okeaniya, eləcə də ölkəyə bağlı olmayan proqramlar.

Proqramlar kataloqu — `/education`, konkret proqramın səhifəsi —
`/education/programs/<id проограммы>`.

## Dörd keçid rejimi

Rejim başlamazdan əvvəl seçilir və məşqin necə gedəcəyini müəyyən edir. Bu,
bölmədəki əsas parametrdir:

- **Mentor** — izah hər cavabdan dərhal sonra görünür, taymer yoxdur. Bu rejim
  mövzunun təhlili üçündür, yoxlama üçün deyil.
- **Vaxta qarşı** — taymer işləyir, izahlar sonda göstərilir. Sürət məşqi.
- **Sınaq imtahanı** — tam simulyasiya: sualların tərkibi real imtahanın
  strukturuna uyğun formalaşdırılır, taymer və sonda hesabat var.
- **Zəif mövzuların gücləndirilməsi** — suallar keçmiş cəhdlərinizin
  statistikasına, yəni çətinlik çəkdiyiniz mövzulara görə seçilir.

Sonuncu rejim məhz səhvlər üzərində işdir: harada səhv etdiyinizi özünüz
xatırlamaq lazım deyil — seçim avtomatik qurulur.

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
2. Suallara cavab verin; cəhd `/education/attempts/<id попытки>` ünvanında
   açılır.
3. Cəhdi tamamlayın — nəticə yadda saxlanılacaq.

Cəhd aşağıdakı vəziyyətlərdən birində olur: **davam edir**, **təhvil verilib**,
**vaxt bitib** və ya **yarımçıq qoyulub**. Vaxt bitibsə, cəhd avtomatik
hesablanır — cavablar itmir.

Bütün cəhdlər saxlanılır, onlara qayıdıb nəyi və necə cavabladığınıza baxmaq
olar.

## İmtahana hazırlıq səviyyəsi

Proqram üzrə **hazırlıq faizi** hesablanır və bu, sadəcə düzgün cavabların payı
deyil:

- hər mövzu üzrə nəticə onun real imtahan strukturundakı payına görə
  çəkilənir — imtahanda daha çox yer tutan mövzuların çəkisi daha böyükdür;
- ayrıca **əhatə** göstərilir: ümumiyyətlə neçə mövzu üzrə mənalı statistika
  toplandığı;
- yanında proqramın keçid balı, təyin edilibsə, göstərilir.

Buna görə də mövzuların üçdə biri əhatə olunduqda 80 % hazırlıq, tam əhatə
zamanı 80 %-dən fərqli məna daşıyır — və bu, imtahanda deyil, dərhal görünür.

## Neçə sual əlçatandır

- **Sınaq dövrü və Growth tarifi** — məhdudiyyətsiz.
- **Start** — ayda 1000 sual.
- **Pro** — məhdudiyyətsiz.

Bankın bir hissəsi abunə olmadan da, tanışlıq həcmində əlçatandır.

## Hansı dildə

Suallar platformanın dillərində mövcuddur: proqram və onun sualları, tərcümə
hazırdırsa, interfeysinizin dilində təqdim olunur.

<!-- translated-from-ru: b2e4897921f9ee7efe043e7720a32410876fe380 -->
