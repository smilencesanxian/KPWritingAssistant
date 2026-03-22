import Card from '@/components/ui/Card';

interface StatCardProps {
  label: string;
  value: number;
  unit: string;
}

export default function StatCard({ label, value, unit }: StatCardProps) {
  return (
    <Card className="flex-1 flex flex-col items-center justify-center py-4 px-2 text-center">
      <span className="text-3xl font-bold text-primary-600">{value}</span>
      <span className="text-xs text-neutral-400 mt-0.5">{unit}</span>
      <span className="text-sm text-neutral-600 mt-1 leading-tight">{label}</span>
    </Card>
  );
}
