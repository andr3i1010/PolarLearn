"use client"

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Button1 from "@/components/button/Button1";

interface DeleteMapButtonProps {
  mapId: string;
  mapName: string;
}

export default function DeleteMapButton({ mapId, mapName }: DeleteMapButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/map/${mapId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(await res.text());

      // Redirect to maps overview after successful deletion
      router.push('/learn/mappen');
    } catch (error) {
      console.error('Error deleting map:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={isLoading}
        title="Map verwijderen"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-600 hover:bg-neutral-700 transition-colors"
      >
        <Trash2 className="h-5 w-5 text-red-500" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] z-110">
          <DialogHeader>
            <DialogTitle>Map verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je de map "{mapName}" wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden. Alle lijsten in deze map blijven bestaan, maar de map zelf wordt permanent verwijderd.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button1 onClick={() => setOpen(false)} text="Annuleren" />
            <Button1
              onClick={() => { handleDelete(); setOpen(false); }}
              text={isLoading ? "Bezig..." : "Definitief verwijderen"}
              disabled={isLoading}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
