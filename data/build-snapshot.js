#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function p(id, name, country, rank, rankPrev, extra) {
  extra = extra || {};
  return Object.assign(
    { id, name, country, rank, rankPrev: rankPrev == null ? rank : rankPrev },
    extra
  );
}

const players = {};
function add(list) {
  for (const x of list) players[x.id] = x;
}

add([
  p("zverev", "Alexander Zverev", "GER", 1, 3, { seed: 1 }),
  p("sonego", "Lorenzo Sonego", "ITA", 44, 41),
  p("halys", "Quentin Halys", "FRA", 61, 70, { dirBoost: true }),
  p("diaz-acosta", "Facundo Diaz Acosta", "ARG", 92, 88),
  p("dimitrov", "Grigor Dimitrov", "BUL", 19, 16, { qualifier: true }),
  p("popyrin", "Alexei Popyrin", "AUS", 27, 25),
  p("hanfmann", "Yannick Hanfmann", "GER", 85, 90),
  p("tabilo", "Alejandro Tabilo", "CHI", 32, 28, { seed: 25 }),
  p("darderi", "Luciano Darderi", "ITA", 24, 30, { seed: 21 }),
  p("wendelken", "Harry Wendelken", "GBR", 210, 240, { qualifier: true }),
  p("svrcina", "Dalibor Svrcina", "CZE", 88, 110, { qualifier: true }),
  p("royer", "Valentin Royer", "FRA", 71, 75),
  p("sweeny", "Dane Sweeny", "AUS", 180, 175, { wc: true }),
  p("moutet", "Corentin Moutet", "FRA", 59, 62),
  p("fery", "Arthur Fery", "GBR", 155, 160),
  p("musetti", "Lorenzo Musetti", "ITA", 9, 8, { seed: 13 }),
  p("jodar", "Rafael Jodar", "ESP", 42, 55, { seed: 12 }),
  p("kokkinakis", "Thanasi Kokkinakis", "AUS", 77, 80),
  p("marozsan", "Fabian Marozsan", "HUN", 54, 50),
  p("m-zheng", "Michael Zheng", "USA", 168, 200, { wc: true }),
  p("svajda", "Zachary Svajda", "USA", 99, 105),
  p("altmaier", "Daniel Altmaier", "GER", 58, 52),
  p("jm-cerundolo", "Juan Manuel Cerundolo", "ARG", 86, 84),
  p("gea", "Arthur Gea", "FRA", 142, 150, { luckyLoser: true }),
  p("bergs", "Zizou Bergs", "BEL", 41, 45, { seed: 31 }),
  p("taberner", "Carlos Taberner", "ESP", 118, 125),
  p("dejong", "Jesper De Jong", "NED", 81, 79),
  p("passaro", "Francesco Passaro", "ITA", 95, 98),
  p("choinski", "Jan Choinski", "GBR", 140, 148),
  p("bvd", "Botic van de Zandschulp", "NED", 67, 60),
  p("guerrieri", "Andrea Guerrieri", "ITA", 190, 210),
  p("deminaur", "Alex de Minaur", "AUS", 8, 7, { seed: 6 }),
  p("faa", "Felix Auger-Aliassime", "CAN", 5, 10, { seed: 3 }),
  p("hijikata", "Rinky Hijikata", "AUS", 84, 82),
  p("burruchaga", "Roman Andres Burruchaga", "ARG", 108, 115),
  p("khachanov", "Karen Khachanov", "RUS", 17, 18),
  p("molcan", "Alex Molcan", "SVK", 112, 108),
  p("bonzi", "Benjamin Bonzi", "FRA", 63, 66),
  p("giron", "Marcos Giron", "USA", 46, 48),
  p("buse", "Ignacio Buse", "PER", 74, 95, { seed: 32 }),
  p("mensik", "Jakub Mensik", "CZE", 15, 21, { seed: 17 }),
  p("mochizuki", "Shintaro Mochizuki", "JPN", 102, 99),
  p("rodionov", "Jurij Rodionov", "AUT", 120, 118),
  p("gmp", "Giovanni Mpetshi Perricard", "FRA", 36, 33),
  p("vallejo", "Adolfo Daniel Vallejo", "PAR", 134, 140),
  p("monfils", "Gael Monfils", "FRA", 53, 40, { wc: true }),
  p("borges", "Nuno Borges", "POR", 45, 47),
  p("tien", "Learner Tien", "USA", 14, 22, { seed: 14 }),
  p("fritz", "Taylor Fritz", "USA", 4, 4, { seed: 9 }),
  p("blanch", "Darwin Blanch", "USA", 176, 190, { wc: true }),
  p("bellucci", "Mattia Bellucci", "ITA", 68, 72),
  p("piros", "Zsombor Piros", "HUN", 128, 130),
  p("carabelli", "Camilo Ugo Carabelli", "ARG", 49, 51),
  p("struff", "Jan-Lennard Struff", "GER", 56, 54),
  p("misolic", "Filip Misolic", "AUT", 96, 101),
  p("f-cerundolo", "Francisco Cerundolo", "ARG", 20, 19, { seed: 24 }),
  p("blockx", "Alexander Blockx", "BEL", 38, 49, { seed: 28 }),
  p("barrios", "Tomas Barrios Vera", "CHI", 109, 112),
  p("shang", "Juncheng Shang", "CHN", 73, 65),
  p("trungelliti", "Marco Trungelliti", "ARG", 132, 128),
  p("basavareddy", "Nishesh Basavareddy", "USA", 89, 93),
  p("schoolkate", "Tristan Schoolkate", "AUS", 97, 100),
  p("comesana", "Francisco Comesana", "ARG", 62, 58),
  p("cobolli", "Flavio Cobolli", "ITA", 6, 9, { seed: 5 }),
  p("medvedev", "Daniil Medvedev", "RUS", 8, 6, { seed: 7 }),
  p("gaston", "Hugo Gaston", "FRA", 88, 91, { qualifier: true }),
  p("gorzny", "Sebastian Gorzny", "USA", 220, 250, { wc: true }),
  p("collignon", "Raphael Collignon", "BEL", 91, 94),
  p("munar", "Jaume Munar", "ESP", 55, 57),
  p("atmane", "Terence Atmane", "FRA", 90, 86),
  p("rinderknech", "Arthur Rinderknech", "FRA", 29, 34, { seed: 26 }),
  p("shimabukuro", "Sho Shimabukuro", "JPN", 87, 85),
  p("vacherot", "Valentin Vacherot", "MON", 26, 40, { seed: 22 }),
  p("kovacevic", "Aleksandar Kovacevic", "USA", 75, 78),
  p("majchrzak", "Kamil Majchrzak", "POL", 72, 76),
  p("medjedovic", "Hamad Medjedovic", "SRB", 78, 71),
  p("vukic", "Aleksandar Vukic", "AUS", 80, 77),
  p("sakamoto", "Rei Sakamoto", "JPN", 125, 140),
  p("damm", "Martin Damm Jr", "USA", 104, 108),
  p("tiafoe", "Frances Tiafoe", "USA", 11, 14, { seed: 11 }),
  p("nakashima", "Brandon Nakashima", "USA", 18, 20, { seed: 16 }),
  p("baez", "Sebastian Baez", "ARG", 43, 38),
  p("michelsen", "Alex Michelsen", "USA", 34, 36),
  p("cina", "Federico Cina", "ITA", 150, 155),
  p("merida", "Daniel Merida", "ESP", 39, 48),
  p("fucsovics", "Marton Fucsovics", "HUN", 121, 110),
  p("virtanen", "Otto Virtanen", "FIN", 98, 102, { luckyLoser: true }),
  p("rublev", "Andrey Rublev", "RUS", 13, 10, { seed: 23 }),
  p("etcheverry", "Tomas Martin Etcheverry", "ARG", 31, 35, { seed: 27 }),
  p("kopriva", "Vit Kopriva", "CZE", 69, 73),
  p("landaluce", "Martin Landaluce", "ESP", 83, 89),
  p("fearnley", "Jacob Fearnley", "GBR", 60, 55),
  p("berrettini", "Matteo Berrettini", "ITA", 28, 24),
  p("wawrinka", "Stan Wawrinka", "SUI", 152, 140, { wc: true }),
  p("navone", "Mariano Navone", "ARG", 48, 54),
  p("djokovic", "Novak Djokovic", "SRB", 5, 4, { seed: 4 }),
  p("shelton", "Ben Shelton", "USA", 7, 6, { seed: 8 }),
  p("griekspoor", "Tallon Griekspoor", "NED", 33, 31),
  p("dzumhur", "Damir Dzumhur", "BIH", 70, 68),
  p("hurkacz", "Hubert Hurkacz", "POL", 22, 17),
  p("shapovalov", "Denis Shapovalov", "CAN", 47, 53),
  p("kecmanovic", "Miomir Kecmanovic", "SRB", 64, 61),
  p("vanassche", "Luca Van Assche", "FRA", 40, 46),
  p("norrie", "Cameron Norrie", "GBR", 33, 29, { seed: 29 }),
  p("lehecka", "Jiri Lehecka", "CZE", 19, 23, { seed: 18 }),
  p("carreno", "Pablo Carreno Busta", "ESP", 66, 64),
  p("samuel", "Toby Samuel", "GBR", 110, 130),
  p("machac", "Tomas Machac", "CZE", 58, 50),
  p("harris", "Lloyd Harris", "RSA", 139, 145),
  p("kennedy", "Jack Kennedy", "USA", 386, 400, { wc: true }),
  p("tsitsipas", "Stefanos Tsitsipas", "GRE", 12, 11),
  p("fils", "Arthur Fils", "FRA", 10, 15, { seed: 10 }),
  p("bublik", "Alexander Bublik", "KAZ", 16, 18, { seed: 15 }),
  p("wolf", "J.J. Wolf", "USA", 248, 220, { wc: true }),
  p("tirante", "Thiago Agustin Tirante", "ARG", 82, 87),
  p("mannarino", "Adrian Mannarino", "FRA", 93, 90),
  p("prizmic", "Dino Prizmic", "CRO", 101, 120),
  p("shevchenko", "Aleksandr Shevchenko", "KAZ", 97, 92),
  p("paul", "Tommy Paul", "USA", 21, 12, { seed: 20 }),
  p("wong", "Coleman Wong", "HKG", 94, 96),
  p("arnaldi", "Matteo Arnaldi", "ITA", 30, 32, { seed: 30 }),
  p("duckworth", "James Duckworth", "AUS", 111, 109),
  p("wu", "Yibing Wu", "CHN", 113, 125),
  p("walton", "Adam Walton", "AUS", 93, 89),
  p("faria", "Jaime Faria", "POR", 70, 79),
  p("brooksby", "Jenson Brooksby", "USA", 73, 68),
  p("safiullin", "Roman Safiullin", "RUS", 50, 44),
  p("alcaraz", "Carlos Alcaraz", "ESP", 2, 1, { seed: 2 }),
]);

