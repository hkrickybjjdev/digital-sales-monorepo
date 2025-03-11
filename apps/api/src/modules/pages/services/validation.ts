import { 
  CreatePageRequest, 
  UpdatePageRequest, 
  CreatePageContentRequest,
  CreateRegistrationRequest,
  PageType
} from '../types';

export class ValidationService {
  // Page type-specific validation
  validatePageRequest(request: CreatePageRequest): string[] {
    const errors: string[] = [];
    
    if (!request.type) {
      errors.push('Page type is required');
    } else if (!this.isValidPageType(request.type)) {
      errors.push(`Invalid page type: ${request.type}`);
    }
    
    if (request.expiresAt && !this.isValidDate(request.expiresAt)) {
      errors.push('expiresAt must be a valid ISO date string');
    }
    
    if (request.launchAt && !this.isValidDate(request.launchAt)) {
      errors.push('launchAt must be a valid ISO date string');
    }
    
    // Validate settings based on page type
    switch (request.type) {
      case 'countdown':
        this.validateCountdownSettings(request, errors);
        break;
      case 'flash-sale':
        this.validateFlashSaleSettings(request, errors);
        break;
      case 'event-registration':
        this.validateEventRegistrationSettings(request, errors);
        break;
      case 'limited-offer':
        this.validateLimitedOfferSettings(request, errors);
        break;
    }
    
    return errors;
  }
  
  validatePageUpdateRequest(request: UpdatePageRequest): string[] {
    const errors: string[] = [];
    
    if (request.expiresAt && !this.isValidDate(request.expiresAt)) {
      errors.push('expiresAt must be a valid ISO date string');
    }
    
    if (request.launchAt && !this.isValidDate(request.launchAt)) {
      errors.push('launchAt must be a valid ISO date string');
    }
    
    // Would need to validate settings based on page type, but we don't know
    // the page type from just the update request
    
    return errors;
  }
  
  validatePageContentRequest(request: CreatePageContentRequest): string[] {
    const errors: string[] = [];
    
    if (!request.contentType) {
      errors.push('Content type is required');
    }
    
    if (!request.title || request.title.trim().length === 0) {
      errors.push('Title is required');
    }
    
    if (!request.description || request.description.trim().length === 0) {
      errors.push('Description is required');
    }
    
    if (request.priceInCents < 0) {
      errors.push('Price cannot be negative');
    }
    
    if (!request.currency || request.currency.trim().length === 0) {
      errors.push('Currency is required');
    }
    
    return errors;
  }
  
  validateRegistrationRequest(request: CreateRegistrationRequest): string[] {
    const errors: string[] = [];
    
    if (!request.email || !this.isValidEmail(request.email)) {
      errors.push('A valid email is required');
    }
    
    if (!request.name || request.name.trim().length === 0) {
      errors.push('Name is required');
    }
    
    if (request.phone && !this.isValidPhone(request.phone)) {
      errors.push('Phone number format is invalid');
    }
    
    return errors;
  }
  
  // Helper validation methods
  private isValidPageType(type: string): boolean {
    const validTypes: PageType[] = ['countdown', 'flash-sale', 'event-registration', 'limited-offer'];
    return validTypes.includes(type as PageType);
  }
  
  private isValidDate(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    } catch (error) {
      return false;
    }
  }
  
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  private isValidPhone(phone: string): boolean {
    // Basic phone validation - could be enhanced for international formats
    const phoneRegex = /^[+]?[\s./0-9-()]{10,20}$/;
    return phoneRegex.test(phone);
  }
  
  // Type-specific validation
  private validateCountdownSettings(request: CreatePageRequest, errors: string[]): void {
    const settings = request.settings as any;
    if (!settings.countdownTarget) {
      errors.push('Countdown target date is required');
    } else if (!this.isValidDate(settings.countdownTarget)) {
      errors.push('Countdown target must be a valid ISO date string');
    }
    
    if (!settings.postCountdownAction) {
      errors.push('Post-countdown action is required');
    } else if (!['redirect', 'show-message', 'show-form'].includes(settings.postCountdownAction)) {
      errors.push('Invalid post-countdown action');
    }
    
    if (settings.postCountdownAction === 'redirect' && !settings.redirectUrl) {
      errors.push('Redirect URL is required for redirect action');
    }
    
    if (settings.postCountdownAction === 'show-message' && 
        (!settings.messageTitle || !settings.messageContent)) {
      errors.push('Message title and content are required for show-message action');
    }
  }
  
  private validateFlashSaleSettings(request: CreatePageRequest, errors: string[]): void {
    const settings = request.settings as any;
    if (!settings.saleEndTime) {
      errors.push('Sale end time is required');
    } else if (!this.isValidDate(settings.saleEndTime)) {
      errors.push('Sale end time must be a valid ISO date string');
    }
    
    if (settings.discountPercentage !== undefined && 
        (settings.discountPercentage < 0 || settings.discountPercentage > 100)) {
      errors.push('Discount percentage must be between 0 and 100');
    }
    
    if (settings.inventoryLimit !== undefined && settings.inventoryLimit < 1) {
      errors.push('Inventory limit must be at least 1');
    }
  }
  
  private validateEventRegistrationSettings(request: CreatePageRequest, errors: string[]): void {
    const settings = request.settings as any;
    
    if (!settings.eventStartTime) {
      errors.push('Event start time is required');
    } else if (!this.isValidDate(settings.eventStartTime)) {
      errors.push('Event start time must be a valid ISO date string');
    }
    
    if (!settings.eventEndTime) {
      errors.push('Event end time is required');
    } else if (!this.isValidDate(settings.eventEndTime)) {
      errors.push('Event end time must be a valid ISO date string');
    }
    
    if (settings.eventStartTime && settings.eventEndTime) {
      const start = new Date(settings.eventStartTime);
      const end = new Date(settings.eventEndTime);
      
      if (end <= start) {
        errors.push('Event end time must be after start time');
      }
    }
    
    if (!settings.eventLocation) {
      errors.push('Event location type is required');
    } else if (!['virtual', 'physical'].includes(settings.eventLocation)) {
      errors.push('Invalid event location type');
    }
    
    if (settings.eventLocation === 'physical' && !settings.physicalAddress) {
      errors.push('Physical address is required for physical events');
    }
    
    if (settings.eventLocation === 'virtual' && !settings.virtualPlatform) {
      errors.push('Virtual platform is required for virtual events');
    }
    
    if (settings.virtualPlatform === 'custom' && !settings.platformLink) {
      errors.push('Platform link is required for custom virtual platforms');
    }
    
    if (settings.maxAttendees !== undefined && settings.maxAttendees < 1) {
      errors.push('Maximum attendees must be at least 1');
    }
  }
  
  private validateLimitedOfferSettings(request: CreatePageRequest, errors: string[]): void {
    const settings = request.settings as any;
    
    if (!settings.offerEndTime) {
      errors.push('Offer end time is required');
    } else if (!this.isValidDate(settings.offerEndTime)) {
      errors.push('Offer end time must be a valid ISO date string');
    }
    
    if (settings.limitedQuantity !== undefined && settings.limitedQuantity < 1) {
      errors.push('Limited quantity must be at least 1');
    }
  }
}