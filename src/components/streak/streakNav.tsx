"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Check, Flame, Snowflake, X } from "lucide-react"

import { getAllStreakData } from "./streakData"
import { updateDailyStreak } from "./updateStreak"
import { ColorRing } from "react-loader-spinner"

// Create a cache to prevent redundant requests
let dataCache = {
    data: null as any,
    timestamp: 0,
    loading: false
};

// Function to reset the cache
function resetCache() {
    dataCache = {
        data: null,
        timestamp: 0,
        loading: false
    };
}

export default function StreakNavbarThing() {
    const [streakCnt, setStreakCnt] = useState(0)
    const [freezeCnt, setFreezeCnt] = useState(0)
    const [loading, setLoading] = useState(true)
    const [weekActivity, setWeekActivity] = useState<Array<{ date: string, status: string }>>([])

    // Function to load fresh streak data
    const refreshData = useCallback(async () => {
        if (dataCache.loading) return;

        setLoading(true);
        resetCache();

        try {
            dataCache.loading = true;
            const data = await getAllStreakData();

            dataCache = {
                data,
                timestamp: Date.now(),
                loading: false
            };

            setStreakCnt(data.streak);
            setFreezeCnt(data.freezes);
            setWeekActivity(data.weekActivity);
            setLoading(false);
        } catch (error) {
            console.error("Error refreshing streak data:", error);
            dataCache.loading = false;
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        // Listen for streak data updates
        const handleStreakUpdate = () => {
            if (isMounted) {
                refreshData();
            }
        };

        window.addEventListener('streak-data-updated', handleStreakUpdate);

        const loadData = async () => {
            try {
                // We no longer update streak automatically - this will happen when a list is completed
                // await updateDailyStreak();

                // Check if we have cached data that's less than 5 minutes old
                const now = Date.now();
                if (dataCache.data && now - dataCache.timestamp < 5 * 60 * 1000) {
                    // Use cached data
                    if (isMounted) {
                        setStreakCnt(dataCache.data.streak);
                        setFreezeCnt(dataCache.data.freezes);
                        setWeekActivity(dataCache.data.weekActivity);
                        setLoading(false);
                    }
                    return;
                }

                // If another component is already loading the data, wait for it
                if (dataCache.loading) {
                    // Poll until data is available
                    const checkInterval = setInterval(() => {
                        if (dataCache.data && isMounted) {
                            setStreakCnt(dataCache.data.streak);
                            setFreezeCnt(dataCache.data.freezes);
                            setWeekActivity(dataCache.data.weekActivity);
                            setLoading(false);
                            clearInterval(checkInterval);
                        }
                    }, 100);

                    // Cleanup interval if component unmounts
                    return () => clearInterval(checkInterval);
                }

                // Mark as loading to prevent duplicate requests
                dataCache.loading = true;

                // Fetch new data
                const data = await getAllStreakData();

                // Cache the result
                dataCache = {
                    data,
                    timestamp: now,
                    loading: false
                };

                if (isMounted) {
                    setStreakCnt(data.streak);
                    setFreezeCnt(data.freezes);
                    setWeekActivity(data.weekActivity);
                    setLoading(false);
                }
            } catch (error) {
                dataCache.loading = false;
                console.error("Error loading streak data:", error);
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        // Cleanup function
        return () => {
            isMounted = false;
            window.removeEventListener('streak-data-updated', handleStreakUpdate);
        };
    }, [refreshData]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'done':
                return <Check className="text-green-400" size={18} />
            case 'frozen':
                return <Snowflake className="text-blue-400" size={18} />
            case 'none':
            default:
                return <X className="text-red-400" size={18} />
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('nl-NL', { weekday: 'short' }).substring(0, 2)
    }

    return (
        <Popover>
            <PopoverTrigger>
                <div className="bg-neutral-800 text-white rounded-lg flex items-center justify-center min-w-40 min-h-10 hover:bg-neutral-700 transition-colors px-2">
                    <Flame className={`mr-1 ${streakCnt >= 1 ? "text-orange-400" : "text-white"}`} />
                    {loading ? (
                        <ColorRing
                            visible={true}
                            height="40"
                            width="40"
                            ariaLabel="color-ring-loading"
                            wrapperStyle={{}}
                            wrapperClass="color-ring-wrapper"
                            colors={['#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8']}
                        />
                    ) : streakCnt}
                </div>
            </PopoverTrigger>
            <PopoverContent className={`w-80 bg-neutral-800 z-110 drop-shadow-2xl min-h-40 flex flex-col space-y-3 text-white justify-center`}>
                <div className="flex flex-row space-x-3">
                    <div className="flex flex-col items-center justify-center h-min-10 hover:bg-neutral-700 drop-shadow-2xl rounded-lg w-full transition-all gap-y-3 text-white border-neutral-700 border-1 py-3">
                        <Flame className={`${streakCnt >= 1 ? "text-orange-400" : "text-white"}`} />
                        {loading ? (
                            <ColorRing
                                visible={true}
                                height="40"
                                width="40"
                                ariaLabel="color-ring-loading"
                                wrapperStyle={{}}
                                wrapperClass="color-ring-wrapper"
                                colors={['#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8']}
                            />
                        ) : (
                            <>{streakCnt} {streakCnt === 1 ? "dag" : "dagen"} reeks</>
                        )}
                    </div>
                    <div className="flex flex-col items-center justify-center h-min-10 hover:bg-neutral-700 drop-shadow-2xl rounded-lg w-full gap-y-3 text-white border-neutral-700 border-1 py-3">
                        <Snowflake className={`${freezeCnt >= 1 ? "text-sky-400" : "text-white"}`} />
                        {loading ? (
                            <ColorRing
                                visible={true}
                                height="40"
                                width="40"
                                ariaLabel="color-ring-loading"
                                wrapperStyle={{}}
                                wrapperClass="color-ring-wrapper"
                                colors={['#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8']}
                            />
                        ) : (
                            <>{freezeCnt} {freezeCnt === 1 ? "bevriezer" : "bevriezers"}</>
                        )}
                    </div>
                </div>
                <div className="flex flex-col space-y-2">
                    <div className="text-sm text-center">Activiteit afgelopen week</div>
                    <div className="flex flex-row items-center justify-center h-min-10 space-x-3 rounded-lg p-3">
                        {weekActivity.map((day, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div className="text-xs mb-1">{formatDate(day.date)}</div>
                                <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center hover:bg-neutral-600 hover:drop-shadow-2xl transition-all">
                                    {getStatusIcon(day.status)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-row justify-center space-x-4 text-xs text-gray-300">
                        <div className="flex items-center space-x-1">
                            <Check className="text-green-400" size={14} />
                            <span>Geleerd</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Snowflake className="text-blue-400" size={14} />
                            <span>Bevroren</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <X className="text-red-400" size={14} />
                            <span>Gemist</span>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}