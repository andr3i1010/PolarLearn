"use client";
import { UseFormReturn } from "react-hook-form";
import Button1 from "@/components/button/Button1";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MapFormValues } from "@/hooks/useMapCreation";

interface MapDialogProps {
  dialogOpen: boolean;
  handleOpenChange: (isOpen: boolean) => void;
  form: UseFormReturn<MapFormValues>;
  onSubmit: (values: MapFormValues) => void;
  isSubmitting: boolean;
}

export default function MapDialog({
  dialogOpen,
  handleOpenChange,
  form,
  onSubmit,
  isSubmitting
}: MapDialogProps) {
  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="z-[110] sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Nieuwe map aanmaken</DialogTitle>
          <DialogDescription>
            Maak een nieuwe map aan om je lijsten te organiseren.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xl">Mapnaam:</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Naam van je map"
                      className="bg-neutral-800 border-neutral-700 h-10 text-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-neutral-800 border-neutral-700 mb-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-xl">
                      Openbare map
                    </FormLabel>
                    <span className="block text-sm text-gray-400">
                      {field.value
                        ? "Iedereen kan deze map bekijken (alleen jij kan bewerken)."
                        : "Alleen jij kunt deze map bekijken en bewerken."}
                    </span>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end flex-row">
              <Button1
                type="submit"
                text={isSubmitting ? "Bezig met aanmaken..." : "Map aanmaken"}
                disabled={isSubmitting}
              />
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
