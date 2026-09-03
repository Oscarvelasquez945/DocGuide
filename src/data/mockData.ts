export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  distanceKm: number;
  phone: string;
  address: string;
  servicesOffered?: string;
  experience: number;
  rating: number;
  color: string;
  latitude?: number;
  longitude?: number;
};

export const doctors: Doctor[] = [
  {
    id: 'julio-garcia',
    name: 'Dr. Julio Alonso García',
    specialty: 'Cardiología',
    distanceKm: 1.2,
    phone: '+504 9999-1020',
    address: 'Col. Palmira, Tegucigalpa',
    servicesOffered: 'Consulta cardiovascular, electrocardiograma y control de hipertensión.',
    experience: 7,
    rating: 4.9,
    color: '#3375D6',
    latitude: 14.0818,
    longitude: -87.2068,
  },
  {
    id: 'ana-lucia',
    name: 'Dra. Ana Lucía Méndez',
    specialty: 'Medicina general',
    distanceKm: 2.8,
    phone: '+504 9970-2241',
    address: 'Blvd. Morazán, Tegucigalpa',
    servicesOffered: 'Consulta general, chequeo preventivo y seguimiento de enfermedades crónicas.',
    experience: 10,
    rating: 4.8,
    color: '#6E62D9',
    latitude: 14.0883,
    longitude: -87.1947,
  },
  {
    id: 'mario-rodriguez',
    name: 'Dr. Mario Rodríguez',
    specialty: 'Dermatología',
    distanceKm: 4.6,
    phone: '+504 9812-4430',
    address: 'Lomas del Guijarro, Tegucigalpa',
    servicesOffered: 'Consulta dermatológica, revisión de lunares y tratamiento de acné.',
    experience: 6,
    rating: 4.7,
    color: '#239E9A',
    latitude: 14.0746,
    longitude: -87.1896,
  },
  {
    id: 'celia-salgado',
    name: 'Dra. Celia Salgado',
    specialty: 'Nutrición',
    distanceKm: 8.4,
    phone: '+504 9450-1182',
    address: 'Col. Kennedy, Tegucigalpa',
    servicesOffered: 'Evaluación nutricional y planes de alimentación personalizados.',
    experience: 8,
    rating: 4.9,
    color: '#E5844D',
    latitude: 14.0642,
    longitude: -87.1781,
  },
];
