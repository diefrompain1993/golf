import { ArrowRight, MessageSquare, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatPlateNumber, getPlateCountryCode } from '@/app/utils/plate';
import { BASE_VEHICLES } from '@/app/data/vehicles';
import { getStoredVehicles, mergeVehicles, type StoredVehicle } from '@/app/utils/vehicleStore';
import { getRoutePath } from '@/app/routesConfig';
import { useAuth } from '@/auth/authContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';

interface QuickSearchProps {
  className?: string;
}

type SearchResult =
  | { status: 'found'; vehicles: StoredVehicle[] }
  | { status: 'not_found' };

const QUICK_SEARCH_STORAGE_KEY = 'quick_search_state';

interface QuickSearchStorageState {
  plate: string;
  performed: boolean;
  userEmail: string | null;
}

const readStoredQuickSearch = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(QUICK_SEARCH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      plate?: string;
      performed?: boolean;
      userEmail?: string;
    };
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      plate: typeof parsed.plate === 'string' ? parsed.plate : '',
      performed: Boolean(parsed.performed),
      userEmail: typeof parsed.userEmail === 'string' ? parsed.userEmail : null
    } satisfies QuickSearchStorageState;
  } catch {
    return null;
  }
};

const clearStoredQuickSearch = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(QUICK_SEARCH_STORAGE_KEY);
};

const writeStoredQuickSearch = (
  plate: string,
  performed: boolean,
  userEmail: string | null
) => {
  if (typeof window === 'undefined') return;
  if (!plate.trim()) {
    clearStoredQuickSearch();
    return;
  }
  window.sessionStorage.setItem(
    QUICK_SEARCH_STORAGE_KEY,
    JSON.stringify({ plate, performed, userEmail })
  );
};

const categoryShortLabels: Record<StoredVehicle['category'], string> = {
  white: 'Белый',
  black: 'Чёрный',
  contractor: 'Подрядчики',
  unlisted: 'Нет в списках'
};

const categoryTextColors: Record<StoredVehicle['category'], string> = {
  white: 'text-emerald-500',
  black: 'text-red-500',
  contractor: 'text-purple-500',
  unlisted: 'text-orange-500'
};

type VehicleStatusLabel = 'Белый' | 'Чёрный' | 'Подрядчик' | 'Нет в списках';

const statusByCategory: Record<StoredVehicle['category'], VehicleStatusLabel> = {
  white: 'Белый',
  black: 'Чёрный',
  contractor: 'Подрядчик',
  unlisted: 'Нет в списках'
};

const listBadgeByTextColor: Record<string, string> = {
  'text-emerald-500': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'text-red-500': 'border-red-200 bg-red-50 text-red-700',
  'text-purple-500': 'border-purple-200 bg-purple-50 text-purple-700',
  'text-orange-500': 'border-orange-200 bg-orange-50 text-orange-700'
};

const PLATE_LETTER_MAP: Record<string, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
  E: 'E',
  H: 'H',
  K: 'K',
  M: 'M',
  O: 'O',
  P: 'P',
  T: 'T',
  X: 'X',
  Y: 'Y',
  R: 'P',
  А: 'A',
  В: 'B',
  С: 'C',
  Е: 'E',
  Н: 'H',
  К: 'K',
  М: 'M',
  О: 'O',
  Р: 'P',
  Т: 'T',
  Х: 'X',
  У: 'Y'
};

const normalizePlateForSearch = (value: string) =>
  value
    .toUpperCase()
    .replace(/[\s-]+/g, '')
    .replace(/[A-Z\u0410\u0412\u0415\u041a\u041c\u041d\u041e\u0420\u0421\u0422\u0423\u0425]/g, (char) =>
      PLATE_LETTER_MAP[char] ?? char
    );

