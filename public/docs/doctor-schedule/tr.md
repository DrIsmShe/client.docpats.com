# Muayeneler ve hekim takvimi

Randevu için zaman aralığının nasıl açılacağı, hasta randevusunun ne şekilde
işlendiği ve muayene geçmişinin nereden görüntüleneceğine ilişkin bölüm.

## Takvimin işleyişi

Takvim, her bir tarih için ayrı ayrı değil, **haftanın günlerine göre**
tanımlanır. Haftanın günü için bir veya birden fazla çalışma aralığı belirtirsiniz;
örneğin 09:00–13:00 ve 15:00–18:00.

Her aralığın kendine ait ayarları bulunur:

- **slot süresi** — bir muayenenin kaç dakika sürdüğü. Öntanımlı değer 20
  dakikadır, 5 ile 240 arasında bir değer kabul edilir;
- **muayene tipi** — yüz yüze veya görüntülü. Aynı gün içinde farklı tiplerde
  aralıklar yer alabilir: örneğin sabah yüz yüze, akşam görüntülü.

Platform, aralıklar ve slot süresinden yararlanarak hastanın göreceği boş
zamanları kendisi oluşturur. Her slotu ayrı ayrı girmeniz gerekmez.

Takvimin kendine ait bir **saat dilimi** vardır (öntanımlı olarak Asia/Baku).
Aralıklardaki saatler bu dilime göre yereldir; bu nedenle farklı bir saat
diliminde bulunan hasta kendisi için doğru olan saati görür.

## Takvim nasıl tanımlanır

1. `/doctor/doctor-schedule` adresini açın.
2. Haftanın gününü seçin ve bir aralık ekleyin: başlangıç saati, bitiş saati,
   slot süresi, muayene tipi.
3. Gerekirse aynı güne ikinci bir aralık ekleyin — örneğin öğle molası bu şekilde
   oluşturulur.
4. Kaydedin. Boş slotlar hastalarda otomatik olarak görünür hâle gelir.

Bir aralık silinebilir — bu durumda o güne ait söz konusu zaman artık teklif
edilmez.

## İzin, kongre, tek bir dolu gün

Belirli tarihler için **istisnalar** mevcuttur; bunlar haftalık takvime göre
önceliklidir:

- **tatil günü** — gün tümüyle kapatılır, o güne randevu oluşturulamaz;
- **özel saatler** — bu tarihte olağan aralıklar yerine farklı aralıklar geçerli olur.

İstisnaya bir gerekçe eklenebilir — bu yalnızca sizin içindir, hasta göremez.

İstisnanın avantajı, temel takvimi bozmamasıdır: belirtilen tarihten sonra her şey
yeniden haftalık düzene göre işler.

## Hasta randevu aldığında ne olur

Randevu sizde **«onay bekliyor»** durumunda görünür. Ardından şu durumlardan
geçer:

- **onay bekliyor** — hasta bir slot seçmiştir, siz henüz yanıt vermemişsinizdir;
- **onaylandı** — muayeneyi onaylamışsınızdır;
- **iptal edildi** — muayene gerçekleşmeyecektir;
- **gerçekleşti** — muayene yapılmıştır;
- **gelmedi** — hasta muayeneye gelmemiştir;
- **ödeme iade edildi** — randevu kapsamında bir ödeme yapılmışsa.

Randevular yalnızca hasta tarafından oluşturulmaz: muayene hekimin kendisi veya
hasta kabul birimi tarafından da oluşturulabilir. Randevuyu kimin oluşturduğu
kayda geçirilir.

Randevuları görüntülemek ve yönetmek için `/doctor/doctor-appointment` sayfasını
kullanın. Muayenelere ilişkin özet: `/doctor/dashboard`.

## Yüz yüze muayene ve görüntülü muayene

Tip, takvimde belirlenir ve randevuya aktarılır. Görüntülü muayenede muayenehane
adresi yerine iletişim yöntemi belirtilir: platformun yerleşik görüntülü görüşme
odası, WhatsApp veya Zoom.

Yerleşik görüntülü görüşme odası doğrudan tarayıcıda açılır — herhangi bir kurulum
gerekmez.

## Randevu arşivi

Tamamlanmış randevular, çalışma listesinde yer kaplamaması için **arşive
alınabilir**: `/doctor/appointments/archive`. Arşivleme geri alınabilir — randevu
genel listeye geri döner.

Hasta dosyalarında olduğu gibi burada da arşiv, silme işleminin yerini alır:
muayenelere ilişkin bilgiler kaybolmaz.

## Değişiklik kaydı

Her randevu için bir **kayıt** tutulur: randevuyu kimin ne zaman oluşturduğu,
onayladığı, iptal ettiği, ertelediği, gerçekleşmiş veya gelmedi olarak
işaretlediği ve ayrıca sistem olayları — örneğin görüntülü oturumun sonlanması.
Görüntülemek için: `/doctor/audit`.

Kayıt, ihtilaflı durumlarda faydalıdır: randevunun yalnızca mevcut durumunu değil,
işlemleri gerçekleştiren kişilerle birlikte tüm geçmişini gösterir.

## Hastanın gördükleri

- `/patient/appointment` — hekim seçimi ve boş zamana randevu alma;
- `/patient/my-appointment` — yaklaşan muayeneler;
- `/patient/my-appointment-history` — geçmiş muayeneler.

Hasta yalnızca takviminizde açık olan ve başka bir randevu ya da istisna
tarafından doldurulmamış zamanları görür.

<!-- translated-from-ru: f4758353cd7de6e2ccf588e9e72f5905824cbbf2 -->
