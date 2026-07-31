# Qəbullar və həkimin cədvəli

Qeydiyyat üçün vaxtın necə açılması, pasiyentin qeydiyyatı ilə nə baş verdiyi və
qəbulların tarixçəsinə haradan baxılması barədə bölmə.

## Cədvəl necə qurulur

Cədvəl hər tarix üzrə ayrılıqda deyil, **həftənin günlərinə görə** təyin edilir.
Həftənin günü üçün siz bir və ya bir neçə iş intervalı göstərirsiniz, məsələn,
09:00–13:00 və 15:00–18:00.

Hər intervalın öz parametrləri var:

- **slotun müddəti** — bir qəbulun neçə dəqiqə çəkdiyi. Susmaya görə 20
  dəqiqədir, 5-dən 240-a qədər təyin edilə bilər;
- **qəbulun növü** — əyani və ya video. Eyni gün müxtəlif növ intervalları
  ehtiva edə bilər: məsələn, səhər əyani, axşam video vasitəsilə.

İntervallar və slot müddəti əsasında platforma pasiyentin gördüyü boş vaxtı özü
bölüşdürür. Hər slotu ayrıca daxil etməyə ehtiyac yoxdur.

Cədvəlin öz **saat qurşağı** var (susmaya görə Asia/Baku). İntervallardakı vaxt
bu qurşaq üçün yerli vaxtdır, buna görə də başqa saat qurşağındakı pasiyent
özü üçün doğru olan vaxtı görür.

## Cədvəl necə təyin edilir

1. `/doctor/doctor-schedule` səhifəsini açın.
2. Həftənin gününü seçin və interval əlavə edin: başlama vaxtı, bitmə vaxtı,
   slotun müddəti, qəbulun növü.
3. Zərurət yaranarsa, eyni günə ikinci interval əlavə edin — fasilə, məsələn,
   nahar fasiləsi belə yaradılır.
4. Yadda saxlayın. Boş slotlar pasiyentlərdə avtomatik görünəcək.

İntervalı silmək mümkündür — bu halda həmin gündə həmin vaxt artıq təklif
olunmur.

## Məzuniyyət, konfrans, bir məşğul gün

Konkret tarixlər üçün **istisnalar** nəzərdə tutulub, onlar həftəlik cədvəldən
üstündür:

- **istirahət günü** — gün tamamilə bağlanır, ona qeydiyyat mümkün olmur;
- **xüsusi saatlar** — bu tarixdə adi intervalların əvəzinə başqa intervallar
  qüvvədə olur.

İstisnaya səbəb göstərmək olar — o, sizin üçündür, pasiyent onu görmür.

İstisnanın rahatlığı ondadır ki, əsas cədvəli pozmur: göstərilən tarixdən sonra
hər şey yenidən həftəlik şəbəkə üzrə işləyir.

## Pasiyent qeydiyyatdan keçəndə nə baş verir

Qeydiyyat sizdə **«təsdiq gözləyir»** vəziyyətində görünür. Sonra o, aşağıdakı
vəziyyətlərdən keçir:

- **təsdiq gözləyir** — pasiyent slotu seçib, siz hələ cavab verməmisiniz;
- **təsdiqlənib** — siz qəbulu razılaşdırmısınız;
- **ləğv edilib** — qəbul baş tutmayacaq;
- **baş tutub** — qəbul keçirilib;
- **gəlməyib** — pasiyent gəlməyib;
- **ödəniş qaytarılıb** — əgər qeydiyyat üzrə ödəniş olubsa.

Qeydiyyatlar yalnız pasiyent tərəfindən yaradılmır: qəbulu həkimin özü də,
qeydiyyat şöbəsi də yarada bilər. Qeydiyyatı kimin yaratdığı qeydə alınır.

Qeydiyyatlara baxmaq və onları idarə etmək — `/doctor/doctor-appointment`
səhifəsində. Qəbullar üzrə icmal — `/doctor/dashboard`.

## Əyani qəbul və videoqəbul

Növ hələ cədvəldə təyin edilir və qeydiyyata köçürülür. Videoqəbulda kabinetin
ünvanı əvəzinə əlaqə üsulu göstərilir: platformanın daxili video otağı,
WhatsApp və ya Zoom.

Daxili video otağı birbaşa brauzerdə açılır — heç nə quraşdırmağa ehtiyac
yoxdur.

## Qeydiyyatların arxivi

Tamamlanmış qeydiyyatları iş siyahısında maneə törətməsinlər deyə **arxivə
köçürmək** olar: `/doctor/appointments/archive`. Arxivləşdirmə geri qaytarıla
bilər — qeydiyyat ümumi siyahıya qayıdır.

Pasiyent kartlarında olduğu kimi, burada da arxiv silinmənin əvəzinədir:
qəbullar barədə məlumatlar itmir.

## Dəyişikliklər jurnalı

Hər qeydiyyat üzrə **jurnal** aparılır: onu kimin və nə vaxt yaratdığı,
təsdiqlədiyi, ləğv etdiyi, təxirə saldığı, baş tutmuş və ya gəlməmiş kimi
qeyd etdiyi, həmçinin sistem hadisələri — məsələn, videoseansın başa çatması.
Baxmaq üçün — `/doctor/audit`.

Jurnal mübahisəli vəziyyətdə faydalıdır: o, qeydiyyatın cari vəziyyətini deyil,
əməliyyatların müəllifləri ilə birlikdə bütün tarixçəsini göstərir.

## Pasiyent nə görür

- `/patient/appointment` — həkimin seçimi və boş vaxta qeydiyyat;
- `/patient/my-appointment` — qarşıdakı qəbullar;
- `/patient/my-appointment-history` — keçmiş qəbullar.

Pasiyent yalnız sizin cədvəlinizlə açılmış və başqa qeydiyyat və ya istisna ilə
tutulmamış vaxtı görür.

<!-- translated-from-ru: f4758353cd7de6e2ccf588e9e72f5905824cbbf2 -->
