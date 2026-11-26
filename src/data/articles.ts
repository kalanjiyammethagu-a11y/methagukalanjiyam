import { getSupabaseStorageUrl } from "@/lib/book-images";
export interface ArticleDetailData {
  slug: string;
  titleTa: string;
  titleEn: string;
  subtitleTa: string;
  subtitleEn: string;
  coverImage: string;
  coverAltTa?: string;
  coverAltEn?: string;
  categoryTa: string;
  categoryEn: string;
  publishedAt: string;
  readingTimeMinutes: number;
  authorTa: string;
  authorEn: string;
  htmlContentTa: string;
  htmlContentEn: string;
  relatedBookSlugs: string[];
}

export const detailedArticles: Record<string, ArticleDetailData> = {
  "eelam-liberation": {
    slug: "eelam-liberation",
    titleTa: "மூத்த புலனாய்வுத் தளபதியின் தியாக வாழ்வும் வீரமும்",
    titleEn: "The Valour and Martyrdom of Senior Intelligence Commander Vinayagam",
    subtitleTa: "குறி தவறாக்கணை: தமிழீழ விடுதலைப் புலிகளின் மூத்த புலனாய்வுத் தளபதியின் தியாக வாழ்க்கை",
    subtitleEn: "The Unswerving Arrow: The sacrifice and leadership of Commander Vinayagam",
    coverImage: getSupabaseStorageUrl("blog", "thalapathi-vinayagam-banner.webp"),
    categoryTa: "வரலாற்று ஆவணம்",
    categoryEn: "Historical Record",
    publishedAt: "2026-08-06",
    readingTimeMinutes: 8,
    authorTa: "சாந்தி நேசக்கரம்",
    authorEn: "Saanthi Nesakaram",
    relatedBookSlugs: ["dhisai-thavara-kanai", "katunayake-attack-victory", "arivaran-pottu-amman"],
    htmlContentTa: `
      <h2>1. அறிமுகமும் ஆரம்ப கால வாழ்க்கையும்</h2>
      <p><b>சேகரிப்பிள்ளை விநாயகமூர்த்தி</b> என்ற இயற்பெயர் கொண்ட தளபதி விநாயகம், 1964 ஆம் ஆண்டு அக்டோபர் 25 அன்று தென்மராட்சியின் வரணி கிராமத்தில் கதிர்காமசேகரம்பிள்ளை - மீனாட்சிப்பிள்ளை இணையருக்கு மகனாகப் பிறந்தார். அமைதியான கிராமத்துப் பின்னணியில் வளர்ந்த இவர், 1983-இல் பகுதிநேரப் போராளியாகவும், 1984 அக்டோபரில் தமிழீழ விடுதலைப் புலிகள் அமைப்பில் முழுநேரப் போராளியாகவும் இணைந்தார்.</p>
      <p>ஆரம்பத்தில் தளபதி கேடயில்ஸ் வழிகாட்டலில் சுய பொருண்மிய உற்பத்தி மற்றும் விதை விநியோகப் பணிகளில் ஈடுபட்டார். 1985-இல் நேரிட்ட வீதி விபத்தொன்றில் இவரது கால்களில் வாகனம் ஏறியதால் பெருவிரல் துண்டிக்கப்பட்டு, கடும் காயங்களுக்கு உள்ளானார். வாழ்நாள் முழுவதும் கடுமையான வலியையும் உபாதையையும் தந்த அந்த உடற்குறையைப் பொருட்படுத்தாது, தேசப்பணியில் ஓயாது உழைத்த உறுதியான வீரன் இவர்.</p>

      <h2>2. இந்திய இராணுவக் காலமும் குடும்பத் தியாகமும்</h2>
      <p>இந்திய அமைதிப்படை இலங்கையில் நிலை கொண்டிருந்த காலத்தில், விநாயகத்தைத் தேடி வந்த இராணுவத்தினர் இவரது குடும்பத்தின் மீது கடும் சித்திரவதைகளை மேற்கொண்டனர். இவரது தந்தையைக் கயிற்றால் கட்டி வாகனத்தில் இறக்கி ஏற்றிச் சித்திரவதை செய்து, வீடையும் தீக்கிரையாக்கினர். குடும்பம் எதிர்கொண்ட கொடுமைகளை அறிந்தபோதும், தாய்நாட்டின் விடுதலையைக் கண்ணெனக் கருதி களத்தில் உறுதியோடு பணியாற்றினார்.</p>

      <div class="my-6 p-6 rounded-2xl bg-[#0A6847]/8 dark:bg-emerald-950/60 border border-[#0A6847]/20 dark:border-emerald-700/60 text-[#111111] dark:text-zinc-100 shadow-2xs">
        <h3 class="text-base font-bold text-[#0A6847] dark:text-emerald-300 mb-2 font-tamil">முக்கிய வரலாற்றுச் சம்பவம்: கட்டுநாயக்கா வான்படைத்தளத் தாக்குதல் (2001)</h3>
        <p class="text-sm leading-relaxed text-[#222222] dark:text-zinc-200">தளபதி விநாயகத்தின் இராணுவப் புலனாய்வு வாழ்க்கையில் மிக முக்கிய முத்திரையாக அமைந்தது <b class="dark:text-white">2001 கட்டுநாயக்கா சர்வதேச விமானநிலையம் மற்றும் வான்படைத்தள மீதான தாக்குதலாகும்</b>. சிறிலங்காவின் பொருளாதாரத்தையும் படை பலத்தையும் உலகறிய ஆட்டங்காண வைத்த இத்தாக்குதலுக்கான வேவு நடவடிக்கைகள், திட்டமிடல்கள் மற்றும் தாக்குதல் அணிகளைப் பாதுகாப்பாகக் களமிறக்கும் அதிமுக்கியப் பொறுப்பைத் தளபதி விநாயகமே முன்னின்று நடத்தினார். கண்ணன், முகிலன், கானகன் உள்ளிட்ட 14 கரும்புலிகள் அடங்கிய சிறப்பு அணிக்கு வழிகாட்டி, எதிரியின் கோட்டைக்குள் புகுந்து சாதனையை நிலைநாட்டினார்.</p>
      </div>

      <h2>3. நந்திக்கடலுக்குப் பின்னரான இரகசியப் பயணமும் தப்பியோடுதலும்</h2>
      <p>2009 முள்ளிவாய்க்கால் இறுதிப் போரின் போது, தளபதி பொட்டு அம்மான் அவர்களின் கட்டளைப்படி கொழும்பு மற்றும் தென் பகுதி நடவடிக்கைகளுக்காக வன்னிக்கு வெளியே மன்னாரில் தங்கியிருந்தார். போரின் முடிவுக்குப் பின், 12,000-க்கும் மேற்பட்ட போராளிகள் சரணடைந்த சூழலிலும், தளபதி விநாயகம் சரணடையாமல் மன்னார் காடுகளிலும் வலைகளுக்குள்ளும் தலைமறைவாக வாழ்ந்தார்.</p>
      <p>அங்கிருந்து தப்பிச் செல்ல முயன்ற போது கடற்படையினரின் தாக்குதல்களுக்கு உள்ளாகி, பலமுறை நூலிழையில் உயிர் தப்பினார். இறுதியாக, <b>24.07.2009</b> அன்று (சரியாக 2001 கட்டுநாயக்கா தாக்குதல் நடைபெற்ற அதே ஜூலை 24 திகதியில்) பொய்யான கடவுச்சீட்டு மூலம் கட்டுநாயக்கா விமான நிலையத்தைக் கடந்து வெளிநாட்டிற்குத் தப்பினார். தான் திட்டமிட்டுத் தாக்கிய அதே விமான நிலையத்தின் வழியே எதிரியின் கண்களில் மண்ணைத் தூவி தப்பியது இவரது புலனாய்வுச் சாதுரியத்திற்குச் சான்றாகும்.</p>

      <blockquote class="my-6 p-6 rounded-2xl bg-neutral-950 text-white border border-amber-400/30 shadow-md">
        <h4 class="text-amber-300 font-bold mb-1 font-tamil">பேரம் பேச மறுத்த கொள்கை உறுதி</h4>
        <p class="italic text-sm leading-relaxed text-zinc-100">மன்னாரில் தலைமறைவாக இருந்தபோது, சிறிலங்கா இராணுவப் புலனாய்வாளர்கள் விநாயகத்தின் மனைவி கிருபா மற்றும் குழந்தைகளைப் பிணையாகப் பிடித்துத் தொலைபேசியில் மிரட்டினர்: <i class="text-amber-100">"குடும்பத்தைக் காப்பாற்ற வேண்டுமானால் சரணடை, இல்லையெனில் சுட்டுக்கொல்வோம்!"</i> அதற்கு விநாயகம் கம்பீரமாகப் பதிலளித்தார்: <b class="text-white">"எத்தனையோ மாவீரர்களையும் மக்களையும் இழந்துவிட்டேன். அவர்களையெல்லாம் விட என் குடும்பம் பெரிதல்ல... அவர்களைச் சுட்டுக் கொல்லுங்கள்!"</b> என்று கூறித் தொலைபேசி அழைப்பைத் துண்டித்துச் சிம் கார்டை உடைத்தெறிந்தார்.</p>
      </blockquote>

      <h2>4. புலம்பெயர் வாழ்வும் இறுதி மறைவும்</h2>
      <p>பிரான்ஸ் நாட்டைச் சென்றடைந்த விநாயகத்திற்கு அங்கும் அமைதி கிடைக்கவில்லை. சிறிலங்கா அரசின் பொய்ப் பிரச்சாரங்களாலும், இன்டர்போல் (Interpol) சிவப்பறிவிப்பாலும் அகதி அந்தஸ்தோ, அடிப்படை மனித உரிமைகளோ, மருத்துவக் காப்பீடோ இன்றித் தனிமையில் விடப்பட்டார். 15 ஆண்டுகள் மனைவி பிள்ளைகளைப் பார்க்க முடியாமல் கடும் மன உளைச்சலுக்கும் வறுமைக்கும் ஆளானார்.</p>
      <p>இறுதியில் சுவாசப் புற்றுநோயால் பாதிக்கப்பட்ட தளபதி விநாயகம், <b>04.06.2024</b> அன்று பாரிஸ் நகரில் உள்ள Saint-Louis மருத்துவமனையில் வீரச்சாவடைந்தார். பிரான்ஸ் மண்ணில் ஆயிரக்கணக்கான தமிழர்கள் மற்றும் சக தோழர்களின் கண்ணீரோடு இவரது இறுதிநிகழ்வு நடைபெற்றது.</p>

      <h2>5. முடிவுரை</h2>
      <p>வரலாறு தானாகப் பாதுகாக்கப்படுவதில்லை. சாந்தி நேசக்கரம் எழுதிய <i>"குறி தவறாக்கணை தளபதி விநாயகம்"</i> நூல் போன்ற ஆவணங்கள் மூலம் தளபதி விநாயகத்தின் தியாக வரலாற்றை அடுத்த தலைமுறைக்குக் கொண்டு சேர்ப்பது தமிழினத்தின் கடமையாகும்.</p>
    `,
    htmlContentEn: `
      <h2>1. Introduction & Early Life</h2>
      <p>Commander Vinayagam, whose given name was <b>Sekaripillai Vinayagamoorthy</b>, was born on October 25, 1964, in the serene village of Varani in Thenmaradchi to Kathirkamasekarampillai and Meenatchipillai. He joined the Tamil liberation struggle as a part-time cadre in 1983 and became a full-time member of the LTTE in October 1984.</p>
      <p>Initially tasked with agricultural production and seed supply logistics under the mentorship of senior leadership, he met with a serious vehicle accident in 1985 resulting in the amputation of his great toe. In spite of chronic physical distress throughout his life, he never permitted injury to impede his unwavering national duty.</p>

      <h2>2. The IPKF Period and Family Sacrifices</h2>
      <p>During the Indian Peace Keeping Force intervention, occupation troops hunting for Vinayagam subjected his elderly father to horrific torture and set their family residence ablaze. Knowing the immense trauma endured by his loved ones, Vinayagam remained steadfast on the battlefield, placing the destiny of his homeland above all personal ties.</p>

      <div class="my-6 p-6 rounded-2xl bg-[#0A6847]/8 dark:bg-emerald-950/60 border border-[#0A6847]/20 dark:border-emerald-700/60 text-[#111111] dark:text-zinc-100 shadow-2xs">
        <h3 class="text-base font-bold text-[#0A6847] dark:text-emerald-300 mb-2">Pivotal Historic Milestone: The 2001 Katunayake Air Base Operation</h3>
        <p class="text-sm leading-relaxed text-[#222222] dark:text-zinc-200">The defining hallmark of Commander Vinayagam's intelligence career was the <b class="dark:text-white">historic assault on Katunayake International Airport and military airbase on July 24, 2001</b>. Vinayagam personally oversaw the comprehensive reconnaissance, covert penetration, and safe insertion of the 14-member elite Black Tiger squad led by Kannan, Mukhilan, and Kaanagan, shaking the adversary's state apparatus to its core.</p>
      </div>

      <h2>3. The Covert Survival After Mullivaikkal (2009)</h2>
      <p>During the catastrophic final phase of the conflict at Mullivaikkal in May 2009, Vinayagam was operating covertly outside Vanni in the dense jungles of Mannar following instructions from intelligence chief Pottu Amman. While over 12,000 fighters were captured or surrendered, Vinayagam refused surrender, surviving in the wild networks of Mannar.</p>
      <p>Remarkably, on <b>July 24, 2009</b> — exactly on the 8th anniversary of the Katunayake operation he had engineered — he slipped through Katunayake airport under an assumed passport to safe sanctuary overseas, baffling military intelligence.</p>

      <h2>4. Diaspora Exile and Final Departure</h2>
      <p>In France, he lived a spartan, underground existence denied basic status and medical care. Battling severe respiratory illness in isolation, Commander Vinayagam passed away as a martyr on <b>June 4, 2024</b> in Paris. His legacy is immortalized in Saanthi Nesakaram's monograph <i>"The Unswerving Arrow"</i>.</p>
    `,
  },
  "movement-structure": {
    slug: "movement-structure",
    titleTa: "பொட்டு அம்மானின் வரலாற்றை எழுதுவதற்கு சாந்தி நேசக்கரம் ஆகிய நான் யார்?",
    titleEn: "Who am I, Saanthi Nesakaram, to Write the History of Pottu Amman?",
    subtitleTa: "வானொலி ஊடகப் பயணம், கடிதத் தொடர்புகள் மற்றும் வன்னி நினைவுகளின் தொடர்",
    subtitleEn: "Memoirs of TamilWebRadio broadcasting, letters from Vanni, and historical meetings",
    coverImage: getSupabaseStorageUrl("blog", "saanthi-nesakaram-banner-1.webp"),
    categoryTa: "நினைவுக் குறிப்பு",
    categoryEn: "Personal Memoir",
    publishedAt: "2026-08-08",
    readingTimeMinutes: 12,
    authorTa: "சாந்தி நேசக்கரம்",
    authorEn: "Saanthi Nesakaram",
    relatedBookSlugs: ["arivaran-pottu-amman", "niraiyaa-peruveli", "uyiranai"],
    htmlContentTa: `
      <h2>1. ஊடகத் தொடக்கமும் இணைய வானொலியும்</h2>
      <p>1997 காலம் வானொலி, பத்திரிகைகள் போன்ற ஊடகங்களில் முழுமையாக மாவீரர்கள் பற்றிய பதிவுகள், நிகழ்ச்சிகள் வழியே இலக்கியமும் வானொலிப் பயணமும் ஆரம்பித்த காலம். 1999 மாவீரர் வாரத்தில் 'Tamilwebradio.com' என்ற இணைய வானொலியையும், 'தாய்மடி வாசம்' என்றொரு வலைப்பூவையும் ஆரம்பித்திருந்தேன். முதன்முதலில் இணைய வானொலியில் என் குரல் ஒலித்தது.</p>
      <p>இணையம் பற்றிய பெரியளவு அறிவோ தெளிவோ இல்லாத அந்த நேரம், யேர்மனி ஸ்ருட்காட் என்ற நகரில் இருந்து குமரன் என்ற தம்பியொருவன் அறிமுகமாகி தொழில்நுட்ப உதவிகளைச் செய்து தந்தான்.</p>

      <h2>2. வன்னியிலிருந்து வந்த அழைப்புகள்</h2>
      <p>2000ஆம் ஆண்டு ஆனையிறவு வெற்றிச் செய்தி வந்த இரவு, புதுக்குடியிருப்பில் இருந்து செய்மதித் தொலைபேசியில் அம்புறுஸ் அண்ணனின் அழைப்பு வந்தது. அன்று முதல் தினமும் ஈழநாதம் பத்திரிகை ஆசிரியர் தலையங்கமும், புலிகளின் குரல் வானொலிச் செய்திகளும் எனக்கு அனுப்பி வைக்கப்பட்டன. என் குழந்தைகள் அவரை 'செய்தி மாமா' என்றும், லெப். கேணல் அருணன் அவர்களை 'கடிதம் மாமா' என்றும் அன்புடன் அழைத்தனர்.</p>

      <h2>3. பொட்டு அம்மானின் நேரடிச் சந்திப்பு</h2>
      <p>2002 ஆம் ஆண்டு வன்னிக்குச் சென்றபோது, புதுக்குடியிருப்பில் ஒரு வீட்டில் காத்திருந்தேன். வரிச்சீருடையில் நல்ல உயரமான ஒருவர் சிரித்தபடி வெளியே வந்தார். அவரே புலனாய்வுத்துறைப் பொறுப்பாளர் பொட்டு அம்மான். 'வணக்கம் வாங்கோ... என்னை தெரியுதா?' என்று அன்போடு வரவேற்றார்.</p>
      <p>அம்மான் தனது குடும்பத்தின் மருமகள் என்ற அங்கீகாரத்தை எனக்கு வழங்கி, களஞ்சியத்தின் அரிய உட்சுற்று வரலாற்று நூல்களைத் தந்து வாசிக்கச் சொன்னார். அம்மான் அறிமுகப்படுத்திய மனிதர்களும் நூல்களுமே என்னை எழுத்தாளராகப் புடம்போட்டன.</p>
    `,
    htmlContentEn: `
      <h2>1. Media Origins and Internet Radio</h2>
      <p>In 1997, our literary and broadcast journey began with community radio and print publications commemorating the sacrifices of martyrs. By the 1999 Heroes Week, I inaugurated 'Tamilwebradio.com', one of the very earliest Tamil digital web radio stations, along with the literary blog 'Thaaimadi Vaasam'.</p>

      <h2>2. Calls and Correspondence from Vanni</h2>
      <p>Following the Elephant Pass victory in 2000, satellite phone calls began reaching our German bureau from Puthukkudiyiruppu in Vanni through Ambruse Annan. Daily editorials from the Eelanatham newspaper and Voice of Tigers bulletins arrived, which I voiced for audiences in Europe, Canada, and Australia.</p>

      <h2>3. Personal Meetings with Pottu Amman</h2>
      <p>During my visit to Vanni in 2002, I had the unforgettable privilege of meeting Intelligence Chief Pottu Amman. Welcoming me as family, he provided rare internal study monographs that elevated my journalistic vision and inspired my subsequent biographical works.</p>
    `,
  },
  "remembrance-memory": {
    slug: "remembrance-memory",
    titleTa: "தியாக தீபம் லெப். கேணல் திலீபனின் வாழ்க்கை வரலாறு",
    titleEn: "Biography of the Flame of Sacrifice, Lt. Col. Thileepan",
    subtitleTa: "அகிம்சை வழியில் 12 நாட்கள் உணவு, நீரின்றி ஆற்றிய உன்னத தியாகம்",
    subtitleEn: "The 12-day historic hunger strike without food or water in 1987",
    coverImage: getSupabaseStorageUrl("blog", "deelipan-widescreen.webp"),
    categoryTa: "தியாக வரலாறு",
    categoryEn: "Martyrdom History",
    publishedAt: "2026-08-05",
    readingTimeMinutes: 10,
    authorTa: "கவிஞர் வாஞ்சிநாதன்",
    authorEn: "Poet Vanchinathan",
    relatedBookSlugs: ["thileepanudan-12-naatkal", "thileepam", "varalatru-thalaivan"],
    htmlContentTa: `
      <h2>1. தியாக தீபத்தின் எழுச்சி</h2>
      <p>யாழ். மருத்துவக் கல்லூரி மாணவனாக இருந்து மக்கள் விடுதலைப் போராட்டத்தில் தன்னை இணைத்துக் கொண்டவர் பார்த்திபன் என்ற இயற்பெயர் கொண்ட லெப். கேணல் திலீபன். அவரது சொல்லாற்றலும், தூய அரசியல் நெறியும் யாழ்ப்பாணத்து மக்கள் மனங்களில் ஆழமாகப் பதிந்திருந்தன.</p>
      
      <h2>2. ஐந்து அம்சக் கோரிக்கைகள்</h2>
      <p>1987 செப்டம்பர் 15 அன்று யாழ். நல்லூர் கந்தசுவாமி கோவில் முன்றலில் திலீபன் சாகும் வரையிலான உண்ணாவிரதத்தைத் தொடங்கினார். ஐந்து நியாயமான கோரிக்கைகளை முன்வைத்து, ஒரு சொட்டு நீரும் அருந்தாமல் 12 நாட்கள் தொடர்ந்து தனது உடலை மெழுகுவர்த்தி போல உருக்கினார்.</p>

      <h2>3. உன்னத தியாகம்</h2>
      <p>செப்டம்பர் 26 அன்று திலீபனின் மூச்சு நின்றது. அவர் விட்டுச் சென்ற இறுதி வரிகள்: 'மக்கள் புரட்சி வெடிக்கட்டும், சுதந்திர தமிழீழம் மலரட்டும்!' இன்றும் உலகம் முழுவதும் வாழும் தமிழர்களின் தேசிய அடையாளமாக திலீபன் திகழ்கிறார்.</p>
    `,
    htmlContentEn: `
      <h2>1. The Rise of an Intellectual Warrior</h2>
      <p>Born Rasiah Parthiban, Lt. Col. Thileepan was a brilliant Jaffna medical student who joined the liberation movement and led the political wing with unmatched charisma and compassion.</p>

      <h2>2. The Five Demands at Nallur</h2>
      <p>On September 15, 1987, at the historic Nallur Kandaswamy temple courtyard in Jaffna, Thileepan commenced a fast-unto-death without taking even a single drop of water, putting forward five fundamental demands for the protection of Tamils.</p>

      <h2>3. The Supreme Sacrifice</h2>
      <p>On September 26, after twelve agonizing days, Thileepan breathed his last. His non-violent self-immolation remains one of the most powerful chapters in modern liberation history.</p>
    `,
  },
  "biography-workshop": {
    slug: "biography-workshop",
    titleTa: "தந்தையிடம் பிரபாகரன் கூறியது — மகன் பிரபாகரன் விளக்கம்",
    titleEn: "What Prabhakaran Told His Father — An Inspiring Dialogue",
    subtitleTa: "இளமைக் காலத்தில் தேசியத் தலைவரின் சிந்தனைகள் மற்றும் இலட்சிய உறுதி",
    subtitleEn: "Youthful reflections and ideological clarity of National Leader Prabhakaran",
    coverImage: getSupabaseStorageUrl("blog", "prabakaran-dad-banner.webp"),
    categoryTa: "வாழ்க்கை வரலாறு",
    categoryEn: "Biography",
    publishedAt: "2026-08-01",
    readingTimeMinutes: 7,
    authorTa: "பேரா.அறிவரசன்",
    authorEn: "Prof. Arivarasan",
    relatedBookSlugs: ["maamanithar-velupillai", "kanden-kanden", "tamileelam-viduthalai"],
    htmlContentTa: `
      <h2>அறவழியும் ஆயுதப் போராட்டமும்</h2>
      <p>“அப்பா! காந்தியடிகள் நல்லவர்; உயர்ந்தவர். அவர் மேற்கொண்ட அறவழிப் போராட்டங்களால் இந்தியாவுக்கு விடுதலை பெற முடிந்தது என்பதை நான் மறுக்கவில்லை. ஆனால் இந்தியச் சூழ்நிலை வேறு; இலங்கைச் சூழ்நிலை வேறு என்பதை நாம் எண்ணிப் பார்க்க வேண்டும்.”</p>
      <p>சிங்கள இனவெறி அரசால் தமிழர்கள் மீது தொடர்ந்து கட்டவிழ்த்து விடப்பட்ட படுகொலைகளுக்கு மத்தியில், அகிம்சை வழிகள் ஒடுக்கப்பட்ட போது இளைஞன் பிரபாகரன் தன் தந்தையிடம் முன்வைத்த தீர்க்கதரிசனமான வாதங்கள் இந்நூலில் ஆவணப்படுத்தப்பட்டுள்ளன.</p>
    `,
    htmlContentEn: `
      <h2>Non-Violence and the Inevitability of Armed Resistance</h2>
      <p>"Father! Mahatma Gandhi was a noble soul; I do not dispute that India gained freedom through non-violent agitation. But we must realize that India's political reality and Ceylon's brutal realities are fundamentally different."</p>
      <p>This historical work records the early conversations between young Prabhakaran and his father Velupillai, articulating the defense of human dignity against systematic state persecution.</p>
    `,
  },
  "language-national-literature": {
    slug: "language-national-literature",
    titleTa: "ஐயா! என் பெயர் தமிழ்ப் பெயர் தானே? தலைவர் கேட்டார்?",
    titleEn: "Sir! Isn't My Name a Tamil Name? The Leader Asked",
    subtitleTa: "மொழித் தூய்மையும் தேசியப் பற்றும் குறித்த சுவையான வரலாற்று உரையாடல்",
    subtitleEn: "A literary discussion on linguistic purity, identity, and Tamil pride",
    coverImage: getSupabaseStorageUrl("blog", "kanden-kanden-banner.webp"),
    categoryTa: "இலக்கிய உரையாடல்",
    categoryEn: "Literature & Language",
    publishedAt: "2026-07-28",
    readingTimeMinutes: 6,
    authorTa: "பேரா.அறிவரசன்",
    authorEn: "Prof. Arivarasan",
    relatedBookSlugs: ["kanden-kanden", "methagu-seyalmozhi", "purananooru-veeran"],
    htmlContentTa: `
      <h2>தமிழ்ப் பெயர்களும் தலைவரின் அக்கறையும்</h2>
      <p>பேராசிரியர் அறிவரசனிடம் தலைவர் பிரபாகரன் ஒருமுறை உரையாடும் போது, 'ஐயா! என் பெயர் தமிழ்ப் பெயர் தானே?' என்று கேட்டார். 'பிரபாகரன்' என்ற சொல் வடமொழி மூலமுடையதா என்று வினவிய தலைவர், தனது போராளிகளுக்குத் தூய தமிழ்ப் பெயர்களைச் சூட்டி மகிழ்ந்தவர்.</p>
      <p>தமிழ் மொழியின் செழுமையும், தமிழ் பெயர்களின் உன்னதமும் உலகெங்கும் வாழும் தமிழர்களின் பிள்ளைகளுக்குச் சென்றடைய வேண்டும் என்ற தலைவரின் சிந்தனைகள் இந்நூலில் விரிவாக விவரிக்கப்பட்டுள்ளன.</p>
    `,
    htmlContentEn: `
      <h2>Linguistic Heritage and National Identity</h2>
      <p>During a literary gathering with Professor Arivarasan, Prabhakaran enquired with great curiosity regarding Tamil naming traditions and linguistic roots. Deeply committed to preserving classical Tamil, he ensured that all freedom fighters and upcoming generations adopted pure Tamil names.</p>
    `,
  },
};

export function getArticleBySlug(slug: string): ArticleDetailData | undefined {
  return detailedArticles[slug];
}

export function getAllArticleSlugs(): string[] {
  return Object.keys(detailedArticles);
}
