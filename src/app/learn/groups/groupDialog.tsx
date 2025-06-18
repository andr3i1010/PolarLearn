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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { GroupFormValues } from "@/hooks/useGroupCreation";

interface GroupDialogProps {
    dialogOpen: boolean;
    handleOpenChange: (isOpen: boolean) => void;
    form: UseFormReturn<GroupFormValues>;
    onSubmit: (values: GroupFormValues) => void;
    isSubmitting: boolean;
}

export default function GroupDialog({
    dialogOpen,
    handleOpenChange,
    form,
    onSubmit,
    isSubmitting
}: GroupDialogProps) {
    return (
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="z-[110] sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Nieuwe groep aanmaken</DialogTitle>
                    <DialogDescription>
                        Maak een nieuwe groep aan om samen met anderen te leren.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xl">Groepsnaam:</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Naam van je groep"
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
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xl">
                                        Beschrijving: <span className="text-sm text-gray-400">(optioneel)</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Beschrijf waar je groep over gaat... (optioneel)"
                                            className="bg-neutral-800 border-neutral-700 h-32 text-lg p-3 resize-none"
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
                                            Openbare groep
                                        </FormLabel>
                                        <span className="block text-sm text-gray-400">
                                            {field.value
                                                ? "Iedereen kan direct lid worden."
                                                : "Leden moeten goedgekeurd worden."}
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

                        <FormField
                            control={form.control}
                            name="canEveryoneAddLists"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-neutral-800 border-neutral-700">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-xl">
                                            Lijsten toevoegen
                                        </FormLabel>
                                        <span className="block text-sm text-gray-400">
                                            {field.value
                                                ? "Alle leden kunnen lijsten toevoegen."
                                                : "Alleen beheerders kunnen lijsten toevoegen."}
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
                                text={isSubmitting ? "Bezig met aanmaken..." : "Groep aanmaken"}
                                disabled={isSubmitting}
                            />
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}