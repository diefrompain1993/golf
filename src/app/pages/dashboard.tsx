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
  const canViewOwnerNames = user?.role !== 'guard';
  const isOfficeAdmin = user?.role === 'office_admin';
  const whiteList = 24;
  const blackList = 3;
  const noList = 12;
  const contractors = 19;
  const total = whiteList + blackList + noList + contractors;
  const showStats = isOfficeAdmin;
  const showLastEntry = user?.role === 'guard' || user?.role === 'admin';
  const dashboardGridClass = showLastEntry
    ? `grid grid-cols-1 gap-6 xl:grid-cols-[396px_minmax(0,1fr)] ${isGuard ? 'xl:items-start' : 'xl:items-stretch'}`
    : 'grid grid-cols-1 gap-6 lg:grid-cols-[396px_minmax(0,1fr)] lg:items-stretch';
  const leftColumnClass = showLastEntry
    ? `flex min-h-0 flex-col gap-6 ${isGuard ? '' : 'xl:h-full xl:self-stretch'}`
    : 'flex min-h-0 flex-col gap-6 lg:h-full lg:self-stretch';
  const rightColumnClass = showLastEntry
    ? `min-w-0 ${isGuard ? '' : 'xl:h-full xl:self-stretch'}`
    : 'min-w-0 lg:h-full lg:self-stretch';
  const quickSearchClass = showLastEntry
    ? `w-full overflow-hidden xl:mt-0 ${isGuard ? '' : 'xl:flex-1'}`
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
              className={`w-full bg-white rounded-xl border border-border shadow-sm flex flex-col ${
                isGuard ? 'px-5 pt-5 pb-5 gap-2.5 md:px-6 xl:px-7 xl:pt-5 xl:pb-4 xl:gap-2.5' : 'px-8 pt-6 pb-6 gap-3'
              }`}
            >
              <h2 className="text-[20px] font-bold text-foreground tracking-tight">
                Последний въезд
              </h2>
              <div
                className={`rounded-xl overflow-hidden border border-border ${
                  isGuard ? 'h-[230px] sm:h-[270px] md:h-[320px] xl:h-[272px] xl:flex-none' : 'flex-1 min-h-0'
                }`}
              >
                <img
                  src="/car_number.jpg"
                  alt="Последний въезд"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid gap-1.5 text-sm text-foreground/80">
                {isGuard ? (
                  <>
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
                    <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                      <div className="plate-text text-[1.08rem] text-foreground">
                        {lastEntry.plateNumber}
                        {showLastEntryCountryCode ? ` (${lastEntryCountryCode})` : ''}
                      </div>
                      <div className="mt-2.5 flex justify-center">
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
                        <div className="mt-2.5 flex justify-center">
                          <span
                            className={`inline-flex max-w-full items-center justify-center rounded-full border px-2.5 py-1 text-center text-[11px] font-semibold leading-tight ${lastEntryAccessClassName}`}
                          >
                            {lastEntryAccessLabel}
                          </span>
                        </div>
                      )}
                      {showLastEntryNotes && (
                        <div className="mt-2.5 border-t border-border/70 pt-2.5 text-center text-sm font-medium leading-snug text-foreground/85">
                          {lastEntryNotes}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span>Время въезда</span>
                      <span className="text-foreground font-semibold">
                        {lastEntry.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Номер</span>
                      <span className="text-right text-foreground plate-text">
                        {lastEntry.plateNumber}
                        {showLastEntryCountryCode ? ` (${lastEntryCountryCode})` : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Камера</span>
                      <span className="text-foreground font-semibold">{lastEntry.camera}</span>
                    </div>
                    {canViewOwnerNames && (
                      <div className="flex items-center justify-between gap-3">
                        <span>Владелец</span>
                        <span className="text-foreground font-semibold">{lastEntry.owner}</span>
                      </div>
                    )}
                    {showLastEntryNotes && (
                      <div className="flex items-center justify-between gap-3">
                        <span>Примечание</span>
                        <span className="text-foreground font-semibold text-right">{lastEntryNotes}</span>
                      </div>
                    )}
                    {showLastEntryAccessState && (
                      <div className="flex justify-center pt-1">
                        <span
                          className={`inline-flex max-w-full items-center justify-center rounded-full border px-3 py-1 text-center text-[12px] font-semibold leading-tight ${lastEntryAccessClassName}`}
                        >
                          {lastEntryAccessLabel}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-center pt-[14px]">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${lastEntryListMeta.badgeClassName}`}
                        aria-label={lastEntryListMeta.label}
                        title={lastEntryListMeta.label}
                      >
                        <lastEntryListMeta.Icon className="h-4 w-4" strokeWidth={2} />
                        {lastEntryListMeta.label}
                      </span>
                    </div>
                  </>
                )}
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
