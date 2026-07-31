# Hastalık Öyküsü ve Muayene Şablonları

Hasta kartının içeriden nasıl doldurulduğunu ve aynı metinleri elle tekrar tekrar
yazmaktan nasıl kurtulacağınızı anlatan bölüm.

## Hastalık öyküsü nelerden oluşur

Kart, kesintisiz bir metin olarak değil, hekimin alışkın olduğu bölümler hâlinde
tutulur. Her bölümün kendi kayıt listesi vardır: kayıt eklenebilir, tümüyle
açılabilir, gereksiz olan silinebilir.

Bölümler:

- yakınmalar;
- anamnesis morbi — mevcut hastalığın öyküsü;
- anamnesis vitae — yaşam öyküsü;
- status praesens — genel durum;
- status localis — lokal durum;
- laboratuvar tetkik sonuçları;
- CT raporları;
- MRI raporları;
- USG raporları;
- öneriler.

Kayıtlar birikimlidir: tekrarlayan vizitlerde yeni bir kayıt eklersiniz, önceki
kayıtlar yerinde kalır ve listede görünür. Böylece kart, üzeri silinip yazılmış
tek bir sürüm değil, bir kronoloji kazanır.

Hastalık öyküsü ekleme işlemi
`/dp/add-patient-medical-history/<id пациента>` sayfasından başlar.

## Tetkik sonuçları

Metin bölümlerinden ayrı olarak, hastaya görüntüleme ve enstrümantal tetkik
sonuçları — dosya ve açıklama ile birlikte — iliştirilir. Desteklenenler:

röntgen, CT, MRI, USG, Doppler, ECG, ekokardiyografi, EEG, Holter, spirometri,
koroner anjiyografi, anjiyografi, PET, SPECT, gastroskopi, kapsül
endoskopisi, jinekolojik muayene — ve laboratuvar tetkikleri.

Yükleme sayfasının adresi tüm türler için aynı biçimdedir:

```
/dp/add-<вид>-scan-upload/<тип пациента>/<id пациента>
```

Laboratuvar sonuçları kendi sayfasından eklenir —
`/dp/add-labtest-results/<тип пациента>/<id пациента>`.

**Adresteki hasta tipi**, kayıtlı ve özel hasta ayrımını ifade eder: aynı
sayfalar her iki tipe de hizmet ettiğinden, bağlantıda hangi kartın açıldığının
belirtilmesi gerekir.

## Şablonlar: aynı metni tekrar yazmamak için

Her tetkik türünün **dört bölümü** vardır ve her biri için şablon
hazırlanabilir:

1. **Tetkik adı** — işlemin sizin pratiğinizde nasıl adlandırıldığı;
2. **Protokol** — görülenlerin tanımı;
3. **Sonuç** — varılan yargı;
4. **Öneriler** — bundan sonra yapılacaklar.

Şablon bir kez oluşturulur ve sonrasında yeniden yazılmak yerine yeni muayeneye
yerleştirilir. Hazır şablon görüntülenebilir, değiştirilebilir ve silinebilir.

Adresler tek biçimlidir:

```
/dp/add-<вид>-scan-template-nameofexam      создать заготовку названия
/dp/add-<вид>-scan-template-report          создать заготовку протокола
/dp/add-<вид>-scan-template-diagnosis       создать заготовку заключения
/dp/add-<вид>-scan-template-recomandation   создать заготовку рекомендаций

/dp/list-<вид>-scan-template-<часть>/<id>     список заготовок
/dp/update-<вид>-scan-template-<часть>/<id>   изменить
/dp/detail-<вид>-scan-template-<часть>/<id>   посмотреть целиком
```

Örneğin CT için: `/dp/add-ct-scan-template-report`.

## Bunun pratikte zaman kazandırma biçimi

Aynı türdeki muayeneler birbirine benzer: bulgular değişir, tanımlamanın yapısı
ise aynı kalır. Protokolü ve tipik sonuç metinlerini bir kez hazırladığınızda,
sonrasında muayeneyi hazır parçalardan oluşturur ve yalnızca ilgili hastada
farklı olan kısmı düzeltirsiniz.

Hazırladığınız şablonlar size aittir: hesabınıza bağlıdır ve çalıştıkça birikir.

## Bu veriler sonrasında ne olur

Hastalık öyküsü kayıtları ve tetkik sonuçları, kartın içeriğini oluşturur ve bu
içerik:

- kayıtlı hasta tarafından kendi hesabında, size açtığı bölümler kapsamında
  görülebilir;
- `/diagnostics` bölümünde yapay zekâ değerlendirmesine eklenebilir — ancak
  yalnızca materyal kimliksizleştirildikten ve işleme onayı doğrulandıktan sonra;
- hasta arşivlendiğinde korunur: kart aktif listeden bütünüyle çıkar ve aynı
  şekilde geri döner.

<!-- translated-from-ru: c35d98297e0ec0d214bae77ef68c134e1f715409 -->
