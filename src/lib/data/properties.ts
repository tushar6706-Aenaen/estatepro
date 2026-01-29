export type PropertyHighlight = {
  title: string;
};

export type PropertyGalleryItem = {
  id: number;
  className: string;
  style: string;
};

export type Property = {
  id: string;
  badge: string;
  title: string;
  location: string;
  price: string;
  meta: string[];
  theme: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  description: string[];
  highlights: PropertyHighlight[];
  gallery: PropertyGalleryItem[];
};

export const properties: Property[] = [
  {
    id: "123-highland-ave",
    badge: "For Sale",
    title: "123 Highland Ave",
    location: "Seattle, WA",
    price: "$850,000",
    meta: ["3", "2", "2,100"],
    theme: "bg-neutral-900",
    address: "123 Highland Ave",
    city: "Seattle",
    state: "WA",
    zip: "98109",
    description: [
      "Experience refined urban living in this sunlit residence tucked away on a tree-lined street in the heart of Seattle.",
      "The open-plan great room flows into a chef-ready kitchen, while the serene primary suite offers spa-like comfort.",
    ],
    highlights: [
      { title: "Private Pool" },
      { title: "Central Air" },
      { title: "EV Charging" },
      { title: "Gym" },
      { title: "Wine Cellar" },
      { title: "Smart Security" },
    ],
    gallery: [
      {
        id: 1,
        className: "col-span-2 row-span-2",
        style: "bg-[url('/landing_page.png')]",
      },
      {
        id: 2,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 3,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 4,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 5,
        className: "",
        style: "bg-neutral-900",
      },
    ],
  },
  {
    id: "88-slate-road",
    badge: "New",
    title: "88 Slate Road",
    location: "Portland, OR",
    price: "$1,250,000",
    meta: ["4", "3", "2,800"],
    theme: "bg-neutral-900",
    address: "88 Slate Road",
    city: "Portland",
    state: "OR",
    zip: "97205",
    description: [
      "A contemporary retreat with curated finishes and dramatic volumes designed for elevated entertaining.",
      "Thoughtful indoor-outdoor connections capture forest views while still being minutes from city amenities.",
    ],
    highlights: [
      { title: "Private Pool" },
      { title: "Central Air" },
      { title: "EV Charging" },
      { title: "Gym" },
      { title: "Wine Cellar" },
      { title: "Smart Security" },
    ],
    gallery: [
      {
        id: 1,
        className: "col-span-2 row-span-2",
        style: "bg-[url('/landing_page.png')]",
      },
      {
        id: 2,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 3,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 4,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 5,
        className: "",
        style: "bg-neutral-900",
      },
    ],
  },
  {
    id: "45-charcoal-ln",
    badge: "For Sale",
    title: "45 Charcoal Ln",
    location: "Austin, TX",
    price: "$675,000",
    meta: ["2", "2", "1,500"],
    theme: "bg-neutral-900",
    address: "45 Charcoal Ln",
    city: "Austin",
    state: "TX",
    zip: "78701",
    description: [
      "An airy single-level home that blends modern finishes with warm textures and easy access to downtown Austin.",
      "The private backyard is ideal for sunset gatherings and relaxed weekend mornings.",
    ],
    highlights: [
      { title: "Private Pool" },
      { title: "Central Air" },
      { title: "EV Charging" },
      { title: "Gym" },
      { title: "Wine Cellar" },
      { title: "Smart Security" },
    ],
    gallery: [
      {
        id: 1,
        className: "col-span-2 row-span-2",
        style: "bg-[url('/landing_page.png')]",
      },
      {
        id: 2,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 3,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 4,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 5,
        className: "",
        style: "bg-neutral-900",
      },
    ],
  },
  {
    id: "99-blue-sky-blvd",
    badge: "Featured",
    title: "99 Blue Sky Blvd",
    location: "Miami, FL",
    price: "$2,100,000",
    meta: ["5", "4", "4,200"],
    theme: "bg-neutral-900",
    address: "99 Blue Sky Blvd",
    city: "Miami",
    state: "FL",
    zip: "33101",
    description: [
      "A resort-style coastal residence with panoramic water views and breezy, sun-filled interiors.",
      "Designed for effortless entertaining with expansive terraces and a sparkling pool deck.",
    ],
    highlights: [
      { title: "Private Pool" },
      { title: "Central Air" },
      { title: "EV Charging" },
      { title: "Gym" },
      { title: "Wine Cellar" },
      { title: "Smart Security" },
    ],
    gallery: [
      {
        id: 1,
        className: "col-span-2 row-span-2",
        style: "bg-[url('/landing_page.png')]",
      },
      {
        id: 2,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 3,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 4,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 5,
        className: "",
        style: "bg-neutral-900",
      },
    ],
  },
  {
    id: "12-ocean-dr",
    badge: "For Sale",
    title: "12 Ocean Dr",
    location: "San Diego, CA",
    price: "$950,000",
    meta: ["3", "2", "1,900"],
    theme: "bg-neutral-900",
    address: "12 Ocean Dr",
    city: "San Diego",
    state: "CA",
    zip: "92101",
    description: [
      "A bright coastal sanctuary with indoor-outdoor living and a serene courtyard garden.",
      "Clean lines, bespoke finishes, and natural light define every room.",
    ],
    highlights: [
      { title: "Private Pool" },
      { title: "Central Air" },
      { title: "EV Charging" },
      { title: "Gym" },
      { title: "Wine Cellar" },
      { title: "Smart Security" },
    ],
    gallery: [
      {
        id: 1,
        className: "col-span-2 row-span-2",
        style: "bg-[url('/landing_page.png')]",
      },
      {
        id: 2,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 3,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 4,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 5,
        className: "",
        style: "bg-neutral-900",
      },
    ],
  },
  {
    id: "555-pine-st",
    badge: "For Sale",
    title: "555 Pine St",
    location: "Denver, CO",
    price: "$1,500,000",
    meta: ["4", "3.5", "3,100"],
    theme: "bg-neutral-900",
    address: "555 Pine St",
    city: "Denver",
    state: "CO",
    zip: "80202",
    description: [
      "A mountain-modern estate with panoramic views and refined detailing throughout.",
      "The spacious layout supports both work-from-home comfort and entertaining.",
    ],
    highlights: [
      { title: "Private Pool" },
      { title: "Central Air" },
      { title: "EV Charging" },
      { title: "Gym" },
      { title: "Wine Cellar" },
      { title: "Smart Security" },
    ],
    gallery: [
      {
        id: 1,
        className: "col-span-2 row-span-2",
        style: "bg-[url('/landing_page.png')]",
      },
      {
        id: 2,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 3,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 4,
        className: "",
        style: "bg-neutral-900",
      },
      {
        id: 5,
        className: "",
        style: "bg-neutral-900",
      },
    ],
  },
];