add([
  p("sabalenka", "Aryna Sabalenka", "BLR", 1, 1, { seed: 1 }),
  p("osorio", "Camila Osorio", "COL", 48, 52),
  p("iatcenko", "Polina Iatcenko", "RUS", 122, 140, { qualifier: true }),
  p("zarazua", "Renata Zarazua", "MEX", 79, 75),
  p("ito", "Aoi Ito", "JPN", 91, 95),
  p("selekhmeteva", "Oksana Selekhmeteva", "RUS", 118, 122),
  p("rakhimova", "Kamilla Rakhimova", "RUS", 72, 80),
  p("krejcikova", "Barbora Krejcikova", "CZE", 35, 28, { seed: 27 }),
  p("chwalinska", "Maja Chwalinska", "POL", 29, 40, { seed: 20 }),
  p("townsend", "Taylor Townsend", "USA", 55, 60),
  p("preston", "Taylah Preston", "AUS", 134, 150, { wc: true }),
  p("parks", "Alycia Parks", "USA", 88, 84),
  p("pliskova", "Karolina Pliskova", "CZE", 64, 70),
  p("vandewinkel", "Hanne Vandewinkel", "BEL", 109, 112),
  p("snigur", "Daria Snigur", "UKR", 126, 130),
  p("shnaider", "Diana Shnaider", "RUS", 16, 14, { seed: 15 }),
  p("kostyuk", "Marta Kostyuk", "UKR", 18, 19, { seed: 11 }),
  p("hunter", "Storm Hunter", "AUS", 160, 155, { qualifier: true }),
  p("stephens", "Sloane Stephens", "USA", 81, 78, { wc: true }),
  p("tauson", "Clara Tauson", "DEN", 23, 25),
  p("birrell", "Kimberly Birrell", "AUS", 76, 82),
  p("marcinko", "Petra Marcinko", "CRO", 103, 108),
  p("alexandrova", "Ekaterina Alexandrova", "RUS", 17, 20, { seed: 18 }),
  p("kessler", "McCartney Kessler", "USA", 31, 33),
  p("annli", "Ann Li", "USA", 38, 42, { seed: 29 }),
  p("ruzic", "Antonia Ruzic", "CRO", 92, 96),
  p("vekic", "Donna Vekic", "CRO", 26, 22),
  p("gibson", "Talia Gibson", "AUS", 141, 148),
  p("tararudee", "Lanlana Tararudee", "THA", 115, 124),
  p("kalieva", "Elvina Kalieva", "USA", 170, 175, { qualifier: true }),
  p("volynets", "Katie Volynets", "USA", 74, 77),
  p("noskova", "Linda Noskova", "CZE", 9, 11, { seed: 6 }),
  p("pegula", "Jessica Pegula", "USA", 5, 4, { seed: 3 }),
  p("ruse", "Elena-Gabriela Ruse", "ROU", 69, 72),
  p("kenin", "Sofia Kenin", "USA", 36, 39),
  p("venus", "Venus Williams", "USA", 580, 560, { wc: true }),
  p("sawangkaew", "Mananchaya Sawangkaew", "THA", 128, 135),
  p("udvardy", "Panna Udvardy", "HUN", 111, 114),
  p("fernandez", "Leylah Fernandez", "CAN", 27, 30, { seed: 31 }),
  p("zhang", "Shuai Zhang", "CHN", 98, 90),
  p("paolini", "Jasmine Paolini", "ITA", 8, 5, { seed: 19 }),
  p("erjavec", "Veronika Erjavec", "SLO", 133, 138),
  p("stefanini", "Lucrezia Stefanini", "ITA", 107, 116),
  p("yastremska", "Dayana Yastremska", "UKR", 45, 41),
  p("golubic", "Viktorija Golubic", "SUI", 78, 81),
  p("parry", "Diane Parry", "FRA", 62, 58),
  p("grabher", "Julia Grabher", "AUT", 119, 121),
  p("cirstea", "Sorana Cirstea", "ROU", 32, 35, { seed: 16 }),
  p("svitolina", "Elina Svitolina", "UKR", 14, 13, { seed: 9 }),
  p("sierra", "Solana Sierra", "ARG", 95, 99),
  p("joint", "Maya Joint", "AUS", 52, 61),
  p("samsonova", "Liudmila Samsonova", "RUS", 21, 18),
  p("xinyu-wang", "Xinyu Wang", "CHN", 34, 37),
  p("arango", "Emiliana Arango", "COL", 87, 85),
  p("blinkova", "Anna Blinkova", "RUS", 68, 66),
  p("kalinskaya", "Anna Kalinskaya", "RUS", 24, 21, { seed: 21 }),
  p("navarro", "Emma Navarro", "USA", 15, 8, { seed: 26 }),
  p("boisson", "Lois Boisson", "FRA", 44, 70, { pr: true }),
  p("koevermans", "Anouk Koevermans", "NED", 136, 142),
  p("mcnally", "Caty McNally", "USA", 101, 97),
  p("boulter", "Katie Boulter", "GBR", 49, 46),
  p("lee", "Carol Young Suh Lee", "USA", 210, 220, { wc: true }),
  p("kraus", "Sinja Kraus", "AUT", 124, 128),
  p("muchova", "Karolina Muchova", "CZE", 10, 12, { seed: 7 }),
  p("andreeva", "Mirra Andreeva", "RUS", 6, 7, { seed: 5 }),
  p("tjen", "Janice Tjen", "INA", 145, 160),
  p("knutson", "Gabriela Knutson", "CZE", 148, 152),
  p("lys", "Eva Lys", "GER", 57, 63),
  p("bartunkova", "Nikola Bartunkova", "CZE", 139, 144),
  p("sherif", "Mayar Sherif", "EGY", 84, 80),
  p("maria", "Tatiana Maria", "GER", 43, 45),
  p("ostapenko", "Jelena Ostapenko", "LAT", 22, 16, { seed: 30 }),
  p("potapova", "Anastasia Potapova", "RUS", 33, 36, { seed: 24 }),
  p("valentova", "Tereza Valentova", "CZE", 117, 123),
  p("rus", "Arantxa Rus", "NED", 90, 88),
  p("jeanjean", "Leolia Jeanjean", "FRA", 113, 118),
  p("tagger", "Lilli Tagger", "AUT", 154, 165),
  p("korpatsch", "Tamara Korpatsch", "GER", 121, 119),
  p("krueger", "Ashlyn Krueger", "USA", 41, 44),
  p("anisimova", "Amanda Anisimova", "USA", 4, 6, { seed: 10 }),
  p("jovic", "Iva Jovic", "USA", 28, 34, { seed: 14 }),
  p("frech", "Magdalena Frech", "POL", 40, 38),
  p("linette", "Magda Linette", "POL", 47, 43),
  p("jones", "Fran Jones", "GBR", 132, 136),
  p("oliynykova", "Oleksandra Oliynykova", "UKR", 129, 133),
  p("brantmeier", "Reese Brantmeier", "USA", 188, 200, { wc: true }),
  p("stoiana", "Mary Stoiana", "USA", 166, 170, { wc: true }),
  p("eala", "Alexandra Eala", "PHI", 25, 32, { seed: 17 }),
  p("bejlek", "Sara Bejlek", "CZE", 37, 50, { seed: 28 }),
  p("bucsa", "Cristina Bucsa", "ESP", 61, 59),
  p("kalinina", "Anhelina Kalinina", "UKR", 66, 64),
  p("sakatsume", "Himeno Sakatsume", "JPN", 143, 147),
  p("kasatkina", "Daria Kasatkina", "RUS", 20, 15),
  p("badosa", "Paula Badosa", "ESP", 30, 26),
  p("sonmez", "Zeynep Sonmez", "TUR", 97, 102),
  p("gauff", "Coco Gauff", "USA", 3, 3, { seed: 4 }),
  p("swiatek", "Iga Swiatek", "POL", 2, 2, { seed: 8 }),
  p("xiyu-wang", "Xiyu Wang", "CHN", 58, 62),
  p("podoroska", "Nadia Podoroska", "ARG", 105, 100),
  p("waltert", "Simona Waltert", "SUI", 114, 117),
  p("dart", "Harriet Dart", "GBR", 86, 83),
  p("stearns", "Peyton Stearns", "USA", 39, 35),
  p("jacquemot", "Elsa Jacquemot", "FRA", 108, 113),
  p("bouzkova", "Marie Bouzkova", "CZE", 42, 47, { seed: 25 }),
  p("keys", "Madison Keys", "USA", 7, 9, { seed: 22 }),
  p("korneeva", "Alina Korneeva", "RUS", 123, 129),
  p("havlickova", "Lucie Havlickova", "CZE", 151, 158),
  p("bondar", "Anna Bondar", "HUN", 93, 97),
  p("zheng", "Qinwen Zheng", "CHN", 12, 8, { qualifier: true }),
  p("liutova", "Kristina Liutova", "RUS", 173, 190, { qualifier: true }),
  p("putintseva", "Yulia Putintseva", "KAZ", 50, 48),
  p("bencic", "Belinda Bencic", "SUI", 11, 17, { seed: 12 }),
  p("osaka", "Naomi Osaka", "JPN", 13, 11, { seed: 13 }),
  p("zakharova", "Anastasia Zakharova", "RUS", 89, 94),
  p("cocciaretto", "Elisabetta Cocciaretto", "ITA", 54, 49),
  p("siniakova", "Katerina Siniakova", "CZE", 46, 51),
  p("zidansek", "Tamara Zidansek", "SLO", 116, 111),
  p("timofeeva", "Maria Timofeeva", "RUS", 127, 131),
  p("quevedo", "Kaitlin Quevedo", "USA", 135, 142),
  p("mertens", "Elise Mertens", "BEL", 19, 24, { seed: 23 }),
  p("sakkari", "Maria Sakkari", "GRE", 51, 27, { seed: 32 }),
  p("montgomery", "Robin Montgomery", "USA", 100, 104),
  p("starodubtseva", "Yuliia Starodubtseva", "UKR", 110, 107),
  p("seidel", "Ella Seidel", "GER", 96, 103),
  p("vidmanova", "Darja Vidmanova", "CZE", 137, 145),
  p("bouzas", "Jessica Bouzas Maneiro", "ESP", 65, 67),
  p("frodin", "Thea Frodin", "USA", 158, 165, { wc: true }),
  p("rybakina", "Elena Rybakina", "KAZ", 5, 6, { seed: 2 }),
]);

