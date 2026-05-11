import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const CLASS_TIMES = ['06:00', '07:00', '09:00', '12:00', '16:20', '17:30', '18:40', '20:00'];

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatDateBR() {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]}`;
}

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [userCheckin, setUserCheckin] = useState(null);
  const [wod, setWod] = useState(null);
  const [loadingCheckin, setLoadingCheckin] = useState(true);
  const [loadingWod, setLoadingWod] = useState(true);

  const todayKey = getTodayKey();
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Atleta';

  useEffect(() => {
    const ref = doc(db, 'checkins', todayKey);
    const timeout = setTimeout(() => setLoadingCheckin(false), 8000);
    const unsub = onSnapshot(ref,
      (snap) => {
        clearTimeout(timeout);
        if (snap.exists()) {
          const slots = snap.data().slots || {};
          let found = null;
          for (const t of CLASS_TIMES) {
            if ((slots[t] || []).some(u => u.uid === user.uid)) { found = t; break; }
          }
          setUserCheckin(found);
        } else {
          setUserCheckin(null);
        }
        setLoadingCheckin(false);
      },
      () => { clearTimeout(timeout); setLoadingCheckin(false); }
    );
    return () => { clearTimeout(timeout); unsub(); };
  }, [todayKey, user.uid]);

  useEffect(() => {
    const ref = doc(db, 'wods', todayKey);
    const timeout = setTimeout(() => setLoadingWod(false), 8000);
    const unsub = onSnapshot(ref,
      (snap) => {
        clearTimeout(timeout);
        setWod(snap.exists() ? snap.data() : null);
        setLoadingWod(false);
      },
      () => { clearTimeout(timeout); setLoadingWod(false); }
    );
    return () => { clearTimeout(timeout); unsub(); };
  }, [todayKey]);

  const quickActions = [
    { label: 'Marcar Aula',  screen: 'Checkin',  icon: 'A' },
    { label: 'Ver WOD',      screen: 'WOD',       icon: 'W' },
    { label: 'Ver Ranking',  screen: 'Ranking',   icon: 'R' },
    { label: 'Meu Perfil',   screen: 'Profile',   icon: 'P' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {userName}</Text>
            <Text style={styles.subGreeting}>{formatDateBR()}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* ── 1. Treino de Hoje (WOD) ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>1</Text>
            </View>
            <Text style={styles.sectionTitle}>Treino de Hoje (WOD)</Text>
          </View>

          {loadingWod ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#CC0000" />
              <Text style={styles.loadingText}>Carregando treino...</Text>
            </View>
          ) : wod ? (
            <View style={styles.wodCard}>
              <View style={styles.wodTagRow}>
                <View style={styles.wodTag}>
                  <Text style={styles.wodTagText}>KAREN</Text>
                </View>
              </View>
              {wod.metcon ? (
                <Text style={styles.wodPreview} numberOfLines={3}>{wod.metcon}</Text>
              ) : wod.warmup ? (
                <Text style={styles.wodPreview} numberOfLines={3}>{wod.warmup}</Text>
              ) : null}
              {wod.notas ? (
                <Text style={styles.wodNotes} numberOfLines={2}>{wod.notas}</Text>
              ) : null}
              <TouchableOpacity
                style={styles.wodBtn}
                onPress={() => navigation.navigate('WOD')}
              >
                <Text style={styles.wodBtnText}>Ver WOD Completo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Sem treino cadastrado</Text>
              <Text style={styles.emptyText}>Nenhum WOD foi registrado para hoje.</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('WOD')}
              >
                <Text style={styles.emptyBtnText}>+ Adicionar Treino</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── 2. Próxima Aula ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>2</Text>
            </View>
            <Text style={styles.sectionTitle}>Próxima Aula</Text>
          </View>

          {loadingCheckin ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#CC0000" />
              <Text style={styles.loadingText}>Verificando check-in...</Text>
            </View>
          ) : userCheckin ? (
            <View style={styles.classCard}>
              <View style={styles.classInfoRow}>
                <View style={styles.classIconBox}>
                  <Text style={styles.classIconText}>A</Text>
                </View>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>Treino · {userCheckin}</Text>
                  <Text style={styles.classDetail}>Wall Balls for Time</Text>
                </View>
              </View>
              <View style={styles.confirmedBadge}>
                <Text style={styles.confirmedText}>Inscrito</Text>
              </View>
              <TouchableOpacity
                style={styles.classBtn}
                onPress={() => navigation.navigate('Checkin')}
              >
                <Text style={styles.classBtnText}>Gerenciar Check-in</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Sem aula marcada</Text>
              <Text style={styles.emptyText}>Nenhuma aula agendada para hoje.</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('Checkin')}
              >
                <Text style={styles.emptyBtnText}>+ Agendar Aula</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── 3. Acesso Rápido ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>3</Text>
            </View>
            <Text style={styles.sectionTitle}>Acesso Rápido</Text>
          </View>
          <View style={styles.quickGrid}>
            {quickActions.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.quickCard}
                onPress={() => navigation.navigate(item.screen)}
              >
                <View style={styles.quickIconBox}>
                  <Text style={styles.quickIconText}>{item.icon}</Text>
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, paddingHorizontal: 20 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  greeting: { color: '#1A1A1A', fontSize: 20, fontWeight: '800' },
  subGreeting: { color: '#888', fontSize: 13, marginTop: 2, fontWeight: '500' },
  logoutBtn: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  logoutText: { color: '#CC0000', fontWeight: '700', fontSize: 13 },

  // Sections
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CC0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  sectionTitle: { color: '#1A1A1A', fontSize: 16, fontWeight: '700' },

  // Loading card
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingText: { color: '#999', fontSize: 14 },

  // WOD Card
  wodCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  wodTagRow: { flexDirection: 'row', marginBottom: 10 },
  wodTag: {
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  wodTagText: { color: '#CC0000', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  wodPreview: { color: '#444', fontSize: 14, lineHeight: 22, marginBottom: 8 },
  wodNotes: { color: '#999', fontSize: 13, fontStyle: 'italic', marginBottom: 14 },
  wodBtn: {
    backgroundColor: '#CC0000',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
  },
  wodBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Class card
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  classInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  classIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  classIconText: { color: '#CC0000', fontWeight: '900', fontSize: 18 },
  classInfo: { flex: 1 },
  className: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  classDetail: { color: '#888', fontSize: 13, marginTop: 2 },
  confirmedBadge: {
    backgroundColor: '#F0FFF4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  confirmedText: { color: '#22C55E', fontSize: 12, fontWeight: '700' },
  classBtn: {
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  classBtnText: { color: '#555', fontWeight: '700', fontSize: 14 },

  // Empty card
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: { color: '#1A1A1A', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  emptyText: { color: '#999', fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  emptyBtn: {
    backgroundColor: '#CC0000',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Quick access
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickIconText: { color: '#CC0000', fontWeight: '900', fontSize: 18 },
  quickLabel: { color: '#1A1A1A', fontSize: 13, fontWeight: '700', textAlign: 'center' },
});
