# Yapay Zekâ ile Materyal Analizi

Asistan, klinik materyali analiz eder ve neye dikkat edilmesi gerektiğini, neyin
netleştirilmesi gerektiğini ve verilerde nelerin eksik olduğunu gösterir. Bölüm
`/diagnostics` adresinde yer alır.

## Temel kural

**Vakayı analiz değil, siz kapatırsınız.** Kendi sonucunuzu yazmadığınız sürece
vaka kapanmaz — sistem bunu doğrudan reddeder ve vakanın yapay zekâ analiziyle
değil, hekimin sonucuyla kapatıldığını belirtir.

Modelin çıkarımı hiçbir zaman sizin raporunuza otomatik olarak yerleştirilmez;
modelin her çıkarımı yardımcı nitelikte olarak işaretlenir ve bu işaret
değiştirilemez: verilerle birlikte dışa aktarma dosyasına ve her türlü
entegrasyona taşınır.

## Neler analiz edilebilir

Dokuz tür inceleme: laboratuvar tetkikleri, röntgen, CT, MRI, ultrasonografi,
ECG, endoskopi, histoloji, dermatoskopi. Ayrıca **klinik vakanın tamamı** —
tek bir görüntünün değil, bütünsel tablonun önem taşıdığı durumlar için.

Sistemin içinde üç ayrı analiz modülü çalışır: inceleme raporlarına yönelik,
laboratuvar parametrelerine yönelik ve klinik vakaya yönelik. Bunlardan
hangisinin uygulanacağı, eklediğiniz materyale göre belirlenir.

## Analizin başlaması için gereken iki koşul

1. **Materyaller kimliksizleştirilmiş olmalıdır** — görüntüde ve form başlığında
   hastanın soyadı bulunmamalıdır. Bu sizin onayınızdır: sistem içeriği sizin
   yerinize denetleyemez.
2. **Harici model tarafından işlenmesine onay verilmiş olmalıdır** — dosya
   platformun dışına çıkar ve bu, varsayılan bir işaret değil, bilinçli bir
   karardır.

Bu iki onay verilmediği sürece analiz düğmesi çalışmaz ve neyin eksik olduğunu
bildirir. Aynı iki koşul belge tanıma işlemi için de geçerlidir.

## Çalışma sırası

1. `/diagnostics` bölümünde **bir vaka oluşturun**: başlık, analizini almak
   istediğiniz soru ve klinik bağlam.
2. **Materyalleri ekleyin** — görüntüler, form taramaları, PDF. Dosyalar
   şifrelenmiş olarak saklanır.
3. Gerekirse **belgeyi tanıtın**: model, formu elle yeniden yazmanıza gerek
   kalmaması için taramadan metni ve parametreleri çıkarır. Sonucu, orijinal
   belge önünde bulunan bir insan denetler.
4. **Analizi başlatın.** Vaka «analiz ediliyor» durumuna geçer; iş görevler
   halinde yürütülür ve her biri ayrı ayrı görünür — kuyrukta, yürütülüyor,
   hazır, hata veya atlandı. Tek bir görev, diğerlerine dokunmadan yeniden
   başlatılabilir.
5. **Bulguları değerlendirin** (aşağıya bakınız).
6. **Sonucu yazın** ve vakayı kapatın.

Kapatılmış bir vaka gerektiğinde **yeniden açılabilir** — örneğin ileri
tetkikler geldiğinde.

## Bulgular ve sizin kararınız

Her bulgu bir önem derecesi alır: **kritik**, **önemli** veya **not**.

Her bulgu için bir karar verirsiniz: **katılıyorum**, **kısmen** veya
**katılmıyorum**. Karar verilmediği sürece bulgu değerlendirilmemiş sayılır.

Karar bir formalite değildir. Aynı anda iki işlevi yerine getirir: analize geri
bildirim sağlar ve aynı zamanda daha sonra dönebileceğiniz kendi materyal
etiketlemenizi oluşturur.

## Kaç analiz kullanılabilir

- **Deneme süresi ve Growth tarifesi** — ayda 60 analiz.
- **Start** — ayda 20.
- **Pro** — sınırsız.

## Dışa aktarma

Vaka bütün olarak dışa aktarılır: materyaller, sizin kararlarınızla birlikte
bulgular ve sizin sonucunuz. Hem tek bir ekli dosya hem de vakanın tamamı
silinebilir.

## Asistanın yapmadıkları

Tanı koymaz ve tedavi reçete etmez. Bunun nedeni ifadelerde temkinli olmak
değildir: yaşayan bir hasta hakkında tanı belirleyen bir sistem, ayrı bir
düzenlemeye tabi bir tıbbi cihazdır. Modül yardımcı nitelikte kaldığı sürece bu
statü doğmaz ve bu sınır «kolaylık olsun diye» bulanıklaştırılamaz.

<!-- translated-from-ru: 5fdd2268fb0e8df3c981fb51e6aeb3a65d4f3234 -->
