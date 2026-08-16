# Yapay Zekâ ile Materyal Analizi

Asistan, klinik materyali analiz eder ve nelere dikkat edilmesi gerektiğini,
nelerin netleştirilmesi gerektiğini ve verilerde nelerin eksik olduğunu gösterir.
Bu bölüme `/diagnostics` adresinden ulaşılır.

## Temel kural

**Vakayı analiz değil, siz kapatırsınız.** Kendi sonucunuzu yazmadığınız sürece
vaka kapanmaz — sistem doğrudan reddeder ve vakanın yapay zekâ analiziyle değil,
hekim sonucuyla kapatıldığını belirtir.

Modelin çıktısı hiçbir zaman otomatik olarak sizin raporunuza yerleştirilmez ve
modelin her çıktısı yardımcı nitelikte olarak işaretlenir; bu işaret
değiştirilemez: verilerle birlikte dışa aktarımlara ve tüm entegrasyonlara aynen
aktarılır.

## Neler analiz edilebilir

Dokuz tetkik türü: laboratuvar tahlilleri, röntgen, CT, MRI, ultrasonografi, ECG,
endoskopi, histoloji, dermatoskopi. Ayrıca **klinik olgunun tamamı** — tek bir
görüntünün değil, bütünsel tablonun önem taşıdığı durumlar için.

Sistemin içinde birbirinden farklı üç analiz motoru çalışır: tetkik raporlarına
yönelik olan, laboratuvar parametrelerine yönelik olan ve klinik olguya yönelik
olan. Hangisinin uygulanacağı, eklediğiniz materyale göre belirlenir.

## Analizin başlatılması için gereken iki koşul

1. **Materyaller kimliksizleştirilmiş olmalıdır** — görüntüde ve form başlığında
   hastanın soyadı bulunmamalıdır. Bu, sizin beyanınızdır: sistem içeriği sizin
   yerinize denetleyemez.
2. **Harici model tarafından işlenmesine onay verilmiş olmalıdır** — dosya
   platformun dışına çıkar ve bu, varsayılan bir işaret kutusu değil, bilinçli
   bir karardır.

Bu iki işaret konulmadığı sürece analiz düğmesi çalışmaz ve neyin eksik olduğunu
bildirir. Aynı iki koşul belge tanıma işlemi için de geçerlidir.

## Çalışma sırası

1. `/diagnostics` bölümünde **bir vaka oluşturun**: başlık, analizini almak
   istediğiniz soru ve klinik bağlam.
2. **Materyalleri ekleyin** — görüntüler, form taramaları, PDF. Dosyalar şifreli
   olarak saklanır.
3. Gerekirse **belgeyi tanıtın**: model, formu elle yeniden yazmanıza gerek
   kalmaması için taramadan metni ve parametreleri çıkarır. Sonucu, orijinali
   önünde bulunan bir insan denetler.
4. **Analizi başlatın.** Vaka «analiz ediliyor» durumuna geçer; işlem görevler
   hâlinde yürütülür ve her biri ayrı ayrı görünür — kuyrukta, yürütülüyor,
   hazır, hata veya atlandı. Tek bir görev, diğerlerine dokunulmadan yeniden
   başlatılabilir.
5. **Bulguları değerlendirin** (aşağıya bakınız).
6. **Sonucunuzu yazın** ve vakayı kapatın.

Kapatılan vaka gerektiğinde **yeniden açılabilir** — örneğin ileri tetkik
sonuçları geldiğinde.

## Bulgular ve sizin kararınız

Her bulgu bir önem derecesi alır: **kritik**, **önemli** veya **not**.

Her bulgu için bir karar verirsiniz: **katılıyorum**, **kısmen** veya
**katılmıyorum**. Karar verilmediği sürece bulgu değerlendirilmemiş sayılır.

Karar bir formalite değildir. Aynı anda iki işlevi yerine getirir: hem analize
geri bildirimdir hem de daha sonra dönebileceğiniz kendi materyal
etiketlemenizdir.

## Kaç analiz hakkı vardır

- **Lite** — ayda 5 analiz.
- **Deneme süresi ve Start tarifesi** — ayda 15.
- **Growth** — ayda 40.
- **Pro** — ayda 100.

Sayım, takvim ayına göre değil, 30 günlük kayan pencereye göre yapılır: kota
ayın birinde sıfırlanmaz, kademeli olarak serbest kalır.

Sayımla ilgili önemli bir açıklama. Birden fazla tetkik dalı içeren bir vaka —
röntgen, CT, laboratuvar — **her dal için ayrı bir analiz** başlatır ve kotada da
aynı sayıda yer kaplar. Bu bir kılı kırk yarma değildir: her dal, modele yapılan
bağımsız bir başvurudur.

Aylık kotanın yanı sıra iki genel sınır daha geçerlidir — saatte 20 ve günde 60
analiz. Bunlar tüm tarifelerde aynıdır ve bütçeyi değil, kazara oluşan
döngülerden korumayı amaçlar: düğmenin takılması, betiğin kontrolden çıkması.

## Dışa aktarım

Vaka bütünüyle dışa aktarılır: materyaller, sizin kararlarınızla birlikte
bulgular ve sonucunuz. Hem tek bir ekli dosya hem de vakanın tamamı silinebilir.

## Asistanın yapmadıkları

Tanı koymaz ve tedavi düzenlemez. Bunun nedeni ifadelerdeki temkinlilik
değildir: yaşayan bir hasta hakkında tanı beyan eden bir sistem, ayrı bir
mevzuata tabi tıbbi cihazdır. Modül yardımcı nitelikte kaldığı sürece bu statü
doğmaz ve bu sınır «kolaylık olsun diye» bulanıklaştırılamaz.

<!-- translated-from-ru: a16f94496fc9c38880bd655c6d5ce8fdaf9710db -->