function team(id, a, b, seed, rank, rankPrev) {
  const pa = players[a];
  const pb = players[b];
  const r = rank != null ? rank : Math.round(((pa && pa.rank) || 80) + ((pb && pb.rank) || 80) / 4);
  const rp = rankPrev != null ? rankPrev : r + 2;
  players[id] = {
    id,
    name: (pa ? pa.name : a) + " / " + (pb ? pb.name : b),
    country: (pa && pb && pa.country === pb.country ? pa.country : "XX"),
    rank: r,
    rankPrev: rp,
    seed: seed,
    playerIds: [a, b],
    doubles: true,
  };
  return id;
}

const mdTeams = [];
function md(id, a, b, seed, rank, rankPrev) {
  mdTeams.push(team(id, a, b, seed, rank, rankPrev));
  return id;
}

md("heliovaara-patten", "mochizuki", "fery", 1, 2, 2);
players["heliovaara-patten"].name = "Harri Heliovaara / Henry Patten";
players["heliovaara-patten"].country = "XX";
players["heliovaara-patten"].playerIds = ["heliovaara", "patten"];
players["heliovaara"] = p("heliovaara", "Harri Heliovaara", "FIN", 3, 4);
players["patten"] = p("patten", "Henry Patten", "GBR", 4, 5);
players["granollers"] = p("granollers", "Marcel Granollers", "ESP", 8, 6);
players["zeballos"] = p("zeballos", "Horacio Zeballos", "ARG", 9, 8);
players["arevalo"] = p("arevalo", "Marcelo Arevalo", "ESA", 11, 10);
players["pavic"] = p("pavic", "Mate Pavic", "CRO", 12, 13);
players["bolelli"] = p("bolelli", "Simone Bolelli", "ITA", 16, 15);
players["vavassori"] = p("vavassori", "Andrea Vavassori", "ITA", 14, 12);
players["harrison"] = p("harrison", "Christian Harrison", "USA", 22, 28);
players["skupski"] = p("skupski", "Neal Skupski", "GBR", 18, 16);
players["krawietz"] = p("krawietz", "Kevin Krawietz", "GER", 20, 19);
players["putz"] = p("putz", "Tim Puetz", "GER", 21, 22);
players["andreozzi"] = p("andreozzi", "Guido Andreozzi", "ARG", 30, 32);
players["guinard"] = p("guinard", "Manuel Guinard", "FRA", 34, 36);
players["luz"] = p("luz", "Orlando Luz", "BRA", 31, 29);
players["matos"] = p("matos", "Rafael Matos", "BRA", 32, 33);
players["cash"] = p("cash", "Julian Cash", "GBR", 25, 27);
players["glasspool"] = p("glasspool", "Lloyd Glasspool", "GBR", 15, 14);
players["k-krajicek"] = p("k-krajicek", "Austin Krajicek", "USA", 40, 38);
players["ram"] = p("ram", "Rajeev Ram", "USA", 28, 26);
players["middelkoop"] = p("middelkoop", "Wesley Middelkoop", "NED", 45, 44);
players["haase"] = p("haase", "Robin Haase", "NED", 50, 52);
players["nys"] = p("nys", "Hugo Nys", "MON", 36, 35);
players["zielinski"] = p("zielinski", "Jan Zielinski", "POL", 37, 39);
players["ebden"] = p("ebden", "Matt Ebden", "AUS", 24, 20);
players["purcell"] = p("purcell", "Max Purcell", "AUS", 33, 31);
players["gille"] = p("gille", "Sander Gille", "BEL", 42, 41);
players["vliegen"] = p("vliegen", "Joran Vliegen", "BEL", 43, 45);
players["bopanna"] = p("bopanna", "Rohan Bopanna", "IND", 55, 48);
players["venus-d"] = p("venus-d", "Michael Venus", "NZL", 29, 30);
players["pees"] = p("pees", "Andrea Pellegrino", "ITA", 60, 62);
players["errani"] = p("errani", "Sara Errani", "ITA", 7, 6);
players["dabrowski"] = p("dabrowski", "Gabriela Dabrowski", "CAN", 5, 5);
players["stefani"] = p("stefani", "Luisa Stefani", "BRA", 10, 11);
players["danilina"] = p("danilina", "Anna Danilina", "KAZ", 19, 21);
players["krunic"] = p("krunic", "Aleksandra Krunic", "SRB", 23, 25);
players["hsieh"] = p("hsieh", "Hsieh Su-wei", "TPE", 6, 8);
players["guo"] = p("guo", "Guo Hanyu", "CHN", 27, 29);
players["mladenovic"] = p("mladenovic", "Kristina Mladenovic", "FRA", 26, 24);
players["melichar"] = p("melichar", "Nicole Melichar-Martinez", "USA", 17, 18);
players["jiang"] = p("jiang", "Jiang Xinyu", "CHN", 35, 38);
players["sutjiadi"] = p("sutjiadi", "Aldila Sutjiadi", "INA", 39, 40);
players["kichenok"] = p("kichenok", "Lyudmyla Kichenok", "UKR", 41, 43);
players["ostapenko-d"] = players["ostapenko"];
players["routliffe"] = p("routliffe", "Erin Routliffe", "NZL", 2, 3);
players["ruud"] = p("ruud", "Casper Ruud", "NOR", 9, 7);
players["serena"] = p("serena", "Serena Williams", "USA", 999, 999, { wc: true });
players["eala-p"] = players["eala"];

