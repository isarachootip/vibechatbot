"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addKnowledge(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

    const question = formData.get("question") as string;
    const answer = formData.get("answer") as string;
    const keywords = formData.get("keywords") as string;

    await prisma.knowledgeBase.create({
        data: { question, answer, keywords }
    });

    revalidatePath("/admin/knowledge");
}

export async function deleteKnowledge(id: string) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

    await prisma.knowledgeBase.delete({ where: { id } });
    revalidatePath("/admin/knowledge");
}
