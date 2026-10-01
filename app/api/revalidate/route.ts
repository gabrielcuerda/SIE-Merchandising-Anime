import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  revalidatePath("/", "layout");

  return NextResponse.json({ revalidated: true });
}
