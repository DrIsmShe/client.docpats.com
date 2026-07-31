# Hekim Panelinde Hastalar

Hastanın nasıl kaydedileceği, dosyasının nasıl yönetileceği, panelden nasıl
çıkarılacağı ve geri getirileceğine ilişkin bölüm. Bunların tümü panelinizdeki
«Poliklinik» bölümünde yer alır.

## İki hasta tipi

**Kayıtlı** — kişinin platformda bir hesabı vardır. Kendi verilerini kendi
panelinde görür ve dosyasının bölümlerine erişiminizi kendisi onaylar. Bu tür
hastayı elektronik posta adresi ile bulursunuz: bu alan zorunludur ve kişinin
hesabıyla bağlantıyı sağlar.

**Özel** — kişinin hesabı yoktur, dosyayı siz yönetirsiniz. Dosya aynı şekilde
doldurulur, ancak hasta dosyayı görmez ve hiçbir şeyi onaylayamaz.

Tip, ekleme sırasında seçilir ve hangi sayfayı kullanacağınızı belirler. Daha
sonra dosyalar ortak listede bir arada bulunur.

## Hasta nasıl eklenir

1. **Poliklinik** bölümünü açın — `/dp/polyclinic` sayfası. Bu, hastalarınızın
   listesidir.
2. Ekleme türünü seçin:
   - kayıtlı hasta — `/dp/add-patient-polyclinic`;
   - özel hasta — `/dp/add-private-patient-polyclinic`.
3. Kayıt kartını doldurun. Alanlar her iki tip için aynıdır:
   - elektronik posta — **zorunludur**, bu alan olmadan ekleme gerçekleşmez;
   - telefon, kimlik belgesi;
   - ad ve soyad, cinsiyet, doğum tarihi (gg/aa/yyyy biçiminde);
   - ülke ve adres;
   - aşılar, alerjiler, kronik hastalıklar, aile anamnezi, geçirilmiş
     ameliyatlar, zararlı alışkanlıklar, serbest metin notu;
   - fotoğraf — zorunlu değildir, görüntü otomatik olarak küçültülür.
4. Kaydedin. Hasta listede görünecek ve randevu kaydı, muayeneler ve hastalık
   öyküsü için kullanılabilir hâle gelecektir.

Daha önce kaydedilmiş bir hastayı arama sayfasından bulabilirsiniz —
`/dp/search-patient-polyclinic`.

## Kaç hasta kaydedilebilir

Burada iki farklı sınırlama bulunur:

- **Hekim hesabınız doğrulanmadığı sürece — en fazla 5 hasta.** Altıncı hastayı
  eklemeye çalıştığınızda sistem doğrulama yapmanızı isteyecektir. Bu, tarife
  sınırlaması değil, sahte panellere karşı bir korumadır.
- **Sonrasında tarife limiti geçerlidir.** Deneme süresinde bu, panel başına 600
  hastadır. Limit dolduğunda tarife değiştirilmesi gerektiğine dair bir mesaj
  görünür.

Doğrulama ve tarife farklı şeylerdir: hesabın doğrulanması beş kişilik eşiği
kaldırır, ancak tarife limitini artırmaz.

## Dosyada neler tutulabilir

Hasta dosyası liste sayfasından açılır: kayıtlı hasta için
`/dp/patient-detail/<id>`, özel hasta için `/dp/private-patient-detail/<id>`.

Dosya içinde şunlar tutulur:

- şikâyetler;
- anamnesis morbi ve anamnesis vitae;
- status praesens ve status localis;
- laboratuvar tetkiklerinin sonuçları;
- CT, MRI ve ultrasonografi raporları;
- öneriler.

Hastalık öyküsü ayrı bir sayfadan eklenir —
`/dp/add-patient-medical-history/<id>`.

Tekrarlayan muayenelerin yeniden yazılması gerekmez: bunlar kendinize göre
düzenlediğiniz şablonlardan oluşturulur.

## Hasta panelden nasıl çıkarılır

**Gerçek anlamda bir silme işlemi yoktur — hasta arşive gönderilir.** Bu,
bilinçli bir tercihtir: tıbbi kayıtlar tek bir tuşa basmakla ortadan
kaybolmamalıdır.

Panelden çıkarma sırasında neler olur:

- dosya arşivlenmiş olarak işaretlenir ve arşivleme tarihi saklanır;
- hasta ana listeden kaybolur — varsayılan olarak yalnızca aktif hastalar
  gösterilir;
- kayıtların kendisi hiçbir yere gitmez.

Arşivlenmiş dosyalar, listeyi değiştirerek görüntülenebilir: liste aktif,
arşivlenmiş veya tümünü birlikte gösterebilir.

## Hasta arşivden nasıl geri getirilir

Arşivleme geri alınabilir: dosya geri yüklenir ve tüm kayıtlarıyla birlikte
yeniden aktif listede görünür. İki tip için ayrı işlemler bulunur: kayıtlı
hastanın geri yüklenmesi ve özel hastanın geri yüklenmesi.

Panelde silme işlemi arşivleme anlamına geldiğinden, hastanın öyküsünü yanlışlıkla
bir tuşa basarak kaybetmek mümkün değildir.

## Hastanın kendisi neleri görür

Kayıtlı hasta kendi dosyasını kendi panelinde görür ve **hangi bölümleri size
açacağına kendisi karar verir**: alerjiler, randevular, ziyaretler, görüntüler ve
raporlar, aşılar, geçirilmiş ameliyatlar — ayrı ayrı. Bölüm açılmadığı sürece onu
göremezsiniz.

Hasta dosyasına yapılan her erişim, değiştirilemeyen veya silinemeyen bir kayıt
günlüğüne işlenir.

Özel hasta kendi dosyasını görmez: hesabı yoktur ve erişimi onaylamak için bir
aracı bulunmaz.

Bunun dışında, hesabı olan bir hastanın kendi panelinden **sizi kendi
hekimleri arasına eklemesi** de mümkündür. Bu durumda dosya doğrudan hastanın
hesabıyla ilişkilendirilir ve sonrasında hasta, bölümlere erişimi olağan şekilde
yönetir.

<!-- translated-from-ru: 6dc02c2e379dca99d56422b318f23c229fc1b6ef -->
