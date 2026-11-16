// Podaci o Suncu, planetama i stanici.
//
// SKALIRANJE (vazna napomena): rastojanja (distanceAU) su medjusobno realno
// srazmerna - isti odnos kao u stvarnosti (Neptun je npr. ~30x dalje od Sunca
// nego Merkur). Velicine (radius) NISU realno srazmerne rastojanjima - da jesu,
// planete bi pri pogledu na ceo sistem bile manje od jednog piksela i potpuno
// nevidljive (upravo to je i realan fizicki problem: u stvarnosti bi sa te
// udaljenosti planete zaista bile nevidljive tacke). Zato su ovde velicine
// planeta vizuelno uvecane ("not to scale"), dok su medjusobni odnosi velicina
// planeta i dalje priblizno tacni (Jupiter je i dalje ubedljivo najveci, Merkur
// najmanji itd). Ovo je standardna praksa u svim interaktivnim prikazima
// Suncevog sistema (npr. NASA "Eyes on the Solar System" ima poseban prekidac
// "Real Size" / "Not to Scale" iz istog razloga).

export const SUN = {
  key: 'sun',
  name: 'Sunce',
  texture: 'static/textures/sun.jpg',
  radius: 4.2,
  info: 'Sunce je zvezda u centru naseg sistema i cini oko 99,8% ukupne mase Suncevog sistema. Njegova energija nastaje nuklearnom fuzijom vodonika u helijum, a povrsinska temperatura iznosi oko 5.500°C. Svetlost sa Sunca putuje do Zemlje oko 8 minuta.'
};

export const MILKY_WAY_TEXTURE = 'static/textures/milky_way.jpg';
export const MOON_TEXTURE = 'static/textures/moon.jpg';

export const DIST_SCALE = 20;      // 1 AU -> koliko scenskih jedinica
export const BASE_PERIOD_SECONDS = 20; // koliko sekundi traje jedna "Zemljina godina" pri brzini 1x
export const MOON_BASE_SECONDS = 20;   // koliko sekundi traje jedna puna "meseceva" revolucija (baza)

