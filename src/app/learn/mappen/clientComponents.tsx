"use client";
import { Plus } from "lucide-react";
import MapDialog from "./mapDialog";
import { useMapCreation } from "@/hooks/useMapCreation";

export function CreateMapButton() {
  const {
    dialogOpen,
    isSubmitting,
    form,
    handleOpenDialog,
    handleOpenChange,
    onSubmit
  } = useMapCreation();

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

      <MapDialog
        dialogOpen={dialogOpen}
        handleOpenChange={handleOpenChange}
        form={form}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
