"use client"
import construction from '@/app/img/construction.gif';
import Button1 from '@/components/button/Button1';
import Image from 'next/image';

export default function Page() {
    return (
        <div className='flex justify-center items-center h-screen flex-col'>
            <Image src={construction} alt="Under construction" />
            <br />
            <Button1 text='Terug naar home' redirectTo='/home/start' />
        </div>
    )
}