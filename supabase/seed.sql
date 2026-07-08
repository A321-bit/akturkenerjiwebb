insert into site_settings (id, name, short_name, founded_year, city, country, description, phone_display, phone_href, whatsapp_number, email, address_line, maps_embed_url, working_hours, instagram, linkedin, youtube, facebook, stats)
values (1, 'Aktürk Enerji Teknolojileri', 'Aktürk Enerji', 2016, 'Ankara', 'Türkiye', '2016''dan beri Ankara merkezli; villa, hobi bahçesi, tarımsal sulama ve müteahhit projeleri için anahtar teslim güneş enerjisi (GES) sistemleri kuran mühendislik firması.', '0 (312) 988 03 88', 'tel:+903129880388', '905335591469', 'info@akturkenerji.com', 'Esertepe Mahallesi, 314. Cadde No: 12/B, Keçiören/Ankara', 'https://share.google/QPVYFonxgGEjpNrXe', 'Pazartesi–Cumartesi, 09:00–18:30', 'https://instagram.com/akturkenerji', 'https://linkedin.com/company/akturkenerji', '', '', '[{"label":"Sektörde deneyim","value":"2016''dan beri"},{"label":"Tamamlanan proje","value":"500+"},{"label":"Kurulu güç","value":"10+ MWp"}]'::jsonb)
on conflict (id) do update set
  name = excluded.name, short_name = excluded.short_name, founded_year = excluded.founded_year,
  city = excluded.city, country = excluded.country, description = excluded.description,
  phone_display = excluded.phone_display, phone_href = excluded.phone_href, whatsapp_number = excluded.whatsapp_number,
  email = excluded.email, address_line = excluded.address_line, maps_embed_url = excluded.maps_embed_url,
  working_hours = excluded.working_hours, instagram = excluded.instagram, linkedin = excluded.linkedin,
  youtube = excluded.youtube, facebook = excluded.facebook, stats = excluded.stats, updated_at = now();

insert into services (slug, eyebrow, title, summary, description, bullets, audience, sort_order)
values ('villa-cati-ges', 'Konut', 'Mesken & Villa Çatı GES Sistemleri', 'Fatura bağımlılığını azaltan, çatınıza özel projelendirilmiş anahtar teslim güneş enerjisi sistemleri.', 'Villa ve müstakil konut çatısına kurulacak bir güneş enerjisi sisteminin (GES) doğru boyutlandırılması, hem yatırımın geri dönüş süresini hem de günlük tasarrufunuzu doğrudan etkiler. Aktürk Enerji olarak Ankara ve çevresinde, çatınızın yönü, eğimi, gölgelenme durumu ve yıllık elektrik tüketiminizi birlikte değerlendirerek size özel bir sistem tasarlıyoruz. Süreç ücretsiz keşifle başlar: ekibimiz yerinde çatı statiğini inceler, mevcut elektrik altyapınızı kontrol eder ve son 12 aylık faturalarınıza göre ihtiyacınız olan kWp değerini hesaplar. Ardından statik hesap raporu ve elektrik tek hat şeması hazırlanır, dağıtım şirketi (EDAŞ) ile bağlantı anlaşması başvurusu bizim tarafımızdan takip edilir. Kurulumda 10 yılın üzerinde ürün garantili panel ve invertör seçenekleri kullanıyoruz; montaj yapısı çatı tipinize (kiremit, sac, düz teras) göre özel olarak belirlenir. Sistem devreye alındıktan sonra üretim/tüketim verilerinizi mobil uygulamadan anlık takip edebilirsiniz. Doğru boyutlandırıldığında villa çatı GES sistemleri yıllık elektrik tüketiminizin tamamına yakınını karşılayarak fatura bağımlılığınızı önemli ölçüde azaltır. Ankara, Çankaya, Etimesgut, Keçiören ve çevre ilçelerdeki villa sahiplerine anahtar teslim hizmet veriyoruz.', ARRAY['Ücretsiz keşif ve tüketim analizi', 'Statik ve elektrik proje çizimi', 'EDAŞ bağlantı anlaşması ve başvuru takibi', '10+ yıl ürün garantili panel ve inverter seçenekleri']::text[], 'Villa ve müstakil konut sahipleri', 0)
on conflict (slug) do nothing;

insert into services (slug, eyebrow, title, summary, description, bullets, audience, sort_order)
values ('muteahhit-ges', 'İş Ortaklığı', 'Müteahhit Firmalarla GES Kurulumları', 'Toplu konut ve site projelerinde geliştiriciyle birlikte çalışan, teslim tarihine göre planlanan kurulum hattı.', 'Toplu konut, site ve karma kullanımlı gayrimenkul projelerinde güneş enerjisi sistemlerinin (GES) doğru zamanda ve doğru bütçeyle devreye alınması, teslim tarihini etkileyen kritik bir süreçtir. Aktürk Enerji, müteahhit ve gayrimenkul geliştirme firmalarıyla proje geliştirme aşamasından itibaren birlikte çalışarak elektrik altyapı planlamasını inşaat projesine entegre ediyor. Ön mühendislik desteğimiz kapsamında blok bazlı elektrik yükü hesabı, ortak alan ve daire bazlı sistem tasarımı ile EDAŞ başvuru stratejisini birlikte belirliyoruz. Toplu malzeme tedariğinde panel, invertör ve montaj ekipmanlarını proje ölçeğine uygun fiyat avantajıyla temin ediyor, kurulumu blok/etap bazlı bir takvime bağlıyoruz — böylece inşaat teslim tarihiniz aksamadan güneş enerjisi sistemleri devreye alınmış oluyor. Ankara ve Türkiye genelindeki toplu konut projelerinde, çok sayıda konuttan oluşan sitelerde blok blok kurulum deneyimimiz bulunuyor. İsteyen müteahhit firmalara bölgesel bayilik ve distribütörlük iş birliği modelleriyle de uzun vadeli ortaklık imkânı sunuyoruz.', ARRAY['Proje geliştirme aşamasında ön mühendislik desteği', 'Toplu alım fiyat avantajı', 'Blok/etap bazlı kurulum takvimi', 'Bayilik ve distribütörlük iş birliği seçenekleri']::text[], 'Müteahhit ve gayrimenkul geliştirme firmaları', 1)
on conflict (slug) do nothing;

