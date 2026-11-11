export type PriceStatus = 'confirmed' | 'needs_verification' | 'pending';

export type Salon = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
};

export type Category = {
  id: string;
  salon_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Service = {
  id: string;
  salon_id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number | null;
  price_status: PriceStatus;
  is_available: boolean;
  is_published: boolean;
  sort_order: number;
};

export type Offer = {
  id: string;
  salon_id: string;
  title: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  is_active: boolean;
};

export type OfferLink = {
  id: string;
  offer_id: string;
  service_id: string | null;
  category_id: string | null;
};

export type MenuSettings = {
  id: string;
  salon_id: string;
  announcement_text: string | null;
  announcement_active: boolean;
};

/** A service as seen on the public menu, with computed offer pricing. */
export type PublicService = Service & {
  offerId: string | null;
  offerTitle: string | null;
  discountedPrice: number | null;
};

export type MenuSection = {
  category: Category;
  services: PublicService[];
};
