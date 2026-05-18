"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateGeminiKey(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const apiKey = formData.get("geminiApiKey") as string;

    try {
        let config = await prisma.shopConfig.findFirst();
        
        if (config) {
            await prisma.shopConfig.update({
                where: { id: config.id },
                data: { geminiApiKey: apiKey || null },
            });
        } else {
            await prisma.shopConfig.create({
                data: { geminiApiKey: apiKey || null },
            });
        }

        revalidatePath("/admin/settings/ai");
        return { success: true, message: "บันทึก API Key สำเร็จ" };
    } catch (error) {
        console.error("Update AI Settings Error:", error);
        return { success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
    }
}
