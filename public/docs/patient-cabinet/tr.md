# Hasta Portalı

Kendi ekranınızda neleri gördüğünüz, neleri yönettiğiniz ve hekime verilerinize nasıl erişim verdiğiniz.

## Öykünüz

- **Hastalık öyküsü** — `/patient/my-medical-histories`, her kayıt ayrı olarak
  bütün hâlinde açılır.
- **Tetkikler** — `/patient/my-lab-results`.
- **Reçeteler** — `/patient/my-prescriptions`.
- **Tetkik dosyaları** — `/patient/get-patients-files`. Türlerine göre açılır:
  radyografi, CT, MRI, ultrasonografi, ECG, ekokardiyografi, EEG, Holter,
  spirometri, gastroskopi, kapsül endoskopisi, koroner anjiyografi, anjiyografi,
  PET, SPECT, jinekolojik muayene, laboratuvar.

Kayıtları, takibinizi yapan hekim girer. Öykünüz tek bir kliniğe bağlı değildir:
hekiminizi ya da şehrinizi değiştirseniz de öykünüz sizinle kalır.

## Verilerinizi kimler görür

Hiçbir şey kendiliğinden açılmaz. Bir hekim veya klinik erişim talep ettiğinde
talep size iletilir — `/patient/consent-requests`; verilmiş erişimler ise
`/patient/my-clinics` adresinde görülür.

**İzin bütün hâlinde değil, bölümler hâlinde verilir.** Ayrı ayrı açılabilenler:

- muayeneler ve bunlara ait kayıtlar;
- alerjiler;
- kronik hastalıklar;
- geçirilmiş ameliyatlar;
- aile öyküsü;
- aşılar;
- görüntülemeler ve raporlar.

Diş hekiminize alerjilerinizi açıp ameliyat öykünüzü kapalı tutabilirsiniz.

## Erişim hangi amaçla verilir

Her onamın bir amacı vardır ve süresi bu amaca bağlıdır:

- ilgili klinikte **tedavi**;
- **sevk** — bir uzmanda tek seferlik konsültasyon;
- **ikinci görüş** — başka bir klinik için erişim;
- **acil yardım** — bu tür onam **7 gün içinde kendiliğinden sona erer**;
- **araştırmalar** — yalnızca kimliği gizlenmiş veriler.

Onam **her an geri alınabilir** ve tekrar geri alma işlemi hiçbir aksaklığa yol
açmaz. Ayrıca onam için önceden belirlenmiş bir süre tanımlanabilir; bu sürenin
sonunda erişim, sizin müdahaleniz olmaksızın sona erer.

Onam elektronik olarak, ASAN İmza aracılığıyla da imzalanabilir ya da kâğıt
belgenin taranmış hâli eklenebilir.

## Her erişimde yapılan doğrulama

Erişim **yalnızca verildiği anda bir kez değil, hekim kartınızın bir bölümünü her
açtığında** doğrulanır. Onamı geri aldığınızda, o bölüme yönelik bir sonraki
talep dahi karşılanmaz.

Verilerinize yönelik her erişim ve onamlarla ilgili her işlem, değiştirilmesi
veya silinmesi mümkün olmayan bir kayıt günlüğüne işlenir.

## Hekimler ve randevu alma

- **Hekim arama** — `/patient/doctors`, profil — `/patient/doctor-details/<id>`.
- **Hekimlerim** — `/patient/my-doctors`.
- **Randevu** — `/patient/appointment`: hekimin takviminden uygun bir saat
  seçersiniz.
- **Yaklaşan randevular** — `/patient/my-appointment`, geçmiş randevular —
  `/patient/my-appointment-history`.
- **Görüntülü muayene** — `/patient/telemed`, tarayıcı üzerinden yapılır, hiçbir
  şey kurmanız gerekmez.

Randevu önce hekime onay için iletilir — durumu randevu listesinde görebilirsiniz.

## Hekiminizle iletişim

Sohbet — `/patient/communication`. Yazışmalar saklanır, dosya eklenebilir.
İletiler çevrilir: siz kendi dilinizde yazarsınız, hekim kendi dilinde okur.

## Tıbbi asistan

`/patient/consultation-ai` — şikâyetlerin değerlendirilmesi, tetkiklerin
açıklanması, hangi uzmana başvurulacağına dair yönlendirme. Tanı koymaz, endişe
verici bulgular karşısında derhâl ambulans çağırmanızı önerir; birkaç iletiden
sonra ise **epikriz** hazırlamayı teklif eder — görüşmenin, hekime giderken
elinizde bulundurmanız açısından pratik olan kısa bir özeti.

Kayıt olmadan deneyebilirsiniz.

## Portalda ayrıca

- **Bildirimler** — `/patient/notifications-for-patient`.
- **Hekim yazıları** — `/patient/all-articles` ve yapay zekânın konuya göre
  derlediği içerikler — `/patient/articles-ai-for-patients`.
- **Davet** — `/patient/invite`.

## Verileriniz size aittir

Kendi öykünüzün dışa aktarılması **ücretsiz olan da dâhil tüm tarifelerde
sınırsız biçimde** kullanılabilir. Ücretli bölüm, yapay zekâ desteği ve görüntülü
muayene indirimidir; kendi verilerinize erişim değildir.

<!-- translated-from-ru: f52cfd86425a346d1f8e0f46520c2bafbe599ebf -->
