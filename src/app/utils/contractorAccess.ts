import { BASE_VEHICLES } from '@/app/data/vehicles';
import {
  getStoredVehiclesByCategory,
  mergeVehicles,
  type StoredVehicle
} from '@/app/utils/vehicleStore';

export const parseDateToTimestamp = (value?: string | null) => {
  if (!value) return null;
  const [day, month, year] = value.split('.').map((part) => Number(part));
  if (!day || !month || !year) return null;
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getDate() !== day || parsed.getMonth() !== month - 1 || parsed.getFullYear() !== year) {
    return null;
  }
  return parsed.getTime();
};

const toDateOnlyTimestamp = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

const resolveAccessDate = (vehicle: StoredVehicle) =>
  vehicle.accessTo?.trim() || vehicle.accessFrom?.trim() || '';

const normalizeContractorOwner = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\"'«»]/g, '')
    .replace(/[^a-zа-яё0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^(ооо|оао|зао|пао|ао|тоо|ип|чп|ooo|oao|zao|pao|ao)\s*/g, '')
    .trim();

const getContractorVehiclesSnapshot = () => {
  const stored = getStoredVehiclesByCategory('contractor');
  return mergeVehicles(BASE_VEHICLES.contractor, stored);
};

const getOwnerContractorVehicles = (
  owner: string,
  contractorVehicles?: StoredVehicle[]
) => {
  const normalizedOwner = normalizeContractorOwner(owner);
  if (!normalizedOwner) return [];
  const source = contractorVehicles ?? getContractorVehiclesSnapshot();

  return source.filter(
    (vehicle) =>
      vehicle.category === 'contractor' &&
      normalizeContractorOwner(vehicle.owner) === normalizedOwner
  );
};

export const CONTRACTOR_EXPIRED_MESSAGE = 'Срок действия подрядчика истек';

export interface ContractorAccessState {
  accessDate: string;
  statusLabel: string;
  isExpired: boolean;
}

const resolveOwnerAccessDate = (ownerVehicles: StoredVehicle[]) => {
  if (ownerVehicles.length === 0) return null;

  const withDate = ownerVehicles
    .map((vehicle) => ({
      accessDate: resolveAccessDate(vehicle),
      timestamp: parseDateToTimestamp(vehicle.accessTo ?? vehicle.accessFrom)
    }))
    .filter((entry) => Boolean(entry.accessDate));

  if (withDate.length === 0) return null;

  const validDates = withDate.filter((entry) => entry.timestamp !== null);
  if (validDates.length > 0) {
    return validDates.reduce((latest, current) =>
      current.timestamp! > latest.timestamp! ? current : latest
    );
  }

  return withDate[0];
};

export const getContractorOwnerAccessState = (
  owner: string,
  referenceDate: Date = new Date(),
  contractorVehicles?: StoredVehicle[]
): ContractorAccessState | null => {
  const ownerVehicles = getOwnerContractorVehicles(owner, contractorVehicles);
  const resolved = resolveOwnerAccessDate(ownerVehicles);
  if (!resolved?.accessDate) return null;

  const accessToTimestamp = resolved.timestamp;
  if (!accessToTimestamp) {
    return {
      accessDate: resolved.accessDate,
      statusLabel: '—',
      isExpired: false
    };
  }

  const isExpired = accessToTimestamp < toDateOnlyTimestamp(referenceDate);
  return {
    accessDate: resolved.accessDate,
    statusLabel: isExpired ? 'Истек' : 'Активен',
    isExpired
  };
};

export const getContractorAccessState = (
  vehicle: StoredVehicle,
  referenceDate: Date = new Date(),
  contractorVehicles?: StoredVehicle[]
) => {
  if (vehicle.category !== 'contractor') return null;
  return getContractorOwnerAccessState(vehicle.owner, referenceDate, contractorVehicles);
};

export const getContractorAccessText = (
  vehicle: StoredVehicle,
  referenceDate: Date = new Date(),
  contractorVehicles?: StoredVehicle[]
) => {
  const state = getContractorAccessState(vehicle, referenceDate, contractorVehicles);
  if (!state) return '—';
  return `${state.accessDate} ${state.statusLabel}`;
};

export const isContractorExpiredOnDate = (
  vehicle: StoredVehicle,
  dateValue: string,
  contractorVehicles?: StoredVehicle[]
) => {
  if (vehicle.category !== 'contractor') return false;
  const ownerVehicles = getOwnerContractorVehicles(vehicle.owner, contractorVehicles);
  const resolved = resolveOwnerAccessDate(ownerVehicles);
  const accessToTimestamp = resolved?.timestamp ?? null;
  const targetTimestamp = parseDateToTimestamp(dateValue);
  if (!accessToTimestamp || !targetTimestamp) return false;
  return accessToTimestamp < targetTimestamp;
};

export const isContractorOwnerExpiredOnDate = (
  owner: string,
  dateValue: string,
  contractorVehicles?: StoredVehicle[]
) => {
  const ownerVehicles = getOwnerContractorVehicles(owner, contractorVehicles);
  const resolved = resolveOwnerAccessDate(ownerVehicles);
  const accessToTimestamp = resolved?.timestamp ?? null;
  const targetTimestamp = parseDateToTimestamp(dateValue);
  if (!accessToTimestamp || !targetTimestamp) return false;
  return accessToTimestamp < targetTimestamp;
};