function pair(id, a, b, seed, rank, rankPrev) {
  if (!players[a] || !players[b]) {
    throw new Error("missing player for pair " + id + ": " + a + "=" + !!players[a] + " " + b + "=" + !!players[b]);
  }
  players[id] = {
    id,
    name: players[a].name + " / " + players[b].name,
    country: players[a].country === players[b].country ? players[a].country : "XX",
    rank,
    rankPrev,
    seed,
    playerIds: [a, b],
    doubles: true,
  };
  return id;
}

const MD = [
  pair("md01", "heliovaara", "patten", 1, 2, 2),
  pair("md02", "kennedy", "gorzny", null, 90, 95),
  pair("md03", "giron", "nakashima", null, 32, 34),
  pair("md04", "cash", "glasspool", 9, 12, 14),
  pair("md05", "krawietz", "putz", 6, 16, 18),
  pair("md06", "michelsen", "tiafoe", null, 28, 30),
  pair("md07", "ebden", "purcell", null, 24, 22),
  pair("md08", "nys", "zielinski", 13, 26, 28),
  pair("md09", "harrison", "skupski", 5, 14, 17),
  pair("md10", "bublik", "rublev", null, 22, 20),
  pair("md11", "gille", "vliegen", 16, 30, 31),
  pair("md12", "shelton", "paul", null, 18, 16),
  pair("md13", "andreozzi", "guinard", 7, 27, 29),
  pair("md14", "fritz", "tien", null, 15, 19),
  pair("md15", "bopanna", "venus-d", null, 40, 36),
  pair("md16", "granollers", "zeballos", 2, 6, 5),
  pair("md17", "arevalo", "pavic", 3, 8, 9),
  pair("md18", "khachanov", "rublev", null, 21, 23),
  pair("md19", "middelkoop", "haase", null, 48, 50),
  pair("md20", "mensik", "lehecka", null, 25, 27),
  pair("md21", "luz", "matos", 8, 29, 28),
  pair("md22", "alcaraz", "faa", null, 10, 12),
  pair("md23", "k-krajicek", "ram", 12, 33, 31),
  pair("md24", "dimitrov", "tsitsipas", null, 19, 18),
  pair("md25", "bolelli", "vavassori", 4, 11, 10),
  pair("md26", "cobolli", "berrettini", null, 20, 21),
  pair("md27", "fils", "rinderknech", null, 23, 25),
  pair("md28", "deminaur", "popyrin", null, 17, 15),
  pair("md29", "zverev", "struff", null, 13, 14),
  pair("md30", "medvedev", "safiullin", null, 16, 17),
  pair("md31", "hurkacz", "bergs", null, 31, 33),
  pair("md32", "musetti", "sonego", null, 34, 32),
  pair("md33", "heliovaara", "patten", 1, 2, 2),
];
MD.length = 32;
MD[0] = pair("md01", "heliovaara", "patten", 1, 2, 2);
MD[1] = pair("md02", "kennedy", "gorzny", null, 90, 95);
MD[2] = pair("md03", "giron", "nakashima", null, 32, 34);
MD[3] = pair("md04", "cash", "glasspool", 9, 12, 14);
MD[4] = pair("md05", "krawietz", "putz", 6, 16, 18);
MD[5] = pair("md06", "michelsen", "tiafoe", null, 28, 30);
MD[6] = pair("md07", "ebden", "purcell", null, 24, 22);
MD[7] = pair("md08", "nys", "zielinski", 13, 26, 28);
MD[8] = pair("md09", "harrison", "skupski", 5, 14, 17);
MD[9] = pair("md10", "bublik", "hurkacz", null, 22, 20);
MD[10] = pair("md11", "gille", "vliegen", 16, 30, 31);
MD[11] = pair("md12", "shelton", "paul", null, 18, 16);
MD[12] = pair("md13", "andreozzi", "guinard", 7, 27, 29);
MD[13] = pair("md14", "fritz", "tien", null, 15, 19);
MD[14] = pair("md15", "bopanna", "venus-d", null, 40, 36);
MD[15] = pair("md16", "granollers", "zeballos", 2, 6, 5);
MD[16] = pair("md17", "arevalo", "pavic", 3, 8, 9);
MD[17] = pair("md18", "khachanov", "rublev", null, 21, 23);
MD[18] = pair("md19", "middelkoop", "haase", null, 48, 50);
MD[19] = pair("md20", "mensik", "lehecka", null, 25, 27);
MD[20] = pair("md21", "luz", "matos", 8, 29, 28);
MD[21] = pair("md22", "alcaraz", "faa", null, 10, 12);
MD[22] = pair("md23", "k-krajicek", "ram", 12, 33, 31);
MD[23] = pair("md24", "dimitrov", "tsitsipas", null, 19, 18);
MD[24] = pair("md25", "bolelli", "vavassori", 4, 11, 10);
MD[25] = pair("md26", "cobolli", "berrettini", null, 20, 21);
MD[26] = pair("md27", "fils", "rinderknech", null, 23, 25);
MD[27] = pair("md28", "deminaur", "popyrin", null, 17, 15);
MD[28] = pair("md29", "zverev", "struff", null, 13, 14);
MD[29] = pair("md30", "medvedev", "safiullin", null, 16, 17);
MD[30] = pair("md31", "blockx", "bergs", null, 31, 33);
MD[31] = pair("md32", "musetti", "sonego", null, 34, 32);

const extraMd = [];
for (let i = 32; i < 64; i++) {
  const aIds = Object.keys(players).filter((k) => !players[k].doubles && players[k].country);
  const ia = aIds[(i * 3) % aIds.length];
  const ib = aIds[(i * 7 + 11) % aIds.length];
  extraMd.push(pair("md" + String(i + 1).padStart(2, "0"), ia === ib ? aIds[0] : ia, ib === ia ? aIds[1] : ib, null, 50 + i, 52 + i));
}

const WD = [];
function wpair(id, a, b, seed, rank, rankPrev) {
  WD.push(pair(id, a, b, seed, rank, rankPrev));
}
wpair("wd01", "siniakova", "townsend", 1, 3, 3);
wpair("wd02", "boulter", "dart", null, 70, 72);
wpair("wd03", "kostyuk", "svitolina", null, 22, 24);
wpair("wd04", "routliffe", "sutjiadi", 9, 18, 20);
wpair("wd05", "guo", "mladenovic", 5, 21, 23);
wpair("wd06", "navarro", "anisimova", null, 16, 14);
wpair("wd07", "hsieh", "ostapenko", 4, 12, 15);
wpair("wd08", "pegula", "gauff", null, 8, 7);
wpair("wd09", "dabrowski", "stefani", 2, 7, 8);
wpair("wd10", "osaka", "kenin", null, 26, 28);
wpair("wd11", "jiang", "zhang", 7, 32, 34);
wpair("wd12", "keys", "stephens", null, 30, 29);
wpair("wd13", "danilina", "krunic", 3, 14, 16);
wpair("wd14", "muchova", "noskova", null, 19, 21);
wpair("wd15", "bucsa", "melichar", 6, 25, 26);
wpair("wd16", "swiatek", "sabalenka", null, 5, 6);
wpair("wd17", "mertens", "shnaider", 8, 28, 30);
wpair("wd18", "fernandez", "annli", null, 36, 38);
wpair("wd19", "kichenok", "golubic", null, 44, 46);
wpair("wd20", "paolini", "errani", null, 24, 22);
wpair("wd21", "andreeva", "kalinskaya", null, 20, 19);
wpair("wd22", "bencic", "vekic", null, 23, 25);
wpair("wd23", "alexandrova", "potapova", null, 27, 28);
wpair("wd24", "rybakina", "putintseva", null, 17, 18);
wpair("wd25", "jovic", "krueger", null, 33, 35);
wpair("wd26", "kasatkina", "samsonova", null, 29, 27);
wpair("wd27", "sakkari", "pliskova", null, 48, 40);
wpair("wd28", "chwalinska", "linette", null, 39, 41);
wpair("wd29", "bouzkova", "cocciaretto", null, 42, 44);
wpair("wd30", "tauson", "frech", null, 37, 39);
wpair("wd31", "zheng", "xinyu-wang", null, 31, 33);
wpair("wd32", "gauff", "pegula", 2, 4, 4);

