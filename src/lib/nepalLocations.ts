export interface Municipality { name: string; }
export interface District { name: string; municipalities: string[]; }
export interface Province { name: string; districts: Record<string, string[]>; }

export const NEPAL_LOCATIONS: Record<string, Record<string, string[]>> = {
  'Koshi': {
    'Morang': ['Biratnagar', 'Belbari', 'Dhanpalthan', 'Kanepokhari', 'Kerabari', 'Letang', 'Pathari-Sanischare', 'Ratuwamai', 'Sundarharaia', 'Udayapurgadhi', 'Budhiganga', 'Dhanuwagar', 'Koshi-Haraia', 'Municipality'],
    'Sunsari': ['Inaruwa', 'Dharan', 'Itahari', 'Ramdhuni', 'Barju', 'Bhokraha', 'Ghodaghodi', 'Koshi', 'Sunsari-Dakshin', 'Duhabi-Bhaluwa'],
    'Jhapa': ['Bhadrapur', 'Birtamod', 'Buddhashanti', 'Damak', 'Jhapa', 'Kankai', 'Mechinagar', 'Mechinagar', 'Shivasataxi'],
    'Ilam': ['Ilam', 'Deumai', 'Mai', 'Maijogmai', 'Rong', 'Sandakpur', 'Suryodaya'],
    'Taplejung': ['Taplejung', 'Maiwakhola', 'Mikwakhola', 'Phungling', 'Sidingba'],
    'Panchthar': ['Phidim', 'Hilihang', 'Kummayak', 'Miklajung', 'Phalgunanda', 'Tumbetumba', 'Yangsijangha'],
    'Sankhuwasabha': ['Khandbari', 'Chainpur', 'Madi', 'Sabha', 'Bhotkhola', 'Chichila', 'Dingla', 'Huwakot', 'Makalu', 'Num'],
    'Solukhumbu': ['Salleri', 'Nechasalyan', 'Solududhkund', 'Likhupike', 'Sotang', 'Jasamba', 'Mahakulung', 'Mapya-Dudhkosi'],
    'Bhojpur': ['Bhojpur', 'Shadananda', 'Tyamke', 'Aamchowk', 'Hatuwagadhi', 'Ramprasad Rai', 'Salpa', 'Silichong'],
    'Dhankuta': ['Dhankuta', 'Pakhribas', 'Hile', 'Chhathar-Jitpur', 'Mahalaxmi', 'Sankhuwasabha', 'Sunsari', 'Teliya'],
    'Terhathum': ['Terhathum', 'Myanglung', 'Laligurash', 'Athrai', 'Phedap', 'Chhathar'],
    'Udayapur': ['Gaighat', 'Katari', 'Rampur', 'Belaka', 'Chaudandigadhi', 'Triyuga', 'Sunkoshi', 'Limchungbung'],
  },
  'Madhesh': {
    'Dhanusha': ['Janakpur', 'Dhanusadham', 'Mithila', 'Nagarain', 'Sabaila', 'Mithila Bihari', 'Hansapur', 'Chakraghatta', 'Kamala', 'Lakshminiwa', 'Mithilankur', 'Nagarain', 'Sahidnagar', 'Dhanusa'],
    'Mahottari': ['Jaleshwor', 'Bardibas', 'Loharpatti', 'Manara', 'Matihani', 'Pipra', 'Ramgopalpur', 'Sarpeshwar', 'Sonaama', 'Bauramai', 'Ekdanakhed', 'Gausala'],
    'Sarlahi': ['Lalbandi', 'Haripur', 'Barahathwa', 'Godaita', 'Kabilasi', 'Karmadanda', 'Malangwa', 'Bagmati', 'Chakraghatta', 'Dhankaul', 'Harwa', 'Ishworpur', 'Narasingh'],
    'Siraha': ['Siraha', 'Lahan', 'Mirchaiya', 'Sukhipur', 'Golbazar', 'Dhangadhimai', 'Kalyanpur', 'Karjanha', 'Nawarajpur', 'Bishnupur', 'Arnama', 'Asanpur', 'Lakshmminiwa', 'Sakhubhagawatipur'],
    'Bara': ['Kalaiya', 'Nijgadh', 'Simraungadh', 'Baragadhi', 'Bishwa', 'Karahiwa', 'Kolhabi', 'Maharajganj', 'Pacharauta', 'Pheta', 'Prasauni', 'Subarnapur', 'Suwarna', 'Adarshkotwal'],
    'Parsa': ['Birgunj', 'Bahudarmai', 'Jagarnathpur', 'Jirawal', 'Kalikamai', 'Pakahamai', 'Parsagadhi', 'Pheta', 'Sakhuwa-Praseni', 'Thori', 'Bindabasini', 'Birgunj-Metropolitan'],
    'Rautahat': ['Gaur', 'Chandranigahapur', 'Garuda', 'Yemunamai', 'Dewahiatahi', 'Fatuwa', 'Gadhimai', 'Guja', 'Katahariya', 'Maulapur', 'Paroha', 'Rajdevi', 'Rajpur', 'Snagamai'],
    'Saptari': ['Rajbiraj', 'Kanchanrup', 'Hanumannagar-Kankalini', 'Saptakoshi', 'Bishnupur', 'Bodebarsaien', 'Daknaha', 'Khanda', 'Mahadeva', 'Sambhunath', 'Shambhunath', 'Surunga', 'Tilathi-Koika', 'Tirahut'],
  },
  'Bagmati': {
    'Kathmandu': ['Kathmandu Metropolitan', 'Kirtipur', 'Tarakeshwor', 'Tokha', 'Budhanilkantha', 'Dakshinkali', 'Gokarneshwor', 'Chandragiri', 'Nagarjun', 'Shankharapur', 'Suryabinayak'],
    'Lalitpur': ['Lalitpur Metropolitan', 'Mahalaxmi', 'KaryaBinayak', 'Godawari', 'Konjyosom', 'Mahankal', 'Bagmati', 'Bhadrakali', 'Changunarayan', 'Lilikot', 'Sainbu', 'Sudal', 'Sunakothi', 'Thecho', 'Thuladurlung'],
    'Bhaktapur': ['Bhaktapur', 'Madhyapur Thimi', 'Suryabinayak', 'Changunarayan', 'Anantalingeshwor'],
    'Dhading': ['Nilkantha', 'Dhunibeshi', 'Gajuri', 'Galgaiya', 'Jwalamukhi', 'Khaniyabas', 'Netrawati-Dhobadi', 'Benighat-Rorang', 'Tripurasundari', 'Siddhalek', 'Thakre', 'Jogimara', 'Gangajamuna', 'Pangretar', 'Lapangang', 'Rubi-Valley'],
    'Nuwakot': ['Bidur', 'Belkotgadhi', 'Kakani', 'Likhu', 'Panchakanya', 'Suryagadhi', 'Tadi', 'Tarkeshwor', 'Kispang', 'Meghang', 'Myagang', 'Sunkanya', 'Dupcheshwor'],
    'Rasuwa': ['Rasuwa-Nagarpalika', 'Uttargaya', 'Kalika', 'Naukunda', 'Parbati-Kunda', 'Gosaikunda', 'Aamachhodingmo'],
    'Sindhupalchok': ['Chautara-Sangachokgadhi', 'Balephi', 'Bhotekoshi', 'Indrawati', 'Jugal', 'Liselang', 'Melamchi', 'Panchpokhari-Thangpal', 'Sunkoshi', 'Tripura-Sundari', 'Bahrabise'],
    'Kavrepalanchok': ['Dhulikhel', 'Banepa', 'Panauti', 'Panchkhal', 'Bhaktapur', 'Khanikhola', 'Mandandeupur', 'Namobuddha', 'Sarasyunkharka', 'Temal', 'ChauriDeurali', 'Koshidekha', 'Mahabharat', 'Roshi', 'Bethanchowk'],
    'Sindhuli': ['Sindhulimadi', 'Kamalamai', 'Dudhauli', 'Golanjor', 'Hariharpurgadhi', 'Marin', 'Sunkoshi', 'Tinpatan', 'Ghyanglekha', 'Bhadrakali', 'Fikkal'],
    'Ramechhap': ['Manthali', 'Doramba', 'Gokulganga', 'Khimilekhu', 'Likhu-Tamakoshi', 'Ramechhap', 'Sunapati', 'Khandadevi', 'Sarbakot', 'Sunkoshi', 'Umakunda'],
    'Dolakha': ['Bhimeshwor', 'Jiri', 'Shailungeshwor', 'Tamakoshi', 'Bigu', 'Kalika', 'Lamabagar-Melung', 'Gaurishankar', 'Bayu', 'Baiteshwor'],
    'Chitwan': ['Bharatpur', 'Kalika', 'Khairahan', 'Madi', 'Ratnanagar', 'Ichchhakamana', 'Bharatpur-Metropolitan'],
    'Makwanpur': ['Hetauda', 'Bhimphedi', 'Kailash', 'Manahari', 'Thaha', 'Bakaiya', 'Bagmati', 'Chitlang', 'Daman', 'Gogane', 'Indrasarowar', 'Kankada', 'Markhu', 'Raksirang', 'Sarikhet', 'Sisneri'],
  },
  'Gandaki': {
    'Kaski': ['Pokhara', 'Annapurna', 'Madi', 'Machhapuchchhre', 'Rupa', 'Pokhara-Lekhnath'],
    'Syangja': ['Putalibazar', 'Waling', 'Galyang', 'Biruwa', 'Arjunchaupari', 'Bhirkot', 'Chapakot', 'Kaligandaki', 'Kwarenasi', 'Phedikhola', 'Alamdevi', 'Aandhikhola', 'Bhadrakali', 'Chhatreswori', 'Harinas'],
    'Tanahu': ['Byas', 'Bhanu', 'Anbukhaireni', 'Bandipur', 'Devaghat', 'Ghiring', 'Myagde', 'Rishing', 'Shuklagandaki', 'Vyas', 'Bhirkot'],
    'Lamjung': ['Besishahar', 'Dudhpokhari', 'Kwholasothar', 'Marsyangdi', 'Rainas', 'Sundarbazar', 'Kirtipur', 'Madhya Nepal', 'Duradanda'],
    'Gorkha': ['Gorkha', 'Palungtar', 'Lamjung', 'Arughat', 'Bhimsen', 'Chumnubri', 'Gandaki', 'Dharche', 'Sulikot', 'Siranchowk', 'Aarughat', 'Bhimsen-Thumka'],
    'Nawalpur': ['Gaindakot', 'Kawasoti', 'Binayi-Triveni', 'Bulingtar', 'Devchuli', 'Madhyabindu', 'Hekuli', 'Sarawal'],
    'Parbat': ['Kushma', 'Jaljala', 'Falebas', 'Mahashila', 'Modi', 'Phalebas', 'Bahakimundali', 'Kusma-Baglung'],
    'Baglung': ['Baglung', 'Dhorpatan', 'Galkot', 'Jaimuni', 'Katikhanda', 'Nisikhola', 'Barekot', 'Bihadi', 'Dudhola', 'Gharabhanjyang', 'Heklang', 'Pang', 'Tarakapuri'],
    'Myagdi': ['Beni', 'Annapurna', 'Dhaulagiri', 'Mangala', 'Raghuganga', 'Rukumkot', 'Bhagawati-Gandaki'],
    'Manang': ['Chame', 'Nashyang', 'Narpani', 'Annapurna', 'Bhote-Narpani', 'Manang-Nyasyang'],
    'Mustang': ['Jomsom', 'Gharapjhong', 'Lo-Manthang', 'Barhagaun-Muktikshetra', 'Dalome', 'Ghasa-Phalyek'],
  },
  'Lumbini': {
    'Rupandehi': ['Bhairahawa', 'Butwal', 'Siddharthanagar', 'Devdaha', 'Lumbini-Sanskritik', 'Sainamaina', 'Tillotama', 'Gaidahawa', 'Kanchan', 'Kotahimai', 'Marchawari', 'Mayadevi', 'Omsatiya', 'Rohini', 'Sammarimai', 'Suddhodhan'],
    'Kapilvastu': ['Kapilvastu', 'Banaganga', 'Buddhabhumi', 'Krishnanagar', 'Maharajganj', 'Shivaraj', 'Banganga', 'Bijayanagar', 'Jaynagar-Mandhata', 'Mayadevi', 'Shibharaj', 'Yashodhara'],
    'Palpa': ['Tansen', 'Rampur', 'Rani-Neuwa', 'Tinau', 'Ribdikot', 'Bagnaskali', 'Bhairabi-Thansingh', 'Madi', 'Nisdi', 'Purbakhola', 'Rampur-Nisdi'],
    'Gulmi': ['Resunga', 'Ruru', 'Chandrakot', 'Dhurkot', 'Gulmidarbar', 'Isma', 'Kaligandaki', 'Madane', 'Malika', 'Maldhung', 'Satyawati', 'Tamghas', 'Baithadada', 'Baadigau'],
    'Arghakhanchi': ['Sandhikharka', 'Argha', 'Malarani', 'Panini', 'Pathariya', 'Chhatragadhi', 'Sitganga', 'Sita-Pokhari'],
    'Pyuthan': ['Pyuthan', 'Mandavi', 'Naubahini', 'Naya-Gaun', 'Swargadwari', 'Mallika', 'Mallarani', 'Jhim-Rukum'],
    'Rolpa': ['Liwang', 'Rolpa', 'Suwarnabani', 'Thawang', 'Jelwang', 'Madi', 'Runtigadhi', 'Sunchhahari', 'Tribeni', 'Pariwartan', 'Koti-Bahundanda'],
    'Rukum-East': ['Putha Uttarganga', 'Sisne', 'Bhume', 'Kol', 'Putha-Uttarganga'],
    'Rukum-West': ['Musikot', 'Chaurjhari', 'Tribeni', 'Banfikot', 'Bafikot', 'Sani-Bheri', 'Aathbis-Kot', 'Aathbis-Dandaparbat'],
    'Dang': ['Ghorahi', 'Tulsipur', 'Rapti', 'Lamahi', 'Bangalachuli', 'Babai', 'Gadhawa', 'Rajpur', 'Shantinagar', 'Sahid-Nagar', 'Banglachuli', 'Bhalubang-Bijauri'],
    'Banke': ['Nepalgunj', 'Kohalpur', 'Duduwa', 'Narainapur', 'Rapti-Sonari', 'Baijanath', 'Baijanath-Rapti', 'Jaispur'],
    'Bardiya': ['Gulariya', 'Rajapur', 'Thakurbaba', 'Bansgadhi', 'Barbardiya', 'Bargada-Beldanda', 'Geruwa', 'Madhuwan', 'Surya-Binayak'],
    'Salyan': ['Salyan', 'Bangad-Kupandaha', 'Chhatreshwori', 'Kapra', 'Kumakh-Kalagaun', 'Siddhakumakh', 'Tribeni', 'Bagchaur', 'Darma', 'Kalaha-Chheda'],
  },
  'Karnali': {
    'Jumla': ['Chandannath', 'Tatopani', 'Guthichaur', 'Hima', 'Kanakasundari', 'Patanshali-Sija', 'Sinja', 'Tila-Khadka'],
    'Kalikot': ['Khandachakra', 'Chhededaha', 'Pahalimanka', 'Sanni-Triveni', 'Tila-Khadga', 'Raskot', 'Naraha-Maharani'],
    'Mugu': ['Chhayanath-Rara', 'Khatyad', 'Mugu-Karnali', 'Soru', 'Chhayanath-Rara'],
    'Humla': ['Simikot', 'Chankheli', 'Kharpunath', 'Namkha', 'Sarkegadhi', 'Tanjakot'],
    'Dolpa': ['Thuli-Bheri', 'Tripurasundari', 'She-Phoksundo', 'Chharka-Tangsong', 'Dolpo-Buddha', 'Jagadulla', 'Kaike', 'Mudkechula', 'Bhijedodar'],
    'Jajarkot': ['Barekot', 'Bheri', 'Junichande', 'Kushe', 'Shila', 'Tribeni-Nalagadhi', 'Nayakbada', 'Jajarkot', 'Dhakwaphedi'],
    'Surkhet': ['Birendranagar', 'Gurbhakot', 'Panchapuri', 'Lekbeshi', 'Taranga', 'Chaukune', 'Simta', 'Bheriganga'],
  },
  'Sudurpashchim': {
    'Kailali': ['Dhangadhi', 'Tikapur', 'Lamki-Chuha', 'Bardagoriya', 'Bhajani', 'Chure', 'Gauriganga', 'Godawari', 'Gauriphanta', 'Janaki', 'Kailari', 'Mohanyal', 'Narayanpur', 'Pahalmanapur', 'Pawera', 'Purana-Mahuli', 'Tikapur'],
    'Kanchanpur': ['Bheemdatta', 'Mahendranagar', 'Belauri', 'Bhimdatta', 'Daijee', 'Dekhatbhuli', 'Krishnapur', 'Laljodi', 'Mahakali', 'Pipariya', 'Raikawar-Bichawa', 'Rautale-Bichawa', 'Sankarpur', 'Suda', 'Belauri'],
    'Doti': ['Dipayal-Silgadhi', 'Adarsha', 'Badikedar', 'Barpata', 'Bogtan-Farmes', 'Dipayal-Silgadhi', 'Puchchadi', 'Sayal', 'Shikhar-Nagar', 'K.I.Singh'],
    'Achham': ['Mangalsen', 'Kamalbazar', 'Banarjhola', 'Chaurpati', 'Janalika', 'Mallekh', 'Ramroshan', 'Turmakhad', 'Bannagadhi', 'Jayaprithvi'],
    'Darchula': ['Darchula', 'Mahakali', 'Lekam', 'Malikaarjun', 'Naugad', 'Shailyashikhar', 'Apihimal', 'Ghusa-Vidiyakot', 'Marma-Chamelikhab'],
    'Baitadi': ['Dasharathchanda', 'Patan', 'Melauli', 'Purchaudi', 'Shivanagar', 'Sigas', 'Surnaya', 'Dilasili', 'Durgabhagawati', 'Ganeshpur', 'Pancheshwor', 'Sitasaria', 'Changunarayan'],
    'Dadeldhura': ['Dadeldhura', 'Amargadhi', 'Bhageshwar', 'Bhageshwar-Nagarpalika', 'Ganeshpur', 'Nawadurga', 'Parashuram-Kotdada'],
    'Bajhang': ['Chainpur', 'Jayaprithvi', 'Bithad-Chiner', 'Chabispathivera', 'Durgathali', 'Jayabageshwar', 'Kanda', 'Khaptad-Chhededaha', 'Masta', 'Ranikhola', 'Saipal', 'Surma', 'Thalara'],
    'Bajura': ['Martadi', 'Badimalika', 'Budhinanda', 'Gaugoda', 'Himali', 'Jagannath', 'Kanaka-Sundari', 'Khaptad-Lekha', 'Swa-Mi-Karna-Li', 'Tribeni-Nalagadhi', 'Triveni'],
  },
};

export const PROVINCES = Object.keys(NEPAL_LOCATIONS);

export function getDistricts(province: string): string[] {
  return province ? Object.keys(NEPAL_LOCATIONS[province] || {}) : [];
}

export function getMunicipalities(province: string, district: string): string[] {
  return (province && district) ? (NEPAL_LOCATIONS[province]?.[district] || []) : [];
}
