import { useRouter } from "next/navigation";
import LearnTool from "@/components/learning/learnTool";

export default function LearnPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const listId = params.id;

  const handleExit = () => {
    router.back();
  };

  return <LearnTool listId={listId} onExit={handleExit} />;
}
