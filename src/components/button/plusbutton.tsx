"use client";
import { LetterText, List, MessageCircle, Plus, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import Link from "next/link";
import GroupDialog from "@/app/learn/groups/groupDialog";
import ForumCreateDialog from "@/components/forum/ForumDialog";
import { useGroupCreation } from "@/hooks/useGroupCreation";
import { useForumCreation } from "@/hooks/useForumCreation";

export default function PlusBtn() {
    const {
        dialogOpen: groupDialogOpen,
        isSubmitting: groupIsSubmitting,
        form: groupForm,
        handleOpenDialog: handleOpenGroupDialog,
        handleOpenChange: handleGroupOpenChange,
        onSubmit: groupOnSubmit
    } = useGroupCreation();

    const {
        dialogOpen: forumDialogOpen,
        isSubmitting: forumIsSubmitting,
        isAdmin,
        banned,
        form: forumForm,
        content,
        selectedCategory,
        handleOpenDialog: handleOpenForumDialog,
        handleOpenChange: handleForumOpenChange,
        onSubmit: forumOnSubmit
    } = useForumCreation();

    return (
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <button className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-all text-white">
                        <Plus />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="text-white font-extrabold bg-neutral-800">
                    <Link
                        href="/learn/createlist"
                        className="flex flex-row rounded-lg hover:bg-neutral-700 p-2 items-center gap-2 transition-all"
                    >
                        <List />
                        Nieuwe Lijst
                    </Link>
                    <Link
                        href="/learn/createsummary"
                        className="flex flex-row rounded-lg hover:bg-neutral-700 p-2 items-center gap-2 transition-all"
                    >
                        <LetterText />
                        Nieuwe Samenvatting
                    </Link>
                    <button
                        onClick={handleOpenGroupDialog}
                        className="flex flex-row rounded-lg hover:bg-neutral-700 p-2 items-center gap-2 transition-all w-full"
                    >
                        <Users />
                        Nieuwe Groep
                    </button>
                    <button
                        onClick={handleOpenForumDialog}
                        className="flex flex-row rounded-lg hover:bg-neutral-700 p-2 items-center gap-2 transition-all w-full"
                    >
                        <MessageCircle />
                        Nieuwe Forumpost
                    </button>
                </PopoverContent>
            </Popover>

            <GroupDialog
                dialogOpen={groupDialogOpen}
                handleOpenChange={handleGroupOpenChange}
                form={groupForm}
                onSubmit={groupOnSubmit}
                isSubmitting={groupIsSubmitting}
            />

            <ForumCreateDialog
                dialogOpen={forumDialogOpen}
                handleOpenChange={handleForumOpenChange}
                form={forumForm}
                onSubmit={forumOnSubmit}
                isSubmitting={forumIsSubmitting}
                isAdmin={isAdmin}
                banned={banned}
                content={content}
                selectedCategory={selectedCategory}
            />
        </>
    );
}