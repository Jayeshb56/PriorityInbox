import React, { useState, useCallback, useEffect } from 'react';
import {
  SafeAreaView, ScrollView, Text, TouchableOpacity, StyleSheet, View, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { classify, formatTime } from './src/classifier';
import { fetchGmail, saveToken, loadToken, clearToken } from './src/gmail';
import { fetchSms } from './src/sms';

const CATEGORIES = ['All', 'Critical', 'High', 'Low'];
const COLORS = { Critical: '#e74c3c', High: '#f39c12', Low: '#27ae60', All: '#5b6ee1' };

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export default function App() {
  const [tab, setTab] = useState('All');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [signedIn, setSignedIn] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  });

  useEffect(() => {
    loadToken().then((t) => setSignedIn(!!t));
  }, []);

  const refresh = useCallback(async (accessToken) => {
    setLoading(true);
    setError(null);
    try {
      const [emails, sms] = await Promise.all([fetchGmail(accessToken), fetchSms()]);
      const all = [...emails, ...sms];
      const enriched = all.map((m) => ({
        ...m,
        priority: m.priority || classify({ from: m.from, subject: m.subject, body: m.snippet }).priority,
        timeLabel: m.timeLabel || formatTime(m.timestamp),
      }));
      enriched.sort((a, b) => b.timestamp - a.timestamp);
      setMessages(enriched);
    } catch (e) {
      setError(e.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.accessToken) {
      const token = response.authentication.accessToken;
      saveToken(token).then(() => {
        setSignedIn(true);
        refresh(token);
      });
    }
  }, [response, refresh]);

  const signIn = () => promptAsync();

  const signOut = async () => {
    await clearToken();
    setSignedIn(false);
    setMessages([]);
  };

  const shown = tab === 'All' ? messages : messages.filter((m) => m.priority === tab);
  const counts = {
    Critical: messages.filter((m) => m.priority === 'Critical').length,
    High: messages.filter((m) => m.priority === 'High').length,
    Low: messages.filter((m) => m.priority === 'Low').length,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.header}>
        <Text style={styles.title}>Priority Inbox</Text>
        <TouchableOpacity onPress={signedIn ? signOut : signIn} disabled={!request}>
          <Text style={styles.authButton}>{signedIn ? 'Sign out' : 'Sign in'}</Text>
        </TouchableOpacity>
      </View>

      {!signedIn ? (
        <View style={styles.center}>
          <Text style={styles.hint}>
            Sign in with Google to read your email.{'\n'}
            SMS is read on-device — nothing leaves your phone.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.tabs}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.tab, tab === c && { backgroundColor: COLORS[c] }]}
                onPress={() => setTab(c)}
              >
                <Text style={styles.tabText}>
                  {c}{c !== 'All' && counts[c] != null ? ` (${counts[c]})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            style={styles.list}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={() => signedIn && refresh(response?.authentication?.accessToken)} />}
          >
            {error && <Text style={styles.error}>{error}</Text>}
            {!loading && shown.length === 0 && !error && (
              <Text style={styles.hint}>No messages. Pull down to refresh.</Text>
            )}
            {shown.map((m) => (
              <View key={m.id} style={[styles.card, { borderLeftColor: COLORS[m.priority] }]}>
                <View style={styles.row}>
                  <Text style={styles.from} numberOfLines={1}>{m.from}</Text>
                  <Text style={styles.time}>{m.timeLabel}</Text>
                </View>
                <Text style={styles.subject} numberOfLines={2}>{m.subject}</Text>
                <Text style={styles.meta}>{m.source} · {m.priority}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  authButton: { color: '#8ab4ff', fontSize: 15, fontWeight: '600', padding: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  hint: { color: '#99a', textAlign: 'center', lineHeight: 22, marginTop: 20, paddingBottom: 16 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#2a2a4a', alignItems: 'center' },
  tabText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  list: { flex: 1, backgroundColor: '#f5f5f5', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, borderRadius: 10, padding: 14, borderLeftWidth: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  from: { fontWeight: 'bold', fontSize: 15, flex: 1, marginRight: 8 },
  time: { color: '#888', fontSize: 12 },
  subject: { marginTop: 6, color: '#444' },
  meta: { marginTop: 6, color: '#aaa', fontSize: 11 },
  error: { color: '#e74c3c', textAlign: 'center', padding: 16 },
});
