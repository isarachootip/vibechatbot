import { MapPin, Phone, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const branches = [
  {
    name: "สาขา ไทวัสดุ บางนา",
    address: "123 ถนนบางนา-ตราด กม.8 แขวงบางนา เขตบางนา กรุงเทพฯ 10260",
    time: "เปิดให้บริการทุกวัน 08:00 - 20:00 น.",
    tel: "02-123-4567",
    image: "https://placehold.co/600x400/e11d48/fff?text=Auto1+Bangna"
  },
  {
    name: "สาขา ไทวัสดุ ลาดพร้าว",
    address: "456 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900",
    time: "เปิดให้บริการทุกวัน 08:00 - 20:00 น.",
    tel: "02-987-6543",
    image: "https://placehold.co/600x400/e11d48/fff?text=Auto1+Ladprao"
  },
  {
    name: "สาขา โรบินสัน ไลฟ์สไตล์ รังสิต",
    address: "789 ถนนพหลโยธิน ตำบลประชาธิปัตย์ อำเภอธัญบุรี ปทุมธานี 12130",
    time: "เปิดให้บริการทุกวัน 10:00 - 21:00 น.",
    tel: "02-555-8888",
    image: "https://placehold.co/600x400/e11d48/fff?text=Auto1+Rangsit"
  }
];

export function BranchesSection() {
  return (
    <section className="bg-gray-50 py-16 border-t">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">สาขาของเรา (Fastauto Service)</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ครอบคลุมทุกพื้นที่ พร้อมให้บริการดูแลรักษารถยนต์ของคุณด้วยช่างผู้เชี่ยวชาญ และมาตรฐานระดับศูนย์บริการ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {branches.map((branch, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="h-48 bg-gray-200 relative overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={branch.image} 
                  alt={branch.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  เปิดให้บริการ
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">{branch.name}</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <MapPin className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                    <span className="leading-relaxed">{branch.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Clock className="w-5 h-5 text-primary shrink-0" />
                    <span>{branch.time}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone className="w-5 h-5 text-primary shrink-0" />
                    <span className="font-medium">{branch.tel}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full group border-primary/20 hover:bg-primary/5 text-primary">
                  ดูแผนที่และการเดินทาง
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
