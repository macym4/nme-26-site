import { NextResponse } from "next/server";

export async function DELETE() { const response = new NextResponse(null, { status: 204 }); response.cookies.delete("date-feedback-access"); return response; }
