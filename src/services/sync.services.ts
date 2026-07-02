export interface PendingAction {
  id?: string;
  type?: string;
  endpoint: string;
  method: string;
  payload?: unknown;
}

const pendingActionsKey = 'pendingActions';

export function getPendingActions(): PendingAction[] {
  const stored = localStorage.getItem(pendingActionsKey);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as PendingAction[];
  } catch {
    return [];
  }
}

function savePendingActions(actions: PendingAction[]) {
  localStorage.setItem(pendingActionsKey, JSON.stringify(actions));
}

export function addPendingAction(action: PendingAction) {
  const actions = getPendingActions();
  const normalized: PendingAction = {
    id: action.id ?? crypto.randomUUID(),
    type: action.type ?? action.method,
    endpoint: action.endpoint,
    method: action.method,
    payload: action.payload,
  };

  actions.push(normalized);
  savePendingActions(actions);
}

export async function syncPendingActions(): Promise<{ synced: number; remaining: number }> {
  const actions = getPendingActions();

  if (actions.length === 0) {
    return { synced: 0, remaining: 0 };
  }

  const remaining: PendingAction[] = [];
  let synced = 0;

  for (const action of actions) {
    try {
      const response = await fetch(action.endpoint, {
        method: action.method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(action.payload)
      });

      if (response.ok) {
        synced += 1;
      } else {
        remaining.push(action);
      }

    } catch {
      remaining.push(action);
    }
  }

  savePendingActions(remaining);
  return { synced, remaining: remaining.length };
}