while (WD.length < 64) {
  const i = WD.length;
  const ids = Object.keys(players).filter((k) => !players[k].doubles);
  const ia = ids[(i * 5 + 3) % ids.length];
  const ib = ids[(i * 11 + 8) % ids.length];
  wpair("wd" + String(i + 1).padStart(2, "0"), ia === ib ? ids[2] : ia, ib === ia ? ids[4] : ib, null, 55 + i, 58 + i);
}

const MX = [];
function mx(id, a, b, seed, rank, rankPrev) {
  MX.push(pair(id, a, b, seed, rank, rankPrev));
}
mx("mx-sab-djo", "sabalenka", "djokovic", 1, 4, 3);
mx("mx-sin-pat", "siniakova", "patten", null, 12, 14);
mx("mx-svi-mon", "svitolina", "monfils", null, 18, 20);
mx("mx-eal-faa", "eala", "faa", null, 22, 24);
mx("mx-ben-cob", "bencic", "cobolli", 4, 10, 12);
mx("mx-tow-zve", "townsend", "zverev", null, 16, 15);
mx("mx-ser-alc", "serena", "alcaraz", null, 8, 9);
mx("mx-rou-gla", "routliffe", "glasspool", null, 14, 13);
mx("mx-muc-men", "muchova", "mensik", null, 11, 13);
mx("mx-mla-are", "mladenovic", "arevalo", null, 28, 30);
mx("mx-nav-pau", "navarro", "paul", null, 15, 16);
mx("mx-ani-tie", "anisimova", "tien", 3, 13, 12);
mx("mx-and-rub", "andreeva", "rublev", null, 9, 10);
mx("mx-err-vav", "errani", "vavassori", null, 17, 11);
mx("mx-shn-ruu", "shnaider", "ruud", null, 19, 18);
mx("mx-peg-fri", "pegula", "fritz", 2, 6, 5);

function m(a, b, extra) {
  return Object.assign({ player1Id: a, player2Id: b, status: "scheduled" }, extra || {});
}
function done(a, b, winner, score) {
  return { player1Id: a, player2Id: b, status: "complete", winnerId: winner, score };
}
function live(a, b, score) {
  return { player1Id: a, player2Id: b, status: "live", score };
}

const menR128 = [
  m("zverev", "sonego"),
  m("halys", "diaz-acosta"),
  m("dimitrov", "popyrin"),
  m("hanfmann", "tabilo"),
  m("darderi", "wendelken"),
  m("svrcina", "royer"),
  m("sweeny", "moutet"),
  m("fery", "musetti"),
  m("jodar", "kokkinakis"),
  m("marozsan", "m-zheng"),
  m("svajda", "altmaier"),
  m("jm-cerundolo", "gea"),
  m("bergs", "taberner"),
  m("dejong", "passaro"),
  m("choinski", "bvd"),
  m("guerrieri", "deminaur"),
  m("faa", "hijikata"),
  m("burruchaga", "khachanov"),
  m("molcan", "bonzi"),
  m("giron", "buse"),
  m("mensik", "mochizuki"),
  m("rodionov", "gmp"),
  m("vallejo", "monfils"),
  m("borges", "tien"),
  m("fritz", "blanch"),
  m("bellucci", "piros"),
  m("carabelli", "struff"),
  m("misolic", "f-cerundolo"),
  m("blockx", "barrios"),
  m("shang", "trungelliti"),
  m("basavareddy", "schoolkate"),
  m("comesana", "cobolli"),
  done("medvedev", "gaston", "medvedev", "6-4 6-2 6-4"),
  live("gorzny", "collignon", "3-6 6-3 3-4"),
  done("munar", "atmane", "munar", "6-7(5) 3-6 6-1 7-6(4) 7-5"),
  done("rinderknech", "shimabukuro", "rinderknech", "6-7(4) 6-2 7-6(4) 6-2"),
  live("vacherot", "kovacevic", "6-2 2-1"),
  done("majchrzak", "medjedovic", "majchrzak", "6-3 6-3 6-3"),
  live("vukic", "sakamoto", "4-6 7-6(5) 4-6 6-3 3-4"),
  m("damm", "tiafoe"),
  m("nakashima", "baez"),
  live("michelsen", "cina", "6-4 1-1"),
  done("merida", "fucsovics", "merida", "6-4 6-4 6-2"),
  live("virtanen", "rublev", "6-5"),
  done("etcheverry", "kopriva", "etcheverry", "6-3 6-4 6-0"),
  live("landaluce", "fearnley", "4-3"),
  m("berrettini", "wawrinka"),
  done("navone", "djokovic", "navone", "7-6(5) 5-7 4-6 6-2 6-1"),
  m("shelton", "griekspoor"),
  m("dzumhur", "hurkacz"),
  done("shapovalov", "kecmanovic", "shapovalov", "6-4 4-6 6-4 6-1"),
  done("vanassche", "norrie", "vanassche", "6-7(6) 6-2 6-2 6-3"),
  done("lehecka", "carreno", "lehecka", "6-1 7-6(5) 4-6 6-2"),
  done("samuel", "machac", "samuel", "6-2 6-3 6-2"),
  done("harris", "kennedy", "harris", "6-4 6-2 6-2"),
  live("tsitsipas", "fils", "4-5"),
  done("bublik", "wolf", "bublik", "6-4 6-2 3-6 6-1"),
  live("tirante", "mannarino", "6-4 6-3 3-6 3-6 2-5"),
  done("prizmic", "shevchenko", "prizmic", "2-6 6-3 6-3 5-7 7-5"),
  done("paul", "wong", "paul", "6-7(3) 6-1 6-3 6-3"),
  m("arnaldi", "duckworth"),
  done("wu", "walton", "wu", "7-6(2) 6-2 7-5"),
  done("faria", "brooksby", "faria", "6-3 7-6(4) 4-6 1-6 6-2"),
  m("safiullin", "alcaraz"),
];

const womenR128 = [
  m("sabalenka", "osorio"),
  done("iatcenko", "zarazua", "iatcenko", "4-6 6-4 7-6(7)"),
  m("ito", "selekhmeteva"),
  done("rakhimova", "krejcikova", "rakhimova", "7-6(4) 6-2"),
  m("chwalinska", "townsend"),
  done("preston", "parks", "preston", "6-3 6-3"),
  done("pliskova", "vandewinkel", "pliskova", "2-6 7-5 6-3"),
  m("snigur", "shnaider"),
  done("kostyuk", "hunter", "kostyuk", "6-4 6-1"),
  m("stephens", "tauson"),
  m("birrell", "marcinko"),
  done("alexandrova", "kessler", "alexandrova", "6-2 6-2"),
  m("annli", "ruzic"),
  done("vekic", "gibson", "vekic", "6-2 4-6 6-3"),
  done("tararudee", "kalieva", "tararudee", "6-3 6-7(4) 6-2"),
  m("volynets", "noskova"),
  done("pegula", "ruse", "pegula", "6-3 6-2"),
  done("kenin", "venus", "kenin", "6-2 7-6(6)"),
  m("sawangkaew", "udvardy"),
  done("fernandez", "zhang", "fernandez", "6-3 6-2"),
  done("paolini", "erjavec", "paolini", "6-3 3-6 6-4"),
  done("stefanini", "yastremska", "stefanini", "6-3 4-6 6-1"),
  m("golubic", "parry"),
  m("grabher", "cirstea"),
  done("svitolina", "sierra", "svitolina", "6-1 6-2"),
  m("joint", "samsonova"),
  done("xinyu-wang", "arango", "xinyu-wang", "6-4 6-2"),
  m("blinkova", "kalinskaya"),
  live("navarro", "boisson", "7-6(6) 4-2"),
  m("koevermans", "mcnally"),
  done("boulter", "lee", "boulter", "6-4 3-6 6-0"),
  m("kraus", "muchova"),
  m("andreeva", "tjen"),
  m("knutson", "lys"),
  m("bartunkova", "sherif"),
  m("maria", "ostapenko"),
  m("potapova", "valentova"),
  m("rus", "jeanjean"),
  m("tagger", "korpatsch"),
  m("krueger", "anisimova"),
  m("jovic", "frech"),
  m("linette", "jones"),
  m("oliynykova", "brantmeier"),
  m("stoiana", "eala"),
  m("bejlek", "bucsa"),
  m("kalinina", "sakatsume"),
  m("kasatkina", "badosa"),
  m("sonmez", "gauff"),
  m("swiatek", "xiyu-wang"),
  m("podoroska", "waltert"),
  m("dart", "stearns"),
  m("jacquemot", "bouzkova"),
  m("keys", "korneeva"),
  m("havlickova", "bondar"),
  m("zheng", "liutova"),
  m("putintseva", "bencic"),
  m("osaka", "zakharova"),
  m("cocciaretto", "siniakova"),
  m("zidansek", "timofeeva"),
  m("quevedo", "mertens"),
  m("sakkari", "montgomery"),
  m("starodubtseva", "seidel"),
  m("vidmanova", "bouzas"),
  m("frodin", "rybakina"),
];

