export type PageType = 'countdown' | 'flash-sale' | 'event-registration' | 'limited-offer';

export interface Page {
  id: string;
  shortId: string;
  userId: string;
  type: PageType;
  createdAt: number;
  expiresAt: number | null;
  launchAt: number | null;
  isActive: boolean;
  customization: PageCustomization;
  settings: CountdownSettings | FlashSaleSettings | EventRegistrationSettings | LimitedOfferSettings;
}

export interface PageCustomization {
  theme?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  logo?: string;
  fontFamily?: string;
  css?: string;
}

export interface CountdownSettings {
  countdownTarget: number; // Unix timestamp
  postCountdownAction: 'redirect' | 'show-message' | 'show-form';
  redirectUrl?: string;
  messageTitle?: string;
  messageContent?: string;
}

export interface FlashSaleSettings {
  saleEndTime: number; // Unix timestamp
  discountPercentage?: number;
  originalPriceDisplay?: boolean;
  inventoryLimit?: number;
  soldOutAction?: 'redirect' | 'show-message';
  postSaleRedirectUrl?: string;
}

export interface EventRegistrationSettings {
  eventStartTime: number; // Unix timestamp
  eventEndTime: number; // Unix timestamp
  eventLocation: 'virtual' | 'physical';
  physicalAddress?: string;
  virtualPlatform?: 'zoom' | 'meet' | 'teams' | 'custom';
  platformLink?: string;
  maxAttendees?: number;
  waitlistEnabled?: boolean;
}

export interface LimitedOfferSettings {
  offerEndTime: number; // Unix timestamp
  discountCode?: string;
  bonusDescription?: string;
  limitedQuantity?: number;
  postOfferAction?: 'redirect' | 'show-alternate';
}

export interface PageContent {
  id: string;
  pageId: string;
  contentType: string;
  productId?: string;
  title: string;
  description: string;
  priceInCents: number;
  currency: string;
  metadata: Record<string, any>;
}

export interface Registration {
  id: string;
  pageId: string;
  email: string;
  name: string;
  phone?: string;
  registeredAt: number;
  customFields?: Record<string, any>;
}

export interface CreatePageRequest {
  type: PageType;
  expiresAt?: number;
  launchAt?: number;
  isActive?: boolean;
  customization?: PageCustomization;
  settings: CountdownSettings | FlashSaleSettings | EventRegistrationSettings | LimitedOfferSettings;
}

export interface UpdatePageRequest {
  expiresAt?: number;
  launchAt?: number;
  isActive?: boolean;
  customization?: PageCustomization;
  settings?: CountdownSettings | FlashSaleSettings | EventRegistrationSettings | LimitedOfferSettings;
}

export interface CreatePageContentRequest {
  contentType: string;
  productId?: string;
  title: string;
  description: string;
  priceInCents: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface CreateRegistrationRequest {
  email: string;
  name: string;
  phone?: string;
  customFields?: Record<string, any>;
}

export interface PageStats {
  views: number;
  conversions: number;
  conversionRate: number;
}