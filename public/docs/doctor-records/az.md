# Xəstəlik tarixçəsi və müayinə şablonları

Pasiyent kartının daxildən necə doldurulduğu və eyni məlumatları əl ilə təkrar-təkrar yazmaqdan necə xilas olmaq barədə bölmə.

## Xəstəlik tarixçəsi nədən ibarətdir

Kart bütöv mətn şəklində deyil, həkim üçün tanış olan bölmələr üzrə aparılır. Hər bölmə — öz qeydlər siyahısıdır: qeyd əlavə etmək, onu tam açmaq, artıq olanı silmək mümkündür.

Bölmələr:

- şikayətlər;
- anamnesis morbi — hazırkı xəstəliyin tarixçəsi;
- anamnesis vitae — həyat anamnezi;
- status praesens — ümumi vəziyyət;
- status localis — lokal status;
- laboratoriya müayinələrinin nəticələri;
- CT rəyləri;
- MRI rəyləri;
- USM rəyləri;
- tövsiyələr.

Qeydlər toplanır: təkrar müraciət zamanı siz yenisini əlavə edirsiniz, əvvəlkilər isə yerində qalır və siyahıda görünür. Beləliklə, kartda bir silinmiş versiya yerinə xronologiya formalaşır.

Xəstəlik tarixçəsinin əlavə edilməsi `/dp/add-patient-medical-history/<id пациента>` səhifəsindən başlayır.

## Müayinə nəticələri

Mətn bölmələrindən ayrı olaraq pasiyentə instrumental müayinələrin nəticələri — fayl və təsvirlə birlikdə — əlavə edilir. Dəstəklənir:

rentgen, CT, MRI, USM, doppler, ECG, ExoKQ, EEQ, holter, spirometriya, koronaroqrafiya, angioqrafiya, PET, OFEKT (SPECT), qastroskopiya, kapsul endoskopiyası, ginekoloji müayinə — və laboratoriya analizləri.

Yükləmə səhifəsinin ünvanı bütün növlər üçün eyni qaydada qurulub:

```
/dp/add-<вид>-scan-upload/<тип пациента>/<id пациента>
```

Laboratoriya nəticələri öz səhifəsi ilə əlavə olunur — `/dp/add-labtest-results/<тип пациента>/<id пациента>`.

**Ünvandaki pasiyent tipi** — qeydiyyatdan keçmiş və privat pasiyentlərə ayırmanın özüdür: eyni səhifələr hər iki tipə xidmət edir, ona görə də linkdə kimin kartının açıldığını göstərmək lazımdır.

## Şablonlar: eyni məlumatı təkrar yazmamaq üçün

Hər müayinə növünün **dörd hissəsi** var və hər biri üçün şablon hazırlamaq mümkündür:

1. **Müayinənin adı** — proseduranın sizin praktikanızda necə adlandığı;
2. **Protokol** — görünənlərin təsviri;
3. **Rəy** — nəticə;
4. **Tövsiyələr** — sonrakı addımlar.

Şablon bir dəfə yaradılır və sonra yeni müayinəyə əlavə olunur, yenidən yazılmır. Hazır şablona baxmaq, onu dəyişdirmək və silmək mümkündür.

Ünvanlar vahid qaydada qurulub:

```
/dp/add-<вид>-scan-template-nameofexam      создать заготовку названия
/dp/add-<вид>-scan-template-report          создать заготовку протокола
/dp/add-<вид>-scan-template-diagnosis       создать заготовку заключения
/dp/add-<вид>-scan-template-recomandation   создать заготовку рекомендаций

/dp/list-<вид>-scan-template-<часть>/<id>     список заготовок
/dp/update-<вид>-scan-template-<часть>/<id>   изменить
/dp/detail-<вид>-scan-template-<часть>/<id>   посмотреть целиком
```

Məsələn, CT üçün: `/dp/add-ct-scan-template-report`.

## Bu, praktikada vaxtı necə qənaət edir

Eyni növ müayinələr bir-birinə bənzəyir: tapıntılar dəyişir, təsvirin strukturu isə eyni qalır. Protokolu və tipik rəyləri bir dəfə hazırladıqdan sonra siz müayinəni hazır hissələrdən yığır və yalnız konkret pasiyentdə fərqlənən hissələri düzəldirsiniz.

Hazır şablonlar sizinkidir: onlar sizin hesabınıza bağlıdır və iş getdikcə toplanır.

## Bu məlumatlarla sonra nə olur

Xəstəlik tarixçəsinin qeydləri və müayinə nəticələri kartın məzmununu təşkil edir və bu məzmun:

- qeydiyyatdan keçmiş pasiyent tərəfindən öz kabinetində, sizə açdığı bölmələr çərçivəsində görünür;
- `/diagnostics` bölməsində süni intellekt təhlilinə əlavə edilə bilər — lakin yalnız materialı deidentifikasiya etdikdən və emala razılığı təsdiqlədikdən sonra;
- pasiyent arxivləşdirilərkən saxlanılır: kart aktiv siyahıdan bütövlükdə çıxır və eyni şəkildə geri qaytarılır.

<!-- translated-from-ru: c35d98297e0ec0d214bae77ef68c134e1f715409 -->
