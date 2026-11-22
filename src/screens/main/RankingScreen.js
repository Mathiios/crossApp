import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  SafeAreaView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { doc, onSnapshot, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getTodayKey, formatDateBR } from '../../utils/dateUtils';

// ── Helpers ──

/** Converte input de tempo (mm:ss ou segundos puros) para total em segundos */
function parseTimeInput(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return null;
  // Formato mm:ss
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length !== 2) return null;
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (isNaN(mins) || isNaN(secs) || mins < 0 || secs < 0 || secs >= 60) return null;
    return mins * 60 + secs;
  }
  // Segundos puros
  const n = parseInt(trimmed, 10);
  return isNaN(n) || n < 0 ? null : n;
}

/** Formata segundos em mm:ss */
function formatTime(totalSeconds) {
  if (totalSeconds == null) return '--';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/** Formata score conforme tipo */
function formatScore(score, scoringType) {
  if (score == null) return '--';
  if (scoringType === 'time') return formatTime(score);
  return `${score} reps`;
}

/** Calcula diferença em relação ao líder */
function getDiff(score, leaderScore, scoringType) {
  if (score == null || leaderScore == null || score === leaderScore) return '';
  if (scoringType === 'time') {
    const diff = score - leaderScore;
    return `+${formatTime(diff)}`;
  }
  const diff = leaderScore - score;
  return `-${diff} reps`;
}

export default function RankingScreen() {
  const { user, userRole, canManageCheckins } = useAuth();
  const canManage = userRole === 'professor' || userRole === 'admin';

  const todayKey = getTodayKey();

  // ── WOD scoringType ──
  const [scoringType, setScoringType] = useState('reps');
  const [wodExists, setWodExists] = useState(false);

  // ── Scores ──
  const [rawScores, setRawScores] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Modal state ──
  const [showModal, setShowModal] = useState(false);
  const [scoreInput, setScoreInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // ── Delete confirmation ──
  const [pendingDelete, setPendingDelete] = useState(null);

  // Listener: WOD do dia (para pegar scoringType)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'wods', todayKey), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setScoringType(data.scoringType || 'reps');
        setWodExists(true);
      } else {
        setScoringType('reps');
        setWodExists(false);
      }
    });
    return () => unsub();
  }, [todayKey]);

  // Listener: Scores do dia
  useEffect(() => {
    setLoading(true);
    const scoresRef = collection(db, 'rankings', todayKey, 'scores');
    const unsub = onSnapshot(scoresRef,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRawScores(data);
        setLoading(false);
      },
      () => { setLoading(false); }
    );
    return () => unsub();
  }, [todayKey]);

  // Sorted scores (client-side)
  const scores = useMemo(() => {
    const sorted = [...rawScores];
    if (scoringType === 'time') {
      sorted.sort((a, b) => (a.score || Infinity) - (b.score || Infinity)); // ascendente
    } else {
      sorted.sort((a, b) => (b.score || 0) - (a.score || 0)); // descendente
    }
    return sorted;
  }, [rawScores, scoringType]);

  // My score
  const myScore = scores.find(s => s.id === user.uid);
  const myPosition = myScore ? scores.indexOf(myScore) + 1 : null;
  const leaderScore = scores.length > 0 ? scores[0].score : null;

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // ── Registrar / Editar score ──
  const handleSubmitScore = async () => {
    if (!scoreInput.trim()) { showMsg('Preencha o campo de resultado.', 'error'); return; }

    let scoreValue;
    if (scoringType === 'time') {
      scoreValue = parseTimeInput(scoreInput);
      if (scoreValue === null) {
        showMsg('Formato inválido. Use mm:ss ou segundos (ex: 4:05 ou 245).', 'error');
        return;
      }
    } else {
      scoreValue = parseInt(scoreInput, 10);
      if (isNaN(scoreValue) || scoreValue < 0) {
        showMsg('Informe um número válido de repetições.', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const scoreRef = doc(db, 'rankings', todayKey, 'scores', user.uid);
      await setDoc(scoreRef, {
        athleteName: user.displayName || user.email,
        athleteUid: user.uid,
        athleteEmail: user.email,
        score: scoreValue,
        scoringType,
        updatedAt: new Date().toISOString(),
      });
      setShowModal(false);
      setScoreInput('');
      showMsg(myScore ? 'Resultado atualizado!' : 'Resultado registrado!');
    } catch (e) {
      showMsg(`Erro: ${e.code || e.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Deletar score ──
  const handleDeleteScore = async (scoreId) => {
    setPendingDelete(null);
    try {
      await deleteDoc(doc(db, 'rankings', todayKey, 'scores', scoreId));
      showMsg('Resultado excluído.', 'info');
    } catch (e) {
      showMsg(`Erro ao excluir: ${e.code || e.message}`, 'error');
    }
  };

  const openModal = () => {
    if (myScore) {
      // Preenche com valor atual para edição
      if (scoringType === 'time') {
        setScoreInput(formatTime(myScore.score));
      } else {
        setScoreInput(String(myScore.score));
      }
    } else {
      setScoreInput('');
    }
    setShowModal(true);
  };

  // ── Podium helpers ──
  const topThree = scores.slice(0, 3);
  const rest = scores.slice(3);
  const podiumOrder = topThree.length >= 3 ? [topThree[1], topThree[0], topThree[2]] : [];
  const podiumColors = ['#A8A8A8', '#FBBF24', '#CD7F32']; // 2nd, 1st, 3rd
  const podiumHeights = [68, 90, 52];
  const podiumPositions = [2, 1, 3];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#CC0000" />
          <Text style={styles.loadingText}>Carregando ranking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Ranking</Text>
            <Text style={styles.headerSubtitle}>{formatDateBR(todayKey)}</Text>
          </View>
        </View>

        {/* Scoring Type Badge */}
        <View style={styles.typeBadgeRow}>
          <View style={[styles.typeBadge, scoringType === 'time' ? styles.typeBadgeTime : styles.typeBadgeReps]}>
            <Text style={styles.typeBadgeText}>
              {scoringType === 'time' ? '⏱️ For Time' : '🏋️ Max Reps'}
            </Text>
          </View>
          <Text style={styles.typeBadgeHint}>
            {scoringType === 'time' ? 'Menor tempo vence' : 'Mais repetições vence'}
          </Text>
        </View>

        {/* Mensagem */}
        {message.text ? (
          <View style={[
            styles.msgBanner,
            message.type === 'error' && styles.msgError,
            message.type === 'info' && styles.msgInfo,
          ]}>
            <Text style={[styles.msgText, message.type === 'error' && { color: '#CC0000' }]}>
              {message.text}
            </Text>
          </View>
        ) : null}

        {/* ── Banner pessoal ── */}
        {myScore ? (
          <View style={styles.myBanner}>
            <View style={styles.myBannerLeft}>
              <View style={styles.myBannerAvatar}>
                <Text style={styles.myBannerAvatarText}>
                  {(user.displayName || user.email || '?')[0].toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.myBannerLabel}>Seu resultado</Text>
                <Text style={styles.myBannerScore}>{formatScore(myScore.score, scoringType)}</Text>
              </View>
            </View>
            <View style={styles.myBannerRight}>
              <View style={styles.myPosBadge}>
                <Text style={styles.myPosBadgeText}>#{myPosition}</Text>
              </View>
              <View style={styles.myBannerActions}>
                <TouchableOpacity style={styles.myEditBtn} onPress={openModal}>
                  <Ionicons name="pencil" size={14} color="#CC0000" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.myDeleteBtn}
                  onPress={() => setPendingDelete({ id: user.uid, name: user.displayName || user.email })}
                >
                  <Ionicons name="trash-outline" size={14} color="#CC0000" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.registerBanner} onPress={openModal}>
            <Ionicons name="add-circle-outline" size={22} color="#CC0000" />
            <Text style={styles.registerBannerText}>Registrar meu resultado</Text>
          </TouchableOpacity>
        )}

        {scores.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="trophy-outline" size={48} color="#CCC" />
            <Text style={styles.emptyTitle}>Sem resultados ainda</Text>
            <Text style={styles.emptyText}>
              {wodExists
                ? 'Seja o primeiro a registrar seu resultado!'
                : 'Nenhum WOD cadastrado para hoje.'}
            </Text>
          </View>
        ) : (
          <>
            {/* ── Pódio Visual ── */}
            {topThree.length >= 3 && (
              <View style={styles.podiumContainer}>
                {podiumOrder.map((athlete, idx) => (
                  <View key={athlete.id} style={styles.podiumItem}>
                    <View style={[styles.podiumAvatar, { backgroundColor: podiumColors[idx] }]}>
                      <Text style={styles.podiumAvatarText}>
                        {(athlete.athleteName || '?')[0].toUpperCase()}
                      </Text>
                      {podiumPositions[idx] === 1 && (
                        <View style={styles.crownBadge}>
                          <Text style={styles.crownText}>👑</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {(athlete.athleteName || '').split(' ')[0]}
                    </Text>
                    <Text style={styles.podiumScore}>{formatScore(athlete.score, scoringType)}</Text>
                    <View style={[styles.podiumBar, {
                      height: podiumHeights[idx],
                      backgroundColor: podiumColors[idx],
                    }]}>
                      <Text style={styles.podiumPos}>{podiumPositions[idx]}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ── Top 3 cards (quando tem menos de 3) ── */}
            {topThree.length > 0 && topThree.length < 3 && (
              <View style={styles.listContainer}>
                {topThree.map((athlete, index) => {
                  const isMe = athlete.id === user.uid;
                  const canDelete = isMe || canManage;
                  return (
                    <View key={athlete.id} style={[styles.rankRow, isMe && styles.rankRowMe]}>
                      <View style={styles.posCircle}>
                        <Text style={styles.posCircleText}>{index + 1}</Text>
                      </View>
                      <View style={styles.rankAvatar}>
                        <Text style={styles.rankAvatarText}>
                          {(athlete.athleteName || '?')[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.rankInfo}>
                        <Text style={styles.rankName} numberOfLines={1}>{athlete.athleteName}</Text>
                        {index > 0 && (
                          <Text style={styles.rankDiff}>{getDiff(athlete.score, leaderScore, scoringType)}</Text>
                        )}
                      </View>
                      <View style={styles.rankRight}>
                        <Text style={styles.rankScore}>{formatScore(athlete.score, scoringType)}</Text>
                        {canDelete && (
                          <TouchableOpacity
                            onPress={() => setPendingDelete({ id: athlete.id, name: athlete.athleteName })}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="trash-outline" size={14} color="#CC0000" style={{ marginTop: 4 }} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── Lista classificatória (4º em diante) ── */}
            {rest.length > 0 && (
              <View style={styles.listContainer}>
                <Text style={styles.listTitle}>Classificação</Text>
                {rest.map((athlete, index) => {
                  const pos = index + 4;
                  const isMe = athlete.id === user.uid;
                  const canDelete = isMe || canManage;
                  return (
                    <View key={athlete.id} style={[styles.rankRow, isMe && styles.rankRowMe]}>
                      <View style={styles.posCircle}>
                        <Text style={styles.posCircleText}>{pos}</Text>
                      </View>
                      <View style={styles.rankAvatar}>
                        <Text style={styles.rankAvatarText}>
                          {(athlete.athleteName || '?')[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.rankInfo}>
                        <Text style={styles.rankName} numberOfLines={1}>{athlete.athleteName}</Text>
                        <Text style={styles.rankDiff}>{getDiff(athlete.score, leaderScore, scoringType)}</Text>
                      </View>
                      <View style={styles.rankRight}>
                        <Text style={styles.rankScore}>{formatScore(athlete.score, scoringType)}</Text>
                        {canDelete && (
                          <TouchableOpacity
                            onPress={() => setPendingDelete({ id: athlete.id, name: athlete.athleteName })}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="trash-outline" size={14} color="#CC0000" style={{ marginTop: 4 }} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modal: Registrar/Editar Score ── */}
      <Modal transparent animationType="fade" visible={showModal} onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {myScore ? 'Editar Resultado' : 'Registrar Resultado'}
            </Text>
            <Text style={styles.modalSubtitle}>{formatDateBR(todayKey)}</Text>

            <View style={[styles.modalTypeBadge, scoringType === 'time' ? styles.modalTypeBadgeTime : styles.modalTypeBadgeReps]}>
              <Text style={styles.modalTypeBadgeText}>
                {scoringType === 'time' ? '⏱️ For Time' : '🏋️ Max Reps'}
              </Text>
            </View>

            <Text style={styles.inputLabel}>
              {scoringType === 'time' ? 'Seu tempo' : 'Suas repetições'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder={scoringType === 'time' ? 'Ex: 4:05 ou 245' : 'Ex: 185'}
              placeholderTextColor="#BBB"
              keyboardType={scoringType === 'time' ? 'default' : 'numeric'}
              value={scoreInput}
              onChangeText={setScoreInput}
              autoFocus
            />
            {scoringType === 'time' && (
              <Text style={styles.inputHint}>Formatos aceitos: mm:ss (ex: 4:05) ou segundos (ex: 245)</Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, saving && { opacity: 0.5 }]}
                onPress={handleSubmitScore}
                disabled={saving}
              >
                <Text style={styles.modalConfirmText}>
                  {saving ? 'Salvando...' : myScore ? 'Atualizar' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal: Confirmar exclusão ── */}
      <Modal transparent animationType="fade" visible={!!pendingDelete} onRequestClose={() => setPendingDelete(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Excluir Resultado</Text>
            <Text style={styles.modalBody}>
              Tem certeza que deseja excluir o resultado de{' '}
              <Text style={{ fontWeight: '800' }}>{pendingDelete?.name}</Text>?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setPendingDelete(null)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDeleteBtn} onPress={() => handleDeleteScore(pendingDelete?.id)}>
                <Text style={styles.modalConfirmText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { color: '#888', marginTop: 16, fontSize: 15, fontWeight: '600' },

  // Header
  header: { paddingTop: 20, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { color: '#1A1A1A', fontSize: 26, fontWeight: '900' },
  headerSubtitle: { color: '#888', fontSize: 13, marginTop: 4 },

  // Type badge
  typeBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  typeBadge: {
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1,
  },
  typeBadgeReps: { backgroundColor: '#FFF0F0', borderColor: '#FFCCCC' },
  typeBadgeTime: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  typeBadgeText: { fontWeight: '700', fontSize: 13, color: '#1A1A1A' },
  typeBadgeHint: { color: '#999', fontSize: 12 },

  // Message
  msgBanner: {
    backgroundColor: '#F0FFF4', borderRadius: 10, padding: 12,
    marginBottom: 12, borderWidth: 1, borderColor: '#C6F6D5',
  },
  msgError: { backgroundColor: '#FFF0F0', borderColor: '#FFCCCC' },
  msgInfo: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  msgText: { color: '#16A34A', fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // My banner
  myBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F0FFF4', borderRadius: 16, padding: 16,
    marginBottom: 20, borderWidth: 1.5, borderColor: '#C6F6D5',
    shadowColor: '#22C55E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  myBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  myBannerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center',
  },
  myBannerAvatarText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  myBannerLabel: { color: '#888', fontSize: 11, fontWeight: '600' },
  myBannerScore: { color: '#16A34A', fontSize: 20, fontWeight: '900', marginTop: 2 },
  myBannerRight: { alignItems: 'flex-end', gap: 8 },
  myPosBadge: {
    backgroundColor: '#22C55E', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  myPosBadgeText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  myBannerActions: { flexDirection: 'row', gap: 6 },
  myEditBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#FFCCCC',
  },
  myDeleteBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#FFCCCC',
  },

  // Register banner (no score yet)
  registerBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    marginBottom: 20, borderWidth: 1.5, borderColor: '#FFCCCC', borderStyle: 'dashed',
  },
  registerBannerText: { color: '#CC0000', fontWeight: '700', fontSize: 15 },

  // Empty
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  emptyTitle: { color: '#1A1A1A', fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 6 },
  emptyText: { color: '#999', fontSize: 13, textAlign: 'center' },

  // Podium
  podiumContainer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    gap: 10, marginBottom: 24, paddingHorizontal: 6, paddingTop: 12,
  },
  podiumItem: { alignItems: 'center', flex: 1 },
  podiumAvatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  podiumAvatarText: { color: '#fff', fontWeight: '900', fontSize: 17 },
  crownBadge: { position: 'absolute', top: -14, alignSelf: 'center' },
  crownText: { fontSize: 16 },
  podiumName: { color: '#555', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  podiumScore: { color: '#1A1A1A', fontSize: 12, fontWeight: '800', marginBottom: 6 },
  podiumBar: {
    width: '100%', borderTopLeftRadius: 10, borderTopRightRadius: 10,
    justifyContent: 'flex-start', alignItems: 'center', paddingTop: 8,
  },
  podiumPos: { color: '#fff', fontWeight: '900', fontSize: 18 },

  // List
  listContainer: { gap: 8, marginBottom: 20 },
  listTitle: { color: '#888', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  rankRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#EBEBEB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  rankRowMe: { borderColor: '#C6F6D5', backgroundColor: '#F0FFF4' },
  posCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
  },
  posCircleText: { color: '#888', fontSize: 12, fontWeight: '800' },
  rankAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  rankAvatarText: { color: '#CC0000', fontSize: 14, fontWeight: '800' },
  rankInfo: { flex: 1 },
  rankName: { color: '#1A1A1A', fontSize: 14, fontWeight: '600' },
  rankDiff: { color: '#999', fontSize: 11, marginTop: 2 },
  rankRight: { alignItems: 'flex-end' },
  rankScore: { color: '#1A1A1A', fontSize: 15, fontWeight: '800' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    width: '100%', maxWidth: 400,
  },
  modalTitle: { color: '#1A1A1A', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  modalSubtitle: { color: '#888', fontSize: 13, marginBottom: 16 },
  modalTypeBadge: {
    alignSelf: 'flex-start', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16,
    borderWidth: 1,
  },
  modalTypeBadgeReps: { backgroundColor: '#FFF0F0', borderColor: '#FFCCCC' },
  modalTypeBadgeTime: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  modalTypeBadgeText: { fontWeight: '700', fontSize: 12, color: '#1A1A1A' },
  modalBody: { color: '#888', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 24 },
  inputLabel: { color: '#555', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  inputHint: { color: '#BBB', fontSize: 11, marginTop: -8, marginBottom: 12 },
  modalInput: {
    backgroundColor: '#F5F5F5', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 18, fontWeight: '700', color: '#1A1A1A',
    marginBottom: 14, borderWidth: 1, borderColor: '#EBEBEB',
    textAlign: 'center',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancelBtn: {
    flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  modalCancelText: { color: '#888', fontWeight: '700', fontSize: 15 },
  modalConfirmBtn: {
    flex: 1, backgroundColor: '#CC0000', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  modalDeleteBtn: {
    flex: 1, backgroundColor: '#CC0000', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  modalConfirmText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
