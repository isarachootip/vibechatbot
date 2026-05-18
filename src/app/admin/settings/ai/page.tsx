import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { updateGeminiKey } from "@/actions/admin-ai-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, KeyRound, Save } from "lucide-react";

export default async function AISettingsPage() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        redirect("/");
    }

    const config = await prisma.shopConfig.findFirst();
    const currentKey = config?.geminiApiKey || "";

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <Bot className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI Configuration</h1>
                    <p className="text-muted-foreground">ตั้งค่าการทำงานของระบบแชทบอท AI</p>
                </div>
            </div>

            <Card className="border-border/40 shadow-sm backdrop-blur-xl bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <KeyRound className="w-5 h-5 text-blue-500" />
                        Google Gemini API Key
                    </CardTitle>
                    <CardDescription>
                        ระบุ API Key เพื่อให้ระบบแชทบอทสามารถวิเคราะห์ข้อความและแนะนำสินค้าให้ลูกค้าได้อัตโนมัติ
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updateGeminiKey} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="geminiApiKey" className="text-sm font-medium text-foreground/80">
                                API Key (จาก Google AI Studio)
                            </label>
                            <input
                                type="password"
                                id="geminiApiKey"
                                name="geminiApiKey"
                                defaultValue={currentKey}
                                placeholder="AIzaSy..."
                                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <p className="text-xs text-muted-foreground">หากไม่ระบุ ระบบจะพยายามดึงจากไฟล์ .env แทน</p>
                        </div>
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 gap-2"
                        >
                            <Save className="w-4 h-4" />
                            บันทึกการตั้งค่า
                        </button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
