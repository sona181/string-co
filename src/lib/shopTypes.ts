export type CustomizationGroup = {
  type: "BODY_COLOR" | "PICKGUARD" | "HARDWARE";
  options: { name: string; hexOrValue: string | null }[];
};

export type ReviewData = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerLabel: string;
};

export type ProductData = {
  id: string;
  name: string;
  brandName: string;
  categoryName: string;
  basePrice: number;
  description: string;
  defaultVariantId: string | null;
  priceWithDelta: number;
  reviewCount: number;
  avgRating: number | null;
  hasCustomizations: boolean;
  customizationGroups: CustomizationGroup[];
  isWishlisted: boolean;
  reviews: ReviewData[];
  audioUrl: string | null;
  model3dUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
};
