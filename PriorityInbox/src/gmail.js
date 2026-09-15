import * as SecureStore from 'expo-secure-store';

const GMAIL_LIST_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
const GMAIL_GET_URL = (id) => `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;

const MAX_EMAILS = 40;

function parseFrom(header) {
  const m = /"?([^"<]*)"?\s*<[^>]+>/.exec(header || '');
  return (m && m[1].trim()) || header || 'Unknown';
}

export async function fetchGmail(accessToken) {
  const listRes = await fetch(`${GMAIL_LIST_URL}?maxResults=${MAX_EMAILS}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!listRes.ok) {
    throw new Error(`Gmail list failed (${listRes.status})`);
  }
  const listJson = await listRes.json();
  const messages = listJson.messages || [];

  const results = [];
  for (const msg of messages) {
    try {
      const res = await fetch(GMAIL_GET_URL(msg.id), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) continue;
      const json = await res.json();
      const headers = {};
      for (const h of json.payload?.headers || []) headers[h.name.toLowerCase()] = h.value;
      results.push({
        id: msg.id,
        source: 'Email',
        from: parseFrom(headers.from),
        subject: headers.subject || '(no subject)',
        date: headers.date,
        timestamp: Number(json.internalDate) || 0,
        snippet: json.snippet || '',
      });
    } catch (e) {
      continue;
    }
  }
  return results;
}

export async function saveToken(token) {
  await SecureStore.setItemAsync('pi_google_token', token);
}

export async function loadToken() {
  try {
    return await SecureStore.getItemAsync('pi_google_token');
  } catch {
    return null;
  }
}

export async function clearToken() {
  try {
    await SecureStore.deleteItemAsync('pi_google_token');
  } catch {}
}
