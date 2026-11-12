/**
 * MORNING. — business details
 * ------------------------------------------------------------------
 * Every phone number, address, link and opening hour on the website
 * is read from this one file. Replace the SAMPLE values below with the
 * client's real details before launch — nothing else needs editing.
 */
window.MORNING_CONFIG = {
  // SAMPLE phone number — used for every "Call to Reserve" button (tel: link)
  phoneDisplay: "+995 555 00 00 00",
  phoneHref: "+995555000000",

  // SAMPLE address (shown per language)
  address: {
    en: "00 Sample Street, Vake, Tbilisi 0179",
    ka: "სანიმუშო ქ. 00, ვაკე, თბილისი 0179",
  },

  // What Google Maps should search for (embed + "Get directions")
  mapQuery: "Vake Park, Tbilisi, Georgia",

  // Social profiles — replace with the cafe's real pages
  instagramHandle: "@morning.cafe",
  instagramUrl: "https://www.instagram.com/",
  facebookUrl: "https://www.facebook.com/",

  // Opening hours (0 = Sunday … 6 = Saturday), local time in `timeZone`
  timeZone: "Asia/Tbilisi",
  hours: [
    { days: [1, 2, 3, 4, 5], open: "08:00", close: "21:00", label: "weekdays" },
    { days: [6, 0], open: "09:00", close: "22:00", label: "weekend" },
  ],

  // Shown in the footer / small print. Set to false once real details are in.
  isDemo: true,
};
