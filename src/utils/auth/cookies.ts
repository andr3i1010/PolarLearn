'use server';

import { cookies } from 'next/headers';

export async function deleteRedirectCookie() {
    const cookiesStore = await cookies();
    cookiesStore.delete('polarlearn.goto');
}
