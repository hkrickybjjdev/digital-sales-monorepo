import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CalendarIcon, Edit2Icon, ExternalLinkIcon, FileTextIcon, PlusIcon, TrashIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const metadata: Metadata = {
  title: "Pages",
  description: "Manage your custom pages.",
};

// Mock data for the page list
const mockPages = [
  {
    id: "page1",
    title: "Flash Sale: Summer Collection",
    type: "flash-sale",
    url: "/flash-sale-summer",
    lastUpdated: new Date("2023-10-18T14:32:00"),
    status: "published"
  },
  {
    id: "page2",
    title: "Webinar Registration",
    type: "event-registration",
    url: "/webinar-registration",
    lastUpdated: new Date("2023-10-15T09:21:00"),
    status: "published"
  },
  {
    id: "page3",
    title: "Product Launch Countdown",
    type: "countdown-landing",
    url: "/product-launch",
    lastUpdated: new Date("2023-10-10T16:45:00"),
    status: "draft"
  }
];

// Helper function to get badge color based on page type
function getPageTypeBadgeColor(pageType: string) {
  switch (pageType) {
    case "flash-sale":
      return "bg-yellow-100 text-yellow-800";
    case "event-registration":
      return "bg-blue-100 text-blue-800";
    case "countdown-landing":
      return "bg-purple-100 text-purple-800";
    case "limited-time-offer":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Helper function for page type display name
function getPageTypeDisplayName(pageType: string) {
  switch (pageType) {
    case "flash-sale":
      return "Flash Sale";
    case "event-registration":
      return "Event Registration";
    case "countdown-landing":
      return "Countdown Landing";
    case "limited-time-offer":
      return "Limited Time Offer";
    default:
      return "Custom Page";
  }
}

// Helper function for status badge color
function getStatusBadgeColor(status: string) {
  switch (status) {
    case "published":
      return "bg-green-100 text-green-800";
    case "draft":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function PagesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pages</h1>
          <p className="text-muted-foreground">Create and manage custom pages for your website</p>
        </div>
        <Link href="/dashboard/page/new/editor">
          <Button>
            <PlusIcon className="h-4 w-4 mr-1" />
            New Page
          </Button>
        </Link>
      </div>

      {mockPages.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockPages.map((page) => (
            <Card key={page.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">{page.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPageTypeBadgeColor(page.type)}`}>
                        {getPageTypeDisplayName(page.type)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(page.status)}`}>
                        {page.status === "published" ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0" 
                    asChild
                  >
                    <Link href={`/dashboard/page/${page.id}/editor`}>
                      <Edit2Icon className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Link>
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground flex items-center mt-2">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  Updated {formatDistanceToNow(page.lastUpdated, { addSuffix: true })}
                </div>
              </CardHeader>
              <CardFooter className="border-t bg-muted/50 p-3">
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {page.url}
                  </span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                      <TrashIcon className="h-3.5 w-3.5" />
                      <span className="sr-only">Delete</span>
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                      <span className="sr-only">View</span>
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-muted p-3">
                <FileTextIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="mb-2">No pages created yet</CardTitle>
            <CardDescription className="mb-6">
              Create your first custom page to attract visitors and boost conversions
            </CardDescription>
            <Link href="/dashboard/page/new/editor">
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create your first page
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}