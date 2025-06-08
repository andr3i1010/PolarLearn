import ConstructionImg from "@/components/constructionImg";

interface AchievementsTabContentProps {
    userId: string;
    isOwnProfile: boolean;
}

export default function AchievementsTabContent({ userId, isOwnProfile }: AchievementsTabContentProps) {
    return (
        <div className="mt-4">
            {/* Achievements content will go here */}
            <ConstructionImg />
        </div>
    );
}
