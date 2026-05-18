"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";

// Update Order Status with LINE Push Notification
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    try {
        const session = await auth();
        if (session?.user?.role !== "ADMIN") {
            throw new Error("Unauthorized");
        }

        // Get order details
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                queueNumber: true,
                lineUserId: true,
                status: true
            }
        });

        if (!order) {
            throw new Error("Order not found");
        }

        // Update status
        await prisma.order.update({
            where: { id: orderId },
            data: { status: newStatus }
        });

        // Send LINE push notification if order is ready
        if (newStatus === "SHIPPED" && order.lineUserId) {
            const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

            if (LINE_ACCESS_TOKEN) {
                try {
                    await fetch("https://api.line.me/v2/bot/message/push", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${LINE_ACCESS_TOKEN}`
                        },
                        body: JSON.stringify({
                            to: order.lineUserId,
                            messages: [{
                                type: "text",
                                text: `🎉 คิวที่ #${order.queueNumber} พร้อมแล้วค่ะ!\n\nกรุณามารับที่เคาน์เตอร์ค่ะ ☕`
                            }]
                        })
                    });
                } catch (error) {
                    console.error("Failed to send LINE notification:", error);
                    // Don't throw - order status was updated successfully
                }
            }
        }

        revalidatePath("/admin/orders");
        revalidatePath(`/admin/orders/${orderId}`);

        return { success: true };
    } catch (error) {
        console.error("Update Order Status Error:", error);
        throw new Error("Failed to update order status");
    }
}