export const PLANETS = [
  {
    key: 'mercury',
    name: 'Merkur',
    texture: 'static/textures/mercury.jpg',
    radius: 0.7,
    distanceAU: 0.39,
    periodYears: 0.241,
    spinSeconds: 9,
    info: 'Najbliza planeta Suncu i najmanja planeta u sistemu. Nema atmosferu koja bi ublazila temperaturne razlike, pa povrsina danju dostize oko 430°C, a nocu pada i do -180°C. Jedna Merkurova godina traje samo 88 zemaljskih dana. Nema nijedan mesec.'
  },
  {
    key: 'venus',
    name: 'Venera',
    texture: 'static/textures/venus_surface.jpg',
    atmosphereTexture: 'static/textures/venus_atmosphere.jpg',
    radius: 1.1,
    distanceAU: 0.72,
    periodYears: 0.615,
    spinSeconds: -40, // retrogradna (suprotna) rotacija, veoma spora
    info: 'Najtoplija planeta u Suncevom sistemu (oko 470°C) zbog gustog omotaca ugljen-dioksida i izrazenog efekta staklene baste. Rotira u suprotnom smeru od vecine planeta i sporije se okrece oko svoje ose nego oko Sunca. Nema mesec. Povrsina (radarski snimak) vidi se ispod gustog sloja oblaka.'
  },
  {
    key: 'earth',
    name: 'Zemlja',
    texture: 'static/textures/earth_daymap.jpg',
    nightTexture: 'static/textures/earth_nightmap.jpg',
    cloudsTexture: 'static/textures/earth_clouds.jpg',
    radius: 1.15,
    distanceAU: 1.0,
    periodYears: 1.0,
    spinSeconds: 6,
    info: 'Jedina do sada poznata planeta sa zivotom, sa vodom u tecnom stanju i atmosferom bogatom kiseonikom. Ima jedan prirodni satelit, Mesec, koji stabilizuje nagib Zemljine ose. Jedna godina traje 365,25 dana.',
    moons: [{ name: 'Mesec', radiusFactor: 0.32, distanceFactor: 2.8, periodSeconds: 12 }]
  },
  {
    key: 'mars',
    name: 'Mars',
    texture: 'static/textures/mars.jpg',
    radius: 0.85,
    distanceAU: 1.52,
    periodYears: 1.881,
    spinSeconds: 6.2,
    info: 'Poznat kao "Crvena planeta" zbog gvozdje-oksida (rdje) u tlu. Na Marsu se nalazi Olympus Mons, najvisi poznati vulkan u Suncevom sistemu. Ima dva mala meseca, Fobos i Dejmos.',
    moons: [
      { name: 'Fobos', radiusFactor: 0.14, distanceFactor: 1.9, periodSeconds: 3, colorTint: 0xb0a89c },
      { name: 'Dejmos', radiusFactor: 0.1, distanceFactor: 2.6, periodSeconds: 5, colorTint: 0xb0a89c }
    ]
  },
  {
    key: 'jupiter',
    name: 'Jupiter',
    texture: 'static/textures/jupiter.jpg',
    radius: 4.2,
    distanceAU: 5.2,
    periodYears: 11.86,
    spinSeconds: 2.4,
    info: 'Najveca planeta u sistemu, gasoviti div cija je masa veca od masa svih ostalih planeta zajedno. Poznat je po Velikoj crvenoj pegi, oluji koja besni vec vekovima, i ima preko 90 poznatih meseci.',
    moons: [
      { name: 'Io', radiusFactor: 0.11, distanceFactor: 1.55, periodSeconds: 4, colorTint: 0xf3e2a0 },
      { name: 'Evropa', radiusFactor: 0.1, distanceFactor: 1.85, periodSeconds: 6, colorTint: 0xe9d9c2 },
      { name: 'Ganimed', radiusFactor: 0.16, distanceFactor: 2.25, periodSeconds: 8, colorTint: 0xc9bfae },
      { name: 'Kalisto', radiusFactor: 0.15, distanceFactor: 2.7, periodSeconds: 11, colorTint: 0x9b9184 }
    ]
  },
  {
    key: 'saturn',
    name: 'Saturn',
    texture: 'static/textures/saturn.jpg',
    ringTexture: 'static/textures/saturn_ring_alpha.jpg',
    radius: 3.6,
    distanceAU: 9.58,
    periodYears: 29.46,
    spinSeconds: 2.6,
    hasRing: true,
    info: 'Prepoznatljiv po upecatljivom sistemu prstenova sacinjenih od leda i stena. Najmanje je gusta planeta u sistemu - kada bi postojao dovoljno veliki okean, Saturn bi na njemu plutao. Ima preko 140 poznatih meseci.',
    moons: [{ name: 'Titan', radiusFactor: 0.18, distanceFactor: 2.2, periodSeconds: 9, colorTint: 0xd7b978 }]
  },
  {
    key: 'uranus',
    name: 'Uran',
    texture: 'static/textures/uranus.jpg',
    radius: 2.1,
    distanceAU: 19.2,
    periodYears: 84.01,
    spinSeconds: -4.5,
    info: 'Ledeni div koji rotira gotovo "na boku" jer mu je osa nagnuta oko 98 stepeni. Plavo-zelenu boju duguje metanu u atmosferi. Ima slabo vidljive prstenove i 27 poznatih meseci.',
    moons: [{ name: 'Titanija', radiusFactor: 0.14, distanceFactor: 2.1, periodSeconds: 7, colorTint: 0xb7c6c9 }]
  },
  {
    key: 'neptune',
    name: 'Neptun',
    texture: 'static/textures/neptune.jpg',
    radius: 2.0,
    distanceAU: 30.05,
    periodYears: 164.8,
    spinSeconds: 4.8,
    info: 'Najudaljenija planeta od Sunca, poznata po najjacim vetrovima u Suncevom sistemu koji dostizu i do 2.100 km/h. Ime je dobila po rimskom bogu mora, u skladu sa svojom intenzivno plavom bojom.',
    moons: [{ name: 'Triton', radiusFactor: 0.13, distanceFactor: 2.0, periodSeconds: -6, colorTint: 0xcfd8e6 }]
  }
];

