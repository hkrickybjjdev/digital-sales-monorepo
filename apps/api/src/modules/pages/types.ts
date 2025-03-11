export type PageType = 'countdown' | 'flash-sale' | 'event-registration' | 'limited-offer';

export interface Page {
  id: string;
  shortId: string;
  userId: string;
  type: PageType;
  createdAt: string;
  expiresAt: string | null;
  launchAt: string | null;
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
  countdownTarget: string; // ISO timestamp
  postCountdownAction: 'redirect' | 'show-message' | 'show-form';
  redirectUrl?: string;
  messageTitle?: string;
  messageContent?: string;
}

export interface FlashSaleSettings {
  saleEndTime: string; // ISO timestamp
  discountPercentage?: number;
  originalPriceDisplay?: boolean;
  inventoryLimit?: number;
  soldOutAction?: 'redirect' | 'show-message';
  postSaleRedirectUrl?: string;
}

export interface EventRegistrationSettings {
  eventStartTime: string; // ISO timestamp
  eventEndTime: string; // ISO timestamp
  eventLocation: 'virtual' | 'physical';
  physicalAddress?: string;
  virtualPlatform?: 'zoom' | 'meet' | 'teams' | 'custom';
  platformLink?: string;
  maxAttendees?: number;
  waitlistEnabled?: boolean;
}

export interface LimitedOfferSettings {
  offerEndTime: string; // ISO timestamp
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
  registeredAt: string;
  customFields?: Record<string, any>;
}

export interface CreatePageRequest {
  type: PageType;
  expiresAt?: string;
  launchAt?: string;
  isActive?: boolean;
  customization?: PageCustomization;
  settings: CountdownSettings | FlashSaleSettings | EventRegistrationSettings | LimitedOfferSettings;
}

export interface UpdatePageRequest {
  expiresAt?: string;
  launchAt?: string;
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