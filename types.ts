export type Seuil = {
  serie: string;
  annee: number;
  moyenne: number | null;
  remarque?: string | null;
  demo?: boolean;
};

export type Specialty = {
  slug: string;
  nom_ar: string;
  nom_fr: string;
  domaine: string;
  filiere: string[];
  diplome: string;
  duree: string;
  description_ar: string;
  competences: string[];
  debouches: string[];
  seuils: Seuil[];
  universites: string[];
  tags: string[];
};
