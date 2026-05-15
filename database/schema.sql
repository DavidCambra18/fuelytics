-- ENUMS
CREATE TYPE vehicle_energy_type AS ENUM (
  'gasoline',
  'diesel',
  'electric',
  'hybrid_gasoline',
  'hybrid_diesel',
  'plug_in_hybrid_gasoline',
  'plug_in_hybrid_diesel',
  'glp',
  'gnc',
  'hydrogen',
  'ethanol'
);

CREATE TYPE gearbox_type AS ENUM (
  'torque_converter',
  'dual_clutch',
  'semi_automatic',
  'cvt',
  'automatic',
  'manual'
);

CREATE TYPE vehicle_type AS ENUM (
  'car',
  'bike',
  'van',
  'truck',
  'quad',
  'agricultural'
);

CREATE TYPE driving_type AS ENUM (
  'slow',
  'normal',
  'fast'
);

CREATE TYPE fuel_type AS ENUM (
  'gasoline_95',
  'gasoline_98',
  'diesel',
  'diesel_premium',
  'biodiesel',
  'electricity',
  'e85',
  'hydrogen'
);

CREATE TYPE refueling_type AS ENUM (
  'complete',
  'partial',
  'initial'
);

CREATE TYPE tire_type AS ENUM (
  'summer',
  'winter',
  'allseason'
);

CREATE TYPE expense_type AS ENUM (
  'maintenance',
  'repair',
  'insurance',
  'fines',
  'oil',
  'toll',
  'washing',
  'taxes',
  'inspection',
  'homologation',
  'tuning',
  'tire_change',
  'financing',
  'spare_parts',
  'parking',
  'matriculation'
);

-- USERS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VEHICLES
CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  brand VARCHAR NOT NULL,
  model VARCHAR NOT NULL,
  power INT NOT NULL,
  cc INT,
  year INT NOT NULL,
  odometer INT,
  plate VARCHAR(20),
  vehicle_energy_type vehicle_energy_type NOT NULL,
  tank_capacity DECIMAL(5,2) NOT NULL,
  gearbox gearbox_type NOT NULL,
  official_consumption DECIMAL(5,2),
  is_public BOOLEAN DEFAULT FALSE,
  show_fuel_data BOOLEAN DEFAULT TRUE,
  show_expenses BOOLEAN DEFAULT FALSE,
  show_statistics BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- FUEL ENTRIES
CREATE TABLE fuel_entries (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL,
  date DATE NOT NULL,
  odometer INT,
  refueling refueling_type NOT NULL,
  fuel_type fuel_type NOT NULL,
  distance DECIMAL(6,2) NOT NULL,
  liters DECIMAL(6,2) NOT NULL,
  price_total DECIMAL(8,2) NOT NULL,
  price_per_liter DECIMAL(5,3) NOT NULL,
  driving_type driving_type NOT NULL,
  tire_type tire_type NOT NULL,
  highway BOOLEAN DEFAULT FALSE,
  city BOOLEAN DEFAULT FALSE,
  road BOOLEAN DEFAULT FALSE,
  ac BOOLEAN DEFAULT FALSE,
  heating BOOLEAN DEFAULT FALSE,
  trailer BOOLEAN DEFAULT FALSE,
  board_consumption DECIMAL(5,2),
  average_speed INT,
  notes TEXT,

  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- EXPENSES
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL,
  date DATE NOT NULL,
  type expense_type NOT NULL,
  description TEXT,
  cost DECIMAL(8,2) NOT NULL,

  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);