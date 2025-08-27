export interface Brand {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  image?: string; // For backward compatibility with existing data
}

export interface BrandFormData {
  name: string;
  description?: string;
  logoUrl?: string;
  image?: string;
}
