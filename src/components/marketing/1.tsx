"use client"
import { motion } from "motion/react"
import Image from "next/image"
import pl_500 from '@/app/img/pl-500.svg'
import React from 'react';
import Button1 from "../button/Button1";

export default function FirstMarketingComponent() {
    return (
        <div className="relative" style={{ width: 300, height: 200 }}>
            <motion.div
                className="absolute"
                style={{ zIndex: 2 }} // image appears over the card
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 100 }}
                transition={{ duration: 0.7, delay: 0.5 }}
            >
                <Image
                    src={pl_500}
                    alt="PolarLearn plaatje"
                    width={120}
                    height={120}
                />
            </motion.div>
            <motion.div
                className="absolute bg-neutral-800 rounded-lg text-white text-center"
                style={{ width: 384, height: 220, bottom: -40, left: 250, zIndex: 1 }}
                initial={{ x: 0, opacity: 0 }}
                whileInView={{ x: -70, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
            >
                <div className="flex flex-col justify-between items-center w-full h-full p-4">
                    <p>Vertaal:</p>
                    <div className="w-full text-2xl font-bold">
                        Ouvrer
                    </div>
                    <hr className="w-full border-t border-neutral-600 mt-2 -mx-4" />
                    <div className="h-4" />
                    <div className="w-full flex justify-center">
                        <input
                            className="bg-neutral-800 text-white h-12 w-3/4 rounded-lg text-center text-xl"
                            type="text"
                            placeholder="Antwoord komt hier"
                        />
                    </div>
                    <div className="h-4" />
                    <Button1 text="Inleveren" />
                </div>
            </motion.div>
        </div>
    );
}