insert into services (slug, eyebrow, title, summary, description, bullets, audience, sort_order)
values ('tarimsal-sulama', 'Tarım', 'Tarımsal Sulama Güneş Enerjisi Sistemleri', 'Şebeke bağlantısı olmayan arazilerde güneşle çalışan sulama pompa sistemleri.', 'Elektrik şebekesinin ulaşmadığı tarım arazilerinde sulama ihtiyacını karşılamanın en sürdürülebilir yolu güneş enerjisiyle çalışan dalgıç pompa sistemleridir. Aktürk Enerji olarak kuyu derinliği, debi ihtiyacı ve arazinin güneşlenme potansiyeline göre panel gücünü ve pompa kapasitesini birlikte hesaplayarak size özel bir tarımsal sulama GES sistemi tasarlıyoruz. Bu sistemler dizel jeneratör yakıt maliyetini veya uzak mesafeden şebeke hattı çekme yatırımını tamamen ortadan kaldırır; güneş olduğu sürece ek bir işletme maliyeti olmadan çalışır. Kurulum sürecinde panel dizilimi, pompa kontrol ünitesi ve gerekirse su deposu/damlama sistemi entegrasyonunu birlikte planlıyor, bakım ihtiyacı düşük ve uzun ömürlü ekipmanlar tercih ediyoruz. Tarımsal destek ve hibe süreçlerinde de çiftçilerimize danışmanlık sağlıyoruz. Polatlı, Şereflikoçhisar ve Ankara''nın diğer tarım bölgelerinde şebekeden bağımsız sulama ihtiyacı olan çiftçilere ve tarımsal işletmelere anahtar teslim tarımsal sulama güneş enerjisi sistemleri kuruyoruz.', ARRAY['Kuyu derinliği ve debiye göre pompa seçimi', 'Şebekeden bağımsız çalışma', 'Düşük bakım maliyeti', 'Tarımsal destek/hibe süreçlerinde danışmanlık']::text[], 'Çiftçiler ve tarımsal işletmeler', 2)
on conflict (slug) do nothing;

insert into services (slug, eyebrow, title, summary, description, bullets, audience, sort_order)
values ('ruzgar-hibrit', 'Hibrit', 'Rüzgar Türbini & Hibrit Sistemler', 'Güneş ışınımının düşük olduğu saatlerde rüzgar desteğiyle kesintisiz üretim.', 'Güneş enerjisi sistemleri gece saatlerinde veya yoğun bulutlu havalarda üretim yapamaz; bu boşluğu kapatmanın en etkili yollarından biri küçük ölçekli rüzgar türbinleriyle oluşturulan hibrit sistemlerdir. Aktürk Enerji, bölgenizin rüzgar potansiyelini ve güneş ışınım verilerini birlikte analiz ederek panel ve türbin kapasitesini dengeli şekilde belirliyor, hibrit invertör ve kontrol ünitesiyle iki kaynağı tek bir enerji hattında birleştiriyor. Bu yaklaşım, özellikle şebekeden tamamen bağımsız çalışması gereken uzak tesisler, karavanlar ve mobil yapılar için gece-gündüz kesintisiz enerji üretimi sağlar. Batarya depolama sistemleriyle entegre edildiğinde, hem güneşli hem rüzgarlı saatlerde üretilen fazla enerji depolanarak enerji kesintisi riski en aza indirilir. Ankara ve çevresinde şebekeden bağımsız çalışmak isteyen tesis sahiplerine, ihtiyaç analizinden kuruluma kadar uçtan uca rüzgar-güneş hibrit sistem çözümleri sunuyoruz.', ARRAY['Bölgesel rüzgar/güneş verimlilik analizi', 'Hibrit inverter ve kontrol ünitesi entegrasyonu', 'Karavan ve uzak tesisler için mobil seçenekler']::text[], 'Şebekeden bağımsız çalışmak isteyen tesisler', 3)
on conflict (slug) do nothing;

