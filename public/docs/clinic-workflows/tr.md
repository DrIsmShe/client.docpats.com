# Klinik: kim neyi yapar

Bu bölüm, «klinikte bu adımı kim gerçekleştirir» sorusunu yanıtlar. Yetkiler
rollere göre dağıtılmıştır ve bazı noktalarda beklentilerden ayrılır — bu noktalar
ayrıca belirtilmiştir.

## Hasta randevu aldı ve geldi

1. **Hasta kartı oluşturmak** — kayıt görevlisi veya yönetici. Hekim bunu
   yapamaz: kart ona yalnızca görüntüleme yetkisiyle açıktır.
2. **Randevu oluşturmak** — kayıt görevlisi, yönetici, müdür veya
   hekimin kendisi.
3. **Hastanın gelişini kaydetmek** — hemşire veya kayıt görevlisi. Hekimin geliş
   kaydına erişimi hiç yoktur.
4. **Sırayı yönetmek** — hemşire ve kayıt görevlisi. Hekim sırayı yalnızca görür.
5. **Muayeneyi gerçekleştirmek ve karta kayıt girmek** — hekim veya hemşire. Burada durum
   tersinedir: kartı oluşturamazlar, ancak tıbbi kayıtları tutabilirler.
6. **Video muayene** — hekim veya kayıt görevlisi düzenleyebilir; hemşire görüntüler.

**Açık olmayan nokta:** hekimin çalışma takvimini hekimin kendisi (veya yönetici)
değiştirir, kayıt görevlisi ise takvimi yalnızca **okur**. Yani kayıt görevlisi bir randevuyu
erteleyebilir, ancak hekimin çalışma saatlerini değiştiremez.

## Reçeteler ve eczane

Zincir üç rolden geçer ve hiçbiri zinciri tek başına kapsamaz:

1. **Reçete düzenlemek** — hekim. Eczacı da reçeteleri (teslim kısmında)
   değiştirebilir, yönetici yalnızca görür, müdür sürece dâhil değildir.
2. **İlacı teslim etmek** — eczacı. Ne hekimin ne de hemşirenin eczaneye erişimi
   vardır.
3. **Depodan düşmek** — eczacı, hemşire veya müdür.
4. **Tedarikçiden sipariş vermek** — talebi eczacı veya hemşire oluşturur;
   yönetici ve müdür talepleri yalnızca görüntüler.
5. **Tedarikçileri yönetmek** — eczacı; muhasebeci mutabakat için onları görür.

**Açık olmayan nokta:** hemşire, eczanenin kendisine erişimi olmamasına rağmen depodan düşüm
yapabilir ve satın alma talebi oluşturabilir. Bu, «muayenehanedeki sarf malzemeleri»
ile «ilaç deposu olarak eczane» ayrımıdır.

## Konsültasyon ve bilgi tabanı

- **Konsültasyon toplamak ve yürütmek** — hekim veya müdür; hemşire
  görüntüleme yetkisiyle katılır. Kayıt görevlisinin erişimi yoktur.
- **Bilgi tabanı**: müdür ve yönetici içerik ekler; hekim,
  hemşire ve kayıt görevlisi okur.

## Çalışanlar ve roller

- **Yeni çalışanı yalnızca sahip davet edebilir.** Ne yönetici ne de
  müdür davet gönderebilir — bu, tüm klinikte yalnızca sahipte bulunan
  tek yetkidir.
- **Çalışan kadrosunu değiştirmek** — sahip ve müdür; yönetici ve
  kayıt görevlisi listeyi görür.
- **Kendi rolünden üst bir rol atanamaz** — bu, sunucuda denetlenir.
- Rol yetkileri **belirli bir çalışan için noktasal olarak düzenlenebilir**: rolün kendisini
  değiştirmeden, rolün üzerine genişletilebilir veya kısıtlanabilir.

## Finans

- **Faturaları** kayıt görevlisi, müdür ve yönetici yönetir; muhasebeci görür.
- **Ödemeleri** kayıt görevlisi ve yönetici gerçekleştirir; muhasebeci görür.
- **Mali raporlar** — muhasebeci ve sahip. Yönetici yalnızca görüntüler.
- **Maaş hesaplaması** — muhasebeci ve sahip, başka kimse.

**Açık olmayan nokta:** neredeyse her şeye erişimi olan klinik yöneticisinin
maaşlara erişimi hiç yoktur.

## Web sitesi, talepler, değerlendirmeler

- **Klinik web sitesi** — sahip, yönetici ve pazarlama uzmanı.
- **Siteden gelen talepleri** pazarlama uzmanı, kayıt görevlisi ve müdür işler.
- **Değerlendirmeleri** pazarlama uzmanı ve müdür yönetir.
- **Hizmetler ve fiyat listesi** — yönetici ve müdür.
- **Personele yönelik duyurular** — yönetici ve müdür.

## Analitik ve günlük kayıtları

- **Klinik analitiği** yöneticiye, müdüre ve pazarlama uzmanına görüntüleme
  yetkisiyle açıktır; tam erişim sahibindir. Start tarifesinde analitik etkin değildir,
  Business ile birlikte kullanıma açılır.
- **Denetim günlüğü** — sahip; yönetici görüntüler. Diğer roller bu günlüğe
  erişemez.

## Yetkiler nasıl kurgulanmıştır

Kırk bölümün her biri için yetki üç düzeyde tanımlanır ve bu düzeyler iç içedir:

- **okuma** — bölümü görmek;
- **değiştirme** — okumayı kapsar;
- **silme** — değiştirmeyi kapsar.

Bu nedenle «kayıt görevlisi kayıtları değiştirebilir, ancak silemez» ifadesi, silme
düğmesinin ona gösterilmeyeceği; isteğin arayüzü atlayarak gönderilmesi hâlinde ise sunucunun
bunu reddedeceği anlamına gelir.

Rol, varsayılan yetki kümesini belirler; belirli bir çalışan için yetkiler rolün
üzerine değiştirilebilir. Denetim yalnızca düğmeleri gizlemekle kalmaz, her istekte
sunucuda gerçekleştirilir.

<!-- translated-from-ru: b45ae52b9a61ae2c1157b8761f80af45f310d5a9 -->
