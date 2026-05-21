import materialsJson from '@data/materials.json';
import familiesJson from '@data/families.json';
import type { Material, Family, FamilyId } from './types';

interface MaterialsDoc {
  count: number;
  source: string;
  materials: Material[];
}

interface FamiliesDoc {
  families: Family[];
}

export const materials: Material[] = (materialsJson as unknown as MaterialsDoc).materials;
export const families: Family[] = (familiesJson as unknown as FamiliesDoc).families;

export const familyById: Record<FamilyId, Family> = Object.fromEntries(
  families.map((f) => [f.id, f]),
) as Record<FamilyId, Family>;
