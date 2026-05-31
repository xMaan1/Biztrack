import { VerifiedCompanyBadge } from '@/src/components/common/VerifiedCompanyBadge';

export function SidebarFooter() {
  return (
    <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
      <div className="mb-3 flex justify-center">
        <VerifiedCompanyBadge className="scale-90" />
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-1">Powered by</p>
        <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          BizTrack Technologies
        </p>
      </div>
    </div>
  );
}