menR128.forEach((x, i) => (x.slot = i));
womenR128.forEach((x, i) => (x.slot = i));

function slots(pairs, startStatus) {
  return pairs.map((id, i) => {
    const next = pairs[i % 2 === 0 ? i + 1 : i - 1];
    if (i % 2 === 1) return null;
    return m(id, next, { slot: i / 2, status: startStatus || "scheduled" });
  }).filter(Boolean);
}

const mdOpening = [];
for (let i = 0; i < 64; i += 2) {
  const a = "md" + String(i + 1).padStart(2, "0");
  const b = "md" + String(i + 2).padStart(2, "0");
  if (!players[a] || !players[b]) continue;
  mdOpening.push(m(a, b, { slot: i / 2 }));
}
while (mdOpening.length < 32) {
  const n = mdOpening.length;
  mdOpening.push(m("md01", "md02", { slot: n }));
}

const wdOpening = [];
for (let i = 0; i < 64; i += 2) {
  const a = "wd" + String(i + 1).padStart(2, "0");
  const b = "wd" + String(i + 2).padStart(2, "0");
  if (!players[a] || !players[b]) continue;
  wdOpening.push(m(a, b, { slot: i / 2 }));
}

const mixedOpening = [
  done("mx-sab-djo", "mx-sin-pat", "mx-sin-pat", "1-4 4-2 [10-8]"),
  done("mx-svi-mon", "mx-eal-faa", "mx-svi-mon", "4-1 4-1"),
  done("mx-ben-cob", "mx-tow-zve", "mx-ben-cob", "4-2 4-2"),
  done("mx-ser-alc", "mx-rou-gla", "mx-ser-alc", "5-3 4-1"),
  done("mx-muc-men", "mx-mla-are", "mx-muc-men", "4-1 2-4 [10-8]"),
  done("mx-nav-pau", "mx-ani-tie", "mx-nav-pau", "5-4 4-2"),
  done("mx-and-rub", "mx-err-vav", "mx-and-rub", "1-4 4-1 [10-8]"),
  done("mx-shn-ruu", "mx-peg-fri", "mx-shn-ruu", "4-2 4-1"),
];
mixedOpening.forEach((x, i) => (x.slot = i));

const mixedLater = [
  Object.assign(done("mx-svi-mon", "mx-sin-pat", "mx-svi-mon", "5-4 4-5 [10-8]"), { round: 8, slot: 0 }),
  Object.assign(done("mx-ben-cob", "mx-ser-alc", "mx-ben-cob", "5-4 4-1"), { round: 8, slot: 1 }),
  Object.assign(done("mx-muc-men", "mx-nav-pau", "mx-muc-men", "4-1 4-3"), { round: 8, slot: 2 }),
  Object.assign(done("mx-and-rub", "mx-shn-ruu", "mx-and-rub", "4-1 4-5 [10-5]"), { round: 8, slot: 3 }),
  Object.assign(done("mx-ben-cob", "mx-svi-mon", "mx-ben-cob", "5-4 4-3 [10-8]"), { round: 4, slot: 0 }),
  Object.assign(done("mx-muc-men", "mx-and-rub", "mx-muc-men", "5-4 3-5 [11-9]"), { round: 4, slot: 1 }),
  Object.assign(done("mx-muc-men", "mx-ben-cob", "mx-muc-men", "6-3 1-6 [10-6]"), { round: 2, slot: 0 }),
];

const h2h = [
  { winnerId: "alcaraz", loserId: "safiullin", date: "2025-10-12" },
  { winnerId: "safiullin", loserId: "alcaraz", date: "2023-03-11" },
  { winnerId: "alcaraz", loserId: "safiullin", date: "2024-05-30" },
  { winnerId: "sabalenka", loserId: "osorio", date: "2025-03-22" },
  { winnerId: "osorio", loserId: "sabalenka", date: "2022-04-08" },
  { winnerId: "sabalenka", loserId: "osorio", date: "2024-08-29" },
  { winnerId: "fils", loserId: "tsitsipas", date: "2026-05-14" },
  { winnerId: "tsitsipas", loserId: "fils", date: "2024-11-02" },
  { winnerId: "tsitsipas", loserId: "fils", date: "2023-06-18" },
  { winnerId: "swiatek", loserId: "xiyu-wang", date: "2025-09-02" },
  { winnerId: "navone", loserId: "djokovic", date: "2026-08-30" },
  { winnerId: "djokovic", loserId: "navone", date: "2024-02-16" },
  { winnerId: "medvedev", loserId: "gaston", date: "2024-05-28" },
  { winnerId: "shelton", loserId: "griekspoor", date: "2025-06-20" },
  { winnerId: "griekspoor", loserId: "shelton", date: "2023-08-12" },
  { winnerId: "anisimova", loserId: "krueger", date: "2025-08-08" },
  { winnerId: "krueger", loserId: "anisimova", date: "2024-07-01" },
  { winnerId: "muchova", loserId: "kraus", date: "2026-04-09" },
  { winnerId: "osaka", loserId: "zakharova", date: "2025-01-14" },
  { winnerId: "tiafoe", loserId: "damm", date: "2026-07-22" },
  { winnerId: "faa", loserId: "hijikata", date: "2025-01-18" },
  { winnerId: "berrettini", loserId: "wawrinka", date: "2022-06-29" },
  { winnerId: "wawrinka", loserId: "berrettini", date: "2019-05-16" },
  { winnerId: "gauff", loserId: "sonmez", date: "2025-04-02" },
  { winnerId: "rybakina", loserId: "frodin", date: "2026-03-11" },
  { winnerId: "zverev", loserId: "sonego", date: "2025-05-15" },
  { winnerId: "sonego", loserId: "zverev", date: "2021-06-17" },
  { winnerId: "fritz", loserId: "blanch", date: "2026-08-01" },
  { winnerId: "deminaur", loserId: "guerrieri", date: "2025-01-07" },
  { winnerId: "navarro", loserId: "boisson", date: "2026-05-20" },
  { winnerId: "boisson", loserId: "navarro", date: "2024-10-09" },
  { winnerId: "pegula", loserId: "kenin", date: "2025-08-15" },
  { winnerId: "kenin", loserId: "pegula", date: "2020-09-10" },
];

function crowd(pct, label) {
  return { pct, label, source: "snapshot", unit: "occupancy" };
}

function price(list, low, high) {
  return { list, resaleLow: low, resaleHigh: high, currency: "USD" };
}

const sessions = [];

function session(id, date, dayNight, venues, extra) {
  sessions.push(
    Object.assign(
      {
        id,
        date,
        dayNight,
        venues,
      },
      extra || {}
    )
  );
}

const ARMSTRONG_TICKETS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17]);
const GRANDSTAND_TICKETS = new Set([1, 3, 5, 7, 9, 11, 13]);

function ven(name, matches, opts) {
  opts = opts || {};
  const ticketed =
    opts.ticketed != null
      ? opts.ticketed
      : name === "Grounds" || name === "Arthur Ashe" || name === "Louis Armstrong" || name === "Grandstand";
  return {
    name,
    ticketed,
    kind: name === "Grounds" ? "grounds" : ticketed || name === "Grandstand" ? "stadium" : name === "Stadium 17" ? "field" : ticketed ? "stadium" : "field",
    matches,
    price: opts.price || null,
    crowd: opts.crowd || crowd(40, "Filling"),
    ticketNote: opts.ticketNote || "",
  };
}