insert into services (slug, eyebrow, title, summary, description, bullets, audience, sort_order)
values ('lityum-batarya-depolama', 'Depolama', 'Lityum Bataryalı Depolamalı Sistemler', 'Ürettiğiniz enerjiyi depolayıp kesinti anında veya gece kullanmanızı sağlayan batarya sistemleri.', 'Güneş enerjisi sisteminizin gündüz ürettiği fazlayı depolayabilmek, hem elektrik kesintilerine karşı güvence sağlar hem de gece saatlerinde şebekeden bağımsız enerji kullanmanızı mümkün kılar. Aktürk Enerji, uzun döngü ömrü ve yüksek güvenlik standardıyla bilinen LiFePO4 (lityum demir fosfat) batarya teknolojisini kullanarak konut ve işletmeler için depolamalı güneş enerjisi sistemleri kuruyor. Sistem, elektrik kesintisi anında otomatik olarak devreye giren bir UPS mantığıyla çalışır — kesinti fark edilmeden batarya beslemesine geçilir. Batarya kapasitesi, günlük tüketim profilinize ve yedekte tutmak istediğiniz süreye göre boyutlandırılır; mobil uygulama üzerinden üretim, tüketim ve batarya doluluk oranını anlık olarak takip edebilirsiniz. Kesintisiz enerji ihtiyacı olan konutlar, küçük işletmeler, tarımsal tesisler ve telekomünikasyon altyapıları için Ankara genelinde lityum batarya depolama sistemleri kuruyoruz — mevcut bir güneş enerjisi sisteminize sonradan batarya entegrasyonu da mümkündür.', ARRAY['LiFePO4 batarya — uzun döngü ömrü', 'Kesinti anında otomatik geçiş (UPS mantığı)', 'Mobil uygulamadan üretim/tüketim takibi']::text[], 'Kesintisiz enerji ihtiyacı olan konut ve işletmeler', 4)
on conflict (slug) do nothing;

insert into services (slug, eyebrow, title, summary, description, bullets, audience, sort_order)
values ('off-grid-sebekeden-bagimsiz', 'Off-Grid', 'Off-Grid / Şebekeden Bağımsız GES Sistemleri', 'Hobi bahçenizden karavanınıza, şebekenin ulaşmadığı her noktaya taşınabilir ve kompakt güneş enerjisi sistemleri kuruyoruz.', 'Elektrik şebekesinin ulaşmadığı ya da şebeke bağlantısının pratik olmadığı her yerde, güneş enerjisi en sürdürülebilir ve bağımsız çözümdür. Aktürk Enerji, hobi bahçesi, karavan, yazlık, gözetleme kulübesi ve uzak saha tesisleri gibi farklı ihtiyaçlara göre boyutlandırılmış off-grid (şebekeden bağımsız) güneş enerjisi sistemleri kuruyor. Hobi bahçenizde aydınlatma, su pompası ve küçük ev aletleri için elektrik ihtiyacınızı; karavanınızda ise buzdolabı, aydınlatma ve elektronik cihazlarınızı şebeke bağlantısı olmadan karşılıyoruz. Sistemlerimiz panel, lityum batarya ve invertörden oluşan kompakt bir yapıda tasarlanır; EDAŞ başvurusu veya şebeke bağlantı anlaşması gerektirmez, bu da kurulum sürecini hem hızlı hem düşük maliyetli kılar. Başlangıç paketleri genellikle temel aydınlatma ve priz ihtiyacını karşılayacak şekilde planlanır; ihtiyacınız arttıkça sistem kolayca büyütülebilir. Karavan sahipleri için çatı yapısına uygun esnek veya sert panel seçenekleri sunuyor, hobi bahçesi sahipleri için ise sehpa üzeri montaj yapıyoruz. Kurulum sonrasında uzaktan teknik destek sağlayarak, sistemi nerede kullanırsanız kullanın yalnız bırakmıyoruz. Gölbaşı, Polatlı ve Ankara''nın diğer bölgelerindeki hobi bahçesi ve karavan sahiplerine, ayrıca şebekeden bağımsız çalışması gereken her türlü küçük tesise bütçenize uygun kompakt güneş enerjisi çözümleri sunuyoruz.', ARRAY['Hobi bahçesi, karavan ve uzak tesisler için kompakt tasarım', 'EDAŞ başvurusu veya şebeke bağlantısı gerektirmez', 'İhtiyaca göre sonradan genişletilebilir sistem', 'Karavan çatısına özel esnek panel seçenekleri']::text[], 'Hobi bahçesi ve karavan sahipleri, şebekeden bağımsız çalışmak isteyen tesisler', 5)
on conflict (slug) do nothing;

insert into services (slug, eyebrow, title, summary, description, bullets, audience, sort_order)
values ('elektrikli-arac-sarj-istasyonu', 'E-Mobilite', 'Elektrikli Araç Şarj İstasyonu Sistemleri', 'Villanıza, işletmenize ya da mevcut güneş enerjisi sisteminize entegre elektrikli araç şarj istasyonu kurulumu.', 'Elektrikli araç sahiplerinin sayısı arttıkça, evde veya işletmede güvenilir bir şarj istasyonuna sahip olmak günlük kullanım açısından pratik bir ihtiyaç haline geliyor. Aktürk Enerji, konut, işletme ve toplu yaşam alanları için AC tip 2 duvar tipi şarj istasyonlarının satış, kurulum ve devreye alma sürecini uçtan uca yürütüyor. Mevcut bir güneş enerjisi sisteminiz varsa, şarj istasyonunu doğrudan GES sisteminize entegre ederek aracınızı büyük ölçüde güneşten şarj etmenizi sağlıyoruz — bu da yakıt/şarj maliyetinizi sıfıra yaklaştırır. Kurulum öncesinde elektrik altyapınızı (pano kapasitesi, kablo kesiti, sigorta) kontrol ediyor, ihtiyaç halinde altyapı güncellemesini de üstleniyoruz. Villa, site, işyeri otoparkı veya AVM gibi farklı ölçeklerde tekli veya çoklu şarj istasyonu kurulumu yapıyoruz; toplu konut ve site projelerinde birden fazla üniteyi ortak altyapıya bağlayarak yönetiyoruz. Şarj istasyonlarımız akıllı uygulama üzerinden şarj takibi ve programlama imkânı sunar — güneşin en yoğun olduğu saatlerde otomatik şarj planlayabilirsiniz. Ankara ve çevresinde villa sahiplerinden işletmelere kadar geniş bir yelpazede elektrikli araç şarj istasyonu kurulumu gerçekleştiriyoruz.', ARRAY['AC Tip 2 duvar tipi şarj istasyonu kurulumu', 'Mevcut güneş enerjisi sisteminize entegrasyon', 'Elektrik altyapı kontrolü ve gerekli güncellemeler', 'Villa, işletme ve toplu yaşam alanları için tekli/çoklu kurulum']::text[], 'Elektrikli araç sahibi villa ve işletme sahipleri', 12)
on conflict (slug) do nothing;

