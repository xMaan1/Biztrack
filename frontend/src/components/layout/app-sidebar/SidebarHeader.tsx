import { BizTrackLogo } from '../../brand/BizTrackLogo';

interface SidebarHeaderProps {
  planLabel?: string;
}

export function SidebarHeader({ planLabel }: SidebarHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-center">
        <BizTrackLogo size="md" href="/dashboard" />
      </div>
      {planLabel && (
        <div className="mt-2 text-center">
          <div className="text-xs text-gray-500 mb-1">Current Plan</div>
          <div className="text-sm font-semibold text-gray-700">{planLabel}</div>
        </div>
      )}
    </div>
  );
}