session(
  "s1-day",
  "2026-08-30",
  "day",
  [
    ven("Arthur Ashe", [done("pegula", "ruse", "pegula", "6-3 6-2"), done("medvedev", "gaston", "medvedev", "6-4 6-2 6-4")], {
      price: price(250, 310, 720),
      crowd: crowd(88, "Packed"),
    }),
    ven("Louis Armstrong", [done("bublik", "wolf", "bublik", "6-4 6-2 3-6 6-1"), done("kostyuk", "hunter", "kostyuk", "6-4 6-1")], {
      price: price(175, 240, 480),
      crowd: crowd(81, "Busy"),
    }),
    ven("Grandstand", [done("lehecka", "carreno", "lehecka", "6-1 7-6(5) 4-6 6-2")], {
      price: price(140, 210, 390),
      crowd: crowd(74, "Busy"),
    }),
    ven("Stadium 17", [done("majchrzak", "medjedovic", "majchrzak", "6-3 6-3 6-3")], {
      ticketed: false,
      crowd: crowd(61, "Open seats"),
    }),
    ven("Court 5", [done("paul", "wong", "paul", "6-7(3) 6-1 6-3 6-3")], { crowd: crowd(70, "Standing room forming") }),
    ven("Court 7", [done("merida", "fucsovics", "merida", "6-4 6-4 6-2")], { crowd: crowd(55, "Walk-up") }),
    ven("Grounds", [], { price: price(65, 249, 360), crowd: crowd(79, "Grounds humming") }),
  ],
  { sessionNumber: 1, groundsPrice: 249, groundsList: 65, price: price(250, 310, 720) }
);

session(
  "s2-night",
  "2026-08-30",
  "night",
  [
    ven(
      "Arthur Ashe",
      [done("navone", "djokovic", "navone", "7-6(5) 5-7 4-6 6-2 6-1"), done("kenin", "venus", "kenin", "6-2 7-6(6)")],
      { price: price(280, 340, 890), crowd: crowd(96, "Roof down, sold") }
    ),
    ven("Louis Armstrong", [done("shapovalov", "kecmanovic", "shapovalov", "6-4 4-6 6-4 6-1")], {
      price: price(150, 190, 410),
      crowd: crowd(77, "Night buzz"),
    }),
    ven("Grandstand", [done("vanassche", "norrie", "vanassche", "6-7(6) 6-2 6-2 6-3")], {
      ticketed: false,
      ticketNote: "Covered by Session 1 Grandstand day ticket",
      crowd: crowd(58, "Thinning"),
    }),
    ven("Stadium 17", [done("faria", "brooksby", "faria", "6-3 7-6(4) 4-6 1-6 6-2")], {
      ticketed: false,
      crowd: crowd(42, "Late session"),
    }),
    ven("Court 6", [done("wu", "walton", "wu", "7-6(2) 6-2 7-5")], { crowd: crowd(38, "Lights on") }),
    ven("Grounds", [], { price: price(65, 180, 280), crowd: crowd(64, "Night grounds") }),
  ],
  { sessionNumber: 2, groundsPrice: 180, groundsList: 65, price: price(280, 340, 890) }
);

session(
  "s3-day",
  "2026-08-31",
  "day",
  [
    ven("Arthur Ashe", [m("sabalenka", "osorio", { order: 1, start: "11:30" }), m("safiullin", "alcaraz", { order: 2, start: "after" })], {
      price: price(275, 275, 680),
      crowd: crowd(72, "Filling for Sabalenka"),
    }),
    ven("Louis Armstrong", [live("tsitsipas", "fils", "4-5"), m("krueger", "anisimova", { order: 2 })], {
      price: price(180, 302, 560),
      crowd: crowd(84, "Fils-Tsitsipas drawing"),
    }),
    ven("Grandstand", [live("kraus", "muchova", "3-5"), m("chwalinska", "townsend", { order: 2 }), m("berrettini", "wawrinka", { order: 3 })], {
      price: price(150, 227, 450),
      crowd: crowd(76, "Wawrinka farewell building"),
    }),
    ven("Stadium 17", [live("zheng", "liutova", "2-3"), m("nakashima", "baez", { order: 2 }), m("stephens", "tauson", { order: 3 }), m("borges", "tien", { order: 4 })], {
      ticketed: false,
      crowd: crowd(63, "Americans on deck"),
    }),
    ven("Court 5", [m("bejlek", "bucsa"), m("blinkova", "kalinskaya"), m("darderi", "wendelken"), m("mensik", "mochizuki")], {
      crowd: crowd(58, "Outer-court hop"),
    }),
    ven("Court 6", [m("sawangkaew", "udvardy"), m("rodionov", "gmp"), m("hanfmann", "tabilo"), m("cocciaretto", "siniakova")], {
      crowd: crowd(47, "Open seating"),
    }),
    ven("Court 7", [live("virtanen", "rublev", "6-5"), m("snigur", "shnaider"), m("blockx", "barrios")], { crowd: crowd(66, "Rublev magnet") }),
    ven("Court 10", [m("jacquemot", "bouzkova"), m("arnaldi", "duckworth"), m("grabher", "cirstea"), m("joint", "samsonova")], {
      crowd: crowd(44, "Walk-up"),
    }),
    ven("Court 11", [live("vacherot", "kovacevic", "6-2 2-1"), m("koevermans", "mcnally"), m("volynets", "noskova"), m("burruchaga", "khachanov")], {
      crowd: crowd(51, "Building"),
    }),
    ven("Court 12", [m("dart", "stearns"), m("dzumhur", "hurkacz"), m("annli", "ruzic"), m("dimitrov", "popyrin")], {
      crowd: crowd(49, "Brits and Dimitrov"),
    }),
    ven("Court 13", [m("tagger", "korpatsch"), m("podoroska", "waltert"), m("shang", "trungelliti"), m("halys", "diaz-acosta")], {
      crowd: crowd(36, "Quiet"),
    }),
    ven("Court 15", [m("kalinina", "sakatsume"), m("ito", "selekhmeteva"), m("svrcina", "royer")], { crowd: crowd(33, "Shade seekers") }),
    ven("Grounds", [], { price: price(65, 234, 360), crowd: crowd(82, "Labor Day crush") }),
  ],
  { sessionNumber: 3, groundsPrice: 234, groundsList: 65, price: price(275, 275, 680) }
);

session(
  "s4-night",
  "2026-08-31",
  "night",
  [
    ven("Arthur Ashe", [m("shelton", "griekspoor", { order: 1, start: "19:00" }), m("osaka", "zakharova", { order: 2 })], {
      price: price(99, 99, 650),
      crowd: crowd(58, "Shelton night still pricing in"),
    }),
    ven("Louis Armstrong", [m("swiatek", "xiyu-wang", { order: 1 }), m("damm", "tiafoe", { order: 2 })], {
      price: price(158, 167, 420),
      crowd: crowd(71, "Iga + Tiafoe"),
    }),
    ven("Grandstand", [m("faa", "hijikata", { order: 1, start: "not before 22:00" })], {
      ticketed: false,
      ticketNote: "Covered by Session 3 Grandstand day ticket",
      crowd: crowd(40, "Holds for FAA"),
    }),
    ven("Stadium 17", [m("borges", "tien", { order: 1 })], {
      ticketed: false,
      crowd: crowd(34, "Late Tien"),
    }),
    ven("Court 5", [m("mensik", "mochizuki")], { crowd: crowd(28, "Night outer") }),
    ven("Court 12", [m("dimitrov", "popyrin")], { crowd: crowd(31, "Night outer") }),
    ven("Grounds", [], { price: price(65, 248, 320), crowd: crowd(60, "Evening grounds") }),
  ],
  { sessionNumber: 4, groundsPrice: 248, groundsList: 65, price: price(99, 99, 650) }
);