insert into services (slug, eyebrow, title, summary, description, bullets, audience, sort_order)
values ('malzeme-tedarik-toptan-perakende', 'Tedarik', 'Malzeme Tedariği, Toptan & Perakende Satış', 'Panel, inverter, batarya ve bağlantı ekipmanlarında toptan/perakende tedarik.', 'Güneş enerjisi sistemi kurulumunda kullanılan panel, invertör, batarya, kablo ve montaj ekipmanlarının orijinal, garantili ve rekabetçi fiyatlı olması, sistemin uzun vadeli performansını doğrudan etkiler. Aktürk Enerji, sektördeki geniş tedarikçi ağı sayesinde bu ekipmanları hem bireysel proje sahiplerine hem de toplu alım yapmak isteyen bayi, kurum ve müteahhit firmalara toptan ve perakende olarak temin ediyor. Güncel stok durumuna göre farklı marka ve kapasitelerde panel ve invertör seçenekleri sunuyor, her üründe orijinal garanti belgesi sağlıyoruz. Toplu alımlarda proje ölçeğine göre özel fiyatlandırma yapıyor, montaj ekibiniz için teknik danışmanlık da veriyoruz. Güncel stok ve fiyat listesi sık değiştiği için en doğru bilgi için doğrudan bizimle iletişime geçmenizi öneririz. Ankara merkezli olsak da Türkiye genelinde bayilere ve bireysel alıcılara malzeme tedariği sağlıyoruz.', ARRAY['Güncel stok ve fiyat listesi için iletişime geçin', 'Toplu alımlarda proje bazlı fiyatlandırma', 'Orijinal ürün ve garanti belgesi']::text[], 'Bayiler, kurumlar ve bireysel alıcılar', 7)
on conflict (slug) do nothing;

insert into services (slug, eyebrow, title, summary, description, bullets, audience, sort_order)
values ('distributorluk-bayilik', 'İş Ortaklığı', 'Distribütörlük ve Bayilik Sistemleri', 'Bölgenizde Aktürk Enerji güvencesiyle iş ortaklığı kurun.', 'Solar enerji sektörü Türkiye''de hızla büyürken, bölgenizde bu büyümeden pay almak isteyen firmalar için Aktürk Enerji güvencesiyle distribütörlük veya bayilik modeliyle iş ortaklığı kurmak güçlü bir fırsat sunuyor. Bayilik anlaşması kapsamında malzeme tedariğinde öncelikli fiyat avantajı, teknik eğitim programları ve saha desteği sağlıyoruz — ekibinizin kurulum, keşif ve satış süreçlerinde ihtiyaç duyacağı bilgi birikimini aktarıyoruz. Ortak pazarlama materyalleri ve marka kullanım desteğiyle bölgenizde güvenilir bir GES markası olarak konumlanmanıza yardımcı oluyoruz. Distribütörlük modelinde ise daha geniş bir bölgede malzeme dağıtımı ve alt bayi ağı kurma imkânı sunuyoruz. Şehrinizde veya bölgenizde solar sektöründe büyümek isteyen firmalarla görüşmeye açığız; iş ortaklığı koşullarını birlikte değerlendirmek için bizimle iletişime geçebilirsiniz.', ARRAY['Bölgesel bayilik/distribütörlük görüşmeleri', 'Teknik eğitim ve saha desteği', 'Ortak pazarlama materyalleri']::text[], 'İş ortaklığı kurmak isteyen firmalar', 8)
on conflict (slug) do nothing;

insert into services (slug, eyebrow, title, summary, description, bullets, audience, sort_order)
values ('projelendirme-muhendislik-basvuru', 'Mühendislik', 'Projelendirme, Mühendislik ve Başvuru İşlemleri', 'EDAŞ başvurusundan elektrik projesine, sisteminizin kağıt üzerindeki tüm süreci bizde.', 'Bir güneş enerjisi sisteminin kâğıt üzerindeki süreci — statik hesap, elektrik projesi, tek hat şeması ve dağıtım şirketi (EDAŞ) başvurusu — kurulum kadar kritik ve genellikle o kadar da karmaşıktır. Aktürk Enerji''nin mühendislik ekibi, çatı veya arazinizin statik durumunu inceleyerek taşıma kapasitesi raporunu hazırlıyor, sisteminize uygun tek hat şemasını ve elektrik projesini çiziyor, EDAŞ bağlantı anlaşması ile lisanssız üretim başvurusu dahil tüm mevzuat süreçlerini sizin adınıza yürütüyor. Bu hizmeti yalnızca kendi kurduğumuz sistemler için değil, başka bir firmanın kurduğu veya kurmayı planladığınız sistemler için de bağımsız mühendislik danışmanlığı olarak sunuyoruz. Savunma sanayi ve telekomünikasyon sektöründeki projelerde edindiğimiz saha tecrübesiyle, standart konut/tarım projelerinin yanı sıra daha karmaşık kurumsal başvurularda da güvenilir bir çözüm ortağıyız. Bireysel başvuru sahiplerinden kurumsal projelere kadar Ankara ve Türkiye genelinde projelendirme, mühendislik ve başvuru süreçlerinde yanınızdayız.', ARRAY['Tek hat şeması ve elektrik proje çizimi', 'EDAŞ / lisanssız üretim başvuru takibi', 'Savunma sanayi ve telekomünikasyon projelerinde saha tecrübesi']::text[], 'Bireysel ve kurumsal başvuru sahipleri', 9)
on conflict (slug) do nothing;

