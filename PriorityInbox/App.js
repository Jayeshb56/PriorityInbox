import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, StyleSheet, View, StatusBar } from 'react-native';

const CATEGORIES = ['Critical', 'High', 'Low'];

const MOCK_EMAILS = {
  Critical: [
    { from: 'Income Tax Dept', subject: 'Notice: Pending tax return submission', time: '9:12 AM' },
    { from: 'Bank of India', subject: 'EMI payment due tomorrow - Rs 15,400', time: '8:45 AM' },
  ],
  High: [
    { from: 'Manager', subject: 'Meeting moved to 3 PM today', time: 'Yesterday' },
    { from: 'Landlord', subject: 'Rent agreement renewal this week', time: 'Yesterday' },
  ],
  Low: [
    { from: 'Newsletter', subject: 'Weekly tech digest', time: '2 days ago' },
    { from: 'Shopping', subject: '50% off sale ends soon', time: '3 days ago' },
  ],
};

const COLORS = { Critical: '#e74c3c', High: '#f39c12', Low: '#27ae60' };

export default function App() {
  const [tab, setTab] = useState('Critical');
  const emails = MOCK_EMAILS[tab];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <Text style={styles.title}>Priority Inbox</Text>
      <View style={styles.tabs}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.tab, tab === c && { backgroundColor: COLORS[c] }]}
            onPress={() => setTab(c)}
          >
            <Text style={styles.tabText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={styles.list}>
        {emails.map((e, i) => (
          <View key={i} style={[styles.card, { borderLeftColor: COLORS[tab] }]}>
            <View style={styles.row}>
              <Text style={styles.from}>{e.from}</Text>
              <Text style={styles.time}>{e.time}</Text>
            </View>
            <Text style={styles.subject}>{e.subject}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a1a2e' },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold', padding: 20, paddingBottom: 10 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#2a2a4a', alignItems: 'center' },
  tabText: { color: '#fff', fontWeight: '600' },
  list: { flex: 1, backgroundColor: '#f5f5f5', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, borderRadius: 10, padding: 14, borderLeftWidth: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  from: { fontWeight: 'bold', fontSize: 15 },
  time: { color: '#888', fontSize: 12 },
  subject: { marginTop: 6, color: '#444' },
});