export function QuickSearch({ className }: QuickSearchProps) {
  const { user } = useAuth();
  const userEmail = user?.email ?? null;
  const isGuard = user?.role === 'guard';
  const isAdmin = user?.role === 'admin';
  const usesGuardDashboardLayout = user?.role === 'guard' || user?.role === 'admin';
  const useExpandedCardHeight =
    user?.role === 'guard' || user?.role === 'admin' || user?.role === 'office_admin';
  const canViewOwnerNames = !usesGuardDashboardLayout;
  const [plateNumber, setPlateNumber] = useState(() => {
    const stored = readStoredQuickSearch();
    if (!stored || !userEmail || stored.userEmail !== userEmail) {
      return '';
    }
    return stored.plate;
  });
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const baseVehicles = useMemo(
    () => [
      ...BASE_VEHICLES.white,
      ...BASE_VEHICLES.black,
      ...BASE_VEHICLES.contractor,
      ...BASE_VEHICLES.unlisted
    ],
    []
  );

  const runSearch = useCallback((value: string) => {
    const normalizedPlate = normalizePlateForSearch(value);
    if (!normalizedPlate) {
      setSearchResult(null);
      return;
    }

    const vehicles = mergeVehicles(baseVehicles, getStoredVehicles());
    const vehicleMatches = vehicles.filter((vehicle) => {
      const normalizedVehicle = normalizePlateForSearch(vehicle.plateNumber);
      return (
        normalizedVehicle === normalizedPlate ||
        normalizedVehicle.includes(normalizedPlate) ||
        normalizedPlate.includes(normalizedVehicle)
      );
    });

    if (vehicleMatches.length > 0) {
      setSearchResult({ status: 'found', vehicles: vehicleMatches });
      return;
    }

    setSearchResult({ status: 'not_found' });
  }, [baseVehicles]);

  const handleSearch = () => {
    const trimmedPlate = plateNumber.trim();
    if (!trimmedPlate) {
      setSearchResult(null);
      writeStoredQuickSearch('', false, userEmail);
      return;
    }
    writeStoredQuickSearch(trimmedPlate, true, userEmail);
    runSearch(trimmedPlate);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const foundVehicles = searchResult?.status === 'found' ? searchResult.vehicles : [];
  const foundVehicle = foundVehicles[0] ?? null;
  const noteText = foundVehicle?.notes?.trim() ?? '';
  const hasNote = Boolean(noteText) && noteText !== '-' && noteText !== '—';
  const hasFoundResult = foundVehicles.length > 0;
  const hasNotFound = searchResult?.status === 'not_found';
  const canOpenNote = foundVehicles.length === 1 && hasNote;

  useEffect(() => {
    const stored = readStoredQuickSearch();
    if (!stored) {
      setPlateNumber('');
      setSearchResult(null);
      return;
    }

    if (!userEmail || stored.userEmail !== userEmail) {
      clearStoredQuickSearch();
      setPlateNumber('');
      setSearchResult(null);
      setDetailsOpen(false);
      return;
    }

    if (stored.plate !== plateNumber) {
      setPlateNumber(stored.plate);
    }

    if (stored.performed && stored.plate) {
      runSearch(stored.plate);
      return;
    }

    setSearchResult(null);
  }, [plateNumber, runSearch, userEmail]);

  const handleOpenCard = () => {
    if (!hasFoundResult) return;

    const params = new URLSearchParams();

    const matchedPlates = Array.from(new Set(foundVehicles.map((vehicle) => vehicle.plateNumber)));

    if (matchedPlates.length === 1) {
      params.set('plate', matchedPlates[0]);
    } else if (matchedPlates.length > 1) {
      params.set('plates', matchedPlates.join(','));
    }

    const matchedStatuses = Array.from(
      new Set(foundVehicles.map((vehicle) => statusByCategory[vehicle.category]))
    );

    if (matchedStatuses.length === 1) {
      params.set('status', matchedStatuses[0]);
    }

    if (canViewOwnerNames) {
      const owners = Array.from(
        new Set(
          foundVehicles
            .map((vehicle) => vehicle.owner)
            .filter((owner) => owner.trim() !== '')
        )
      );

      if (owners.length === 1) {
        params.set('owner', owners[0]);
      }
    }

    const url = `${getRoutePath('events')}?${params.toString()}`;
    setDetailsOpen(false);
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const resultItems = foundVehicles.map((vehicle, index) => ({
    key: `vehicle-${vehicle.id}-${index}`,
    plateNumber: vehicle.plateNumber,
    country: vehicle.country,
    listLabel: categoryShortLabels[vehicle.category],
    listColor: categoryTextColors[vehicle.category]
  }));
  const hasEmptyInput = plateNumber.trim() === '';
  const isIdleState = searchResult === null;
  const showResultPanel = isIdleState || hasFoundResult || hasNotFound;
  const resultSummaryHint =
    resultItems.length > 5
      ? 'Прокрутите список'
      : hasNotFound
        ? 'По запросу ничего не найдено'
        : isIdleState
          ? hasEmptyInput
            ? 'Введите номер для поиска'
            : 'Нажмите "Найти" для поиска'
          : null;
  const placeholderRows = 3;

  return (
    <div
      className={`bg-white rounded-xl border border-border shadow-sm px-8 pt-6 flex min-h-0 flex-col ${
        isGuard ? 'pb-[19px]' : isAdmin ? 'pb-[7px]' : 'pb-5'
      } ${
        isAdmin ? 'xl:min-h-[325px]' : useExpandedCardHeight ? 'xl:min-h-[333px]' : ''
      } ${className ?? ''}`}
    >
      <h2 className="text-[20px] font-bold text-foreground tracking-tight mb-3">
        Быстрый поиск автомобиля
      </h2>

      <div className="flex flex-1 flex-col min-h-0">
        <div className="mb-3 flex flex-col items-center">
          <div className="flex w-full max-w-[560px] justify-center gap-3 max-[640px]:flex-col">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-[16px] h-[16px] text-muted-foreground [@media(max-width:1279px)]:w-[18px] [@media(max-width:1279px)]:h-[18px]"
                strokeWidth={2}
              />
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  const trimmedValue = value.trim();
                  setPlateNumber(value);
                  writeStoredQuickSearch(trimmedValue ? value : '', false, userEmail);
                  if (searchResult) {
                    setSearchResult(null);
                  }
                  if (detailsOpen) {
                    setDetailsOpen(false);
                  }
                }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                className="w-full pl-11 pr-4 py-3 bg-muted/40 rounded-xl border border-border focus:outline-none focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-smooth text-sm text-foreground placeholder:text-muted-foreground [@media(max-width:1279px)]:h-11 [@media(max-width:1279px)]:py-0 [@media(max-width:1279px)]:pl-12 [@media(max-width:1279px)]:text-[15px]"
                placeholder="Введите номер"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-smooth shadow-md hover:shadow-lg font-semibold max-[640px]:w-full [@media(max-width:1279px)]:h-11 [@media(max-width:1279px)]:py-0 [@media(max-width:1279px)]:text-[15px]"
            >
              Найти
            </button>
          </div>
        </div>

        {showResultPanel && (
          <div className="border-t border-border pt-3 flex flex-col flex-1 min-h-0">
            <div className="flex flex-col gap-2 text-sm text-foreground/70 min-h-0 [@media(max-width:1279px)]:text-[15px]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span>Найдено автомобилей:</span>
                  <span className="font-semibold text-foreground">{resultItems.length}</span>
                </div>
                {resultSummaryHint && (
                  <span className="text-[11px] text-muted-foreground">{resultSummaryHint}</span>
                )}
              </div>
              <div className="h-[116px] rounded-lg border border-border/80 bg-muted/20 overflow-hidden [@media(max-width:1279px)]:h-[128px]">
                <div className="grid grid-cols-2 items-center gap-3 border-b border-border/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground [@media(max-width:1279px)]:py-2 [@media(max-width:1279px)]:text-[11px]">
                  <span className="text-center">Номер</span>
                  <span className="text-center">Список</span>
                </div>
                <div
                  className={`h-[84px] overscroll-contain px-1 py-1 [@media(max-width:1279px)]:h-[92px] [@media(max-width:1279px)]:px-1.5 [@media(max-width:1279px)]:py-1.5 ${
                    resultItems.length > 0 ? 'overflow-y-auto' : 'overflow-y-hidden'
                  }`}
                  onWheel={(event) => {
                    const container = event.currentTarget;
                    if (container.scrollHeight <= container.clientHeight) return;
                    const maxScrollTop = container.scrollHeight - container.clientHeight;
                    const scrollingDown = event.deltaY > 0;
                    const scrollingUp = event.deltaY < 0;
                    const canScrollDown = container.scrollTop < maxScrollTop;
                    const canScrollUp = container.scrollTop > 0;

                    if ((scrollingDown && canScrollDown) || (scrollingUp && canScrollUp)) {
                      event.stopPropagation();
                    }
                  }}
                >
                  {resultItems.length > 0
                    ? resultItems.map((item) => (
                        <div
                          key={item.key}
                          className="grid grid-cols-2 items-center gap-3 rounded-md px-2 py-1 hover:bg-white/70 [@media(max-width:1279px)]:px-2.5 [@media(max-width:1279px)]:py-1.5"
                        >
                          <span className="inline-flex w-full min-w-0 items-center justify-center gap-2 text-center text-foreground plate-text">
                            <span className="truncate">{formatPlateNumber(item.plateNumber)}</span>
                            <span className="shrink-0 text-[11px] text-foreground/70 font-semibold [@media(max-width:1279px)]:text-xs">
                              ({getPlateCountryCode(item.plateNumber, item.country)})
                            </span>
                          </span>
                          <span className="flex justify-center">
                            <span
                              className={
                                "inline-flex w-full max-w-[160px] items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4 [@media(max-width:1279px)]:max-w-[172px] [@media(max-width:1279px)]:px-2.5 [@media(max-width:1279px)]:py-1 [@media(max-width:1279px)]:text-xs " +
                                (listBadgeByTextColor[item.listColor] ??
                                  'border-border bg-white text-foreground/80')
                              }
                            >
                              {item.listLabel}
                            </span>
                          </span>
                        </div>
                      ))
                    : Array.from({ length: placeholderRows }).map((_, index) => (
                        <div
                          key={`placeholder-row-${index}`}
                          aria-hidden="true"
                          className="grid grid-cols-2 items-center gap-3 rounded-md px-2 py-1 opacity-60 [@media(max-width:1279px)]:px-2.5 [@media(max-width:1279px)]:py-1.5"
                        >
                          <span className="inline-flex w-full min-w-0 items-center justify-center gap-2 text-center text-muted-foreground plate-text">
                            <span className="truncate">—</span>
                            <span className="shrink-0 text-[11px] font-semibold [@media(max-width:1279px)]:text-xs">
                              (—)
                            </span>
                          </span>
                          <span className="flex justify-center">
                            <span className="inline-flex w-full max-w-[160px] items-center justify-center rounded-full border border-dashed border-border bg-white/70 px-2 py-0.5 text-[11px] font-semibold leading-4 text-muted-foreground [@media(max-width:1279px)]:max-w-[172px] [@media(max-width:1279px)]:px-2.5 [@media(max-width:1279px)]:py-1 [@media(max-width:1279px)]:text-xs">
                              —
                            </span>
                          </span>
                        </div>
                      ))}
                </div>
              </div>
            </div>

            <div
              className={`mt-auto pt-5 flex items-center gap-3 [@media(min-width:1024px)_and_(max-width:1279px)]:gap-2 ${
                canOpenNote ? 'justify-between' : 'justify-end'
              }`}
            >
              {canOpenNote && (
                <button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                  className="flex items-center gap-1.5 text-sm transition-smooth text-primary hover:text-primary/80 [@media(min-width:1024px)_and_(max-width:1279px)]:gap-1 [@media(min-width:1024px)_and_(max-width:1279px)]:text-[13px] [@media(min-width:1024px)_and_(max-width:1279px)]:whitespace-nowrap"
                >
                  <MessageSquare className="w-4 h-4" strokeWidth={2} />
                  Есть примечание
                </button>
              )}

              <Button
                type="button"
                variant="secondary"
                onClick={handleOpenCard}
                disabled={!hasFoundResult}
                className="h-8 px-3 text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap [@media(min-width:1024px)_and_(max-width:1279px)]:h-8 [@media(min-width:1024px)_and_(max-width:1279px)]:px-2.5 [@media(min-width:1024px)_and_(max-width:1279px)]:text-[13px]"
              >
                Посмотреть въезды
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {foundVehicles.length === 1 && foundVehicle && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Информация о примечании</DialogTitle>
              <DialogDescription className="text-foreground font-medium">
                {canViewOwnerNames ? 'Детали автомобиля и владельца.' : 'Детали автомобиля.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">Номер:</span>
                <span className="text-slate-900 plate-text">
                  {formatPlateNumber(foundVehicle.plateNumber)} ({getPlateCountryCode(foundVehicle.plateNumber, foundVehicle.country)})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">Список:</span>
                <span
                  className={`font-semibold ${categoryTextColors[foundVehicle.category]}`}
                >
                  {categoryShortLabels[foundVehicle.category]}
                </span>
              </div>
              {canViewOwnerNames && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-medium">Владелец:</span>
                  <span className="text-slate-900 font-semibold">{foundVehicle.owner}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">Дата добавления:</span>
                <span className="text-slate-900 font-semibold">
                  {foundVehicle.addedDate}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">Примечание:</span>
                <span
                  className={`font-semibold ${
                    hasNote ? 'text-slate-900' : 'text-slate-500'
                  }`}
                >
                  {noteText || '—'}
                </span>
              </div>
            </div>
            <DialogFooter className="justify-start sm:justify-start">
              <Button variant="secondary" onClick={() => setDetailsOpen(false)}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