insert into services (slug, eyebrow, title, summary, description, bullets, audience, sort_order)
values ('fabrika-cati-ges', 'Endüstriyel', 'Fabrika Çatı GES Sistemleri', 'Üretim tesisinizin geniş çatı alanını, enerji maliyetlerinizi düşüren büyük ölçekli bir güneş enerjisi santraline dönüştürün.', 'Fabrika ve üretim tesislerinin geniş çatı alanları, endüstriyel ölçekte güneş enerjisi üretimi için önemli bir potansiyel taşır. Aktürk Enerji, tesisinizin çatı statiğini, mevcut üç faz elektrik altyapısını ve yıllık tüketim profilinizi birlikte değerlendirerek işletmenize özel bir güneş enerjisi sistemi (GES) tasarlıyor. Süreç ücretsiz keşifle başlar: çatı alanınızı, taşıma kapasitesini ve gölgelenme durumunu inceliyor, son 12 aylık elektrik faturalarınıza göre size en yüksek tasarrufu sağlayacak sistem gücünü hesaplıyoruz. Endüstriyel tesislerde üretim genellikle gündüz saatlerinde en yoğun elektrik tüketimiyle örtüştüğü için güneş enerjisi yatırımının geri dönüş süresi konut projelerine kıyasla daha kısa olabilir. Kurulum sürecini, tesisinizin üretim takvimini aksatmayacak şekilde vardiya ve bakım planınıza göre programlıyor; trapez sac, sandviç panel gibi farklı çatı tiplerine uygun montaj sistemleri kullanıyoruz. Statik rapor, elektrik projesi ve EDAŞ ya da OSB bağlantı anlaşması başvurusunun tamamını sizin adınıza yürütüyoruz. Ankara ve çevresindeki organize sanayi bölgelerinde ve bağımsız üretim tesislerinde, işletmenizin enerji maliyetini kalıcı olarak azaltacak anahtar teslim fabrika çatı GES sistemleri kuruyoruz.', ARRAY['Büyük ölçekli çatı statiği ve yük analizi', 'Üç faz elektrik altyapısına uygun sistem tasarımı', 'Üretimi aksatmayan, vardiya planına göre kurulum', 'OSB/EDAŞ bağlantı anlaşması ve başvuru takibi']::text[], 'Fabrika ve üretim tesisi sahipleri', 10)
on conflict (slug) do nothing;

insert into services (slug, eyebrow, title, summary, description, bullets, audience, sort_order)
values ('taahhut-isletme-bakim', 'Taahhüt & Bakım', 'Taahhüt ve İşletme-Bakım Hizmetleri', 'Kurumsal projelerde taahhüt yüklenimi, devreye alınmış güneş enerjisi sistemlerinde periyodik işletme ve bakım.', 'Bir güneş enerjisi sisteminin kurulumu kadar, kurulum sonrasındaki işletme süreci de sistemin ömrü ve verimliliği açısından belirleyicidir. Aktürk Enerji, kurumsal ve kamu projelerinde taahhüt yüklenicisi olarak GES kurulum işlerini sözleşme kapsamında uçtan uca üstlenirken, devreye alınmış sistemlerde de düzenli işletme ve bakım (O&M) hizmeti sunuyor. Taahhüt kapsamında ihale şartnamesine uygun mühendislik, malzeme tedariki, kurulum ve devreye alma süreçlerini yürütüyoruz — ister kendi projemiz olsun ister başka bir yüklenicinin devrettiği iş. İşletme-bakım tarafında ise panel temizliği, invertör ve batarya sağlık kontrolleri, bağlantı noktalarının kontrolü, üretim verimliliği raporlaması ve arıza müdahalesini kapsayan periyodik ziyaretlerle sisteminizin uzun vadeli performansını güvence altına alıyoruz. Bu hizmet, sistemini başka bir firmadan kurdurmuş olan işletmeler için de geçerlidir — mevcut GES''inizin bakımını devralabiliriz. Uzaktan izleme altyapımızla üretim düşüşlerini erken tespit ediyor, sahaya çıkmadan önce olası arızayı teşhis etmeye çalışıyoruz. Ankara ve çevresinde kurumsal, endüstriyel ve toplu projelerde taahhüt ve işletme-bakım hizmeti veriyoruz.', ARRAY['İhale ve kurumsal proje taahhüt yüklenimi', 'Panel temizliği ve ekipman sağlık kontrolü', 'Uzaktan izleme ile erken arıza tespiti', 'Başka firmanın kurduğu sistemlere de bakım hizmeti']::text[], 'Kurumsal projeler ve mevcut GES sahipleri', 11)
on conflict (slug) do nothing;

