// Default instrument images shown when a genre has no real products yet.
// Uses Unsplash CDN photo IDs — stable, no API key needed.
// Replace any entry with a real Cloudinary URL once a product is added for that genre.

type FallbackImage = { src: string; alt: string; width: number; height: number };

const u = (id: string, w: number, h: number, alt: string): FallbackImage => ({
  src: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`,
  alt,
  width: w,
  height: h,
});

export const GENRE_DEFAULTS: Record<string, FallbackImage[]> = {
  HIP_HOP: [
    u("photo-1571974599782-87624638275d", 800, 533, "DJ Turntable"),
    u("photo-1493225457124-a3eb161ffa5f", 533, 800, "Stage Microphone"),
    u("photo-1508700115892-45ecd05ae2ad", 800, 533, "Drum Machine"),
    u("photo-1614680889675-e7f1f3ee0e36", 600, 600, "Beat Pad"),
    u("photo-1598453257662-32e39e36c56a", 600, 900, "Mic Stand"),
    u("photo-1598488035139-bdbb2231ce04", 800, 533, "Sampler"),
  ],
  CLASSICAL: [
    u("photo-1511192336575-5a79af67a629", 533, 800, "Violin"),
    u("photo-1520523839897-bd0b52f945a0", 800, 533, "Piano Keys"),
    u("photo-1598035986813-a7a6a8ee79a9", 533, 800, "Cello"),
    u("photo-1555685812-4b943f1cb0eb", 800, 533, "Grand Piano"),
    u("photo-1529524744115-97c1cbb78b94", 533, 800, "Harp"),
    u("photo-1519508234439-4f23643125c1", 533, 800, "Viola"),
  ],
  JAZZ: [
    u("photo-1415201364774-f6f0bb35f28f", 533, 800, "Saxophone"),
    u("photo-1534534629-af462e7b2a02", 533, 800, "Trumpet"),
    u("photo-1520523839897-bd0b52f945a0", 800, 533, "Jazz Piano"),
    u("photo-1558584673-c834fb1cc3ca", 533, 800, "Double Bass"),
    u("photo-1519892300165-cb5542fb47c7", 800, 533, "Jazz Drums"),
    u("photo-1511376777868-f9a6ba7843ad", 800, 533, "Jazz Club Stage"),
  ],
  ROCK_METAL: [
    u("photo-1510915361894-db8b60106cb1", 800, 533, "Electric Guitar"),
    u("photo-1519892300165-cb5542fb47c7", 800, 533, "Drum Kit"),
    u("photo-1558098329-a11cff621064", 533, 800, "Bass Guitar"),
    u("photo-1558584673-c834fb1cc3ca", 533, 800, "Guitar Neck"),
    u("photo-1551355738-1875b5a87fa3", 800, 533, "Guitar Amp"),
    u("photo-1564186763535-ebb21ef5277f", 533, 800, "Guitar Body"),
  ],
  ELECTRONIC: [
    u("photo-1598488035139-bdbb2231ce04", 800, 533, "Synthesizer"),
    u("photo-1558865869-c93de47f8d89", 800, 533, "MIDI Controller"),
    u("photo-1571974599782-87624638275d", 800, 533, "DJ Deck"),
    u("photo-1516280440614-37939bbacd81", 800, 533, "Music Production"),
    u("photo-1614680889675-e7f1f3ee0e36", 600, 600, "Beat Machine"),
    u("photo-1508700115892-45ecd05ae2ad", 800, 533, "Step Sequencer"),
  ],
  COUNTRY_FOLK: [
    u("photo-1510915361894-db8b60106cb1", 800, 533, "Acoustic Guitar"),
    u("photo-1593697908869-3dd593b7b0c3", 533, 800, "Harmonica"),
    u("photo-1511192336575-5a79af67a629", 533, 800, "Fiddle"),
    u("photo-1583309219338-0c553ff4c6f9", 533, 800, "Guitar Close-up"),
    u("photo-1625650419540-20cf9c2b8fa2", 533, 800, "Banjo"),
    u("photo-1512733596533-7b627a501393", 800, 533, "Folk Stage"),
  ],
  REGGAE: [
    u("photo-1558098329-a11cff621064", 533, 800, "Bass Guitar"),
    u("photo-1519892300165-cb5542fb47c7", 800, 533, "Drum Kit"),
    u("photo-1510915361894-db8b60106cb1", 800, 533, "Guitar"),
    u("photo-1571974599782-87624638275d", 800, 533, "Sound System"),
    u("photo-1493225457124-a3eb161ffa5f", 533, 800, "Microphone"),
    u("photo-1520523839897-bd0b52f945a0", 800, 533, "Keyboard"),
  ],
  BLUES_SOUL: [
    u("photo-1510915361894-db8b60106cb1", 800, 533, "Blues Guitar"),
    u("photo-1520523839897-bd0b52f945a0", 800, 533, "Upright Piano"),
    u("photo-1593697908869-3dd593b7b0c3", 533, 800, "Harmonica"),
    u("photo-1415201364774-f6f0bb35f28f", 533, 800, "Saxophone"),
    u("photo-1534534629-af462e7b2a02", 533, 800, "Trumpet"),
    u("photo-1519892300165-cb5542fb47c7", 800, 533, "Soul Drums"),
  ],
};
