import { useState, useEffect } from "react";
import { Station, STATIONS } from "@/data/stations";

export const useStations = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStations = async () => {
    setLoading(true);
    setError(null);
    // Prototype: simulate latency and return static stations
    await new Promise(r => setTimeout(r, 300));
    setStations(STATIONS as unknown as Station[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const refetchStations = async () => {
    await fetchStations();
  };

  return {
    stations,
    loading,
    error,
    refetchStations,
  };
};
