"use client";
import { Plus } from "lucide-react";
import GroupDialog from "./groupDialog";
import { useGroupCreation } from "@/hooks/useGroupCreation";

export function CreateGroupButton() {
    const {
        dialogOpen,
        isSubmitting,
        form,
        handleOpenDialog,
        handleOpenChange,
        onSubmit
    } = useGroupCreation();

    return (
        <>
            <div className="bg-neutral-800 rounded-full hover:bg-neutral-600 transition-all">
                <button
                    type="button"
                    onClick={handleOpenDialog}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-all text-white"
                    style={{ padding: 0, border: "none", background: "none" }}
                >
                    <Plus />
                </button>
            </div>

            <GroupDialog
                dialogOpen={dialogOpen}
                handleOpenChange={handleOpenChange}
                form={form}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
            />
        </>
    );
}
