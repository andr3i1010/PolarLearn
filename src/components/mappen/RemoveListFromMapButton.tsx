"use client"

import { useState } from "react";
import { ListX } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Button1 from "@/components/button/Button1";

interface RemoveListFromMapButtonProps {
  mapId: string;
  listId: string;
  listName: string;
}

export default function RemoveListFromMapButton({ mapId, listId, listName }: RemoveListFromMapButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRemove = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/maps/${mapId}/lists`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } catch (error) {
      console.error('Error removing list from map:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        disabled={isLoading}
        title="Verwijder lijst uit map"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
      >
        <ListX className="h-5 w-5 ml-1 text-red-400" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] z-110">
          <DialogHeader>
            <DialogTitle>Bevestig verwijdering</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je "{listName}" uit deze map wilt verwijderen? Je kan het later weer toevoegen.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button1 onClick={() => setOpen(false)} text="Annuleren" />
            <Button1 onClick={() => { handleRemove(); setOpen(false); }} text={isLoading ? "Bezig..." : "Verwijderen"} disabled={isLoading} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
