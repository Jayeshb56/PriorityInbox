import { PermissionsAndroid, Platform } from 'react-native';
import SmsReader from '../modules/sms-reader';
import { classify, formatTime } from './classifier';

const MAX_SMS = 50;

export async function fetchSms() {
  if (Platform.OS !== 'android') return [];

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    {
      title: 'Priority Inbox SMS Permission',
      message: 'Priority Inbox reads your SMS on-device to sort them into Critical, High and Low. No data leaves your phone.',
      buttonPositive: 'Allow',
    }
  );
  if (granted !== PermissionsAndroid.RESULTS.GRANTED) return [];

  const raw = SmsReader.getInboxSms(MAX_SMS);
  return raw.map((m, i) => ({
    id: `sms-${m.timestamp}-${i}`,
    source: 'SMS',
    from: m.from,
    subject: m.body.split('\n')[0].slice(0, 80),
    timestamp: Number(m.timestamp) || 0,
    snippet: m.body.slice(0, 120),
    ...classify({ from: m.from, subject: '', body: m.body }),
    timeLabel: formatTime(m.timestamp),
  }));
}
