// Centralized station data and interfaces for the frontend application

export interface Station {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number];
  distance?: string;
  rating?: number;
  image?: string;
  charged: number;
  total: number;
  status: "ok" | "at-risk" | "shortage";
  percentage?: number;
  predictedEmptyIn?: string | null;
  forecast?: number[];
  swapFee?: number; // in STK tokens
  availableBatteries?: number;
  totalSlots?: number;
}

// Comprehensive station data for Seoul area
export const STATIONS: Station[] = [
  {
    id: "A",
    name: "Gwanghwamun EV Hub",
    location: "Gwanghwamun Square, Jongno-gu, Seoul",
    coordinates: [126.977, 37.571],
    distance: "0.3 km",
    rating: 4.7,
    image: "/battery-1.png",
    charged: 16,
    total: 20,
    status: "ok",
    percentage: 80,
    predictedEmptyIn: null,
    forecast: [14, 16, 18, 17, 15, 12, 10],
    swapFee: 5,
    availableBatteries: 9,
    totalSlots: 10,
  },
  {
    id: "B",
    name: "Gangnam Station Power Point",
    location: "Gangnam-daero, Seocho-gu, Seoul",
    coordinates: [127.0276, 37.4979],
    distance: "6.8 km",
    rating: 4.5,
    image: "/battery-1.png",
    charged: 7,
    total: 20,
    status: "at-risk",
    percentage: 35,
    predictedEmptyIn: "3.0 hours",
    forecast: [9, 7, 5, 3, 2, 3, 6],
    swapFee: 5,
    availableBatteries: 4,
    totalSlots: 10,
  },
  {
    id: "C",
    name: "Jamsil Lotte World Center",
    location: "Olympic-ro, Songpa-gu, Seoul",
    coordinates: [127.1002, 37.5113],
    distance: "10.9 km",
    rating: 4.2,
    image: "/battery-1.png",
    charged: 0,
    total: 20,
    status: "shortage",
    percentage: 0,
    predictedEmptyIn: "CRITICAL",
    forecast: [8, 5, 3, 1, 0, 0, 0],
    swapFee: 5,
    availableBatteries: 0,
    totalSlots: 10,
  },
  {
    id: "D",
    name: "Hongdae EV Plaza",
    location: "Hongik-ro, Mapo-gu, Seoul",
    coordinates: [126.9237, 37.5572],
    distance: "4.5 km",
    rating: 4.6,
    image: "/battery-1.png",
    charged: 18,
    total: 20,
    status: "ok",
    percentage: 90,
    predictedEmptyIn: null,
    forecast: [15, 18, 20, 18, 16, 14, 12],
    swapFee: 5,
    availableBatteries: 10,
    totalSlots: 10,
  },
  {
    id: "E",
    name: "Yeouido Finance District",
    location: "Yeoui-daero, Yeongdeungpo-gu, Seoul",
    coordinates: [126.924, 37.521],
    distance: "6.2 km",
    rating: 4.4,
    image: "/battery-1.png",
    charged: 9,
    total: 20,
    status: "ok",
    percentage: 45,
    predictedEmptyIn: null,
    forecast: [7, 9, 11, 9, 7, 5, 4],
    swapFee: 5,
    availableBatteries: 5,
    totalSlots: 10,
  },
  {
    id: "F",
    name: "COEX Samseong Station",
    location: "Teheran-ro, Gangnam-gu, Seoul",
    coordinates: [127.0606, 37.5101],
    distance: "8.1 km",
    rating: 4.3,
    image: "/battery-1.png",
    charged: 12,
    total: 20,
    status: "ok",
    percentage: 60,
    predictedEmptyIn: null,
    forecast: [10, 12, 14, 12, 10, 8, 6],
    swapFee: 5,
    availableBatteries: 6,
    totalSlots: 10,
  }
];

// Helper functions
export const getStationById = (id: string): Station | undefined => {
  return STATIONS.find(station => station.id === id);
};

export const getStationByNumericId = (id: number): Station | undefined => {
  return STATIONS.find(station => station.id === id.toString() || station.id === String.fromCharCode(64 + id));
};

export const getStationStatus = (charged: number, total: number): "ok" | "at-risk" | "shortage" => {
  const percentage = (charged / total) * 100;
  if (percentage === 0) return "shortage";
  if (percentage <= 30) return "at-risk";
  return "ok";
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case "ok":
      return "#10b981"; // emerald-500
    case "at-risk":
      return "#f59e0b"; // amber-500
    case "shortage":
      return "#ef4444"; // red-500
    default:
      return "#6b7280"; // gray-500
  }
};

// AI route data (previously scattered in dashboard)
export interface AIRoute {
  id: string;
  from: string;
  to: string;
  fromCoords: [number, number];
  toCoords: [number, number];
  batteries: number;
  eta: string;
  priority: "critical" | "high" | "normal";
  reason: string;
}

export const AI_ROUTES: AIRoute[] = [
  {
    id: "route1",
    from: "D",
    to: "C",
    fromCoords: [126.9237, 37.5572], // From Hongdae
    toCoords: [127.1002, 37.5113], // To Jamsil
    batteries: 8,
    eta: "22 min",
    priority: "critical",
    reason: "Station C is out of batteries",
  },
  {
    id: "route2", 
    from: "A",
    to: "B",
    fromCoords: [126.977, 37.571], // From Gwanghwamun
    toCoords: [127.0276, 37.4979], // To Gangnam Station
    batteries: 4,
    eta: "18 min",
    priority: "high",
    reason: "Station B predicted shortage in ~3h",
  }
];

// AI alerts data
export interface AIAlert {
  id: string;
  type: "shortage" | "prediction" | "optimization";
  station: string;
  message: string;
  severity: "critical" | "warning" | "info";
  timeAgo: string;
}

export const AI_ALERTS: AIAlert[] = [
  {
    id: "alert1",
    type: "shortage",
    station: "C",
    message: "Station C (Jamsil) is out of batteries! Immediate action required.",
    severity: "critical",
    timeAgo: "2 min ago",
  },
  {
    id: "alert2",
    type: "prediction",
    station: "B",
    message: "Station B (Gangnam) will run out in ~3 hours based on demand patterns.",
    severity: "warning",
    timeAgo: "5 min ago",
  },
  {
    id: "alert3",
    type: "prediction",
    station: "E",
    message: "Station E (Yeouido) may run low in ~2 hours based on demand patterns.",
    severity: "warning",
    timeAgo: "7 min ago",
  },
  {
    id: "alert4",
    type: "optimization",
    station: "All",
    message: "Route optimization complete. 3 truck routes suggested for efficiency.",
    severity: "info",
    timeAgo: "10 min ago",
  }
];
