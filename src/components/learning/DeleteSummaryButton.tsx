'use client';

import { useState, useCallback } from "react";
import { Trash2 } from 'lucide-react';
import { deleteSummary } from '@/serverActions/summaryActions';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-toastify';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Button1 from "@/components/button/Button1";

interface DeleteSummaryButtonProps {
    summaryId: string;
    customText?: string;
}

export default function DeleteSummaryButton({ summaryId, customText }: DeleteSummaryButtonProps) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const handleDelete = useCallback(async () => {
        setIsDeleting(true);
        console.log('[DeleteSummaryButton] handleDelete called. summaryId:', summaryId, 'pathname:', pathname);

        if (!summaryId || typeof summaryId !== 'string' || summaryId.trim() === '') {
            toast.error('Ongeldig samenvatting ID voor verwijdering.');
            console.error('[DeleteSummaryButton] Invalid summaryId:', summaryId);
            setIsDeleting(false);
            setOpen(false);
            return;
        }

        try {
            const result = await deleteSummary(summaryId);
            if (result.success) {
                toast.success(result.message || 'Samenvatting succesvol verwijderd!');
                console.log('[DeleteSummaryButton] Deletion successful. Navigating...');

                const onSummaryPage = pathname?.includes(`/learn/summary/${summaryId}`);
                const onEditSummaryPage = pathname?.includes(`/learn/editsummary/${summaryId}`);
                console.log(`[DeleteSummaryButton] Current pathname: ${pathname}`);
                console.log(`[DeleteSummaryButton] summaryId: ${summaryId}`);
                console.log(`[DeleteSummaryButton] Is on summary page? ${onSummaryPage}`);
                console.log(`[DeleteSummaryButton] Is on edit summary page? ${onEditSummaryPage}`);

                if (onSummaryPage || onEditSummaryPage) {
                    console.log('[DeleteSummaryButton] Navigating to /home/start');
                    router.push('/home/start');
                } else {
                    console.log('[DeleteSummaryButton] Refreshing current page');
                    router.refresh();
                }
            } else {
                toast.error(result.error || 'Fout bij het verwijderen van de samenvatting.');
                console.error('[DeleteSummaryButton] Deletion failed:', result.error);
            }
        } catch (error) {
            console.error('[DeleteSummaryButton] Error calling deleteSummary:', error);
            toast.error('Er is een onverwachte fout opgetreden.');
        } finally {
            setIsDeleting(false);
            setOpen(false);
            console.log('[DeleteSummaryButton] handleDelete finished.');
        }
    }, [summaryId, router, pathname]);

    return (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('[DeleteSummaryButton] Button clicked. summaryId:', summaryId);
                    setOpen(true);
                }}
                className="text-red-400 p-2 rounded-full z-10 flex items-center justify-center h-10 w-10 bg-neutral-700 hover:bg-neutral-600 transition-colors"
                title="Samenvatting verwijderen"
            >
                {customText && <span className="sr-only">{customText}</span>}
                <Trash2 size={18} />
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px] z-[110]">
                    <DialogHeader>
                        <DialogTitle>Bevestig verwijdering</DialogTitle>
                        <DialogDescription>
                            Weet je zeker dat je deze samenvatting wilt verwijderen? Dit kan niet ongedaan gemaakt worden.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end space-x-2 mt-4">
                        <Button1
                            onClick={() => setOpen(false)}
                            text="Annuleren"
                        />
                        <Button1
                            onClick={handleDelete}
                            text={isDeleting ? "Bezig met verwijderen..." : "Verwijderen"}
                            disabled={isDeleting}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
