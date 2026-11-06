// ===== Store configuration — replace bracketed values with the real operator's details =====
window.STORE = {
  brand: "Solar Edge LLC",
  legalName: "Solar Edge LLC",
  city: "Montgomery, TX",
  address: "16747 Timberglen, Montgomery, TX 77316",
  phone: "+1 (832) 960-0340",
  email: "support@solaredgellc.com",
  hours: ""
  , governingState: "Texas", governingCounty: "Montgomery County",
  tradeDiscount: 0.15, // installer / trade price off retail
  freeShipOver: 1500,
  shipFlat: 49,
};

// Categories
window.CATEGORIES = [
  { id: "panels", name: "Solar Panels", img: "img/panels.jpg" },
  { id: "inverters", name: "Inverters", img: "img/inverters.jpg" },
  { id: "batteries", name: "Batteries & Storage", img: "img/batteries.jpg" },
  { id: "controllers", name: "Charge Controllers", img: "img/controllers.jpg" },
  { id: "racking", name: "Racking & Mounting", img: "img/racking.jpg" },
  { id: "wiring", name: "Wire & BOS", img: "img/wiring.jpg" },
  { id: "kits", name: "Complete Kits", img: "img/kits.jpg" },
  { id: "portable", name: "Portable Power", img: "img/portable.jpg" },
];

