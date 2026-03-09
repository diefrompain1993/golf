import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { useMemo, useState } from 'react';
import { formatPlateNumber, getPlateCountryCode } from '@/app/utils/plate';
import { useAuth } from '@/auth/authContext';
import {
  CONTRACTOR_EXPIRED_MESSAGE,
  isContractorOwnerExpiredOnDate
} from '@/app/utils/contractorAccess';

interface Event {
  id: string;
  date: string;
  time: string;
  camera: string;
  plateNumber: string;
  country?: string;
  owner: string;
  status: 'Чёрный' | 'Белый' | 'Нет в списках' | 'Подрядчик';
}

const events: Event[] = [
  {
    id: '00001',
    date: '12.02.2026',
    time: '12:41:23',
    camera: 'Въезд-1',
    plateNumber: 'H123HH16',
    owner: 'ООО "ТрансСервис"',
    status: 'Подрядчик'
  },
  {
    id: '00002',
    date: '14.02.2026',
    time: '12:39:45',
    camera: 'Въезд-2',
    plateNumber: 'Х777ХХ78',
    owner: 'Петров П.П.',
    status: 'Белый'
  },
  {
    id: '00003',
    date: '14.02.2026',
    time: '12:35:12',
    camera: 'Въезд-1',
    plateNumber: 'М999МР77',
    owner: 'ООО "СМК"',
    status: 'Подрядчик'
  },
  {
    id: '00004',
    date: '14.02.2026',
    time: '12:20:08',
    camera: 'Въезд-1',
    plateNumber: 'К456КМ77',
    owner: 'Неизвестно',
    status: 'Нет в списках'
  },
  {
    id: '00005',
    date: '13.02.2026',
    time: '12:15:32',
    camera: 'Въезд-2',
    plateNumber: 'В888АА50',
    owner: 'Смирнова Е.П.',
    status: 'Белый'
  },
  {
    id: '00006',
    date: '13.02.2026',
    time: '12:10:15',
    camera: 'Въезд-1',
    plateNumber: 'О555ОО50',
    owner: 'ООО "СМК"',
    status: 'Подрядчик'
  },
  {
    id: '00007',
    date: '13.02.2026',
    time: '12:05:47',
    camera: 'Въезд-2',
    plateNumber: 'Р321КР78',
    owner: 'Неизвестно',
    status: 'Нет в списках'
  },
  {
    id: '00008',
    date: '13.02.2026',
    time: '12:01:19',
    camera: 'Въезд-2',
    plateNumber: 'В888АА50',
    owner: 'Смирнова Е.П.',
    status: 'Белый'
  },
  {
    id: '00009',
    date: '13.02.2026',
    time: '11:58:42',
    camera: 'Въезд-2',
    plateNumber: 'Р321КР78',
    owner: 'Неизвестно',
    status: 'Нет в списках'
  },
  {
    id: '00010',
    date: '13.02.2026',
    time: '11:54:22',
    camera: 'Въезд-3',
    plateNumber: 'К777КК52',
    owner: 'ООО "ГрандСтрой"',
    status: 'Подрядчик'
  },
  {
    id: '00011',
    date: '13.02.2026',
    time: '11:49:18',
    camera: 'Въезд-1',
    plateNumber: 'Т555ТТ77',
    owner: 'Николаев В.В.',
    status: 'Белый'
  },
  {
    id: '00012',
    date: '13.02.2026',
    time: '11:44:03',
    camera: 'Въезд-3',
    plateNumber: 'С222СС16',
    owner: 'Неизвестно',
    status: 'Нет в списках'
  },
  {
    id: '00013',
    date: '13.02.2026',
    time: '11:40:27',
    camera: 'Въезд-1',
    plateNumber: 'Е321КХ116',
    owner: 'Орлова А.А.',
    status: 'Белый'
  }
];

const parseTimeToSeconds = (value: string) => {
  const parts = value.split(':').map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return 0;
  const [hours = 0, minutes = 0, seconds = 0] = parts;
  return hours * 3600 + minutes * 60 + seconds;
};

interface EventsTableProps {
  onViewAll?: () => void;
  className?: string;
}

