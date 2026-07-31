# Materialın süni intellekt tərəfindən təhlili

Köməkçi klinik materialı təhlil edir və nəyə diqqət yetirməyi, nəyi dəqiqləşdirməyi və məlumatlarda nəyin çatışmadığını göstərir. Bölmə `/diagnostics` ünvanında yerləşir.

## Əsas qayda

**İşi təhlil deyil, siz bağlayırsınız.** Öz nəticənizi yazmayana qədər iş bağlanmayacaq — sistem birbaşa imtina edəcək və işin süni intellektin təhlili ilə deyil, həkimin rəyi ilə bağlandığını bildirəcək.

Modelin nəticəsi heç vaxt sizin rəyinizə avtomatik əlavə olunmur, onun hər bir nəticəsi köməkçi kimi işarələnir və bu işarə dəyişdirilə bilməz: o, məlumatlarla birlikdə ixraca və istənilən inteqrasiyaya ötürülür.

## Nəyi təhlil etmək olar

Doqquz növ müayinə: laborator analizlər, rentgen, CT, MRI, USM, ECG, endoskopiya, histologiya, dermatoskopiya. Bundan əlavə, **bütövlükdə klinik hal** — ayrıca bir təsvirin deyil, ümumi mənzərənin əhəmiyyət daşıdığı hallarda.

Daxildə üç fərqli təhlil mexanizmi işləyir: müayinə rəyləri üzrə, laborator göstəricilər üzrə və klinik hal üzrə. Onlardan hansının tətbiq ediləcəyini əlavə etdiyiniz materiallar müəyyən edir.

## Təhlilin başlaması üçün zəruri olan iki şərt

1. **Materiallar deidentifikasiya olunub** — təsvirdə və blankın başlığında pasiyentin soyadı yoxdur. Bu, sizin qeydinizdir: sistem məzmunu sizin əvəzinizə yoxlaya bilməz.
2. **Xarici model tərəfindən emala razılıq var** — fayl platformanın hüdudlarından kənara çıxır və bu, defolt olaraq qoyulan işarə deyil, şüurlu qərardır.

Hər iki qeyd edilmədikcə, təhlil düyməsi işləməyəcək və nəyin çatışmadığını bildirəcək. Eyni iki şərt sənədin tanınmasına da aiddir.

## İş qaydası

1. `/diagnostics` bölməsində **iş yaradın**: ad, təhlilini almaq istədiyiniz sual və klinik kontekst.
2. **Materialları əlavə edin** — təsvirlər, blank skanları, PDF. Fayllar şifrələnmiş şəkildə saxlanılır.
3. Zərurət yaranarsa, **sənədi tanıdın**: model skandan mətni və göstəriciləri çıxaracaq ki, blankı əl ilə yenidən yığmağa ehtiyac qalmasın. Nəticəni orijinal qarşısında olan insan yoxlayır.
4. **Təhlili başladın.** İş «təhlil olunur» vəziyyətinə keçir; iş tapşırıqlar üzrə aparılır və hər biri ayrıca görünür — növbədə, icra olunur, hazır, xəta və ya buraxılıb. Ayrıca tapşırığı digərlərinə toxunmadan yenidən başlatmaq olar.
5. **Tapıntıları nəzərdən keçirin** (aşağıya baxın).
6. **Nəticə yazın** və işi bağlayın.

Bağlanmış iş zərurət yarandıqda **yenidən açıla bilər** — məsələn, əlavə müayinənin nəticələri daxil olduqda.

## Tapıntılar və sizin qərarınız

Hər tapıntı əhəmiyyət dərəcəsi alır: **kritik**, **vacib** və ya **qeyd**.

Hər tapıntı üzrə siz qərar verirsiniz: **razıyam**, **qismən** və ya **razı deyiləm**. Qərar verilmədikcə, tapıntı nəzərdən keçirilməmiş sayılır.

Qərar formallıq deyil. O, eyni anda iki funksiyanı yerinə yetirir: bu, həm təhlilə əks əlaqədir, həm də sonradan qayıda biləcəyiniz material işarələməsidir.

## Neçə təhlil mövcuddur

- **Sınaq dövrü və Growth tarifi** — ayda 60 təhlil.
- **Start** — ayda 20.
- **Pro** — məhdudiyyətsiz.

## İxrac

İş bütövlükdə ixrac olunur: materiallar, sizin qərarlarınızla birlikdə tapıntılar və sizin nəticəniz. Həm ayrıca əlavə edilmiş faylı, həm də bütövlükdə işi silmək mümkündür.

## Köməkçinin etmədikləri

O, diaqnoz qoymur və müalicə təyin etmir. Səbəb ifadələrdə ehtiyatlılıq deyil: canlı pasiyent barədə diaqnoz təsdiq edən sistem ayrıca tənzimlənməyə malik tibbi vasitədir. Modul köməkçi olaraq qaldıqca bu status yaranmır və bu sərhədi «rahatlıq üçün» bulanıqlaşdırmaq olmaz.

<!-- translated-from-ru: 5fdd2268fb0e8df3c981fb51e6aeb3a65d4f3234 -->
