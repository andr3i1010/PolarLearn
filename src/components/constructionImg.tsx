import Image from 'next/image';
import construction from '@/app/img/construction.gif';
export default function ConstructionImg() {
    return (
        <Image src={construction} alt="Under construction" />
    );
}