# Materialın süni intellekt tərəfindən təhlili

Köməkçi klinik materialı təhlil edir və nəyə diqqət yetirmək, nəyi
dəqiqləşdirmək və məlumatlarda nəyin çatışmadığını göstərir. Bölmə
`/diagnostics` ünvanında yerləşir.

## Əsas qayda

**İşi təhlil deyil, siz bağlayırsınız.** Öz nəticənizi yazmayana qədər iş
bağlanmayacaq — sistem birbaşa imtina edəcək və işin süni intellektin təhlili
ilə deyil, həkimin rəyi ilə bağlandığını bildirəcək.

Modelin nəticəsi heç vaxt sizin rəyinizə avtomatik daxil edilmir, onun hər bir
nəticəsi köməkçi kimi işarələnir və bu işarə dəyişdirilməzdir: o, məlumatlarla
birlikdə ixraca və istənilən inteqrasiyaya ötürülür.

## Nəyi təhlil etmək mümkündür

Doqquz növ müayinə: laborator analizlər, rentgen, CT, MRI, ultrasəs müayinəsi,
ECG, endoskopiya, histologiya, dermatoskopiya. Bundan əlavə, **klinik halın
bütövlükdə** təhlili — ayrıca bir təsvirin deyil, mənzərənin məcmu halda
əhəmiyyət daşıdığı vəziyyətlər üçün.

Daxildə üç fərqli təhlil mexanizmi işləyir: müayinə rəyləri üzrə, laborator
göstəricilər üzrə və klinik hal üzrə. Hansının tətbiq olunacağını əlavə
etdiyiniz materiallar müəyyən edir.

## Təhlilin işə düşməsi üçün zəruri olan iki şərt

1. **Materiallar depersonallaşdırılıb** — təsvirdə və blankın başlığında
   pasiyentin soyadı yoxdur. Bu, sizin qeydinizdir: sistem məzmunu sizin
   əvəzinizə yoxlaya bilmir.
2. **Xarici model tərəfindən emala razılıq var** — fayl platformadan kənara
   çıxır və bu, defolt olaraq qoyulan işarə deyil, şüurlu qərardır.

Hər iki qeyd qoyulmayana qədər təhlil düyməsi işləməyəcək və nəyin
çatışmadığını bildirəcək. Eyni iki şərt sənədin tanınmasına da şamil olunur.

## İş qaydası

1. `/diagnostics` bölməsində **iş yaradın**: ad, təhlil almaq istədiyiniz sual
   və klinik kontekst.
2. **Materialları əlavə edin** — təsvirlər, blank skanları, PDF. Fayllar
   şifrələnmiş şəkildə saxlanılır.
3. Zərurət olduqda **sənədi tanıdın**: model skandan mətni və göstəriciləri
   çıxaracaq ki, blankı əl ilə yenidən yığmağa ehtiyac qalmasın. Nəticəni
   qarşısında orijinal olan insan yoxlayır.
4. **Təhlili işə salın.** İş «təhlil olunur» vəziyyətinə keçir; iş tapşırıqlar
   şəklində aparılır və hər biri ayrıca görünür — növbədə, icra olunur, hazır,
   xəta və ya ötürülüb. Ayrıca tapşırığı digərlərinə toxunmadan yenidən işə
   salmaq olar.
5. **Tapıntıları nəzərdən keçirin** (aşağıya baxın).
6. **Nəticə yazın** və işi bağlayın.

Bağlanmış iş zərurət olduqda **yenidən açıla bilər** — məsələn, əlavə müayinə
nəticələri daxil olduqda.

## Tapıntılar və sizin verdiktiniz

Hər tapıntı əhəmiyyət dərəcəsi alır: **kritik**, **vacib** və ya **qeyd**.

Hər tapıntı üzrə siz verdikt qoyursunuz: **razıyam**, **qismən** və ya **razı
deyiləm**. Verdikt olmadıqca tapıntı nəzərdən keçirilməmiş sayılır.

Verdikt formallıq deyil. O, eyni anda iki iş görür: bu, həm təhlilə əks
əlaqədir, həm də sonradan qayıda biləcəyiniz material işarələməsidir.

## Neçə təhlil əlçatandır

- **Lite** — ayda 5 təhlil.
- **Sınaq dövrü və Start tarifi** — ayda 15.
- **Growth** — ayda 40.
- **Pro** — ayda 100.

Hesablama təqvim ayı üzrə deyil, 30 günlük sürüşən pəncərə üzrə aparılır: kvota
ayın birində sıfırlanmır, tədricən boşalır.

Hesablama ilə bağlı bir vacib dəqiqləşdirmə. Bir neçə istiqaməti — rentgen, CT,
laboratoriya — əhatə edən iş **hər istiqamət üzrə ayrıca təhlil** işə salır və
kvotada bir o qədər yer tutur. Bu, xırdaçılıq deyil: hər istiqamət modelə
müstəqil müraciətdir.

Aylıq kvotadan əlavə, iki ümumi limit də qüvvədədir — saatda 20 və sutkada 60
təhlil. Onlar bütün tariflərdə eynidir və büdcəni deyil, təsadüfi dövrədən
qoruyur: düymə ilişib, skript pozulub.

## İxrac

İş bütövlükdə ixrac olunur: materiallar, sizin verdiktlərinizlə tapıntılar və
sizin nəticəniz. Həm ayrıca əlavə edilmiş faylı, həm də işi bütövlükdə silmək
mümkündür.

## Köməkçinin etmədikləri

O, diaqnoz qoymur və müalicə təyin etmir. Səbəb ifadələrdəki ehtiyatlılıq
deyil: canlı pasiyent barədə diaqnoz təsdiq edən sistem ayrıca tənzimlənməyə
malik tibbi cihazdır. Modul köməkçi olaraq qaldıqca bu status yaranmır və
sərhədi «rahatlıq naminə» bulanıqlaşdırmaq olmaz.

<!-- translated-from-ru: a16f94496fc9c38880bd655c6d5ce8fdaf9710db -->