session(
  "s5-day",
  "2026-09-01",
  "day",
  [
    ven("Arthur Ashe", [m("gauff", "sonmez"), m("fritz", "blanch")], {
      price: price(260, 290, 640),
      crowd: crowd(70, "Coco day"),
    }),
    ven("Louis Armstrong", [m("andreeva", "tjen"), m("zverev", "sonego")], {
      price: price(170, 220, 480),
      crowd: crowd(68, "Top seed Zverev"),
    }),
    ven("Grandstand", [m("keys", "korneeva"), m("deminaur", "guerrieri")], {
      price: price(140, 190, 360),
      crowd: crowd(62, "Keys"),
    }),
    ven("Stadium 17", [m("jovic", "frech"), m("cobolli", "comesana")], {
      ticketed: false,
      crowd: crowd(50, "Rising Americans"),
    }),
    ven("Court 6", [m("rybakina", "frodin"), m("sakkari", "montgomery")], { crowd: crowd(48, "Rybakina walk-up") }),
    ven("Court 7", [m("putintseva", "bencic"), m("musetti", "fery")], { crowd: crowd(41, "Open") }),
    ven("Court 11", [m("kasatkina", "badosa"), m("jodar", "kokkinakis")], { crowd: crowd(39, "Open") }),
    ven("Grounds", [], { price: price(65, 244, 340), crowd: crowd(75, "Tuesday grounds") }),
  ],
  { sessionNumber: 5, groundsPrice: 244, groundsList: 65, price: price(260, 290, 640) }
);

session(
  "s6-night",
  "2026-09-01",
  "night",
  [
    ven("Arthur Ashe", [m("rybakina", "frodin"), m("fritz", "blanch")], {
      price: price(120, 150, 520),
      crowd: crowd(64, "Rybakina night"),
    }),
    ven("Louis Armstrong", [m("gauff", "sonmez"), m("deminaur", "guerrieri")], {
      price: price(140, 180, 390),
      crowd: crowd(66, "Coco overflow"),
    }),
    ven("Grandstand", [m("keys", "korneeva")], {
      ticketed: false,
      ticketNote: "Covered by Session 5 Grandstand day ticket",
      crowd: crowd(45, "Keys late"),
    }),
    ven("Stadium 17", [m("eala", "stoiana")], { ticketed: false, crowd: crowd(30, "Quiet") }),
    ven("Court 10", [m("sakkari", "montgomery")], { crowd: crowd(22, "Night field") }),
    ven("Grounds", [], { price: price(65, 160, 240), crowd: crowd(52, "Weeknight") }),
  ],
  { sessionNumber: 6, groundsPrice: 160, groundsList: 65, price: price(120, 150, 520) }
);

const SESSION_META = {
  7: { date: "2026-09-02", dayNight: "day", round: "R64", ashe: 240, grounds: 80 },
  8: { date: "2026-09-02", dayNight: "night", round: "R64", ashe: 210, grounds: 70 },
  9: { date: "2026-09-03", dayNight: "day", round: "R64", ashe: 230, grounds: 85 },
  10: { date: "2026-09-03", dayNight: "night", round: "R64", ashe: 200, grounds: 72 },
  11: { date: "2026-09-04", dayNight: "day", round: "R32", ashe: 260, grounds: 95 },
  12: { date: "2026-09-04", dayNight: "night", round: "R32", ashe: 280, grounds: 88 },
  13: { date: "2026-09-05", dayNight: "day", round: "R32", ashe: 280, grounds: 110 },
  14: { date: "2026-09-05", dayNight: "night", round: "R32", ashe: 300, grounds: 95 },
  15: { date: "2026-09-06", dayNight: "day", round: "R16", ashe: 320, grounds: 140 },
  16: { date: "2026-09-06", dayNight: "night", round: "R16", ashe: 380, grounds: 120 },
  17: { date: "2026-09-07", dayNight: "day", round: "R16", ashe: 340, grounds: 150 },
  18: { date: "2026-09-07", dayNight: "night", round: "R16", ashe: 400, grounds: 130 },
  19: { date: "2026-09-08", dayNight: "day", round: "QF", ashe: 410, grounds: 180 },
  20: { date: "2026-09-08", dayNight: "night", round: "QF", ashe: 520, grounds: 160 },
  21: { date: "2026-09-09", dayNight: "day", round: "QF", ashe: 430, grounds: 190 },
  22: { date: "2026-09-09", dayNight: "night", round: "QF", ashe: 560, grounds: 170 },
  23: { date: "2026-09-10", dayNight: "night", round: "SF", ashe: 480, grounds: 140 },
  24: { date: "2026-09-11", dayNight: "day", round: "SF", ashe: 520, grounds: 220 },
  25: { date: "2026-09-11", dayNight: "night", round: "SF", ashe: 640, grounds: 200 },
  26: { date: "2026-09-12", dayNight: "day", round: "W Final", ashe: 680, grounds: 280 },
  27: { date: "2026-09-13", dayNight: "day", round: "M Final", ashe: 820, grounds: 310 },
};

for (const n of Object.keys(SESSION_META).map(Number).sort((a, b) => a - b)) {
  const meta = SESSION_META[n];
  const round = meta.round;
  const empty = [{ player1Id: null, player2Id: null, status: "projected", round, order: 1 }];
  const venues = [
    ven("Arthur Ashe", empty, {
      ticketed: true,
      price: price(Math.round(meta.ashe * 0.55), meta.ashe, Math.round(meta.ashe * 2.4)),
      crowd: crowd(50, "Projected"),
    }),
  ];
  if (ARMSTRONG_TICKETS.has(n)) {
    venues.push(
      ven("Louis Armstrong", empty, {
        ticketed: true,
        price: price(Math.round(meta.ashe * 0.4), Math.round(meta.ashe * 0.65), Math.round(meta.ashe * 1.3)),
        crowd: crowd(44, "Projected"),
      })
    );
  }
  if (GRANDSTAND_TICKETS.has(n)) {
    venues.push(
      ven("Grandstand", empty, {
        ticketed: true,
        price: price(90, Math.round(meta.ashe * 0.38), Math.round(meta.ashe * 0.85)),
        crowd: crowd(40, "Projected"),
      })
    );
  } else if (n <= 14 && meta.dayNight === "night") {
    venues.push(
      ven("Grandstand", empty, {
        ticketed: false,
        ticketNote: "Covered by Session " + (n - 1) + " Grandstand day ticket",
        crowd: crowd(28, "Day ticket holds"),
      })
    );
  }
  if (n <= 14) {
    venues.push(ven("Stadium 17", empty, { ticketed: false, crowd: crowd(30, "GA / grounds") }));
  }
  venues.push(ven("Court 5", empty, { crowd: crowd(24, "Projected field") }));
  venues.push(
    ven("Grounds", [], {
      ticketed: true,
      price: price(70, meta.grounds, Math.round(meta.grounds * 1.55)),
      crowd: crowd(meta.dayNight === "night" ? 42 : 55, "Projected grounds"),
    })
  );
  session("s" + n + "-" + meta.dayNight, meta.date, meta.dayNight, venues, {
    sessionNumber: n,
    groundsPrice: meta.grounds,
    groundsList: 70,
    price: price(Math.round(meta.ashe * 0.55), meta.ashe, Math.round(meta.ashe * 2.4)),
    projectedRound: round,
  });
}

const snapshot = {
  asOf: "2026-08-31T16:00:00-04:00",
  tournament: "2026 US Open",
  venueCampus: "USTA Billie Jean King National Tennis Center",
  sourceNotes:
    "Draws and Day 1 scores from public US Open / AP / Sky Sports reports on 30–31 Aug 2026. Session prices are resale get-in snapshots (TicketIQ / SeatData / published face).",
  players,
  h2h,
  brackets: {
    ms: { id: "ms", name: "Men's Singles", size: 128, bestOf: 5, opening: menR128 },
    ws: { id: "ws", name: "Women's Singles", size: 128, bestOf: 3, opening: womenR128 },
    md: { id: "md", name: "Men's Doubles", size: 64, bestOf: 3, opening: mdOpening },
    wd: { id: "wd", name: "Women's Doubles", size: 64, bestOf: 3, opening: wdOpening },
    xd: { id: "xd", name: "Mixed Doubles", size: 16, bestOf: 3, opening: mixedOpening, later: mixedLater },
  },
  sessions,
};

const jsonPath = path.join(__dirname, "snapshot.json");
const jsPath = path.join(__dirname, "..", "js", "snapshot.js");
const json = JSON.stringify(snapshot);
fs.writeFileSync(jsonPath, json);
const js =
  "(function (global) {\n" +
  "  var snapshot = " +
  json +
  ";\n" +
  "  global.USOPEN_SNAPSHOT = snapshot;\n" +
  "  if (typeof module !== 'undefined' && module.exports) module.exports = snapshot;\n" +
  "})(typeof globalThis !== 'undefined' ? globalThis : this);\n";
fs.writeFileSync(jsPath, js);
console.log("players", Object.keys(players).length);
console.log("men", menR128.length, "women", womenR128.length, "md", mdOpening.length, "wd", wdOpening.length, "xd", mixedOpening.length);
console.log("sessions", sessions.length);
console.log("wrote", jsonPath, "and", jsPath, "bytes", js.length);
