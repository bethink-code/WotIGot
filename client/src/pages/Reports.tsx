import { useState } from "react";
import { Download } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import { useHouses } from "@/lib/queries";
import { api } from "@/lib/api";
import { downloadBlob, formatRand } from "@/lib/utils";

export default function Reports() {
  const { data: houses } = useHouses();
  const [downloading, setDownloading] = useState(false);

  const totalProperties = houses?.length ?? 0;
  const totalItems = houses?.reduce((sum, h) => sum + (h.total_items || 0), 0) ?? 0;
  const totalValue = houses?.reduce((sum, h) => sum + (h.total_value || 0), 0) ?? 0;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get("/reports/xlsx", { responseType: "blob" });
      downloadBlob(res.data, `wotigot_report_${Date.now()}.xlsx`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Reports" subtitle="Download inventory reports" color="green" />

      <div className="px-4 py-4 space-y-4 animate-slideUp">
        <SectionLabel>SELECT REPORT SCOPE</SectionLabel>
        <p className="font-dm text-sm text-text-grey">
          Choose which properties to include in your report. Select "All Properties" for a complete inventory, or pick a specific property.
        </p>

        {/* All properties card (selected) */}
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-green shadow-card-soft">
          <div className="w-10 h-10 rounded-xl bg-green-soft flex items-center justify-center">
            <span className="text-green text-lg">🏠</span>
          </div>
          <div className="flex-1">
            <p className="font-poppins font-semibold text-sm text-text-dark">All Properties</p>
            <p className="font-dm text-xs text-text-grey">
              {totalProperties} properties · {totalItems} items · {formatRand(totalValue)}
            </p>
          </div>
          <div className="w-6 h-6 rounded-full bg-green flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        </div>

        {totalProperties === 0 && (
          <p className="font-dm text-sm text-green text-center">
            No properties found. Add a property first to generate reports.
          </p>
        )}

        {/* Info box */}
        <div className="bg-yellow-soft rounded-xl p-4">
          <p className="font-poppins font-semibold text-sm text-text-dark mb-2">What's included in the report?</p>
          <ul className="font-dm text-sm text-text-grey space-y-1">
            <li>· Property and room details</li>
            <li>· Item descriptions, brands, and models</li>
            <li>· Serial numbers and categories</li>
            <li>· Prices and estimated values</li>
            <li>· One sheet per property (for "All Properties")</li>
          </ul>
        </div>

        <Button
          onClick={handleDownload}
          loading={downloading}
          disabled={totalProperties === 0}
          color="green"
          icon={<Download size={18} />}
        >
          Download Excel Report
        </Button>
      </div>
    </div>
  );
}
