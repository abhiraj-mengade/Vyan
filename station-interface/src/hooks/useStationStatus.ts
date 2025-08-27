import { useState, useEffect } from "react";
// Prototype: no contract reads

interface StationStatus {
  availableBatteries: number;
  totalBatteries: number;
  isActive: boolean;
  batteryLevel: number;
}

// Define the contract station structure based on frontend
interface ContractStation {
  id: string;
  name: string;
  location: string;
  latitude: bigint;
  longitude: bigint;
  operator: string;
  totalSlots: bigint;
  availableSlots: bigint;
  batteries: readonly bigint[];
  isActive: boolean;
  createdAt: bigint;
  baseFee: bigint;
  rating: number;
}

export const useStationStatus = (stationId: string) => {
  const [status, setStatus] = useState<StationStatus>({
    availableBatteries: 12,
    totalBatteries: 20,
    isActive: true,
    batteryLevel: 85
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStationStatus = async () => {
    setLoading(true);
    setError(null);
    // Prototype: simulate latency and random availability
    await new Promise(r => setTimeout(r, 400));
    const total = 20;
    const available = 10 + Math.floor(Math.random() * 9);
    setStatus({
      availableBatteries: available,
      totalBatteries: total,
      isActive: true,
      batteryLevel: 85
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchStationStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStationStatus, 30000);
    return () => clearInterval(interval);
  }, [stationId]);

  return {
    status,
    loading,
    error,
    refetch: fetchStationStatus,
  };
};
