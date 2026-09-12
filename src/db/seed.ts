import { sql } from "drizzle-orm";
import { client, db } from "./client";

type SeedCollectible = {
  name: string;
  slug: string;
  kind: "stamp" | "passport" | "souvenir" | "book" | "badge";
  description: string;
  whereToGet: string;
  cost?: number;
};

type SeedPlace = {
  name: string;
  slug: string;
  wikidataId?: string;
  collectibles?: SeedCollectible[];
  kind: "attraction" | "nature" | "culture" | "food" | "hidden_gem";
  summary: string;
  lat: number;
  lng: number;
  visitMinutes: number;
};

type SeedCity = {
  name: string;
  slug: string;
  wikidataId?: string;
  summary: string;
  lat: number;
  lng: number;
  places: SeedPlace[];
};

const CHINA: { code: string; name: string; slug: string; wikidataId: string; emoji: string; summary: string; cities: SeedCity[] } = {
  code: "CN",
  name: "China",
  slug: "china",
  wikidataId: "Q148",
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

async function main() {
  await db.transaction(async (tx) => {
    // Seed is idempotent: cities/places cascade from the country row.
    await tx.execute(sql`DELETE FROM countries WHERE code = ${CHINA.code}`);

    const [country] = await tx.execute<{ id: string }>(sql`
      INSERT INTO countries (code, name, slug, summary, emoji, wikidata_id)
      VALUES (${CHINA.code}, ${CHINA.name}, ${CHINA.slug}, ${CHINA.summary}, ${CHINA.emoji}, ${CHINA.wikidataId})
      RETURNING id
    `);

    for (const city of CHINA.cities) {
      const [inserted] = await tx.execute<{ id: string }>(sql`
        INSERT INTO cities (country_id, name, slug, summary, location, wikidata_id)
        VALUES (
          ${country.id},
          ${city.name},
          ${city.slug},
          ${city.summary},
          ST_SetSRID(ST_MakePoint(${city.lng}, ${city.lat}), 4326),
          ${city.wikidataId ?? null}
        )
        RETURNING id
      `);

      for (const place of city.places) {
        const [insertedPlace] = await tx.execute<{ id: string }>(sql`
          INSERT INTO places (city_id, name, slug, kind, summary, location, visit_minutes, wikidata_id)
          VALUES (
            ${inserted.id},
            ${place.name},
            ${place.slug},
            ${place.kind},
            ${place.summary},
            ST_SetSRID(ST_MakePoint(${place.lng}, ${place.lat}), 4326),
            ${place.visitMinutes},
            ${place.wikidataId ?? null}
          )
          RETURNING id
        `);

        for (const item of place.collectibles ?? []) {
          await tx.execute(sql`
            INSERT INTO collectibles (place_id, name, slug, kind, description, where_to_get, cost)
            VALUES (
              ${insertedPlace.id},
              ${item.name},
              ${item.slug},
              ${item.kind}::collectible_kind,
              ${item.description},
              ${item.whereToGet},
              ${item.cost ?? null}
            )
          `);
        }
      }
    }
  });

  const placeCount = CHINA.cities.reduce((n, c) => n + c.places.length, 0);
  const collectibleCount = CHINA.cities.reduce(
    (n, c) => n + c.places.reduce((m, p) => m + (p.collectibles?.length ?? 0), 0),
    0,
  );
  console.log(
    `seeded ${CHINA.name}: ${CHINA.cities.length} cities, ${placeCount} places, ${collectibleCount} collectibles`,
  );
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
