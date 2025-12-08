// app/api/rerum/note/[id]/route.ts
import { NextResponse } from 'next/server';

const RERUM_OBJ_PREFIX = 'https://devstore.rerum.io/v1/id/';

export async function GET(
    request: Request,
    { params }: { params: { id: string } } // destructured and awaited
) {
    const noteId = params.id; // "65dcd20fce3cc6a72dfc366e"

    if (!noteId) {
        return new NextResponse('Missing note ID', { status: 400 });
    }

    const externalUrl = `${RERUM_OBJ_PREFIX}${noteId}`;
    console.log("SERVER PROXY LOG: Fetching external note URL:", externalUrl);

    try {
        const response = await fetch(externalUrl);

        if (!response.ok) {
            console.error("Rerùm fetch failed. Status:", response.status);
            return new NextResponse('Note not found', { status: response.status });
        }

        const note = await response.json();
        return NextResponse.json(note);
    } catch (error) {
        console.error("PROXY FETCH ERROR:", error);
        return new NextResponse('Internal Proxy Error', { status: 500 });
    }
}