export function EventsTable({ onViewAll, className }: EventsTableProps) {
  const { user } = useAuth();
  const isGuard = user?.role === 'guard';
  const canViewOwnerNames = user?.role !== 'guard';
  const showListColumn = true;
  const visibleEventsCount = isGuard ? 13 : 11;
  const [timeSort, setTimeSort] = useState<'asc' | 'desc'>('desc');

  const sortedEvents = useMemo(() => {
    const next = [...events];
    next.sort((a, b) => {
      const diff = parseTimeToSeconds(a.time) - parseTimeToSeconds(b.time);
      return timeSort === 'asc' ? diff : -diff;
    });
    return next.slice(0, visibleEventsCount);
  }, [timeSort, visibleEventsCount]);

  const getStatusStyles = (status: Event['status']) => {
    const styles = {
      'Чёрный': 'bg-red-50 text-red-500',
      'Белый': 'bg-emerald-50 text-emerald-500',
      'Подрядчик': 'bg-purple-50 text-purple-500',
      'Нет в списках': 'bg-orange-50 text-orange-500'
    };
    return styles[status];
  };

  return (
    <div
      className={`bg-white rounded-xl border border-border shadow-sm overflow-hidden flex flex-col ${className ?? ''}`}
    >
      <div className="px-8 py-6 border-b border-border">
        <h2 className="text-[20px] font-bold text-foreground tracking-tight">Последние события</h2>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table
          className={`w-full ${
            isGuard ? 'min-w-[560px] table-fixed md:min-w-[600px]' : 'min-w-[760px] table-auto xl:min-w-full xl:table-fixed'
          }`}
        >
          <colgroup className={isGuard ? '' : 'hidden xl:table-column-group'}>
            <col style={{ width: isGuard ? '22%' : '17%' }} />
            <col style={{ width: isGuard ? '40%' : canViewOwnerNames ? '39%' : '31%' }} />
            <col style={{ width: isGuard ? '22%' : '22%' }} />
            <col style={{ width: isGuard ? '16%' : canViewOwnerNames ? '22%' : '30%' }} />
          </colgroup>
          <thead>
            <tr className="bg-muted/20 border-b border-border">
              <th className="text-center whitespace-nowrap py-4 px-2 text-[12px] font-bold uppercase tracking-wider md:px-2 xl:px-4">
                <button
                  type="button"
                  onClick={() => setTimeSort((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="grid w-full grid-cols-[1fr_auto_1fr] items-center text-foreground/70 hover:text-foreground transition-colors text-[12px] font-bold uppercase tracking-wider"
                >
                  <span aria-hidden="true" />
                  <span>Время</span>
                  <span className="inline-flex items-center justify-start">
                    {timeSort === 'asc' ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>
              </th>
              <th className="text-center whitespace-nowrap py-4 px-2 text-[12px] font-bold text-foreground/70 uppercase tracking-wider md:px-2 xl:px-4">
                Номер
              </th>
              {showListColumn && (
                <th className="text-center whitespace-nowrap py-4 px-2 text-[12px] font-bold text-foreground/70 uppercase tracking-wider md:px-2 xl:px-4">
                  Список
                </th>
              )}
              <th className="text-center whitespace-nowrap py-4 px-2 text-[12px] font-bold text-foreground/70 uppercase tracking-wider md:px-2 xl:px-4">
                Камера
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {sortedEvents.map((event) => {
              const isUnrecognized = event.status === 'Нет в списках';
              const ownerLabel = isUnrecognized || event.owner === 'Неизвестно' ? '—' : event.owner;
              const countryCode = getPlateCountryCode(event.plateNumber, event.country);
              const formattedPlate = formatPlateNumber(event.plateNumber);
              const contractorExpired =
                event.status === 'Подрядчик' &&
                isContractorOwnerExpiredOnDate(event.owner, event.date);

              return (
                <tr
                  key={event.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-smooth group"
                >
                  <td
                    className={`py-4 text-center whitespace-nowrap text-[14px] font-medium text-foreground/80 tabular-nums transition-colors hover:text-foreground ${
                      isGuard ? 'px-1.5 md:px-2.5' : 'px-2 md:px-2 xl:px-4'
                    }`}
                  >
                    {event.time}
                  </td>
                  <td
                    className={`py-4 text-center text-foreground plate-text ${
                      isGuard ? 'px-2 md:px-3' : 'px-2 md:px-2 xl:px-4'
                    }`}
                  >
                    <div className={`flex flex-col items-center ${isGuard ? 'gap-1' : 'gap-1.5'}`}>
                      <div className={`grid w-full items-center ${isGuard ? 'grid-cols-[1fr_auto_1fr] gap-1.5' : 'grid-cols-[1fr_auto_1fr] gap-2'}`}>
                        <span aria-hidden="true" />
                        <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                          {formattedPlate}
                          <span className="text-[11px] text-foreground/70 font-semibold">
                            ({countryCode})
                          </span>
                        </span>
                        <span className="inline-flex items-center justify-start">
                          {isUnrecognized && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  aria-label="Плохо распознан номер"
                                  className="inline-flex items-center text-amber-500 opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 rounded-sm"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                sideOffset={6}
                                className="tooltip-cloud"
                                arrowClassName="tooltip-cloud-arrow"
                                showArrow={false}
                              >
                                Плохо распознан номер
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </span>
                      </div>
                      {(canViewOwnerNames || contractorExpired) && (
                        <div className="max-w-full text-center text-[12px] font-medium leading-tight text-foreground/65">
                          {canViewOwnerNames && (
                            <span className="block">{ownerLabel}</span>
                          )}
                          {contractorExpired && (
                            <span
                              className={`block text-[12px] leading-tight text-red-500 ${canViewOwnerNames ? 'mt-1' : ''}`}
                            >
                              {CONTRACTOR_EXPIRED_MESSAGE}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  {showListColumn && (
                    <td className={`py-4 text-center ${isGuard ? 'px-1.5 md:px-2.5' : 'px-2 md:px-2 xl:px-4'}`}>
                      <span
                        className={`mx-auto flex w-full items-center justify-center whitespace-nowrap rounded-full font-medium ${
                          isGuard ? 'max-w-[118px] px-2 py-1 text-[12px]' : 'max-w-[138px] px-2.5 py-1 text-[13px]'
                        } ${getStatusStyles(
                          event.status
                        )}`}
                      >
                        {event.status}
                      </span>
                    </td>
                  )}
                  <td
                    className={`py-4 text-center whitespace-nowrap font-medium text-foreground/80 ${
                      isGuard ? 'px-1.5 text-[13px] md:px-2.5' : 'px-2 text-[14px] md:px-2 xl:px-4'
                    }`}
                  >
                    {event.camera}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-8 pt-4 pb-2 border-t border-border flex items-center justify-center bg-muted/20">
        <p className="text-sm font-medium text-muted-foreground text-center w-full -translate-y-[2px]">
          {sortedEvents.length > 0 ? `Показано 1-${sortedEvents.length} из ${sortedEvents.length}` : 'Показано 0 из 0'}
        </p>
      </div>
    </div>
  );
}