// Catalog — illustrative listings; confirm specs, suppliers and stock before selling.
window.PRODUCTS = [
  { id: "SE-P410", cat: "panels", name: "410W Mono PERC Panel, All-Black", price: 189, unit: "panel", specs: ["410 W STC", "21.3% efficiency", "108 half-cut cells", "25-yr power warranty"], pallet: 31 },
  { id: "SE-P440", cat: "panels", name: "440W N-Type TOPCon Panel", price: 229, unit: "panel", specs: ["440 W STC", "22.5% efficiency", "Bifacial-ready frame", "30-yr power warranty"], pallet: 36 },
  { id: "SE-P550", cat: "panels", name: "550W Commercial Bifacial Panel", price: 279, unit: "panel", specs: ["550 W STC", "Dual glass", "144 half-cut cells", "Ground-mount rated"], pallet: 31 },
  { id: "SE-PAL31", cat: "panels", name: "Pallet: 31 × 410W All-Black Panels (12.7 kW)", price: 5390, unit: "pallet", specs: ["12.71 kW total", "Freight to job site", "Liftgate available", "Trade favorite"] },

  { id: "SE-M400", cat: "inverters", name: "400VA Microinverter", price: 165, unit: "unit", specs: ["1 module per unit", "97% CEC efficiency", "Rapid shutdown compliant", "25-yr warranty"] },
  { id: "SE-S76", cat: "inverters", name: "7.6 kW Grid-Tie String Inverter", price: 1690, unit: "unit", specs: ["2 MPPT inputs", "UL 1741 SB listing", "Wi-Fi monitoring", "12-yr warranty"] },
  { id: "SE-H10", cat: "inverters", name: "10 kW Hybrid Inverter, 48V", price: 3290, unit: "unit", specs: ["Battery-ready, 48V", "200A pass-through", "Generator input", "Backup in <10 ms"] },
  { id: "SE-H15", cat: "inverters", name: "15 kW Split-Phase Hybrid Inverter", price: 4890, unit: "unit", specs: ["120/240V split-phase", "3 MPPT inputs", "Parallel up to 6 units", "10-yr warranty"] },

  { id: "SE-B5R", cat: "batteries", name: "5.1 kWh 48V LiFePO4 Rack Battery", price: 1390, unit: "module", specs: ["5.12 kWh usable", "6,000+ cycles", "Closed-loop comms", "Stackable to 16"] },
  { id: "SE-B10W", cat: "batteries", name: "10 kWh Wall-Mount Home Battery", price: 3790, unit: "unit", specs: ["10.24 kWh", "Indoor/outdoor IP65", "UL 9540A tested cells", "10-yr warranty"] },
  { id: "SE-B15C", cat: "batteries", name: "15 kWh Battery Cabinet System", price: 6490, unit: "system", specs: ["3 × 5.12 kWh modules", "Pre-wired cabinet", "Busbars & breaker", "Expands to 30 kWh"] },
  { id: "SE-B30C", cat: "batteries", name: "30 kWh Whole-Home Storage Bank", price: 9890, unit: "system", specs: ["6 × 5.12 kWh modules", "Dual cabinets", "Whole-home backup", "Freight shipped"] },

  { id: "SE-C40", cat: "controllers", name: "40A MPPT Charge Controller", price: 149, unit: "unit", specs: ["12/24V auto", "Up to 100V PV", "Bluetooth app", "LiFePO4 profiles"] },
  { id: "SE-C100", cat: "controllers", name: "100A MPPT Charge Controller", price: 459, unit: "unit", specs: ["12/24/36/48V", "Up to 250V PV", "Parallel capable", "5-yr warranty"] },

  { id: "SE-R10", cat: "racking", name: "Roof Mount Kit — 10 Panels", price: 449, unit: "kit", specs: ["Aluminium rails & splices", "Flashed L-feet", "Mid/end clamps", "Asphalt shingle"] },
  { id: "SE-R24", cat: "racking", name: "Roof Mount Kit — 24 Panels", price: 989, unit: "kit", specs: ["2 rows × 12", "Integrated grounding", "Stamped engineering letter", "Pitched roofs"] },
  { id: "SE-G12", cat: "racking", name: "Ground Mount Kit — 12 Panels", price: 1890, unit: "kit", specs: ["Galvanized steel posts", "Adjustable 15–45° tilt", "Up to 140 mph wind", "Concrete not included"] },

  { id: "SE-W500", cat: "wiring", name: "10 AWG PV Wire, 500 ft Spool", price: 219, unit: "spool", specs: ["UL 4703, 2 kV", "Sunlight resistant", "Red or black", "Tinned copper"] },
  { id: "SE-MC4", cat: "wiring", name: "MC4 Connector Pack (50 pairs) + Crimper", price: 129, unit: "pack", specs: ["IP68", "30A rated", "Ratcheting crimp tool", "Spanner wrenches"] },
  { id: "SE-CB6", cat: "wiring", name: "6-String DC Combiner Box", price: 329, unit: "unit", specs: ["NEMA 4X enclosure", "15A string fuses", "Surge protection", "600V DC"] },
  { id: "SE-RSD", cat: "wiring", name: "Rapid Shutdown Devices (10-Pack)", price: 499, unit: "pack", specs: ["NEC 690.12 compliant", "Module-level", "Transmitter included", "Plug & play"] },

  { id: "SE-K3", cat: "kits", name: "3.3 kW Off-Grid Cabin Kit", price: 2790, unit: "kit", specs: ["8 × 410W panels", "3 kW inverter/charger", "5.1 kWh battery", "Racking & wiring"] },
  { id: "SE-K6", cat: "kits", name: "6.6 kW Grid-Tie Home Kit", price: 5490, unit: "kit", specs: ["16 × 410W panels", "16 microinverters", "Roof racking", "Permit plan set support"] },
  { id: "SE-K10", cat: "kits", name: "10 kW Hybrid Home Kit + 10 kWh Battery", price: 9990, unit: "kit", specs: ["24 × 440W panels", "10 kW hybrid inverter", "10 kWh battery", "Racking, wire & RSD"] },

  { id: "SE-PS1", cat: "portable", name: "1,000Wh Portable Power Station", price: 599, unit: "unit", specs: ["1,800W AC output", "LiFePO4, 3,000 cycles", "Solar input 500W", "Weighs 27 lb"] },
  { id: "SE-PS3", cat: "portable", name: "3,600Wh Power Station + 2 × 200W Panels", price: 2490, unit: "bundle", specs: ["3,600W AC, 240V-ready", "Expandable battery", "2 folding panels", "Home backup transfer"] },
  { id: "SE-FP100", cat: "portable", name: "100W Folding Solar Panel", price: 119, unit: "unit", specs: ["Monocrystalline", "Kickstand case", "USB-C & DC out", "IP67"] },
];


