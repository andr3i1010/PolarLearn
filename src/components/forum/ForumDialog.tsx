"use client";
import { memo, useCallback, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Button1 from "@/components/button/Button1";
import ReactMarkdown from 'react-markdown';
import Tabs, { TabItem } from "@/components/Tabs";
import { SelectCategoryCombobox } from "@/app/home/forum/selectCategoryCombobox";
import { Combobox } from "@/app/home/forum/selectSubjCombobox";
import { ForumFormValues } from "@/hooks/useForumCreation";

// Memoized markdown preview component
const MarkdownPreview = memo(({ content }: { content: string }) => (
    <div className="bg-neutral-800 border border-neutral-700 h-40 overflow-y-auto p-3 rounded-md prose prose-invert max-w-none whitespace-pre-line">
        {content ? (
            <ReactMarkdown components={{
                h1: ({ node, ...props }) => <h1 className="text-4xl font-bold my-4" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-3xl font-bold my-3" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-2xl font-semibold my-2" {...props} />,
                img: ({ src, alt, ...props }) => (
                    <img
                        src={src}
                        alt={alt || ""}
                        style={{ maxWidth: "100%", maxHeight: "400px", height: "auto" }}
                        {...props}
                    />
                ),
            }}>
                {content}
            </ReactMarkdown>
        ) : (
            <p className="text-gray-400">Voorbeeldweergave verschijnt hier...</p>
        )}
    </div>
));

// Memoized title field component
const TitleField = memo(({ control }: { control: any }) => {
    return (
        <FormField
            control={control}
            name="title"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-xl">Titel:</FormLabel>
                    <FormControl>
                        <Input
                            placeholder="Titel van de post"
                            className="bg-neutral-800 border-neutral-700 h-10 text-xl text-center font-bold"
                            {...field}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
});

// Memoized content field component
const ContentField = memo(({ control, content }: { control: any; content: string }) => {
    return (
        <FormField
            control={control}
            name="content"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-xl">Postinhoud:</FormLabel>
                    <Tabs tabs={[
                        {
                            id: "write",
                            label: "Schrijven",
                            content: (
                                <div>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Inhoud van de post. Markdown wordt ondersteund."
                                            className="bg-neutral-800 border-neutral-700 h-40 text-xl p-3 resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <div className="text-sm mt-2 text-gray-400">
                                        <p>Markdown tips:</p>
                                        <p>**vetgedrukt**, *schuingedrukt*, [link](https://url.com)</p>
                                        <p># Grote kop, ## Kleinere kop, ### Nog kleinere kop</p>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            id: "preview",
                            label: "Voorbeeld",
                            content: <MarkdownPreview content={content} />,
                        },
                    ]} defaultActiveTab="write" />
                    <FormMessage />
                </FormItem>
            )}
        />
    );
});

// Memoized category field component
const CategoryField = memo(({ control, isAdmin }: { control: any; isAdmin: boolean }) => {
    return (
        <FormField
            control={control}
            name="category"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-xl">Categorie:</FormLabel>
                    <FormControl>
                        <SelectCategoryCombobox
                            initialValue={field.value}
                            onSelect={(value) => {
                                field.onChange(value);
                            }}
                            isAdmin={isAdmin}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
});

// Memoized subject field component
const SubjectField = memo(({
    control,
    isSubmitting,
    banned,
    onSubmit,
    category,
    form
}: {
    control: any;
    isSubmitting: boolean;
    banned: boolean;
    onSubmit: () => void;
    category: string;
    form: any;
}) => {
    // Use exact string comparison - category might sometimes be undefined
    const isSchoolCategory = category === "school";

    // Auto-clear subject field when changing away from school category
    useEffect(() => {
        if (!isSchoolCategory && form) {
            form.setValue("subject", "");
        }
    }, [isSchoolCategory, form]);

    return (
        <FormField
            control={control}
            name="subject"
            render={({ field }) => (
                <FormItem>
                    <FormControl>
                        <div className="flex items-center justify-between w-full">
                            <div className="w-60">
                                {isSchoolCategory ? (
                                    <Combobox
                                        placeholder="Selecteer een vak"
                                        minWidth="100%"
                                        initialValue={field.value}
                                        onSelectAction={(value) => {
                                            field.onChange(value);
                                        }}
                                    />
                                ) : null}
                            </div>
                            <Button1
                                text={isSubmitting ? 'Bezig met plaatsen...' : 'Post aanmaken'}
                                disabled={isSubmitting || banned}
                                onClick={onSubmit}
                            />
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
});

interface ForumDialogProps {
    dialogOpen: boolean;
    handleOpenChange: (isOpen: boolean) => void;
    form: UseFormReturn<ForumFormValues>;
    onSubmit: (values: ForumFormValues) => void;
    isSubmitting: boolean;
    isAdmin: boolean;
    banned: boolean;
    content: string;
    selectedCategory: string;
}

export default function ForumCreateDialog({
    dialogOpen,
    handleOpenChange,
    form,
    onSubmit,
    isSubmitting,
    isAdmin,
    banned,
    content,
    selectedCategory
}: ForumDialogProps) {
    // Memoize form submission handler
    const handleFormSubmit = useCallback(() => {
        form.handleSubmit(onSubmit)();
    }, [form, onSubmit]);

    return (
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="z-[110] max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Nieuwe forumpost</DialogTitle>
                    <DialogDescription>
                        Vul de details in om een nieuwe forumpost te maken. Markdown wordt ondersteund.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit(onSubmit)(e);
                    }} className="space-y-6">
                        <TitleField control={form.control} />
                        <CategoryField control={form.control} isAdmin={isAdmin} />
                        <ContentField control={form.control} content={content} />
                        <SubjectField
                            control={form.control}
                            isSubmitting={isSubmitting}
                            banned={banned}
                            onSubmit={handleFormSubmit}
                            category={selectedCategory}
                            form={form}
                        />
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
