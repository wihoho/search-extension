// When to ask for a Chrome Web Store review. Searches are small, so OmniSearch waits for the
// 5th successful search, then asks in two quiet places: one extra row in the address bar
// suggestions (for a few sessions) and a dismissible banner in the side panel.

export const FIRST_ASK = 5;
export const SNOOZE = 20;
export const MAX_OMNIBOX_SESSIONS = 5;
// Content of the address bar suggestion; selecting it opens the review page.
export const RATE_CONTENT = '★ review OmniSearch';

export const initialRate = () => ({ askAt: FIRST_ASK, done: false, omniboxShown: 0 });

export const totalUses = (usage = {}) => Object.values(usage).reduce((sum, n) => sum + n, 0);

export const shouldAsk = (rate, uses) => !rate.done && uses >= rate.askAt;

export const shouldSuggest = (rate, uses) => shouldAsk(rate, uses) && rate.omniboxShown < MAX_OMNIBOX_SESSIONS;

// "Later" waits for 20 more searches and allows the address bar row again.
export const later = (rate, uses) => ({ ...rate, askAt: uses + SNOOZE, omniboxShown: 0 });

export const finish = (rate) => ({ ...rate, done: true });

export async function loadRate() {
  const { rate } = await chrome.storage.local.get('rate');
  return { ...initialRate(), ...(rate || {}) };
}

export const saveRate = (rate) => chrome.storage.local.set({ rate });

export const reviewUrl = () => `https://chromewebstore.google.com/detail/${chrome.runtime.id}/reviews`;
