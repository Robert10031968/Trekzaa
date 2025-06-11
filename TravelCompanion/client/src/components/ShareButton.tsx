import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon
} from "react-share";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
}

export function ShareButton({ url, title, description }: ShareButtonProps) {
  const shareUrl = `${window.location.origin}${url}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Share2 className="h-4 w-4" />
          <span className="sr-only">Share</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild className="cursor-pointer">
          <TwitterShareButton
            url={shareUrl}
            title={title}
            className="flex w-full items-center px-2 py-1.5"
          >
            <TwitterIcon size={20} round className="mr-2" />
            Share on X/Twitter
          </TwitterShareButton>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <FacebookShareButton
            url={shareUrl}
            hashtag="#dreamvacation"
            className="flex w-full items-center px-2 py-1.5"
          >
            <FacebookIcon size={20} round className="mr-2" />
            Share on Facebook
          </FacebookShareButton>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <LinkedinShareButton
            url={shareUrl}
            title={title}
            summary={description}
            source={window.location.origin}
            className="flex w-full items-center px-2 py-1.5"
          >
            <LinkedinIcon size={20} round className="mr-2" />
            Share on LinkedIn
          </LinkedinShareButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}