# Vyan — A De-PIN for EV Battery Swapping

**Vyan** is a decentralized battery-swapping network designed for dense urban environments in South Korea. It combines **IoT-enabled swap stations, an on-chain battery registry (De-PIN), and AI-driven inventory rebalancing**.  
All payments and rewards are powered by a **KRW-pegged stablecoin**, making adoption seamless for local users.  

Vyan reduces **range anxiety** and **operating costs** for EV owners and fleet operators by enabling rapid swaps, ensuring renewable energy attribution, and making battery value transparent and auditable on-chain.  

---

## Problem
Despite incentives, EV adoption in Korea faces barriers:
- Charging bottlenecks → Long charging times & costly infrastructure.  
- Battery trust issues → No transparent audit trail for usage/valuation.  
- Inventory imbalance → Uneven distribution of charged batteries across stations.  
- Renewable attribution → Lack of reliable tracking for green charging.  
- Ecosystem silos → Vendor lock-in and poor interoperability.  

---

## Solution
Vyan addresses these challenges with a **decentralized, AI + blockchain–powered approach**:

- **On-chain Identity (De-PIN):** Transparent battery + station metadata stored immutably.  
- **IoT Telemetry:** Stations stream signed data on charging, temperature, and renewable sources.  
- **AI Inventory Agent:** Forecasts demand, optimizes battery rebalancing, and cuts downtime.  
- **KRW Stablecoin:** Seamless payments & programmable rewards for green charging.  
- **User-Friendly Wallets:** Account abstraction for a Web2-like experience.  

---

## System Flow

### 1. User Journey and Battery Swap
```mermaid
sequenceDiagram
    participant U as User Frontend
    participant S as Station Interface
    participant API as Session Server
    participant C as Smart Contract
    
    Note over U,S: User arrives at station
    U->>S: Scan QR code to start a session
    S->>U: QR scanned confirmation
    
    Note over U,API: Session initialization
    U->>API: POST /session/start {station_id, user_id}
    API->>U: Session created
    U->>C: getStationDetails(stationId)
    C->>U: Station info, battery status
    
    Note over U,C: Battery insertion
    U->>U: User inserts the discharged battery and confirms
    U->>C: calculateSwapFee()
    C->>U: Estimated swap fee
    
    Note over U,C: Payment and swap
    U->>U: Show payment option via KRW Stablecoin
    U->>C: swapBattery() 
    C->>S: Payment confirmed
    C->>U: Rewards credited (if applicable)
    S->>U: Release charged battery
    
    Note over U,S: Station interface success
    S->>API: Track session completion
    
    Note over C: BatterySwapped event emitted → Triggers AI monitoring
```

### 2. Operator Journey and Battery Rebalancing

```mermaid
sequenceDiagram
    participant C as Smart Contract
    participant AI as AI Agent
    participant O as Operator Dashboard
    participant API as Server
    participant S as Station Interface
    
    Note over C,AI: AI Monitoring triggered
    C->>AI: BatterySwapped event
    AI->>C: getStationDetails() - check inventory
    AI->>C: getAllStations() - analyze network
    
    alt Low inventory detected
        AI->>AI: Generate rebalancing plan
        Note over AI: Considering proximity, live traffic,<br/>demand patterns, truck availability,<br/>battery availability, historical data <br/> via an LLM
        AI->>C: Emit AIRebalanceRequested event
        C->>O: Event detected
        O->>O: Show rebalancing strategies
        O->>O: Operator reviews plans
        O->>API: Execute rebalancing strategy
        API->>S: Update station inventory
    end
```

## Learn More

- [Vyan Whitepaper](Vyan_Whitepaper.pdf)

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

## Authors

- [Parth Mittal](https://github.com/mittal-parth)
- [Abhiraj Mengade](https://github.com/abhiraj-mengade)