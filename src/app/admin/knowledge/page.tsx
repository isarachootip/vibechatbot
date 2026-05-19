import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { addKnowledge, deleteKnowledge } from "@/actions/admin-knowledge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function KnowledgeBasePage() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") redirect("/");

    const kbs = await prisma.knowledgeBase.findMany({ orderBy: { createdAt: 'desc' } });

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <Brain className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Knowledge Base (KM)</h1>
                    <p className="text-muted-foreground">สอน AI ให้ตอบคำถามที่พบบ่อย (FAQ) ตามที่คุณต้องการ</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Add New Knowledge */}
                <Card className="col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="w-5 h-5" /> เพิ่มความรู้ใหม่
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={addKnowledge} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">คำถามที่พบบ่อย (หรือคีย์เวิร์ด)</label>
                                <input name="question" required className="w-full p-2 border rounded-md" placeholder="เช่น: มีโปรโมชั่นยางไหม?" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">คำตอบที่ให้ AI นำไปใช้</label>
                                <textarea name="answer" required rows={4} className="w-full p-2 border rounded-md" placeholder="ตอนนี้ซื้อยาง 3 แถม 1 ครับ..." />
                            </div>
                            <Button type="submit" className="w-full">บันทึกความรู้</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List of Knowledge */}
                <div className="col-span-1 md:col-span-2 space-y-4">
                    {kbs.map(kb => (
                        <Card key={kb.id}>
                            <CardContent className="p-4 flex gap-4 justify-between">
                                <div>
                                    <h3 className="font-bold text-primary">Q: {kb.question}</h3>
                                    <p className="text-sm text-gray-700 mt-2">A: {kb.answer}</p>
                                </div>
                                <form action={async () => {
                                    'use server';
                                    await deleteKnowledge(kb.id);
                                }}>
                                    <Button variant="ghost" size="icon" type="submit" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    ))}
                    {kbs.length === 0 && (
                        <div className="text-center p-12 text-gray-500 bg-white rounded-xl border border-dashed">
                            ยังไม่มีข้อมูลความรู้ในระบบ ลองเพิ่มคำถาม-คำตอบแรกดูสิครับ!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
