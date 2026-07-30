# DocPats Surgical Simulation — İstifadəçi təlimatı

**Sənədin versiyası:** 1.0 (MVP)
**Kimlər üçün:** Praktikada çalışan plastik cərrahlar, ENT mütəxəssisləri, kosmetoloqlar

---

## Mündəricat

1. [Surgical Simulation nədir](#что-такое-surgical-simulation)
2. [2 dəqiqədə iş prosesi](#рабочий-процесс-за-2-минуты)
3. [Yeni planın yaradılması](#создание-нового-плана)
4. [Pasiyentin fotoşəklinə dair tələblər](#требования-к-фотографии-пациента)
5. [Redaktorun interfeysi](#интерфейс-редактора)
6. [Control points ilə iş](#работа-с-контрольными-точками)
7. [Qabaqcıl deformasiya texnikaları](#продвинутые-техники-деформации)
8. [Pasiyentlə konsultasiya](#консультация-с-пациентом)
9. [İxrac və sənədləşdirmə](#экспорт-и-документация)
10. [Yadda saxlama, dublikatlar, silinmə](#сохранение-дубликаты-удаление)
11. [Qısayol düymələri](#горячие-клавиши)
12. [Məxfilik və PHI](#конфиденциальность-и-phi)
13. [Problemlərin həlli](#решение-проблем)
14. [Workflow üzrə tövsiyələr](#рекомендации-по-workflow)
15. [Versiyaların yol xəritəsi](#дорожная-карта-версий)

---

## Surgical Simulation nədir

Surgical Simulation modulu — müdaxilədən əvvəl pasiyentin fotoşəkli üzərində plastik əməliyyatın gözlənilən nəticəsini vizuallaşdırmaq üçün alətdir. Siz foto yükləyir, qarşıdan gələn korreksiya zonalarında control points yerləşdirir, onları istənilən mövqeyə çəkirsiniz — təsvir real vaxt rejimində deformasiya olunaraq gözlənilən nəticəni göstərir.

Alət Radial Basis Function və Gaussian filtri tətbiq edilməklə 2D deformasiya (liquify / mesh warp) bazasında işləyir. Bütün hesablamalar brauzerdə WebWorker istifadə olunmaqla yerinə yetirilir; plan DocPats-ın qorunan serverinə yadda saxlanılana qədər pasiyentin məlumatları sizin cihazınızdan kənara çıxmır.

**Bu modulu aşağıdakılar üçün istifadə edin:**

- Əməliyyat barədə qərar verilməzdən əvvəl pasiyentlə konsultasiya
- Gözləntilərin dəqiqləşdirilməsi (expectation management)
- Əməliyyatönü planın sənədləşdirilməsi
- Pasiyentin razılığı (informed consent) üçün vizual material hazırlanması
- Klinika komandasında variantların daxili müzakirəsi

**Modul aşağıdakıları əvəz etmir:**

- Pasiyentin klinik qiymətləndirilməsi
- Rentgenoloji planlama
- 3D skanlama (göstərişlər olduqda)
- Hüquqi əhəmiyyət daşıyan tibbi rəy

Simulyasiyanın nəticəsi **təxmini vizuallaşdırmadır**, konkret əməliyyat nəticəsinin zəmanəti deyil.

---

## 2 dəqiqədə iş prosesi

**Addım 1.** Əsas menyu → "Simulyasiya" → sağ yuxarı küncdə `+ Новый план` düyməsi.

**Addım 2.** Açılan pəncərədə pasiyentin fotosunu sürüşdürüb buraxın və ya yükləmə sahəsinə klikləyin. İcazə verilən formatlar: JPG, PNG, WebP. Maksimum ölçü: 20 MB. Minimum ayırdetmə: 200×200 px.

**Addım 3.** Modal pəncərənin 2-ci addımında planın adını daxil edin (məsələn: "İvanov İ.A. — rinoplastika, variant 1") və istəyə görə pasiyent identifikatorunu göstərin. "Yarat" düyməsini basın.

**Addım 4.** Redaktor açılacaq. Rejimi "Nöqtə əlavə et" vəziyyətinə keçirin (yuxarı paneldəki `+●` ikonu). Qarşıdan gələn korreksiya zonalarında klikləyin — control points görünəcək.

**Addım 5.** "Seçim" rejiminə keçin (kursor-ox ikonu). Hər nöqtənin mavi dairəsini istənilən mövqeyə çəkin. Təsvir real vaxt rejimində deformasiya olunur.

**Addım 6.** Nəticə əməliyyat planına uyğun gəldikdə sağ yuxarı küncdəki "Əvvəl / Sonra" tabına keçin. Slayder müqayisəni göstərir.

**Addım 7.** "İxrac" panelində formatı (JPG/PNG), rejimi (əvvəl / sonra / side-by-side) seçin və "Yüklə" düyməsini basın. Fayl lokal olaraq saxlanılacaq.

Bütün dəyişikliklər hər 2 saniyədə avtomatik yadda saxlanılır. Yadda saxlama indikatoru toolbar-ın sağ hissəsində yerləşir.

---

## Yeni planın yaradılması

### Planın adlandırılması

Planın adı verilənlər bazasında şifrələnəcək və yalnız sizə əlçatan olacaq. Adın tövsiyə olunan strukturu:

`[Soyad A.A.] — [əməliyyatın növü], [variant]`

Nümunələr:

- `Petrova A.B. — rinoplastika, konservativ`
- `Petrova A.B. — rinoplastika, aqressiv`
- `Sidorov V.K. — blepharoplasty, hər iki göz`

Əgər **variantları** müzakirə edirsinizsə — konservativ / mülayim / aqressiv — bir pasiyent üçün bir neçə plan yaradın. Bu, pasiyentə konsultasiyada onları müqayisə etmək imkanı verəcək.

### Pasiyent identifikatoru

Bu sahə istəyə bağlıdır. İstifadə edə bilərsiniz:

- Klinikanın tibbi kartının nömrəsi
- Baş hərflər
- Daxili kod

Bu sahə də şifrələnir. Klinika GDPR/HIPAA tələbləri altında işləyirsə, tam ad-soyaddan istifadə etməyin — kart nömrəsi kifayətdir.

### Planların axtarışı və sıralanması

Planların siyahısında əlçatandır:

- Ad və ya pasiyent identifikatoru üzrə **axtarış** (böyük-kiçik hərf nəzərə alınmır)
- **Sıralama**: yenidən köhnəyə, köhnədən yeniyə, əlifba sırası ilə

---

## Pasiyentin fotoşəklinə dair tələblər

Simulyasiyanın dəqiqliyi ilkin fotonun keyfiyyətindən kritik dərəcədə asılıdır.

### Məcburi şərtlər

**Ayırdetmə.** Qısa tərəf üzrə minimum 1000×1500 px. Optimal 2000×3000 px. Smartfonun adi rejimdə çəkdiyi foto uyğundur. Selfi və web-kamera fotolarının istifadəsi genişbucaqlı obyektivin perspektiv təhrifinə görə tövsiyə edilmir.

**İşıqlanma.** Ön tərəfdən bərabər, üzdə kəskin kölgələr olmadan. Bright sunlight və arxa işıqlanmadan çəkinin. Optimal variant — studiya softbox-u və ya pəncərədən daxil olan səpələnmiş gün işığı.

**Kameraya qədər məsafə.** 1.5 metrdən yaxın olmasın. Bu, burun və çənənin perspective distortion-unu minimuma endirir. 50-85 mm focal length ekvivalentindən istifadə edin (iPhone-da — wide deyil, 2× telephoto obyektiv).

**Neytral üz ifadəsi.** Pasiyent gülümsəmir, dodaqlar qapalıdır, lakin sıxılmamışdır. Gözlər açıqdır, kameraya baxır. Heç bir mimik yığılma olmamalıdır.

**Saçlar.** Üzdən yığılmış olmalıdır. Alnı, qulaqları, çənə xəttini örtməməlidir. İdeal variant — arxaya toplanmış.

**Zinət əşyaları və makiyaj.** Çıxarılmalıdır. Pirsing, iri sırğalar, parlaq dodaq boyası — hamısı referensi təhrif edir.

**Neytral fon.** Açıq və birrəngli (boz, ağ, solğun mavi). Başın arxasında naxış, tekstur, parlaq obyektlər olmamalıdır.

### Rakurslar

Tam dəyərli planlama üçün bir pasiyentin üç fotosunun olması arzuolunandır:

1. **Frontal** (anfas) — simmetriyanın, burun qanadlarının enliyinin, dodaqların formasının qiymətləndirilməsi üçün
2. **Profile** (profil, sol və sağ) — bucağın, burun kürəyinin (dorsum), burun ucunun, çənənin qiymətləndirilməsi üçün
3. **3/4** (yarımprofil) — orta zonanın həcminin, yanaq sümüklərinin qiymətləndirilməsi üçün

**Vacibdir:** cari versiyada (MVP) hər foto = ayrı bir plandır. Növbəti versiyada (v2) bir plan çərçivəsində multi-view nəzərdə tutulur.

### Foto tələblərə uyğun deyilsə nə etməli

Onu yükləməyin. Pasiyentdən yenidən çəkdirməsini xahiş edin və ya klinikada özünüz çəkin. Keyfiyyətsiz foto üzərində deformasiya yalançı gözləntilər yaradır və bu, əməliyyatdan sonra konfliktə gətirib çıxarır.

---

## Redaktorun interfeysi

### Səhifənin başlığı

- **"← Planların siyahısına" oxu** — bütün planların siyahısına qayıdış.
- **Planın adı və pasiyent ID-si** — oxun altında göstərilir.
- **"Redaktor / Əvvəl-Sonra" tabları** — iş rejiminin dəyişdirilməsi.

### Redaktorun yuxarı paneli (toolbar)

Canvas-ın sağ yuxarı küncündə yerləşir. Elementlər soldan sağa:

**1. "Seçim" rejimi** (kursor-ox ikonu). Aktiv olduqda mavi rənglə işıqlanır. Bu rejimdə:

- Canvas fonuna klik və çəkmə — panoramlaşdırma (pan)
- Nöqtənin mavi dairəsinə klik — seçim + çəkmə (drag)
- Sarı kvadrata klik — nöqtənin seçilməsi
- Alt + sarı kvadratın çəkilməsi — anchor-un yerdəyişməsi

**2. "Nöqtə əlavə et" rejimi** (`+●` ikonu). Aktiv olduqda mavidir. Bu rejimdə fotoya klik yeni control point yaradır.

**3. Undo / Redo** (↶ / ↷ ikonları). Son əməliyyatın geri alınması və qaytarılması. Geri alınacaq bir şey yoxdursa, qeyri-aktivdir. Hotkey: Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y).

**4. Zoom −** / faiz / **Zoom +**. Miqyasın kiçildilməsi və böyüdülməsi. Cari faiz ortada göstərilir. Siçan çarxı ilə də əlçatandır — zoom kursora bağlıdır (Figma-da olduğu kimi).

**5. "Fit"** — fotonu canvas-ın ölçüsünə uyğunlaşdırmaq.

**6. "1:1"** — zoom-u 100%-ə sıfırlamaq, fotonu mərkəzləşdirmək.

**7. Yadda saxlama indikatoru** — sağdakı sonuncu element:

- `●` mavi, pulsasiya edən — yadda saxlanılır
- `✓` yaşıl — yadda saxlanıldı
- `✕` qırmızı — yadda saxlama xətası (internet bağlantısını yoxlayın)

### Aşağı məlumat zolağı

Sol aşağı küncdə göstərir:

- Fotonun ayırdetməsi (nümunə: `677×1200`)
- Deformasiya nöqtələrinin sayı

### Nöqtənin xassələr paneli

İstənilən nöqtə seçildikdə sağ aşağı küncdə görünür. Tərkibi:

- **Radius (Təsir radiusu)** — 1–50% slayderi. Nöqtə ətrafındaki deformasiya zonasını təyin edir. Radius kiçik olduqca dəyişiklik daha lokal olur. Dəyər təsvirin uzun tərəfinə nisbətdə faizlə göstərilir. Canvas üzərindəki nöqtəli dairə radius-u vizuallaşdırır.

- **Strength (Güc)** — −1.00-dan +1.00-a qədər slayder. 1.00 olduqda nöqtə piksellərini yerdəyişmə istiqamətinə tam güclə dartır. 0.50 olduqda — yarı güclə. Mənfi dəyərlərdə nöqtə piksellərini yerdəyişmədən **itələyir** (əks effektli korreksiyalar üçün istifadə olunur).

- **Başlıqdaki × işarəsi** — nöqtənin silinməsi.

- Panelin aşağısındaki **ipucları**:
  - `Alt + перетаскивание квадрата — сдвиг центра`
  - `Del — удалить`

---

## Control points ilə iş

### Control point-in anatomiyası

Hər nöqtə dörd elementdən ibarətdir:

1. **Sarı kvadrat (Anchor)** — deformasiyanın ilkin mərkəzi. Adətən ilk klikin yeri ilə üst-üstə düşür. Susmaya görə hərəkət etmir.

2. **Mavi dairə (Current)** — hədəf nöqtə. Anchor mövqeyində yerləşən pikseli "köçürmək istədiyiniz" yer. Çəkmə üçün əsas elementdir.

3. Anchor və current arasındaki **nöqtəli xətt** — yerdəyişmə vektoru. Deformasiyanın istiqamətini və kəmiyyətini göstərir.

4. Anchor ətrafındaki **nöqtəli dairə** — nöqtənin təsir zonası. Piksel mərkəzdən uzaq olduqca onun yerdəyişməsi azalır. Dairənin hüdudlarından kənarda deformasiya yoxdur.

### Nöqtələrin əlavə edilməsi

1. `+●` rejiminə keçin.
2. Korreksiya planlaşdırılan zonalarda klikləyin. Hər klik yeni nöqtə yaradır.
3. Yaradılarkən nöqtənin anchor = current olur (yəni yerdəyişmə sıfırdır). Susmaya görə radius 8%, strength 1.00-dır.

### Nöqtənin yerinin dəyişdirilməsi

1. "Seçim" rejiminə keçin.
2. Mavi dairəni siçanın sol düyməsi ilə tutub istənilən mövqeyə çəkin.
3. Hərəkət etdikcə foto real vaxt rejimində deformasiya olunur.

### Dəqiq tənzimləmə

1. Nöqtəni seçin (mavi dairəyə və ya sarı kvadrata klik).
2. Sağ aşağı paneldə redaktə edin:
   - Radius — təsir zonasının enliyi
   - Strength — deformasiyanın gücü

### Nöqtənin silinməsi

Üç üsul:

- Nöqtəni seçin → xassələr panelində × düyməsini basın
- Nöqtəni seçin → klaviaturada Delete və ya Backspace
- Nöqtəni seçin → Escape seçimi sıfırlayır (silmir)

### Nöqtə limiti

Texniki maksimum — plan üzrə 200 nöqtə. Praktikada keyfiyyətli rinoplastika üçün 10–25 nöqtə kifayətdir, daha mürəkkəb müdaxilələr üçün (üzün tam rekonstruksiyası) — 50–70-ə qədər.

---

## Qabaqcıl deformasiya texnikaları

Cari MVP mühərriki qlobal RBF deformasiyasından istifadə edir. Bu, lokal dəyişikliklər üçün yaxşı nəticələr verir, lakin dəqiq idarəetmə üçün müəyyən texnika tələb edir.

### Texnika 1 — Lokal dəyişikliklər üçün kiçik nöqtələr

Problem: böyük radius yalnız hədəf zonanı deyil, qonşu strukturları da deformasiya edir. Həlli — dəqiq dəyişikliklər üçün kiçik radius (2-4%) istifadə etmək.

**Nümunə: burun donqarının götürülməsi**

1. Donqarın zirvəsində birbaşa nöqtə yaradın.
2. radius = 2-3% təyin edin.
3. Strength = 1.00.
4. Mavi dairəni 3-5 piksel **şaquli olaraq aşağı** çəkin.
5. Donqar hamarlanır, burun kürəyinin qonşu hissələri isə praktiki olarak yerindən tərpənmir.

### Texnika 2 — Xətt boyunca nöqtə zəncirləri

Problem: bir nöqtə dairəvi (radial) təhrif yaradır. **Xətti** strukturun korreksiyası üçün (burun kürəyi, çənə xətti, dodaq xətti) nöqtə zənciri lazımdır.

**Nümunə: burun kürəyinin düzəldilməsi**

1. Burun kürəyi boyunca burun uzunluğunun 10-15%-i intervalla 4-5 nöqtə yaradın.
2. Hər nöqtə üçün radius 2-3%.
3. Mavi dairələri istənilən düz xətt üzrə düzülməsi üçün çəkin.
4. Nəticə: burun kürəyi düzəldilib, üzün qalan hissəsi toxunulmamış qalıb.

### Texnika 3 — Lövbər nöqtələri (anchors)

Problem: bir zona deformasiya olunduqda qonşu zona (məsələn, burunun yanındaki yanaqlar) da RBF sahəsinin yayılması səbəbindən bir qədər hərəkət edir.

Həlli — korreksiya zonasının perimetri boyunca **lövbər nöqtələri** qoymaq. Lövbər nöqtələrində anchor = current olur (mavi dairə yerini dəyişmir), lakin onlar warp hesablamasında iştirak edərək qonşu pikselləri hərəkətdən saxlayır.

**Nümunə: dodaqların hərəkəti olmadan burun ucunun korreksiyası**

1. Burun ucunda işçi nöqtə yaradın, radius 5%, yuxarı çəkin.
2. Filtrumda (burun və dodaq arasında) lövbər nöqtə yaradın, radius 4%, **tərpətməyin**.
3. Burun qanadlarının hər iki tərəfində lövbər nöqtələr yaradın, radius 3%, **tərpətməyin**.
4. Burun ucu qaldırılıb, filtrum və dodaq yerində qalıb.

### Texnika 4 — "Şişirtmə" üçün mənfi strength

Bəzən nöqtəni sürüşdürmək deyil, sahəni "şişirtmək" lazım gəlir (burun qanadları daha geniş, dodaqlar daha dolğun).

1. Genişləndirmək istədiyiniz zonanın mərkəzində nöqtə yaradın.
2. Mavi dairəni istənilən sərhədin **hüdudlarından kənara** çəkin.
3. strength dəyərini **−0.3 ilə −0.5** arasında (mənfi dəyər) təyin edin.
4. Radius = 5-10%.
5. Zona nöqtədən itələnir = genişlənmə effekti.

### Texnika 5 — Dublikatlar vasitəsilə çoxsaylı variantlar

Konsultasiya üçün eyni əməliyyatın bir neçə variantının olması əlverişlidir. Planların siyahısında "Dublikat et" funksiyasından istifadə edin:

1. "Petrova A.B. — rinoplastika, variant 1 (konservativ)" planını yaradın.
2. Redaktə edin: kiçik yerdəyişmələr, incə dəyişikliklər.
3. Planların siyahısında → bu planın üzərindəki "Kopyala" düyməsi.
4. Dublikatı yenidən adlandırın: "Petrova A.B. — rinoplastika, variant 2 (mülayim)".
5. Açın, deformasiyaları gücləndirin.
6. "variant 3 (aqressiv)" üçün təkrarlayın.

Konsultasiyada pasiyentə hər üç variantı ardıcıl olaraq göstərin.

### Nələrdən çəkinmək lazımdır

**Böyük radius ilə böyük yerdəyişmələri eyni vaxtda istifadə etməyin.** Bu, fonda və saç xəttində dalğavari artefaktlar yaradır.

**Fonu deformasiya etməyin.** Saç xətti / qulaq / çiyin radius-a düşürsə, onlar da təhrif olunur. Fonu "kilidləmək" üçün ətrafda lövbər nöqtələri qoyun.

**Güclü zoom out ilə işləməyin.** Nöqtələrin dəqiq yerləşdirilməsi 100% və ya daha böyük zoom tələb edir. Toolbar-daki `+` və `1:1` düymələrindən istifadə edin.

**Simmetriyanı nəzərdən qaçırmayın.** Pasiyent burunun korreksiyasını istəyirsə, hər iki tərəfi uzlaşdırılmış şəkildə deformasiya edin. Cari MVP-də bu, əl ilə edilir (mirror mode v2-də görünəcək).

---

## Pasiyentlə konsultasiya

"Əvvəl / Sonra" tabı **pasiyentə göstərmək** üçün nəzərdə tutulub. Burada texniki elementlər minimum, vizual müqayisə isə maksimumdur.

### Slayder-ayırıcı

Mərkəzi təsvir dairəvi tutacağı olan şaquli xətt ilə bölünüb. Onu sağa-sola çəkməklə pasiyent görür:

- Sol hissə — "Əvvəl" fotosu (orijinal)
- Sağ hissə — "Sonra" fotosu (deformasiya ilə)

Qarışıqlıq olmaması üçün künclərdə "ƏVVƏL" və "SONRA" yazıları var.

### Konsultasiyanın tövsiyə olunan ssenarisi

1. Planı fullscreen rejimində açın (tam ekran üçün brauzerdə F11).
2. Pasiyentə "Redaktor" tabını göstərin — nöqtələrin özünü vizual marker kimi istifadə edərək nəyi dəyişməyi planladığınızı izah edin.
3. "Əvvəl / Sonra"ya keçin, pasiyentin özünə slayderi hərəkət etdirmək imkanı verin.
4. Müzakirə edin — bu, onun gözləntilərinə uyğundur, ya yox.
5. Digər variantlar varsa (konservativ / aqressiv) — cari planı bağlayın, növbətisini açın.
6. Yekunda bir variantı final kimi seçin.
7. Informed consent-ə əlavə etmək üçün PDF (və ya JPG + çap) formatında ixrac edin.

### Pasiyentə nə demək vacibdir

Simulyasiya — **gözlənilən nəticənin vizuallaşdırılmasıdır, zəmanət deyil**. Əməliyyatın real nəticəsi aşağıdakılardan asılıdır:

- Toxumaların fərdi xüsusiyyətləri (dərinin qalınlığı, elastikliyi, qığırdaqların qalınlığı)
- Sağalma və çapıqlaşma prosesi
- Cərrahın texnikası
- Pasiyentin əməliyyatdan sonrakı rejimə riayət etməsi

Simulyasiyadan ±10-20% kənara çıxmalar normaldır və əməliyyatın defekti sayılmır. Bu ifadəni informed consent-də istifadə edin.

---

## İxrac və sənədləşdirmə

### "İxrac" paneli

"Əvvəl / Sonra" tabında sağda yerləşir.

### Nəyi ixrac etmək

**1. Əməliyyatdan əvvəl (orijinal)** — pasiyentin deformasiyasız ilkin fotosu. Medical record üçün, nəticə ilə müqayisədə "əvvəlki fakt" kimi istifadə olunur.

**2. Əməliyyatdan sonra (deformasiya ilə)** — warp tətbiq edilmiş foto. Pasiyentə göstərmək və planın sənədləşdirilməsi üçün istifadə olunur.

**3. Yan-yana: Əvvəl və Sonra** — "ƏVVƏL" və "SONRA" yazıları ilə bir təsvirdə side-by-side kompozisiya. Çap və informed consent üçün ən əlverişli formatdır.

### Format

**JPG** — əksər hallar üçün tövsiyə olunur. Kiçik həcm, 85-92%-də məqbul keyfiyyət.

**PNG** — sıxılma olmadan, maksimum keyfiyyət. Nəticə sonradan Photoshop-da redaktə olunacaqsa və ya böyük formatda çap ediləcəksə istifadə edin.

### JPG keyfiyyəti

Slayder 40-100%. Tövsiyələr:

- 60-70% — e-poçt, messencerlər üçün
- 80-90% — document print üçün standart
- 95-100% — arxiv, nəşr üçün

### Yükləmə

Parametrləri tənzimlədikdən sonra "Yüklə" düyməsini basın. Fayl brauzerinizin Downloads qovluğuna `plan-2026-04-24-ринопластика.jpg` tipli adla saxlanılacaq.

### Sənədləşdirmə üzrə tövsiyə

Hər əməliyyat üçün pasiyentin elektron kartına saxlayın:

1. Orijinal foto ("Əvvəl" ixracı)
2. Nəticənin simulyasiyası ("Sonra" ixracı)
3. Side-by-side ("Yan-yana" ixracı)
4. Görünən control points ilə redaktorun skrinşotu (Print Screen vasitəsilə) — dəqiq nəyin planlaşdırıldığını anlamaq üçün

Bu, pre-op planlamanın tam sənədləşdirilməsini yaradır və pasiyentlə post-op mübahisələrdən qoruyur.

---

## Yadda saxlama, dublikatlar, silinmə

### Avtomatik yadda saxlama

Bütün dəyişikliklər (nöqtələrin əlavə edilməsi/silinməsi, onların parametrlərinin dəyişdirilməsi, çəkilməsi) son əməliyyatdan **2 saniyə sonra avtomatik** yadda saxlanılır. Əl ilə heç nə etmək lazım deyil.

Yuxarı toolbar-daki yadda saxlama indikatoru cari statusu göstərir:

- `●` mavi, pulsasiya edən — yadda saxlanılır
- `✓` yaşıl — yadda saxlanıldı
- `✕` qırmızı — xəta (internet bağlantısını yoxlayın)

Səhifə bağlandıqda və ya başqa tab-a keçildikdə məcburi yadda saxlama işə düşür. Məlumatlar itmir.

### Planın dublikat edilməsi

Planların siyahısında hər kartın üç düyməsi var: "Aç", "Kopyala", "Sil".

**Kopyala** eyni foto və bütün control points ilə planın tam dublikatını yaradır. Dublikat siyahının yuxarısında görünür. Redaktəyə başlamazdan əvvəl onu yenidən adlandırın (məsələn, adına "(variant 2)" əlavə edin).

İstifadə olunur:

- Əməliyyatın bir neçə variantının yaradılması üçün
- Eksperimental dəyişikliklərdən əvvəl planın backup-ı üçün
- Oxşar anatomiyaya parametrlərin köçürülməsi üçün

### Planın silinməsi

"Sil" düyməsi təsdiq tələb edir. Təsdiqdən sonra:

- Plan verilənlər bazasında silinmiş kimi işarələnir (soft delete)
- Pasiyentin fotosu 24 saat sonra R2 anbarından silinir (bu fotoya dublikatlardan başqa istinad yoxdursa)
- Plan siyahıdan itir

**Diqqət:** silinməni geri qaytarmaq mümkün deyil. Ehtiyat lazımdırsa — orijinalı silməzdən əvvəl planı dublikat edin.

---

## Qısayol düymələri

Mətn daxiletmə sahələri istisna olmaqla, səhifənin hər yerində işləyir.

- **`Ctrl + Z`** — Undo (geri alma)
- **`Ctrl + Shift + Z`** və ya **`Ctrl + Y`** — Redo (təkrarlama)
- **`Delete`** və ya **`Backspace`** — Seçilmiş nöqtəni silmək
- **`Escape`** — Seçimi sıfırlamaq + "Seçim" rejiminə keçmək
- **`Siçan çarxı`** — Kursorun mövqeyinə doğru zoom
- **`Alt + sarı kvadratın çəkilməsi`** — Seçilmiş nöqtənin anchor-unu yerdəyişmək

Növbəti versiyalarda əlavə edilməsi nəzərdə tutulur:

- `V` — "Seçim" rejimi
- `A` — "Əlavə et" rejimi
- `+` / `−` — zoom
- `0` — fit to view
- `1` — 100% zoom
- `Space + drag` — müvəqqəti pan rejimi

---

## Məxfilik və PHI

DocPats Surgical Simulation pasiyentlərin tibbi məlumatlarına dair HIPAA (ABŞ) və GDPR (Aİ) tələbləri nəzərə alınmaqla hazırlanmışdır.

### Nə şifrələnir

- **Planın adı** — AES-256-GCM, verilənlər bazasında şifrələnir
- **Pasiyent identifikatoru** — AES-256-GCM, verilənlər bazasında şifrələnir
- **Fotoşəkil** — R2-də server tərəfi şifrələmə ilə saxlanılır, giriş yalnız avtorizasiya olunmuş session üzrədir

### Nə şifrələnmir

- Control points (koordinatlar, radius, strength) — bunlar HIPAA anlamında PHI deyil, çünki foto və metaməlumatlardan ayrı olaraq pasiyenti identifikasiya etmir
- Planın yaradılma/yenilənmə tarixləri

### Giriş

- Yalnız siz DocPats hesabının sahibi kimi öz planlarınıza giriş imkanına maliksiniz
- Nə Anthropic, nə də DocPats komandası planlarınızın məzmununu oxuya bilməz
- Məhkəmə tələbi olduqda şifrələnmiş məlumatlar təqdim olunur, açar klinikada qalır

### Tövsiyələr

**DocPats hesabı üçün mürəkkəb parollar və 2FA istifadə edin.** Hesabınızın sındırılması = pasiyentlərin PHI-nin kompromitasiyası.

**Skrinşotları PIN/parol olmayan qorunmayan local disk-də saxlamayın.** İxrac edilmiş JPG/PNG faylları avtomatik şifrələnmir.

**Klinikanın kompüterini istifadədən çıxarmazdan əvvəl** brauzer cache-inin foto kopyalarını saxlamadığından əmin olun. Browser privacy tools istifadə edin (məsələn, Chrome-da Cleanup Cache).

**Avropa pasiyentləri ilə işləyərkən** (GDPR) — fotonu sistemə yükləməzdən **əvvəl** biometrik məlumatların işlənməsinə yazılı razılıq alın.

---

## Problemlərin həlli

### Foto yüklənmir, "Görsel okunamadı" və ya "Image cannot be read" mesajı görünür

**Səbəb 1:** Format dəstəklənmir. Yalnız JPG, PNG, WebP dəstəklənir. HEIC (iPhone native) **işləmir**.

**Həlli:** HEIC-i JPG-yə konvertasiya edin (Mac-da Photos, onlayn konverter).

**Səbəb 2:** Foto 200×200 px-dən kiçikdir.

**Həlli:** thumbnail və ya preview deyil, orijinal fotodan istifadə edin.

**Səbəb 3:** Fayl zədələnmişdir və ya real image deyil (məsələn, .docx-dan .jpg kimi adlandırılmış fayl).

**Həlli:** Faylı standart baxış proqramında açın (Photos, Preview). Açılmırsa — fayl xarabdır, başqasından istifadə edin.

### Editor yüklənir, lakin canvas boşdur

**Səbəb:** R2 anbarından foto yüklənərkən CORS xətası. Adətən ilk yükləmə zamanı, Cloudflare hələ düzgün headers-i keşləməyəndə baş verir.

**Həlli:** 30 saniyə gözləyin, Hard Refresh edin (Ctrl+Shift+R). Kömək etmirsə — DocPats texniki dəstəyinə müraciət edin.

### Nöqtələr görünür, lakin çəkilmir

**Səbəb:** Brauzer pointer capture events almır. Ən çox köhnə brauzer və ya tablet/stylus-un spesifik parametri səbəb olur.

**Həlli:** Brauzeri son versiyaya yeniləyin (Chrome 120+, Firefox 115+, Edge 120+, Safari 17+). Touchpad-da — siçan istifadə edin.

### Deformasiya fotoya tətbiq olunmur (nöqtələr hərəkət edir, foto isə dəyişmir)

**Səbəb:** WebWorker yüklənməmişdir. Chrome cihazın yaddaşı azaldıqda worker-i bloklaya bilər.

**Həlli:** Artıq tabları bağlayın, editor-u yenidən yükləyin (F5). Təkrarlanırsa — başqa brauzer və ya 8GB+ RAM olan kompüter istifadə edin.

### Yadda saxlama indikatoru qırmızıdır (✕)

**Səbəb:** DocPats serveri ilə bağlantı yoxdur və ya session-un müddəti bitmişdir.

**Həlli:** İnterneti yoxlayın. Hər şey qaydasındadırsa — səhifəni yenidən yükləyin (son 2 saniyədəki dəyişikliklər itə bilər, qalan hər şey yadda saxlanılıb).

### Plan yaratdığım halda planların siyahısı boşdur

**Səbəb:** Başqa hesabla daxil olmuşsunuz və ya təsadüfən dev/staging mühitinə keçmişsiniz.

**Həlli:** URL-i (klinikanın production-URL-i olmalıdır) və hesab parametrlərindəki e-poçtu yoxlayın.

### Foto aşağı ayırdetmədə ixrac olunur

**Səbəb:** Siz full-resolution orijinal deyil, fotonun preview versiyasından (maksimum 1200 px) istifadə edirsiniz.

**Həlli:** İxrac zamanı sistem warp-ı avtomatik olarak tam ayırdetməyə tətbiq edir — yükləmə indikatoru itənə qədər gözləyin (ixrac panelinin sağ yuxarı küncündə). Gözləmədən "Yüklə" düyməsini basmayın.

### Editor ləng işləyir, donur

**Səbəb:** 50+ nöqtəsi olan planlarda və 4000×6000 px fotolarda deformasiya low-end cihazlar üçün ağır olur.

**Həlli:**

- Fit rejimində işləyin (kiçik preview hesablama baxımından daha sərfəlidir)
- Nöqtələrin sayını azaldın (yaxın olanları birləşdirin)
- Dedicated GPU olan cihaz istifadə edin

---

## Workflow üzrə tövsiyələr

İstifadə praktikasından çıxan, konsultasiya üçün optimal workflow:

### Pasiyent gəlməzdən əvvəl (10-15 dəqiqə)

1. Pasiyentin fotosunu açın (əvvəlcədən e-poçtla alınmış və ya ilkin vizitdə çəkilmiş).
2. DocPats-də 2-3 variant-plan yaradın:
   - `[Pasiyent] — konservativ`
   - `[Pasiyent] — mülayim`
   - `[Pasiyent] — aqressiv`
3. Hər birində nöqtələri əvvəlcədən yerləşdirin, yadda saxlayın.

### Konsultasiya zamanı (30-40 dəqiqə)

1. Pasiyentə əməliyyatın imkanlarını və məhdudiyyətlərini vizuallaşdırma olmadan izah edin.
2. DocPats-i böyük monitorda açın (minimum 24").
3. Yerləşdirilmiş nöqtələrlə **redaktoru** göstərin — anatomiyanı izah edin.
4. **Əvvəl/Sonra**ya keçin — pasiyentə slayderlə oynamaq imkanı verin.
5. **Hər 3 variantı** ardıcıl göstərin. Hər birinin müzakirəsinə 5-10 dəqiqə ayırın.
6. Pasiyentin gözləntilərini və tərəddüdlərini müzakirə edin.
7. Final variantı birlikdə seçin.

### Konsultasiyadan sonra (5 dəqiqə)

1. Final planı 3 formatda (əvvəl / sonra / side-by-side) JPG 90% keyfiyyətlə ixrac edin.
2. Pasiyentin electronic medical record-una saxlayın.
3. Pasiyentin fiziki qovluğu üçün side-by-side variantı çap edin.
4. Pasiyentin imzası ilə informed consent-ə əlavə edin: "_Mən gözlənilən nəticənin simulyasiyasını gördüm və bunun təxmini vizuallaşdırma olduğunu anlayıram_".
5. Əməliyyat günü (və ya bir gün əvvəl) — komanda ilə təzə şəkildə təkrar nəzərdən keçirmək üçün final planı DocPats-də açın.

---

## Versiyaların yol xəritəsi

Cari versiya (MVP) — funksiyaların baza dəsti.

### v2.0 "Assisted" (yaxın 3-4 həftə üçün planlaşdırılır)

- **Üzün avtomatik işarələnməsi** MediaPipe Face Mesh vasitəsilə — plan açılarkən 468 anatomical landmark avtomatik görünür
- **Nöqtə qrupları** — burun / dodaqlar / gözlər / qaşları ayrıca göstərmək/gizlətmək
- **Kalibrasiya** — bəbəklərarası məsafəni göstərməklə bütün ölçmələri millimetrlə almaq
- **Tibbi ölçmələr** — nasofrontal angle, nasolabial angle, tip projection (Goode's ratio), alar base width
- **Symmetry lock** — sağ yarının sola güzgüləndirilməsi
- **Nasal surgery presets** — hump reduction / tip refinement / nostril narrowing üçün pre-configured nöqtə dəstləri
- **Mask protection** — deformation saçlara və fona avtomatik olaraq təsir etmir

### v3.0 "Professional"

- **Liquify brush** — nöqtələrə əlavə olaraq interaktiv Photoshop-style alət
- **Reference library** — sürətli matching üçün "hədəf burunlar" bazası
- **Multi-view** — bir planda 3-5 rakurs, sinxron deformasiya
- Klinikanın loqosu, measurements və consent text ilə pasiyent üçün **PDF hesabat**
- **Consultation mode** — təqdimat üçün fullscreen UI

### v4.0 "3D"

- ML vasitəsilə 2D→3D reconstruction
- 3D mesh editing
- Pasiyentin smartfonunda AR preview

---

_Sənəd DocPats redaksiyası tərəfindən Dr. İsmayılovun rəhbərliyi altında hazırlanmışdır, aprel 2026._

<!-- translated-from-ru: 65848d708c47ec27f7c2babbb9fcaac9b390bb72 -->