insert into project_references (slug, title, category, location, capacity, year, summary, description, sort_order)
values ('referans-1', '[PLACEHOLDER] Villa Çatı GES Projesi', 'Villa', 'Çankaya, Ankara', '10 kWp', '2024', 'Müstakil villa çatısına kurulan, yıllık tüketimin tamamına yakınını karşılayan sistem.', 'Çankaya''da bulunan müstakil bir villanın çatısına kurduğumuz 10 kWp gücündeki güneş enerjisi sistemi (GES), hanenin yıllık elektrik tüketiminin tamamına yakınını karşılıyor. Proje kapsamında çatı statiği incelendi, elektrik projesi çizildi ve EDAŞ bağlantı anlaşması Aktürk Enerji tarafından yürütüldü. Çankaya ve çevresinde villa çatı GES kurulumu düşünen ev sahipleri için benzer sistemleri anahtar teslim olarak kuruyoruz.', 0)
on conflict (slug) do nothing;

insert into project_references (slug, title, category, location, capacity, year, summary, description, sort_order)
values ('referans-2', '[PLACEHOLDER] Toplu Konut Projesi', 'Müteahhit', 'Etimesgut, Ankara', '180 kWp', '2023', 'Müteahhit firmayla ortak yürütülen, 40 konutluk sitede blok bazlı kurulum.', 'Etimesgut''ta 40 konuttan oluşan bir toplu konut projesinde, müteahhit firmayla birlikte yürüttüğümüz 180 kWp kapasiteli güneş enerjisi sistemi, blok blok kurulum takvimiyle teslim tarihini aksatmadan tamamlandı. Etimesgut ve Ankara genelinde müteahhit firmalarla ortak yürüttüğümüz GES projelerinde toplu malzeme tedariği ve saha koordinasyonunu Aktürk Enerji üstleniyor.', 1)
on conflict (slug) do nothing;

insert into project_references (slug, title, category, location, capacity, year, summary, description, sort_order)
values ('referans-3', '[PLACEHOLDER] Tarımsal Sulama Sistemi', 'Tarım', 'Polatlı, Ankara', '15 kWp', '2023', 'Şebeke bağlantısı olmayan arazide güneş destekli dalgıç pompa sistemi.', 'Polatlı''da şebeke bağlantısı bulunmayan bir tarım arazisinde kurduğumuz 15 kWp güç kapasiteli güneş enerjisi destekli dalgıç pompa sistemi, sulama ihtiyacını dizel jeneratöre ya da şebeke yatırımına gerek kalmadan karşılıyor. Polatlı ve Ankara''nın tarım bölgelerinde çiftçilere özel tarımsal sulama GES sistemleri kuruyoruz.', 2)
on conflict (slug) do nothing;

insert into project_references (slug, title, category, location, capacity, year, summary, description, sort_order)
values ('referans-4', '[PLACEHOLDER] Hobi Bahçesi Elektrifikasyonu', 'Hobi Bahçesi', 'Gölbaşı, Ankara', '3 kWp', '2024', 'Aydınlatma, sulama pompası ve priz ihtiyacını karşılayan kompakt sistem.', 'Gölbaşı''ndaki bir hobi bahçesinde aydınlatma, sulama pompası ve priz ihtiyacını karşılayan 3 kWp''lik kompakt güneş enerjisi sistemi kurduk. Gölbaşı ve Ankara çevresindeki hobi bahçesi sahiplerine bütçeye uygun, kolay taşınabilir ve ihtiyaca göre sonradan genişletilebilir GES çözümleri sunuyoruz.', 3)
on conflict (slug) do nothing;

insert into project_references (slug, title, category, location, capacity, year, summary, description, sort_order)
values ('referans-5', '[PLACEHOLDER] Telekomünikasyon Saha İstasyonu', 'Telekomünikasyon', 'Ankara', '8 kWp', '2022', 'Şebekeden bağımsız çalışan iletişim istasyonu için hibrit güneş/batarya sistemi.', 'Ankara''da şebekeden bağımsız çalışan bir telekomünikasyon saha istasyonu için 8 kWp güç kapasiteli hibrit güneş/batarya sistemi kurduk. Kesintisiz iletişim altyapısı gerektiren telekomünikasyon ve savunma sanayi projelerinde Ankara genelinde saha tecrübemizle hizmet veriyoruz.', 4)
on conflict (slug) do nothing;

insert into project_references (slug, title, category, location, capacity, year, summary, description, sort_order)
values ('referans-6', '[PLACEHOLDER] Karavan Enerji Sistemi', 'Karavan', 'Ankara', '1,2 kWp', '2024', 'Esnek panel ve lityum batarya ile yolda kesintisiz enerji.', 'Ankara merkezli bir karavan sahibi için esnek panel ve lityum batarya ile donattığımız 1,2 kWp''lik mobil enerji sistemi, yolda şebekeden bağımsız kesintisiz enerji sağlıyor. Ankara ve Türkiye genelinde karavan sahiplerine özel kompakt GES ve batarya paketleri kuruyoruz.', 5)
on conflict (slug) do nothing;

insert into testimonials (name, role, quote, sort_order)
values ('[PLACEHOLDER] Müşteri Adı', 'Villa Sahibi, Çankaya', 'Keşiften kuruluma kadar her aşamada bilgilendirildik, süreç söz verilen tarihte tamamlandı.', 0);

insert into testimonials (name, role, quote, sort_order)
values ('[PLACEHOLDER] Müşteri Adı', 'Proje Müdürü, İnşaat Firması', 'Blok bazlı kurulum takvimine tam uyum sağladılar, teslim tarihimizi aksatmadılar.', 1);

