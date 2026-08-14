# DocPats Verilerinizi Nasıl İşliyor

Bu belge, platformun verileri nasıl sakladığına ve koruduğuna ilişkin teknik
bir açıklamadır — hukuki bir belge değildir. Resmî gizlilik politikası
hazırlanmakta olup, hukuki incelemenin ardından yine burada yayımlanacaktır.
Verilerinizle ilgili her türlü soru için
[support@docpats.com](mailto:support@docpats.com) adresine yazabilirsiniz.

---

## Neleri saklıyoruz

**Hesap verileri** — ad, elektronik posta adresi, telefon, arayüz dili, rol.

**Tıbbi veriler** — yalnızca sizin veya hekiminizin girdiği veriler: muayeneler,
şikâyetler ve anamnez, tetkik sonuçları, görüntüleme raporları, aşılar,
alerjiler, geçirilmiş cerrahi girişimler, kronik hastalıklar.

Hekimle yapılan sohbetteki **yazışmalar ve ekler**, ayrıca video muayenelere
ilişkin kayıtlar (görüşmenin gerçekleştiği bilgisi ve süresi; içeriği değil).

**Teknik kayıtlar** — tıbbi kartlara erişim günlüğü, oturumlar, içerikle
ilişkilendirilmeyen arayüz olayları.

## Bunlar nasıl korunuyor

**Depolamada şifreleme.** Kişisel ve tıbbi metin verileri — adlar, iletişim
bilgileri, şikâyetler, başvuru nedenleri, sohbet mesajları — açık biçimde
değil, şifrelenmiş olarak saklanır. Cerrahi modelleme verileri, bütünlük
denetimi içeren ayrı bir algoritmayla şifrelenir: bozulmuş bir operasyon planı,
sessizce hatalı değerler döndürmek yerine hiç çözülmez.

**Şifre çözmeden arama.** Hekimin, veri tabanının tamamını açığa çıkarmadan
hastayı telefon numarasıyla bulabilmesi için, şifrelenmiş alanın yanında geri
döndürülemez bir parmak izi saklanır. Parmak izi üzerinden eşleşme
doğrulanabilir, ancak özgün numara geri elde edilemez.

**Erişim günlüğü.** Tıbbi karta yapılan her erişim, **değiştirilemeyen veya
silinemeyen** ayrı bir günlüğe kaydedilir — bu yasak, arayüz ayarları düzeyinde
değil, veri tabanının kendisinde tanımlıdır. Günlük yedi yıl saklanır. Günlüğe
yapısal bilgiler kaydedilir: kimin, ne zaman, hangi bölüme eriştiği — ancak
kartın içeriği kaydedilmez.

**Klinikler arası ayrım.** Her kliniğin verileri, veri tabanı sorguları
düzeyinde diğer kliniğe erişilemez durumdadır: aidiyet bilgisi her sorguya
otomatik olarak eklenir ve başka bir kliniğin verilerine erişmeye çalışan sorgu
reddedilir. Bu, aşılabilecek bir arayüz denetimi değil, veri deposunun
özniteliğidir.

## Kim neyi görüyor

Hekim, kartınıza **yalnızca sizin onayınızdan sonra** ve yalnızca açtığınız
bölümler için erişim kazanır: alerjiler, muayeneler, ziyaretler, görüntülemeler
ve raporlar, aşılar, geçirilmiş cerrahi girişimler — her biri ayrı ayrı. Diş
hekimine alerjileri açıp cerrahi öyküyü açmamak mümkündür.

Erişim geri alınabilir. Geri alma işlemi, erişimin verilmiş olduğuna dair kaydı
silmez.

## Verilerinize ilişkin haklarınız

**Ücretsiz dâhil olmak üzere her tarifede sınırsız veri dışa aktarımı.** Geçmiş
kayıtların saklanması ve bunlara erişim her zaman ücretsizdir — platformun
ücretli bölümü, kendi verileriniz değil, yapay zekâ desteği ve muayene
indirimleriyle ilgilidir.

**Hesabın silinmesi** verilerinizi siler. Erişim günlüğündeki kayıtlar korunur:
bu kayıtlar tıbbi içerik barındırmaz ve değiştirilemezlikleri, günlüğün genel
olarak anlamlı olmasının koşuludur.

## Neleri yapmıyoruz

- Tıbbi verileri üçüncü taraflara satmıyor ve devretmiyoruz.
- Kartlarınızın içeriğini reklam amacıyla kullanmıyoruz.
- İlaç şirketlerinden finansman kabul etmiyor ve editöryel içerik görünümü
  altında reklam içeriği yayımlamıyoruz.

## Dış hizmetler

İşin bir bölümü dış tedarikçiler tarafından yürütülür: dosya ve görüntülerin
saklanması, elektronik posta ve push bildirimlerinin iletilmesi, ödemelerin
işlenmesi, klinik materyalin çözümlenmesi için dil modelleri. Bu taraflara
yalnızca ilgili işlem için gerekli olan bilgiler aktarılır.

---

**Verilerinizle ilgili sorular:** [support@docpats.com](mailto:support@docpats.com).
Ayrıca bkz. [HIPAA uyumluluğunun nasıl sağlandığı](/docs/hipaa).

<!-- translated-from-ru: a71000c5d4c22e210a5df89082c7b4e1628fe61f -->
