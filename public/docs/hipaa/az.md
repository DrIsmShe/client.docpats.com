# HIPAA: platformada nə edilib

Dürüst ifadə: DocPats tibbi məlumatların işlənməsinə dair **HIPAA tələbləri
nəzərə alınmaqla qurulmuşdur**. Bu, keçirilmiş kənar audit və imzalanmış
məlumatların işlənməsi haqqında saziş (BAA) ilə eyni şey deyil — bunlar
hələlik bizdə yoxdur və əksini demək dürüst olmazdı.

Aşağıda — sözə inanmaq yerinə özünüz qiymətləndirə bilməniz üçün konkret
olaraq nələrin tətbiq edildiyi göstərilir. Suallar üçün:
[support@docpats.com](mailto:support@docpats.com).

---

## Təmizlənməsi mümkün olmayan giriş jurnalı

Tibbi karta hər müraciət ayrıca jurnala yazılır. Qeydlərin dəyişdirilməsi və
silinməsi hüquqların tənzimlənməsi ilə deyil, **məlumat modeli səviyyəsində
qadağandır**: platformanın administratoru giriş tarixçəsini fiziki olaraq
redaktə edə bilmir. Saxlanma müddəti — yeddi ildir.

Jurnala struktur düşür: kim, nə vaxt, hansı resursa və hansı əməliyyatla
müraciət edib. **Tibbi məzmun jurnala yazılmır** — bu, kodda ayrıca
qaydadır, çünki jurnal məlumatların özündən daha uzun yaşayır və onların
ikinci, daha az qorunan saxlanma yerinə çevrilməməlidir.

## Məlumatların saxlanma zamanı şifrələnməsi

Pasiyenti identifikasiya etməyə imkan verən mətn məlumatları və tibbi
qeydlər verilənlər bazasına yazılmadan əvvəl şifrələnir. Cərrahi
modelləşdirmə domeni üçün bütövlüyün yoxlanılması ilə alqoritm istifadə
olunur: dəyişdirilmiş əməliyyat planı inandırıcı, lakin yanlış məlumat
qaytarmaq yerinə ümumiyyətlə deşifrə olunmayacaq.

Şifrələnmiş sahələr üzrə axtarış geri qaytarılmayan barmaq izləri vasitəsilə
qurulub: həkim pasiyenti telefon nömrəsi ilə tapır, lakin barmaq izindən
nömrəni bərpa etmək mümkün deyil.

## Minimum zəruri giriş

Qeydiyyatdan keçmiş pasiyent həkimin girişini özü təsdiqləyir və kartın
bölmələrini **ayrı-ayrılıqda** açır. Razılığı geri götürmək mümkündür.

Klinikanın daxilində hüquqlar doqquz rol üzrə bölünür — sahibkardan
əczaçıya qədər — və hüquq konkret əməkdaş üçün ayrıca bölmə səviyyəsinə
qədər dəqiqləşdirilə bilər. Başqasının rolunu öz rolundan yüksək səviyyəyə
qaldırmaq qadağandır: əməkdaş özündə olmayan hüquqları verə bilməz.

## Klinikalar arasında izolyasiya

Klinikaya mənsubiyyət verilənlər bazasına hər sorğuya avtomatik olaraq əlavə
edilir, özgə məlumatları əldə etməyə çalışan sorğu isə rədd olunur. Bu,
interfeysdəki yoxlama deyil, məlumatlara giriş qatının xüsusiyyətidir. Bu
hal üçün layihədə ayrıca testlər var: A klinikasının məlumatları B
klinikasının kontekstində sorğulanır və boş nəticə qaytarmalıdır.

## Süni intellekt nə edir və nə etmir

Analizlərin və təsvirlərin təhlili köməkçi olaraq işarələnir, işarə
dəyişdirilə bilmir və hər hansı ixracda məlumatlarla birlikdə köçürülür.
Həkim öz rəyini yazmayana qədər iş bağlana bilməz və modelin nəticəsi heç
vaxt oraya avtomatik əlavə edilmir. Klinik qərara görə məsuliyyət insanın
üzərində qalır — bu, xırda hərflərlə yazılmış xəbərdarlıqda deyil, sistemin
quruluşunda təsbit olunub.

## Hələlik nələr yoxdur

- **HIPAA-ya uyğunluq üzrə kənar audit.**
- Tərəfdaş klinikalar üçün **imzalanan BAA.**
- **SOC 2 sertifikatlaşdırması.**

Əgər bu sənədlər işiniz üçün lazımdırsa — yazın, müddətləri müzakirə edək:
[support@docpats.com](mailto:support@docpats.com).

---

Həmçinin baxın: [platforma məlumatlarınızla necə davranır](/docs/privacy).

<!-- translated-from-ru: e3c4adfd989f60b3d8945845f2af0baddb294dbf -->
