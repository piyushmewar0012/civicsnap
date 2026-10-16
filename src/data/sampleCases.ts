import { SampleCase } from '../types/civic';

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: 'case-pothole',
    title: 'Road Pothole',
    category: 'pothole',
    location: 'Near 4th Cross, opposite City Health Clinic, Main Bazaar Road',
    description: 'Noticeable asphalt depression with loose gravel visible along the inner lane.',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    note: 'Demonstrates cautious identification of road surface damage without making unsupported depth claims.'
  },
  {
    id: 'case-garbage',
    title: 'Garbage Accumulation',
    category: 'garbage_accumulation',
    location: 'Corner of Sector 12 Park, adjacent to the public bus shelter',
    description: 'Accumulation of uncollected domestic solid waste and discarded plastic items on the walkway.',
    imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    note: 'Separates visible discarded materials from speculation regarding collection schedules or responsible contractors.'
  },
  {
    id: 'case-streetlight',
    title: 'Broken Streetlight',
    category: 'broken_streetlight',
    location: 'Lamp Post #14, 2nd Avenue near Community Hall entrance',
    description: 'Streetlight pole with damaged upper casing and exposed lamp fitting during daylight hours.',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
    note: 'Notes physical fixture state while explicitly withholding assumptions regarding electrical fault or line power.'
  },
  {
    id: 'case-unclear',
    title: 'Unclear / Low-Light Image (Caution Test)',
    category: 'unclear_insufficient',
    location: 'Near Metro Station Pillar 42',
    description: 'Low-light, partially obscured image with motion blur and indistinct dark shapes.',
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
    note: 'PRD Requirement 4.3: Validates that CivicLens refuses to force a classification when evidence is insufficient.'
  },
  {
    id: 'case-unsupported',
    title: 'Fallen Tree Branch (Out of Scope)',
    category: 'unsupported_category',
    location: 'Oak Street sidewalk, outside House #88',
    description: 'Large broken tree branch resting across pedestrian walkway.',
    imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
    note: 'PRD Section 6 & 7: Explains MVP focus (potholes, garbage, streetlights) and avoids misclassifying out-of-scope issues.'
  }
];
