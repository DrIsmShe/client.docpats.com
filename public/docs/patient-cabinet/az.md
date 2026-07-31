# Pasiyent kabineti

Özünüzdə nə görürsünüz, nəyi idarə edirsiniz və həkimə öz məlumatlarınıza girişi necə verirsiniz.

## Sizin tarixçəniz

- **Xəstəlik tarixçəsi** — `/patient/my-medical-histories`, hər bir qeyd
  bütövlükdə açılır.
- **Analizlər** — `/patient/my-lab-results`.
- **Təyinatlar** — `/patient/my-prescriptions`.
- **Müayinə faylları** — `/patient/get-patients-files`. Növlərə görə açılır:
  rentgen, CT, MRI, USM, ECG, EhoKQ, EEG, Holter, spirometriya, qastroskopiya,
  kapsul endoskopiyası, koronaroqrafiya, angioqrafiya, PET, SPECT,
  ginekoloji müayinə, laborator.

Qeydləri nəzarətində olduğunuz həkim daxil edir. Tarixçəniz bir klinikaya bağlı
deyil: həkimi və ya şəhəri dəyişsəniz, o, sizinlə qalır.

## Məlumatlarınızı kim görür

Heç nə öz-özünə açılmır. Həkim və ya klinika giriş tələb etdikdə, sorğu sizə
gəlir — `/patient/consent-requests`, verilmiş girişlər isə
`/patient/my-clinics` bölməsində görünür.

**İcazə bütövlükdə deyil, hissə-hissə verilir.** Ayrı-ayrılıqda açılır:

- vizitlər və onlara dair qeydlər;
- allergiyalar;
- xroniki xəstəliklər;
- keçirilmiş əməliyyatlar;
- ailə anamnezi;
- peyvəndlər;
- təsvirlər və rəylər.

Stomatoloqa allergiyaları açmaq, əməliyyatlar tarixçəsini isə açmamaq mümkündür.

## Girişi nə üçün açırlar

Hər razılığın məqsədi var və müddət də bundan asılıdır:

- bu klinikada **müalicə**;
- **göndəriş** — mütəxəssisdə birdəfəlik konsultasiya;
- **ikinci fikir** — başqa klinika üçün giriş;
- **təcili yardım** — bu cür razılığın **müddəti 7 gün sonra öz-özünə bitir**;
- **tədqiqatlar** — yalnız şəxsiyyəti müəyyənləşdirilməyən məlumatlar.

Razılığı **istənilən vaxt geri götürmək** mümkündür və təkrar geri götürmə heç nəyi
pozmur. Həmçinin razılığın əvvəlcədən təyin olunmuş müddəti ola bilər — bundan
sonra giriş sizin iştirakınız olmadan dayandırılır.

Razılığı elektron şəkildə, o cümlədən ASAN İmza vasitəsilə imzalamaq, yaxud kağız
variantın skanını əlavə etmək mümkündür.

## Hər müraciətdə yoxlama

Giriş **verilərkən bir dəfə deyil, həkim kartınızın bölməsini hər açdıqda**
yoxlanılır. Razılığı geri götürdünüz — bu bölməyə növbəti sorğu artıq keçməyəcək.

Məlumatlarınıza hər müraciət və razılıqlarla hər əməliyyat dəyişdirilməsi və ya
silinməsi mümkün olmayan jurnalda qeydə alınır.

## Həkimlər və qəbula yazılma

- **Həkim axtarışı** — `/patient/doctors`, profil — `/patient/doctor-details/<id>`.
- **Mənim həkimlərim** — `/patient/my-doctors`.
- **Qeydiyyat** — `/patient/appointment`: həkimin cədvəlindən boş vaxtı
  seçirsiniz.
- **Qarşıdakı qəbullar** — `/patient/my-appointment`, keçmiş qəbullar —
  `/patient/my-appointment-history`.
- **Video qəbul** — `/patient/telemed`, brauzerdə keçirilir, heç nə quraşdırmaq
  lazım deyil.

Qeydiyyat əvvəlcə təsdiq üçün həkimə gedir — vəziyyəti qəbullar siyahısında
görünür.

## Həkimlə ünsiyyət

Çat — `/patient/communication`. Yazışma saxlanılır, fayllar əlavə etmək mümkündür.
Mesajlar tərcümə olunur: siz öz dilinizdə yazırsınız, həkim öz dilində oxuyur.

## Tibbi köməkçi

`/patient/consultation-ai` — şikayətlərin təhlili, analizlərin izahı, hansı
mütəxəssisə müraciət etməli olduğunuza dair məsləhət. O, diaqnoz qoymur, təhlükəli
əlamətlər olduqda dərhal təcili yardım çağırmağı tövsiyə edir, bir neçə mesajdan
sonra isə **epikriz** — söhbətin qısa xülasəsini hazırlamağı təklif edir; onunla
həkimə getmək rahatdır.

Qeydiyyatdan keçmədən sınamaq mümkündür.

## Kabinetdə daha nələr var

- **Bildirişlər** — `/patient/notifications-for-patient`.
- **Həkim məqalələri** — `/patient/all-articles`, həmçinin süni intellektin
  mövzuya uyğun topladığı materiallar — `/patient/articles-ai-for-patients`.
- **Dəvət** — `/patient/invite`.

## Məlumatlarınız sizə aiddir

Öz tarixçənizin ixracı **bütün tariflərdə, o cümlədən ödənişsiz tarifdə,
məhdudiyyətsiz** əlçatandır. Ödənişli hissə süni intellektin köməyi və video
qəbula endirimdir, öz məlumatlarınıza giriş deyil.

<!-- translated-from-ru: f52cfd86425a346d1f8e0f46520c2bafbe599ebf -->