insert into testimonials (name, role, quote, sort_order)
values ('[PLACEHOLDER] Müşteri Adı', 'İşletme Sahibi, Polatlı', 'Şebeke olmayan arazimizde sulama artık güneşle çalışıyor, yakıt maliyetimiz sıfırlandı.', 2);

insert into blog_posts (slug, title, description, category, content, published_at)
values ('lityum-batarya-depolama-ne-zaman-gerekli', 'Lityum Batarya Depolamalı Sistemler: Ne Zaman Anlamlı Olur?', 'Güneş enerjisi sisteminize batarya eklemenin hangi durumlarda mantıklı bir yatırım olduğunu inceliyoruz.', 'Depolama', 'Şebekeye bağlı bir güneş enerjisi sistemi kurduran birçok kişi, zamanla "batarya eklesem mi?" sorusunu sorar. Cevap, kullanım amacınıza ve şebeke güvenilirliğinize göre değişir.

## Bataryasız sistemler nasıl çalışır

Şebekeye bağlı (on-grid) bir sistemde, gündüz ürettiğiniz fazla enerji şebekeye aktarılır ve mahsuplaşma yoluyla faturanıza yansır. Gece ise ihtiyacınız olan enerjiyi normal şekilde şebekeden çekersiniz. Bu kurulum, ilk yatırım maliyetini düşük tutar.

## Batarya eklemenin sağladığı faydalar

Lityum (LiFePO4) batarya eklediğinizde, gündüz fazla üretimi şebekeye vermek yerine depolayıp gece kullanabilirsiniz. Bunun iki temel faydası vardır:

1. **Elektrik kesintilerinde kesintisiz güç:** Şebeke kesildiğinde sistem otomatik olarak bataryaya geçer, kritik cihazlarınız çalışmaya devam eder.
2. **Şebeke bağımlılığının azalması:** Özellikle mahsuplaşma koşullarının değiştiği ya da şebeke kesintilerinin sık yaşandığı bölgelerde, depolama sistemin genel verimliliğini artırır.

## Ne zaman öncelik olmalı

Sık elektrik kesintisi yaşanan bölgelerde, kesintisiz çalışması gereken ekipmanı olan işletmelerde (soğuk hava deposu, sunucu odası, sulama sistemi gibi) ya da şebekeden tamamen bağımsız olmak isteyen kullanıcılar için batarya neredeyse zorunlu bir bileşendir. Şebekenin stabil olduğu ve öncelikli amacın sadece fatura tasarrufu olduğu durumlarda ise bataryasız sistem daha hızlı geri ödeme sağlayabilir.

## LiFePO4 tercih etme sebebimiz

Lityum demir fosfat (LiFePO4) bataryalar, diğer lityum kimyasallarına göre daha uzun döngü ömrüne ve daha yüksek termal kararlılığa sahiptir. Bu özellikleri nedeniyle güneş enerjisi depolama uygulamalarında tercih ediyoruz.

Mevcut sisteminize batarya entegrasyonu ya da yeni kurulacak bir sistemde depolama planlaması için bizimle iletişime geçebilirsiniz.', '2026-03-18')
on conflict (slug) do nothing;

insert into blog_posts (slug, title, description, category, content, published_at)
values ('muteahhitler-icin-ges-proje-entegrasyonu', 'Müteahhitler İçin GES: Proje Sürecine Nasıl Entegre Edilir?', 'Toplu konut projelerinde güneş enerjisi sisteminin inşaat takvimine nasıl entegre edildiğini ve avantajlarını anlatıyoruz.', 'Müteahhit Projeleri', 'Toplu konut projelerinde güneş enerjisi sistemlerinin sonradan, teslim aşamasında düşünülmesi yaygın bir hatadır. Oysa GES''in proje geliştirme aşamasında planlanması, hem maliyet hem de uygulama açısından ciddi avantajlar sağlar.

## Neden erken planlama önemli

Elektrik altyapısı (pano yerleşimi, kablo güzergahları, sayaç mahalli) proje aşamasında güneş enerjisi sistemi düşünülerek tasarlanırsa, sonradan ek maliyet ve iş kaybına yol açan revizyonların önüne geçilir. Ayrıca çatı statiği ve panel yerleşimi baştan hesaba katıldığında, hem estetik hem de teknik açıdan daha bütünleşik bir sonuç elde edilir.

## Blok bazlı kurulum takvimi

Çok bloklu projelerde kurulumu tek seferde değil, inşaatın teslim sırasına göre blok blok planlıyoruz. Bu yaklaşım sayesinde:

- Teslim tarihi yaklaşan bloklarda kurulum önceliklendirilir,
- Saha ekibi ve malzeme lojistiği optimum şekilde planlanır,
- Genel inşaat takvimi aksamadan ilerler.

## Toplu alımın maliyet avantajı

Çok sayıda konut biriminin aynı anda projelendirilmesi, panel, inverter ve montaj malzemesinde toplu alım avantajı sağlar. Bu avantaj, birim başına maliyeti bireysel kurulumlara kıyasla belirgin şekilde düşürür ve projenin genel bütçesine olumlu yansır.

## İş birliği modeli

Müteahhit firmalarla çalışırken, ön mühendislik desteğinden başlayıp anahtar teslim kuruluma kadar tüm süreci ortak bir takvim üzerinden yürütüyoruz. Talep edilmesi halinde bayilik/distribütörlük iş birliği modelleriyle de çalışabiliyoruz.

Devam eden ya da planlama aşamasındaki bir projeniz varsa, ön mühendislik değerlendirmesi için bizimle iletişime geçebilirsiniz.', '2026-02-09')
on conflict (slug) do nothing;

insert into blog_posts (slug, title, description, category, content, published_at)
values ('tarimsal-sulama-gunes-enerjisi-pompa', 'Tarımsal Sulamada Güneş Enerjisi: Şebekesiz Arazilerde Pompa Sistemleri', 'Elektrik hattının ulaşmadığı tarım arazilerinde güneş enerjili sulama pompası kurulumunun nasıl planlandığını anlatıyoruz.', 'Tarımsal Sulama', 'Türkiye''de birçok tarım arazisi, elektrik şebekesinin ulaşamadığı bölgelerde yer alır. Bu durumda çiftçilerin klasik seçenekleri ya dizel jeneratörle pompa çalıştırmak ya da uzun ve maliyetli bir şebeke hattı çektirmektir. Güneş enerjili sulama sistemleri, üçüncü ve genellikle en ekonomik seçeneği sunar.

## Sistem nasıl çalışır

Güneş panelleri, doğrudan akımı bir sürücü (pompa kontrol) ünitesine iletir; bu ünite dalgıç veya yüzey pompasını güneş ışınımına bağlı olarak değişken hızda çalıştırır. Güneş ne kadar güçlüyse pompa o kadar hızlı çalışır; bulutlu havalarda debi düşer ama sistem yine de çalışmaya devam eder.

## Doğru boyutlandırmanın kriterleri

Bir sulama sisteminin boyutlandırılmasında üç ana veri gereklidir:

- **Kuyu derinliği ve statik su seviyesi:** Pompanın kaç metre yükseğe su çıkarması gerektiğini belirler.
- **İstenen debi:** Günlük kaç metreküp su çekilmesi gerektiği, sulanacak alan ve bitki türüne göre hesaplanır.
- **Güneşlenme profili:** Bölgenin ortalama günlük güneşlenme süresi, günlük toplam su üretimini doğrudan etkiler.

## Şebekeden bağımsız çalışmanın avantajları

Dizel jeneratöre kıyasla yakıt maliyeti ortadan kalkar, bakım ihtiyacı büyük ölçüde azalır ve sistem sessiz çalışır. Ayrıca panel ve pompa ekipmanının kullanım ömrü uzun olduğundan, yatırım birkaç sezon içinde kendini amorti edebilir.

## Hibe ve destek süreçleri

Tarımsal sulama sistemleri için zaman zaman kamu destekleri veya hibe programları açılabilmektedir. Başvuru süreçlerinde gerekli teknik dokümantasyonun hazırlanmasında da danışmanlık sağlıyoruz.

Arazinizin koordinatlarını ve kuyu bilgilerinizi paylaşırsanız, size özel bir ön değerlendirme hazırlayabiliriz.', '2026-04-03')
on conflict (slug) do nothing;

insert into blog_posts (slug, title, description, category, content, published_at)
values ('villa-cati-kac-kwp-ges-sistemi', 'Villa Çatınıza Kaç kWp Güneş Enerjisi Sistemi Kurulmalı?', 'Doğru sistem boyutunu belirlerken dikkate alınması gereken çatı alanı, yönü, tüketim ve bütçe kriterlerini anlatıyoruz.', 'Villa GES', 'Villa çatısına güneş enerjisi sistemi kurdurmayı düşünenlerin en sık sorduğu soru şudur: "Bana kaç kWp''lik bir sistem lazım?" Bu sorunun tek bir doğru cevabı yoktur; sistem boyutu birkaç değişkenin birlikte değerlendirilmesiyle belirlenir.

## Yıllık elektrik tüketiminiz

İlk adım, son 12 aylık elektrik faturalarınıza bakmaktır. Aylık ortalama tüketiminizi kWh cinsinden bilmek, ihtiyacınız olan sistem gücünü hesaplamanın başlangıç noktasıdır. Yaz ve kış tüketiminiz arasında büyük fark varsa (örneğin klima veya elektrikli ısıtma kullanıyorsanız) bu mevsimsel dalgalanmayı da hesaba katmak gerekir.

## Çatı alanı ve yönü

Ankara gibi orta enlemdeki bir şehirde en verimli kurulum, güney cepheye bakan ve gölgelenmeyen çatı yüzeyleridir. Doğu-batı yönelimli çatılarda da sistem kurulabilir, ancak üretim miktarı güney cepheye göre bir miktar daha düşük olur. Çatı üzerindeki baca, klima ünitesi gibi engeller de kullanılabilir alanı ve dolayısıyla maksimum sistem boyutunu etkiler.

## Bütçe ve geri ödeme süresi

Daha büyük bir sistem daha fazla üretim ve daha yüksek tasarruf demektir, ancak başlangıç yatırımı da artar. Çoğu villa sahibi için mantıklı yaklaşım, yıllık tüketimin tamamını ya da büyük bölümünü karşılayacak bir sistem boyutuna göre planlama yapmaktır; bu sayede şebekeden çekilen enerji minimize edilirken gereksiz büyük bir yatırımdan da kaçınılmış olur.

## Neden keşif önemli

Yukarıdaki tüm faktörler birbirine bağlıdır ve doğru sonuca ancak yerinde yapılan bir keşifle ulaşılabilir. Keşif sırasında çatı statiği, yönü, gölgelenme durumu ve elektrik altyapınız birlikte değerlendirilir; bu sayede hem yeterli hem de bütçenize uygun bir sistem önerisi sunabiliriz.

Villa çatınız için ücretsiz keşif talep etmek üzere bizimle iletişime geçebilirsiniz.', '2026-05-12')
on conflict (slug) do nothing;

