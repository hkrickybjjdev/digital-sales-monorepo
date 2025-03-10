"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface GeneralSettingsProps {
  pageType: string | null;
  onNext: () => void;
}

export function GeneralSettings({ pageType, onNext }: GeneralSettingsProps) {
  // State for form fields
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [launchDate, setLaunchDate] = useState<Date | undefined>(undefined);
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [secondaryColor, setSecondaryColor] = useState("#F59E0B");
  const [fontFamily, setFontFamily] = useState("inter");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  
  // For tabs within the general settings
  const [activeTab, setActiveTab] = useState("basic");

  // Function to handle URL slug generation from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setPageTitle(title);
    // Generate slug from title (lowercase, replace spaces with dashes, remove special chars)
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '');
    setPageSlug(slug);
  };

  // Page type display name
  const getPageTypeName = () => {
    switch (pageType) {
      case "flash-sale":
        return "Flash Sale Page";
      case "event-registration":
        return "Event Registration Page";
      case "countdown-landing":
        return "Countdown Landing Page";
      case "limited-time-offer":
        return "Limited-Time Offer Page";
      default:
        return "Custom Page";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Step 2: General Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure the basic settings for your {getPageTypeName().toLowerCase()}.
        </p>
      </div>

      <div className="sticky top-2 z-10 pt-2 pb-3 bg-background">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto mb-2">
            <TabsTrigger value="basic" className="text-xs md:text-sm py-2 md:py-1.5">Basic Info</TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs md:text-sm py-2 md:py-1.5">Schedule</TabsTrigger>
            <TabsTrigger value="design" className="text-xs md:text-sm py-2 md:py-1.5">Design</TabsTrigger>
            <TabsTrigger value="seo" className="text-xs md:text-sm py-2 md:py-1.5">SEO</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="pb-24"> {/* Add padding for fixed bottom action buttons */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6 mt-0">
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="page-title">Page Title</Label>
                  <Input
                    id="page-title"
                    placeholder="Enter a title for your page"
                    value={pageTitle}
                    onChange={handleTitleChange}
                    className="min-h-[2.75rem] text-base md:text-sm md:min-h-[2.25rem]"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="page-url">
                    Page URL
                    <span className="text-muted-foreground text-xs ml-2">
                      (automatically generated from title)
                    </span>
                  </Label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
                    <span className="text-muted-foreground mr-1 text-sm">
                      yourwebsite.com/
                    </span>
                    <Input
                      id="page-url"
                      placeholder="page-url-slug"
                      value={pageSlug}
                      onChange={(e) => setPageSlug(e.target.value)}
                      className="min-h-[2.75rem] text-base md:text-sm md:min-h-[2.25rem] w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6 mt-0">
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="launch-date">Launch Date & Time</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="launch-date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal min-h-[2.75rem] md:min-h-[2.25rem]",
                          !launchDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {launchDate ? format(launchDate, "PPP") : "Select launch date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={launchDate}
                        onSelect={setLaunchDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center space-x-2 p-1">
                  <Switch
                    id="has-expiration"
                    checked={hasExpiration}
                    onCheckedChange={setHasExpiration}
                    className="data-[state=checked]:bg-primary scale-110"
                  />
                  <Label htmlFor="has-expiration" className="cursor-pointer py-2">
                    Set expiration date
                  </Label>
                </div>

                {hasExpiration && (
                  <div className="grid gap-2">
                    <Label htmlFor="expiration-date">Expiration Date & Time</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="expiration-date"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal min-h-[2.75rem] md:min-h-[2.25rem]",
                            !expirationDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {expirationDate ? format(expirationDate, "PPP") : "Select expiration date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={expirationDate}
                          onSelect={setExpirationDate}
                          initialFocus
                          disabled={(date) => {
                            // Disable dates before launch date
                            return launchDate ? date < launchDate : false;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design" className="space-y-6 mt-0">
            <div className="space-y-4">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-10 h-10 border rounded touch-manipulation"
                      style={{ backgroundColor: primaryColor }}
                    ></div>
                    <Input
                      id="primary-color"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-14 h-10 p-0 m-0 touch-manipulation"
                    />
                    <Input 
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 min-h-[2.75rem] text-base md:text-sm md:min-h-[2.25rem]"
                    />
                  </div>
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-10 h-10 border rounded touch-manipulation"
                      style={{ backgroundColor: secondaryColor }}
                    ></div>
                    <Input
                      id="secondary-color"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-14 h-10 p-0 m-0 touch-manipulation"
                    />
                    <Input 
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 min-h-[2.75rem] text-base md:text-sm md:min-h-[2.25rem]"
                    />
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="font-family">Font Family</Label>
                  <select
                    id="font-family"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[2.75rem] md:min-h-[2.25rem]"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                  >
                    <option value="inter">Inter</option>
                    <option value="roboto">Roboto</option>
                    <option value="poppins">Poppins</option>
                    <option value="open-sans">Open Sans</option>
                    <option value="montserrat">Montserrat</option>
                  </select>
                </div>

                <div className="p-4 border rounded-md bg-muted/40">
                  <div className="flex items-center mb-3">
                    <Palette className="w-5 h-5 mr-2" />
                    <span className="font-medium">Preview</span>
                  </div>
                  <div 
                    className="p-4 border rounded-md shadow-sm bg-white"
                    style={{ 
                      fontFamily: fontFamily === 'inter' ? 'Inter, sans-serif' : 
                                fontFamily === 'roboto' ? 'Roboto, sans-serif' : 
                                fontFamily === 'poppins' ? 'Poppins, sans-serif' : 
                                fontFamily === 'open-sans' ? 'Open Sans, sans-serif' : 
                                'Montserrat, sans-serif' 
                    }}
                  >
                    <div 
                      className="text-white p-2 rounded mb-2 text-center font-semibold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Primary Button
                    </div>
                    <div 
                      className="p-2 rounded mb-2 border-2 text-center font-medium"
                      style={{ borderColor: secondaryColor, color: secondaryColor }}
                    >
                      Secondary Button
                    </div>
                    <p style={{ color: primaryColor }} className="font-bold">
                      This is heading text in primary color
                    </p>
                    <p className="text-sm mt-1">
                      This is body text in your selected font family.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-6 mt-0">
            <div className="space-y-4">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="meta-title">Meta Title</Label>
                  <Input
                    id="meta-title"
                    placeholder="Enter SEO title (70 characters max)"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    maxLength={70}
                    className="min-h-[2.75rem] text-base md:text-sm md:min-h-[2.25rem]"
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {metaTitle.length}/70 characters
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="meta-description">Meta Description</Label>
                  <Textarea
                    id="meta-description"
                    placeholder="Enter a description for search engines (160 characters max)"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    maxLength={160}
                    className="min-h-[100px] text-base md:text-sm"
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {metaDescription.length}/160 characters
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="meta-keywords">Meta Keywords</Label>
                  <Input
                    id="meta-keywords"
                    placeholder="Enter keywords separated by commas"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    className="min-h-[2.75rem] text-base md:text-sm md:min-h-[2.25rem]"
                  />
                  <div className="text-xs text-muted-foreground">
                    Example: landing page, sale, discount, limited offer
                  </div>
                </div>

                <div className="p-4 border rounded-md bg-muted/40">
                  <h3 className="text-sm font-medium mb-2">Search Engine Preview</h3>
                  <div className="p-4 border rounded-md bg-white space-y-1">
                    <div className="text-blue-600 text-lg font-medium">
                      {metaTitle || pageTitle || "Page Title"}
                    </div>
                    <div className="text-green-700 text-sm">
                      yourwebsite.com/{pageSlug || "page-url"}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {metaDescription || "This is where your meta description will appear in search engines. Make it compelling to increase click-through rates."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Fixed action buttons at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex justify-between z-20">
        <Button 
          variant="outline"
          onClick={() => setActiveTab("basic")} 
          className="min-h-[2.75rem] md:min-h-[2.25rem]"
        >
          Back
        </Button>
        <Button 
          onClick={onNext}
          className="min-h-[2.75rem] md:min-h-[2.25rem]"
        >
          Continue to Content
        </Button>
      </div>
    </div>
  );
}