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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="page-title">Page Title</Label>
                <Input
                  id="page-title"
                  placeholder="Enter a title for your page"
                  value={pageTitle}
                  onChange={handleTitleChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="page-url">
                  Page URL
                  <span className="text-muted-foreground text-xs ml-2">
                    (automatically generated from title)
                  </span>
                </Label>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-1 text-sm">
                    yourwebsite.com/
                  </span>
                  <Input
                    id="page-url"
                    placeholder="page-url-slug"
                    value={pageSlug}
                    onChange={(e) => setPageSlug(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="launch-date">Launch Date & Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !launchDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {launchDate ? format(launchDate, "PPP") : "Select launch date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={launchDate}
                      onSelect={setLaunchDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="has-expiration"
                  checked={hasExpiration}
                  onCheckedChange={setHasExpiration}
                />
                <Label htmlFor="has-expiration">Set expiration date</Label>
              </div>

              {hasExpiration && (
                <div className="grid gap-2">
                  <Label htmlFor="expiration-date">Expiration Date & Time</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !expirationDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expirationDate ? format(expirationDate, "PPP") : "Select expiration date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
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
        <TabsContent value="design" className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 border rounded"
                    style={{ backgroundColor: primaryColor }}
                  ></div>
                  <Input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-10 p-0 m-0"
                  />
                  <Input 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 border rounded"
                    style={{ backgroundColor: secondaryColor }}
                  ></div>
                  <Input
                    id="secondary-color"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-12 h-10 p-0 m-0"
                  />
                  <Input 
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="font-family">Font Family</Label>
                <select
                  id="font-family"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
        <TabsContent value="seo" className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="meta-title">Meta Title</Label>
                <Input
                  id="meta-title"
                  placeholder="Enter SEO title (70 characters max)"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  maxLength={70}
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
                  className="min-h-[100px]"
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

      <Separator className="my-6" />
      
      <div className="flex justify-between">
        <Button 
          variant="outline"
          onClick={() => setActiveTab("basic")}
          className="w-full sm:w-auto mr-2"
        >
          Back to Page Type
        </Button>
        <Button 
          onClick={onNext}
          className="w-full sm:w-auto"
        >
          Continue to Content
        </Button>
      </div>
    </div>
  );
}