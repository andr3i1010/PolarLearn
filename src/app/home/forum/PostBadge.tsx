import { Badge } from "@/components/ui/badge";
import { Book, MessageCircle, MessageCircleQuestion, Megaphone, Lightbulb } from "lucide-react";

export function PostBadge({ type }: { type: string }) {
  return (
    <Badge
      variant="outline"
      className={`text-xs ${categoryColor(type)}`}
    >
      <BadgeIcon type={type} />
      {categoryText(type)}
    </Badge>
  )
}

export function BadgeIcon({ type }: { type: string }) {
  switch (type) {
    case "school":
      return <Book />;
    case "general":
      return <MessageCircle />;
    case "help":
      return <MessageCircleQuestion />;
    case "fr":
      return <Lightbulb />;
    case "announcement":
      return <Megaphone />;
  }
}

export function categoryColor(type: string) {
  switch (type) {
    case "school":
      return "bg-blue-500";
    case "general":
      return "bg-green-500";
    case "help":
      return "bg-yellow-500";
    case "announcement":
      return "bg-red-500";
    case "fr":
      return "bg-yellow-400";
    default:
      return "bg-gray-500";
  }
}

export function categoryText(type: string) {
  switch (type) {
    case "school":
      return "School-gerelateerd";
    case "general":
      return "Niet school-gerelateerd";
    case "help":
      return "Hulp";
    case "announcement":
      return "Aankondiging";
    case "fr":
      return "Gewilde Functie";
    default:
      return "Onbekend";
  }
}