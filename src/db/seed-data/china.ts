import type { SeedCountry } from "./types";

const china: SeedCountry = {
  code: "CN",
  name: "China",
  slug: "china",
  wikidataId: "Q148",
  motif: "dragon",
  emoji: "🇨🇳",
  summary:
    "Imperial capitals, terracotta armies and sandstone pillars — China spans dense history and dramatic landscapes.",
  cities: [
    {
      name: "Beijing",
      slug: "beijing",
      wikidataId: "Q956",
      summary: "The imperial capital: palaces, hutongs and the Great Wall within reach.",
      lat: 39.9042,
      lng: 116.4074,
      places: [
        {
          name: "Great Wall at Mutianyu",
          slug: "great-wall-mutianyu",
          events: [
            {
              name: "Autumn foliage on the ramparts",
              slug: "autumn-foliage",
              description:
                "The forested slopes below Mutianyu turn red and gold — the most photogenic weeks on this section.",
              startMonth: 10,
              endMonth: 11,
            },
          ],
          bestMonths: [4, 5, 9, 10],
          seasonNote:
            "Spring and autumn are clear and mild; midsummer is hazy and crowded, winter sections can ice over.",
          collectibles: [
            {
              name: "Great Wall climbing certificate",
              slug: "climbing-certificate",
              kind: "book",
              description:
                "A personalised certificate recording that you climbed the Wall, printed with your name and the date.",
              whereToGet: "Souvenir shops near the Mutianyu cable car station",
              cost: 30,
            },
          ],
      wikidataId: "Q12501",
          kind: "attraction",
          summary: "Restored, forested stretch of wall that stays far quieter than Badaling.",
          lat: 40.4319,
          lng: 116.5704,
          visitMinutes: 300,
        },
        {
          name: "Forbidden City",
          slug: "forbidden-city",
          bestMonths: [4, 5, 9, 10],
          seasonNote: "Shoulder seasons avoid both summer crowds and Beijing's winter cold.",
          collectibles: [
            {
              name: "Palace Museum seal stamp",
              slug: "palace-seal-stamp",
              kind: "stamp",
              description:
                "Free self-service ink stamps of imperial seals, placed at gates and halls along the route.",
              whereToGet: "Stamp tables inside the main halls",
            },
          ],
      wikidataId: "Q80290",
          kind: "culture",
          summary: "Ming and Qing imperial palace complex at the city's heart.",
          lat: 39.9163,
          lng: 116.3972,
          visitMinutes: 240,
        },
        {
          name: "Temple of Heaven",
          slug: "temple-of-heaven",
          events: [
            {
              name: "Spring Festival temple fair",
              slug: "spring-festival-fair",
              description:
                "Lunar New Year fair with a re-enactment of the imperial heaven-worship ceremony, plus food and folk performance stalls.",
              startMonth: 1,
              endMonth: 2,
            },
          ],
          bestMonths: [4, 5, 9, 10],
          seasonNote: "Come early: the surrounding park fills with morning tai chi and music.",
          collectibles: [
            {
              name: "Temple of Heaven commemorative ticket",
              slug: "commemorative-ticket",
              kind: "souvenir",
              description:
                "An illustrated keepsake ticket sold alongside the standard entry ticket.",
              whereToGet: "Main ticket office, east gate",
              cost: 20,
            },
          ],
      wikidataId: "Q125445",
          kind: "culture",
          summary: "Ming-era ritual complex ringed by a park full of morning tai chi.",
          lat: 39.8822,
          lng: 116.4066,
          visitMinutes: 150,
        },
        {
          name: "Jingshan Park",
          slug: "jingshan-park",
          events: [
            {
              name: "Peony season",
              slug: "peony-season",
              description:
                "Hundreds of peony varieties flower across the hillside — the park's busiest and most photographed weeks.",
              startMonth: 4,
              endMonth: 5,
            },
          ],
          bestMonths: [3, 4, 10, 11],
          seasonNote: "Peonies in spring, golden foliage in late autumn over the Forbidden City rooftops.",
      wikidataId: "Q734499",
          kind: "hidden_gem",
          summary: "Hilltop pavilion with the best rooftop view over the Forbidden City.",
          lat: 39.9242,
          lng: 116.3903,
          visitMinutes: 90,
        },
      ],
    },
    {
      name: "Xi'an",
      slug: "xian",
      wikidataId: "Q5826",
      summary: "Ancient Silk Road terminus, walled city and home of the Terracotta Army.",
      lat: 34.3416,
      lng: 108.9398,
      places: [
        {
          name: "Terracotta Army",
          slug: "terracotta-army",
          bestMonths: [3, 4, 5, 9, 10],
          seasonNote: "The pits are covered, so weather matters less than crowds — avoid national holidays.",
          collectibles: [
            {
              name: "Warrior replica figurine",
              slug: "warrior-figurine",
              kind: "souvenir",
              description:
                "Officially licensed replica of a terracotta warrior, boxed with a certificate.",
              whereToGet: "Museum gift shop by the exit of Pit 1",
              cost: 120,
            },
          ],
      wikidataId: "Q47672",
          kind: "attraction",
          summary: "Thousands of life-size funerary figures guarding Qin Shi Huang's tomb.",
          lat: 34.3841,
          lng: 109.2785,
          visitMinutes: 240,
        },
        {
          name: "Xi'an City Wall",
          slug: "xian-city-wall",
          events: [
            {
              name: "City Wall lantern festival",
              slug: "lantern-festival",
              description:
                "The ramparts are lit with thousands of lanterns through the Lunar New Year period.",
              startMonth: 1,
              endMonth: 2,
            },
          ],
          bestMonths: [4, 5, 9, 10],
          seasonNote: "Cycling the 14km circuit is punishing in July heat.",
      wikidataId: "Q1334336",
          kind: "culture",
          summary: "Intact Ming fortification you can cycle the full 14km circuit of.",
          lat: 34.2611,
          lng: 108.9422,
          visitMinutes: 150,
        },
        {
          name: "Muslim Quarter",
          slug: "muslim-quarter",
          seasonNote: "Busiest and best after dark, year-round.",
          kind: "food",
          summary: "Night food streets: hand-pulled noodles, roujiamo and persimmon cakes.",
          lat: 34.2667,
          lng: 108.9403,
          visitMinutes: 120,
        },
      ],
    },
    {
      name: "Zhangjiajie",
      slug: "zhangjiajie",
      wikidataId: "Q197379",
      summary: "Quartz-sandstone pillars and canyon walkways in subtropical forest.",
      lat: 29.1170,
      lng: 110.4794,
      places: [
        {
          name: "Zhangjiajie National Forest Park",
          slug: "zhangjiajie-national-forest-park",
          events: [
            {
              name: "Autumn colour season",
              slug: "autumn-colour",
              description:
                "Clearest skies of the year and turning foliage between the sandstone pillars.",
              startMonth: 10,
              endMonth: 11,
            },
          ],
          bestMonths: [4, 5, 9, 10],
          seasonNote:
            "Avoid June-August monsoon rain; autumn brings the clearest views of the pillars.",
          collectibles: [
            {
              name: "Park passport booklet",
              slug: "park-passport",
              kind: "passport",
              description:
                "Booklet stamped at each scenic viewpoint — a record of how much of the park you covered.",
              whereToGet: "Visitor centre at the main park entrance",
              cost: 25,
            },
          ],
      wikidataId: "Q3895620",
          kind: "nature",
          summary: "The sandstone pillar landscape that inspired Avatar's floating mountains.",
          lat: 29.3155,
          lng: 110.4344,
          visitMinutes: 480,
        },
        {
          name: "Tianmen Mountain",
          slug: "tianmen-mountain",
          bestMonths: [4, 5, 9, 10],
          seasonNote: "The glass walkway closes in ice and heavy cloud; clear autumn days are best.",
          collectibles: [
            {
              name: "Heaven's Gate 999 steps badge",
              slug: "heavens-gate-badge",
              kind: "badge",
              description:
                "Enamel pin awarded for climbing all 999 steps to the Heaven's Gate arch.",
              whereToGet: "Kiosk at the top of the stairway",
              cost: 35,
            },
          ],
      wikidataId: "Q3861073",
          kind: "nature",
          summary: "Cable car, cliff-edge glass walkways and the Heaven's Gate arch.",
          lat: 29.0500,
          lng: 110.4833,
          visitMinutes: 360,
        },
      ],
    },
  ],
};

export default china;
