# HIPAA: Platformda Neler Yapıldı

Dürüst bir ifadeyle: DocPats, tıbbi verilerin işlenmesine ilişkin **HIPAA gerekliliklerini gözeterek geliştirilmiştir**. Bu, bağımsız bir üçüncü taraf denetiminden geçmiş olmakla ve imzalanmış bir veri işleme sözleşmesine (BAA) sahip olmakla aynı şey değildir — bunlar henüz elimizde bulunmamaktadır ve aksini söylemek dürüst olmazdı.

Aşağıda, sözümüze güvenmek zorunda kalmadan kendiniz değerlendirebilmeniz için tam olarak nelerin uygulandığı yer almaktadır. Sorularınız için: [support@docpats.com](mailto:support@docpats.com).

---

## Temizlenmesi Mümkün Olmayan Erişim Kaydı

Bir tıbbi kayda yapılan her erişim ayrı bir günlüğe yazılır. Kayıtların değiştirilmesi ve silinmesi, bir yetki ayarı ile değil, **veri modeli düzeyinde yasaklanmıştır**: platform yöneticisi erişim geçmişini fiziksel olarak düzenleyemez. Saklama süresi yedi yıldır.

Günlüğe yapı bilgisi kaydedilir: kimin, ne zaman, hangi kaynağa ve hangi eylemle eriştiği. **Tıbbi içerik günlüğe yazılmaz** — bu, kod içinde tanımlı ayrı bir kuraldır; çünkü günlük, verilerin kendisinden daha uzun süre saklanır ve verilerin daha az korunan ikinci bir deposuna dönüşmemelidir.

## Verilerin Saklama Sırasında Şifrelenmesi

Hastanın kimliğinin belirlenmesine olanak tanıyan metin bilgileri ve tıbbi kayıtlar, veritabanına yazılmadan önce şifrelenir. Cerrahi modelleme alanı için bütünlük doğrulaması içeren bir algoritma kullanılır: değiştirilmiş bir ameliyat planı, makul görünen ancak hatalı veriler döndürmek yerine hiç şifre çözülmez.

Şifrelenmiş alanlarda arama, geri döndürülemez parmak izleri üzerinden çalışır: hekim hastayı telefon numarasıyla bulabilir, ancak parmak izinden numarayı geri elde etmek mümkün değildir.

## Asgari Gerekli Erişim

Kayıtlı hasta, hekimin erişimini bizzat onaylar ve kartın bölümlerini **tek tek** açar. Onay geri alınabilir.

Klinik içinde yetkiler, sahipten eczacıya kadar dokuz role göre ayrılmıştır ve yetki, belirli bir çalışan için tek bir bölüm düzeyine kadar daraltılabilir. Bir başkasının rolünü kendi rolünün üzerine yükseltmek yasaktır: çalışan, kendisinde bulunmayan yetkileri veremez.

## Klinikler Arası İzolasyon

Klinik aidiyeti, veritabanına yapılan her sorguya otomatik olarak eklenir ve başka bir kliniğin verilerine ulaşmaya çalışan sorgu reddedilir. Bu, arayüzdeki bir kontrol değil, veri erişim katmanının bir özelliğidir. Bu durum için projede ayrı testler bulunmaktadır: A kliniğinin verileri, B kliniği bağlamıyla sorgulanır ve boş sonuç dönmesi gerekir.

## Yapay Zekâ Ne Yapar, Ne Yapmaz

Tahlillerin ve görüntülerin değerlendirilmesi yardımcı nitelikte olarak işaretlenir; bu işaret değiştirilemez ve verilerle birlikte her türlü dışa aktarıma dahil edilir. Hekim kendi değerlendirmesini yazmadan dosya kapatılamaz ve modelin çıktısı asla otomatik olarak buraya yerleştirilmez. Klinik karara ilişkin sorumluluk insanda kalır — bu, küçük puntolu bir uyarıyla değil, sistemin yapısıyla güvence altına alınmıştır.

## Henüz Bulunmayanlar

- **HIPAA uyumluluğuna ilişkin bağımsız denetim.**
- Partner klinikler için **imzalanabilir BAA.**
- **SOC 2 sertifikasyonu.**

Bu belgelere çalışmanız için ihtiyacınız varsa bize yazın, süreleri görüşelim: [support@docpats.com](mailto:support@docpats.com).

---

Ayrıca bkz. [platformun verilerinizi nasıl işlediği](/docs/privacy).

<!-- translated-from-ru: e3c4adfd989f60b3d8945845f2af0baddb294dbf -->
