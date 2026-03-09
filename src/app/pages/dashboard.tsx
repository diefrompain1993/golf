import { StatsCard } from '@/app/components/stats-card';
import { EventsTable } from '@/app/components/events-table';
import { QuickSearch } from '@/app/components/quick-search';
import { useAuth } from '@/auth/authContext';
import { AlertCircle, Users2, ShieldCheck, ShieldAlert, Building2 } from 'lucide-react';
import type { RouteId } from '@/app/routesConfig';
import { getPlateCountryCode } from '@/app/utils/plate';
import {
  getContractorOwnerAccessState,
  parseDateToTimestamp
} from '@/app/utils/contractorAccess';

interface DashboardProps {
  onNavigate?: (page: RouteId) => void;
}

type LastEntryStatus = 'Белый' | 'Чёрный' | 'Подрядчик' | 'Нет в списках';

const getLastEntryListMeta = (status: LastEntryStatus) => {
  switch (status) {
    case 'Белый':
      return {
        label: 'Белый список',
        badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        Icon: ShieldCheck
      };
    case 'Чёрный':
      return {
        label: 'Чёрный список',
        badgeClassName: 'border-red-200 bg-red-50 text-red-700',
        Icon: ShieldAlert
      };
    case 'Подрядчик':
      return {
        label: 'Подрядчики',
        badgeClassName: 'border-violet-200 bg-violet-50 text-violet-700',
        Icon: Building2
      };
    default:
      return {
        label: 'Нет в списках',
        badgeClassName: 'border-orange-200 bg-orange-50 text-orange-700',
        Icon: AlertCircle
      };
  }
};

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const isGuard = user?.role === 'guard';
  const isAdmin = user?.role === 'admin';
  const usesGuardDashboardLayout = user?.role === 'guard' || user?.role === 'admin';
  const isOfficeAdmin = user?.role === 'office_admin';
  const whiteList = 24;
  const blackList = 3;
  const noList = 12;
  const contractors = 19;
  const total = whiteList + blackList + noList + contractors;
  const showStats = isOfficeAdmin;
  const showLastEntry = usesGuardDashboardLayout;
  const dashboardGridClass = showLastEntry
    ? 'grid grid-cols-1 gap-6 xl:grid-cols-[396px_minmax(0,1fr)] xl:items-start'
    : 'grid grid-cols-1 gap-6 lg:grid-cols-[396px_minmax(0,1fr)] lg:items-stretch';
  const leftColumnClass = showLastEntry
    ? `flex min-h-0 flex-col ${isAdmin ? 'gap-3' : 'gap-6'}`
    : 'flex min-h-0 flex-col gap-6 lg:h-full lg:self-stretch';
  const rightColumnClass = showLastEntry
    ? 'min-w-0'
    : 'min-w-0 lg:h-full lg:self-stretch';
  const quickSearchClass = showLastEntry
    ? 'w-full overflow-hidden xl:mt-0'
    : 'w-full overflow-hidden';
  const lastEntry = {
    date: '12.02.2026',
    time: '12:41:23',
    plateNumber: 'H123HH16',
    country: 'RUS',
    status: 'Подрядчик' as const,
    camera: 'Въезд-1',
    owner: 'ООО "ТрансСервис"',
    notes: 'Логистика'
  };
  const lastEntryListMeta = getLastEntryListMeta(lastEntry.status);
  const lastEntryCountryCode = getPlateCountryCode(lastEntry.plateNumber, lastEntry.country);
  const showLastEntryCountryCode = lastEntryCountryCode !== '—';
  const lastEntryOwner = lastEntry.owner.trim();
  const showLastEntryOwner =
    isAdmin && Boolean(lastEntryOwner) && lastEntryOwner !== '—' && lastEntryOwner !== '-';
  const lastEntryNotes = lastEntry.notes?.trim();
  const showLastEntryNotes = Boolean(lastEntryNotes) && lastEntryNotes !== '—' && lastEntryNotes !== '-';
  const lastEntryReferenceTimestamp = parseDateToTimestamp(lastEntry.date);
  const lastEntryAccessState =
    lastEntry.status === 'Подрядчик'
      ? getContractorOwnerAccessState(
          lastEntry.owner,
          lastEntryReferenceTimestamp ? new Date(lastEntryReferenceTimestamp) : new Date()
        )
      : null;
  const showLastEntryAccessState = Boolean(lastEntryAccessState?.accessDate);
  const lastEntryAccessLabel = lastEntryAccessState
    ? lastEntryAccessState.isExpired
      ? `Срок действия истек ${lastEntryAccessState.accessDate}`
      : `Срок действия до ${lastEntryAccessState.accessDate}`
    : '';
  const lastEntryAccessClassName = lastEntryAccessState?.isExpired
    ? 'border-red-200 bg-red-50 text-red-600'
    : 'border-slate-200 bg-slate-50 text-slate-600';

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      {showStats && (
        <div className="grid auto-rows-fr grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Всего за сегодня"
            count={total}
            icon={<Users2 className="w-6 h-6" strokeWidth={2} />}
            color="blue"
            onClick={() => onNavigate?.('vehicles')}
          />
          <StatsCard
            title="Белый список"
            count={whiteList}
            icon={<ShieldCheck className="w-6 h-6" strokeWidth={2} />}
            color="green"
            onClick={() => onNavigate?.('white-list')}
          />
          <StatsCard
            title="Чёрный список"
            count={blackList}
            icon={<ShieldAlert className="w-6 h-6" strokeWidth={2} />}
            color="red"
            onClick={() => onNavigate?.('black-list')}
          />
          <StatsCard
            title="Подрядчики"
            count={contractors}
            icon={<Building2 className="w-6 h-6" strokeWidth={2} />}
            color="purple"
            onClick={() => onNavigate?.('contractors')}
          />
        </div>
      )}
      
      {/* Events Table + Quick Search */}
      <div className={dashboardGridClass}>
        <div className={leftColumnClass}>
          {showLastEntry && (
            <div
              className={`w-full rounded-xl border border-border bg-white px-5 pt-5 shadow-sm flex flex-col gap-2.5 md:px-6 xl:px-7 xl:pt-5 xl:gap-2.5 ${
                isGuard ? 'pb-6 xl:pb-5' : 'pb-5 xl:pb-4'
              }`}
            >
              <h2 className="text-[20px] font-bold text-foreground tracking-tight">
                Последний въезд
              </h2>
              <div
                className="h-[230px] rounded-xl overflow-hidden border border-border sm:h-[270px] md:h-[320px] xl:h-[272px] xl:flex-none"
              >
                <img
                  src="/car_number.jpg"
                  alt="Последний въезд"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid gap-1.5 text-sm text-foreground/80">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-medium text-foreground/80">
                    Время въезда
                  </span>
                  <span className="text-[15px] font-semibold tracking-tight text-foreground">
                    {lastEntry.time}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-medium text-foreground/80">Камера</span>
                  <span className="text-[15px] font-semibold tracking-tight text-foreground">
                    {lastEntry.camera}
                  </span>
                </div>
                <div
                  className={`rounded-2xl border border-border bg-muted/20 px-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] ${
                    isAdmin ? 'py-3' : 'py-3.5'
                  }`}
                >
                  <div className={`plate-text text-foreground ${isAdmin ? 'text-[1.04rem]' : 'text-[1.08rem]'}`}>
                    {lastEntry.plateNumber}
                    {showLastEntryCountryCode ? ` (${lastEntryCountryCode})` : ''}
                  </div>
                  {showLastEntryOwner && (
                    <div className="mt-1 text-[12px] font-medium leading-tight text-foreground/70">
                      <span className="mx-auto block max-w-[250px] truncate" title={lastEntryOwner}>
                        {lastEntryOwner}
                      </span>
                    </div>
                  )}
                  <div className={`flex justify-center ${isAdmin ? 'mt-2' : 'mt-2.5'}`}>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-[4px] text-[12px] font-semibold leading-none ${lastEntryListMeta.badgeClassName}`}
                      aria-label={lastEntryListMeta.label}
                      title={lastEntryListMeta.label}
                    >
                      <lastEntryListMeta.Icon className="h-3 w-3" strokeWidth={2} />
                      {lastEntryListMeta.label}
                    </span>
                  </div>
                  {showLastEntryAccessState && (
                    <div className={`flex justify-center ${isAdmin ? 'mt-2' : 'mt-2.5'}`}>
                      <span
                        className={`inline-flex max-w-full items-center justify-center rounded-full border px-2.5 py-1 text-center text-[11px] font-semibold leading-tight ${lastEntryAccessClassName}`}
                      >
                        {lastEntryAccessLabel}
                      </span>
                    </div>
                  )}
                  {showLastEntryNotes && (
                    <div
                      className={`border-t border-border/70 text-center font-medium leading-snug text-foreground/85 ${
                        isAdmin ? 'mt-2 pt-2 text-[13px]' : 'mt-2.5 pt-2.5 text-sm'
                      }`}
                    >
                      {lastEntryNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <QuickSearch className={quickSearchClass} />
        </div>
        <div className={rightColumnClass}>
          <EventsTable onViewAll={() => onNavigate?.('events')} />
        </div>
      </div>
    </div>
  );
}
