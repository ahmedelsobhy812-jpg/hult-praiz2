/* Countries (with calling codes) and Egypt's governorates and cities.
   For other countries the governorate and city are free text. */
window.HP_LOCATIONS = (function () {
  var COUNTRIES = [
    ["Egypt", "+20"], ["Saudi Arabia", "+966"], ["United Arab Emirates", "+971"], ["Kuwait", "+965"],
    ["Qatar", "+974"], ["Bahrain", "+973"], ["Oman", "+968"], ["Jordan", "+962"], ["Lebanon", "+961"],
    ["Iraq", "+964"], ["Syria", "+963"], ["Palestine", "+970"], ["Libya", "+218"], ["Sudan", "+249"],
    ["Tunisia", "+216"], ["Algeria", "+213"], ["Morocco", "+212"], ["Yemen", "+967"], ["Turkey", "+90"],
    ["United Kingdom", "+44"], ["United States", "+1"], ["Canada", "+1"], ["Germany", "+49"], ["France", "+33"],
    ["Italy", "+39"], ["Spain", "+34"], ["Netherlands", "+31"], ["Sweden", "+46"], ["Switzerland", "+41"],
    ["Russia", "+7"], ["India", "+91"], ["Pakistan", "+92"], ["China", "+86"], ["Japan", "+81"],
    ["South Korea", "+82"], ["Australia", "+61"], ["Brazil", "+55"], ["South Africa", "+27"],
    ["Nigeria", "+234"], ["Kenya", "+254"], ["Ethiopia", "+251"]
  ];

  var EGYPT = {
    "Cairo": ["Nasr City", "Heliopolis", "Maadi", "New Cairo", "Shubra", "Helwan", "Zamalek", "Other"],
    "Giza": ["Dokki", "Mohandessin", "6th of October City", "Sheikh Zayed", "Haram", "Imbaba", "Other"],
    "Alexandria": ["Montaza", "Sidi Gaber", "Smouha", "Borg El Arab", "Agami", "Miami", "Other"],
    "Qalyubia": ["Banha", "Shubra El Kheima", "Qalyub", "Khanka", "Other"],
    "Port Said": ["Port Said City", "Port Fouad", "Other"],
    "Suez": ["Suez City", "Arbaeen", "Other"],
    "Damietta": ["Damietta City", "New Damietta", "Ras El Bar", "Other"],
    "Dakahlia": ["Mansoura", "Talkha", "Mit Ghamr", "Belqas", "Other"],
    "Sharqia": ["Zagazig", "10th of Ramadan City", "Belbeis", "Abu Hammad", "Other"],
    "Gharbia": ["Tanta", "El Mahalla El Kubra", "Kafr El Zayat", "Zefta", "Other"],
    "Monufia": ["Shebin El Kom", "Menouf", "Sadat City", "Ashmoun", "Other"],
    "Beheira": ["Damanhur", "Kafr El Dawwar", "Rashid", "Edku", "Other"],
    "Kafr El Sheikh": ["Kafr El Sheikh City", "Desouk", "Baltim", "Fuwa", "Other"],
    "Ismailia": ["Ismailia City", "Fayed", "Qantara", "Other"],
    "Faiyum": ["Faiyum City", "Sinnuris", "Tamiya", "Other"],
    "Beni Suef": ["Beni Suef City", "Nasser", "El Wasta", "Other"],
    "Minya": ["Minya City", "Mallawi", "Samalut", "Maghagha", "Other"],
    "Asyut": ["Asyut City", "Dairut", "Manfalut", "Abnub", "Other"],
    "Sohag": ["Sohag City", "Akhmim", "Girga", "Tahta", "Other"],
    "Qena": ["Qena City", "Nag Hammadi", "Qus", "Other"],
    "Luxor": ["Luxor City", "Armant", "Esna", "Other"],
    "Aswan": ["Aswan City", "Edfu", "Kom Ombo", "Other"],
    "Red Sea": ["Hurghada", "Safaga", "Marsa Alam", "Other"],
    "New Valley": ["Kharga", "Dakhla", "Other"],
    "Matrouh": ["Marsa Matrouh", "El Alamein", "Siwa", "Other"],
    "North Sinai": ["Arish", "Sheikh Zuweid", "Other"],
    "South Sinai": ["Sharm El Sheikh", "Dahab", "El Tor", "Other"]
  };

  var codes = [];
  COUNTRIES.forEach(function (c) { if (codes.indexOf(c[1]) < 0) codes.push(c[1]); });

  return {
    COUNTRIES: COUNTRIES,
    COUNTRY_NAMES: COUNTRIES.map(function (c) { return c[0]; }),
    CALLING_CODES: codes,
    EGYPT: EGYPT,
    callingCodeFor: function (country) {
      for (var i = 0; i < COUNTRIES.length; i++) if (COUNTRIES[i][0] === country) return COUNTRIES[i][1];
      return "";
    }
  };
})();