// Patuljaste planete. Pluton trenutno nema pravu teksturu (nije poslata),
// pa se za njega generise privremena tekstura (texture: null => solarSystem.js
// koristi proceduralnu zamenu) - lako se zamenjuje pravom slikom kasnije.
export const DWARF_PLANETS = [
  {
    key: 'ceres',
    name: 'Cerera',
    texture: 'static/textures/ceres.jpg',
    radius: 0.4,
    distanceAU: 2.3,
    periodYears: 4.6,
    spinSeconds: 5,
    info: 'Cerera je najveca i jedina patuljasta planeta u glavnom pojasu asteroida, izmedju Marsa i Jupitera. Cini oko trecine ukupne mase citavog pojasa asteroida. Nema poznatih prirodnih satelita.'
  },
  {
    key: 'pluto',
    name: 'Pluton',
    texture: null, // privremena tekstura dok se ne posalje prava slika Plutona
    radius: 0.55,
    distanceAU: 39.5,
    periodYears: 248,
    spinSeconds: 6.4,
    info: 'Nekada smatran devetom planetom, Pluton je od 2006. godine klasifikovan kao patuljasta planeta. Nalazi se u Kajperovom pojasu, ledenoj oblasti iza Neptuna. Ima pet poznatih meseca - najveci, Haron, je toliko velik da Pluton i Haron zapravo kruze jedno oko drugog oko zajednicke tacke.',
    moons: [
      { name: 'Haron', radiusFactor: 0.45, distanceFactor: 2.6, periodSeconds: 8, colorTint: 0xb8ada2 },
      { name: 'Niks', radiusFactor: 0.08, distanceFactor: 3.6, periodSeconds: 4, colorTint: 0xcfc7bd },
      { name: 'Hidra', radiusFactor: 0.09, distanceFactor: 4.2, periodSeconds: 5, colorTint: 0xcfc7bd }
    ]
  },
  {
    key: 'haumea',
    name: 'Haumea',
    texture: 'static/textures/haumea.jpg',
    radius: 0.5,
    distanceAU: 43.13,
    periodYears: 284,
    spinSeconds: 1.6, // Haumea se stvarno vrti izuzetno brzo (~4h) - najbrza poznata veca planeta/patuljasta planeta
    squashed: true,   // Haumea ima izduzen, jajolik oblik zbog brze rotacije
    info: 'Haumea je patuljasta planeta u Kajperovom pojasu, prepoznatljiva po izduzenom, jajolikom obliku - posledica izuzetno brze rotacije (jedan "dan" traje samo oko 4 sata, najbrze od svih poznatih vecih tela u Suncevom sistemu). Ima dva poznata meseca, Hiaku i Namaku.',
    moons: [
      { name: 'Hiaka', radiusFactor: 0.22, distanceFactor: 2.4, periodSeconds: 6, colorTint: 0xd8dde0 },
      { name: 'Namaka', radiusFactor: 0.14, distanceFactor: 1.8, periodSeconds: 4, colorTint: 0xd8dde0 }
    ]
  },
  {
    key: 'makemake',
    name: 'Makemake',
    texture: 'static/textures/makemake.jpg',
    radius: 0.48,
    distanceAU: 45.79,
    periodYears: 305,
    spinSeconds: 7.8,
    info: 'Treca po velicini patuljasta planeta u Kajperovom pojasu, dobila je ime po bogu plodnosti sa Uskrsnjeg ostrva. Povrsina joj je prekrivena zaledjenim metanom i etanom, sto joj daje crvenkasto-braon boju. Ima jedan mali, tamni mesec.',
    moons: [{ name: 'MK 2', radiusFactor: 0.1, distanceFactor: 2.2, periodSeconds: 5, colorTint: 0x5a5450 }]
  },
  {
    key: 'eris',
    name: 'Eris',
    texture: 'static/textures/eris.jpg',
    radius: 0.53,
    distanceAU: 67.78,
    periodYears: 557,
    spinSeconds: 5.6,
    info: 'Eris je jedna od najmasivnijih poznatih patuljastih planeta - njeno otkrice 2005. godine direktno je pokrenulo raspravu koja je dovela do toga da Pluton izgubi status planete. Nalazi se u rasejanom disku, dalje od glavnog Kajperovog pojasa. Ima jedan poznati mesec, Dizmoniju.',
    moons: [{ name: 'Dizmonija', radiusFactor: 0.18, distanceFactor: 2.3, periodSeconds: 6, colorTint: 0xc9c9d2 }]
  }
];
export const STATION = {
  key: 'station',
  name: 'Svemirska stanica',
  distanceAU: 2.7,
  periodYears: 4.44,
  info: 'Orbitalna svemirska stanica smestena u pojasu asteroida, izmedju Marsa i Jupitera. Sluzi kao istrazivacka i osmatracka platforma za nadzor unutrasnjih i spoljasnjih planeta Suncevog sistema, kao i tranzitna tacka za dalje misije.'
};

