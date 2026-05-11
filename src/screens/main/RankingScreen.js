import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

const rankingData = [
  { pos: 1, name: 'Joao Silva',    score: 185, diff: 12, initial: 'J' },
  { pos: 2, name: 'Maria Costa',   score: 182, diff: 15, initial: 'M' },
  { pos: 3, name: 'Pedro Lima',    score: 179, diff: 18, initial: 'P' },
  { pos: 4, name: 'Ana Souza',     score: 175, diff: 22, initial: 'A' },
  { pos: 5, name: 'Carlos Dias',   score: 171, diff: 26, initial: 'C' },
  { pos: 6, name: 'Lucia Ferr.',   score: 168, diff: 29, initial: 'L' },
  { pos: 7, name: 'Roberto M.',    score: 165, diff: 32, initial: 'R' },
  { pos: 8, name: 'Fernanda A.',   score: 160, diff: 37, initial: 'F' },
];

export default function RankingScreen() {
  const topThree = rankingData.slice(0, 3);
  const rest = rankingData.slice(3);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ranking</Text>
          <Text style={styles.headerSubtitle}>Aula em Tempo Real - 17:30</Text>
        </View>

        {/* Top 3 Podium */}
        <View style={styles.podiumContainer}>
          {/* 2nd place */}
          <View style={[styles.podiumItem, styles.podiumSecond]}>
            <View style={[styles.podiumAvatar, { backgroundColor: '#9CA3AF' }]}>
              <Text style={styles.podiumAvatarText}>{topThree[1].initial}</Text>
            </View>
            <View style={[styles.podiumBar, { height: 60, backgroundColor: '#9CA3AF' }]}>
              <Text style={styles.podiumPos}>2</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{topThree[1].name.split(' ')[0]}</Text>
            <Text style={styles.podiumScore}>{topThree[1].score}</Text>
          </View>

          {/* 1st place */}
          <View style={[styles.podiumItem, styles.podiumFirst]}>
            <View style={[styles.podiumAvatar, { backgroundColor: '#FBBf24' }]}>
              <Text style={styles.podiumAvatarText}>{topThree[0].initial}</Text>
            </View>
            <View style={[styles.podiumBar, { height: 90, backgroundColor: '#FBBF24' }]}>
              <Text style={styles.podiumPos}>1</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{topThree[0].name.split(' ')[0]}</Text>
            <Text style={styles.podiumScore}>{topThree[0].score}</Text>
          </View>

          {/* 3rd place */}
          <View style={[styles.podiumItem, styles.podiumThird]}>
            <View style={[styles.podiumAvatar, { backgroundColor: '#CD7F32' }]}>
              <Text style={styles.podiumAvatarText}>{topThree[2].initial}</Text>
            </View>
            <View style={[styles.podiumBar, { height: 45, backgroundColor: '#CD7F32' }]}>
              <Text style={styles.podiumPos}>3</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{topThree[2].name.split(' ')[0]}</Text>
            <Text style={styles.podiumScore}>{topThree[2].score}</Text>
          </View>
        </View>

        {/* Rankings List */}
        <View style={styles.listContainer}>
          {rest.map((athlete) => (
            <View key={athlete.pos} style={styles.rankRow}>
              <Text style={styles.rankPos}>#{athlete.pos}</Text>
              <View style={styles.rankAvatar}>
                <Text style={styles.rankAvatarText}>{athlete.initial}</Text>
              </View>
              <Text style={styles.rankName}>{athlete.name}</Text>
              <View style={styles.rankRight}>
                <Text style={styles.rankScore}>{athlete.score}</Text>
                <Text style={styles.rankDiff}>-{athlete.diff}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { paddingTop: 20, paddingBottom: 24 },
  headerTitle: { color: '#1A1A1A', fontSize: 26, fontWeight: '900' },
  headerSubtitle: { color: '#888', fontSize: 13, marginTop: 4 },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  podiumItem: { alignItems: 'center', flex: 1 },
  podiumFirst: {},
  podiumSecond: {},
  podiumThird: {},
  podiumAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumAvatarText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 8,
  },
  podiumPos: { color: '#fff', fontWeight: '900', fontSize: 16 },
  podiumName: { color: '#555', fontSize: 12, marginTop: 6, fontWeight: '600' },
  podiumScore: { color: '#1A1A1A', fontSize: 13, fontWeight: '800' },
  listContainer: { gap: 10, marginBottom: 40 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rankPos: { color: '#999', fontSize: 14, fontWeight: '700', width: 30 },
  rankAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankAvatarText: { color: '#CC0000', fontSize: 14, fontWeight: '800' },
  rankName: { color: '#1A1A1A', fontSize: 15, fontWeight: '600', flex: 1 },
  rankRight: { alignItems: 'flex-end' },
  rankScore: { color: '#1A1A1A', fontSize: 15, fontWeight: '800' },
  rankDiff: { color: '#CC0000', fontSize: 11, marginTop: 2 },
});
