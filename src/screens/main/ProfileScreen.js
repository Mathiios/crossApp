import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function ProfileScreen({ navigation }) {
  const { user, logout, userRole, isAdmin } = useAuth();
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Atleta';

  const [stats, setStats] = useState({ treinos: '...', meses: '...', prs: '...' });
  const [loadingStats, setLoadingStats] = useState(true);

  const roleConfig = {
    aluno:     { label: 'Aluno',          color: '#3B82F6', icon: 'A' },
    professor: { label: 'Professor',       color: '#F59E0B', icon: 'P' },
    admin:     { label: 'Administrador',   color: '#CC0000', icon: 'X' },
  };
  const role = roleConfig[userRole] || roleConfig.aluno;

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoadingStats(true);

      // Total de treinos (dias com check-in)
      let totalCheckins = 0;
      try {
        const checkinsSnap = await getDocs(collection(db, 'checkins'));
        checkinsSnap.forEach((docSnap) => {
          const slots = docSnap.data().slots || {};
          for (const time of Object.keys(slots)) {
            if ((slots[time] || []).some(u => u.uid === user.uid)) {
              totalCheckins++;
              break;
            }
          }
        });
      } catch (e) { /* silencioso */ }

      // Meses desde criação da conta
      let meses = 0;
      try {
        const creationTime = user?.metadata?.creationTime;
        if (creationTime) {
          const created = new Date(creationTime);
          const now = new Date();
          meses = Math.max(1,
            (now.getFullYear() - created.getFullYear()) * 12 +
            (now.getMonth() - created.getMonth())
          );
        }
      } catch (e) { meses = 1; }

      // Total de PRs (scores no ranking)
      let totalPRs = 0;
      try {
        const scoresQuery = query(
          collectionGroup(db, 'scores'),
          where('athleteUid', '==', user.uid)
        );
        const scoresSnap = await getDocs(scoresQuery);
        totalPRs = scoresSnap.size;
      } catch (e) { /* silencioso */ }

      setStats({
        treinos: String(totalCheckins),
        meses: String(meses),
        prs: String(totalPRs),
      });
    } catch (e) {
      setStats({ treinos: '0', meses: '1', prs: '0' });
    } finally {
      setLoadingStats(false);
    }
  };

  const menuItems = [
    { icon: 'fitness', label: 'Meus Resultados', desc: 'Historico de treinos', screen: 'WOD' },
    { icon: 'trending-up', label: 'Progresso', desc: 'Seus PRs e evolucao', screen: 'Ranking' },
    { icon: 'notifications', label: 'Notificacoes', desc: 'Alertas e lembretes', screen: null },
    { icon: 'settings', label: 'Configuracoes', desc: 'Preferencias do app', screen: null },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>Membro CrossFit</Text>
          </View>
          <View style={[styles.roleBadge, { borderColor: `${role.color}40`, backgroundColor: `${role.color}15` }]}>
            <Text style={[styles.roleBadgeText, { color: role.color }]}>{role.label}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {loadingStats ? (
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
              <ActivityIndicator size="small" color="#CC0000" />
            </View>
          ) : (
            [
              { label: 'Treinos', value: stats.treinos },
              { label: 'Meses', value: stats.meses },
              { label: 'PRs', value: stats.prs },
            ].map((stat) => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => item.screen && navigation.navigate(item.screen)}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={20} color="#CC0000" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Admin panel (somente admin) */}
        {isAdmin && (
          <TouchableOpacity style={styles.adminBtn} onPress={() => navigation.navigate('Admin')}>
            <Text style={styles.adminBtnText}>Painel de Administracao</Text>
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 28 },
  avatarContainer: {
    shadowColor: '#CC0000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 14,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#CC0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 38, fontWeight: '900' },
  userName: { color: '#1A1A1A', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  userEmail: { color: '#888', fontSize: 13, marginBottom: 12 },
  roleBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    marginTop: 6,
  },
  roleBadgeText: { fontWeight: '700', fontSize: 13 },
  memberBadge: {
    backgroundColor: '#FFF0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  memberBadgeText: { color: '#CC0000', fontWeight: '700', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#1A1A1A', fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  menuSection: { gap: 10, marginBottom: 20 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuContent: { flex: 1 },
  menuLabel: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  menuDesc: { color: '#999', fontSize: 12, marginTop: 2 },
  adminBtn: {
    backgroundColor: '#FFF0F0',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCCCC',
    marginBottom: 12,
  },
  adminBtnText: { color: '#CC0000', fontWeight: '800', fontSize: 15 },
  logoutBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    marginBottom: 40,
  },
  logoutText: { color: '#CC0000', fontWeight: '700', fontSize: 15 },
});
