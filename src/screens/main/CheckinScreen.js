import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, SafeAreaView,
} from 'react-native';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { getTodayKey, formatDateShortBR } from '../../utils/dateUtils';

const CLASS_TIMES = ['06:00', '07:00', '09:00', '12:00', '16:20', '17:30', '18:40', '20:00'];
const MAX_SPOTS = 20;

export default function CheckinScreen() {
  const { user, canManageCheckins } = useAuth();
  const [mode, setMode] = useState('personal');
  const [slots, setSlots] = useState({});
  const [userCheckin, setUserCheckin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [manageSlot, setManageSlot] = useState(CLASS_TIMES[0]);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [pendingClearSlot, setPendingClearSlot] = useState(null);

  const todayKey = getTodayKey();

  useEffect(() => {
    setLoading(true); setError('');
    const ref = doc(db, 'checkins', todayKey);
    const timeout = setTimeout(() => { setLoading(false); setError('permission-denied'); }, 10000);
    const unsub = onSnapshot(ref,
      (snap) => {
        clearTimeout(timeout);
        const slotsData = snap.exists() ? (snap.data().slots || {}) : {};
        setSlots(slotsData);
        let found = null;
        for (const t of CLASS_TIMES) {
          if ((slotsData[t] || []).some(u => u.uid === user.uid)) { found = t; break; }
        }
        setUserCheckin(found);
        setLoading(false);
      },
      (err) => { clearTimeout(timeout); setLoading(false); setError(err.code || 'unknown'); }
    );
    return () => { clearTimeout(timeout); unsub(); };
  }, [todayKey, user.uid]);

  useEffect(() => {
    if (mode !== 'manage') return;
    setLoadingUsers(true);
    getDocs(collection(db, 'users'))
      .then(snap => setAllUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, [mode]);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleSelfCheckin = async (time) => {
    if (actionLoading) return;
    if (userCheckin && userCheckin !== time) {
      showMsg(`Voce ja esta inscrito nas ${userCheckin}. Cancele primeiro.`, 'error');
      return;
    }
    const spots = slots[time] || [];
    if (userCheckin === time) {
      setActionLoading(true);
      try {
        const entry = spots.find(u => u.uid === user.uid);
        await updateDoc(doc(db, 'checkins', todayKey), { [`slots.${time}`]: arrayRemove(entry) });
        showMsg('Check-in cancelado.', 'info');
      } catch(e) { showMsg(`Erro: ${e.code}`, 'error'); }
      finally { setActionLoading(false); }
      return;
    }
    if (spots.length >= MAX_SPOTS) { showMsg('Essa aula esta lotada!', 'error'); return; }
    setActionLoading(true);
    try {
      const ref = doc(db, 'checkins', todayKey);
      const snap = await getDoc(ref);
      const entry = { uid: user.uid, name: user.displayName || user.email, email: user.email };
      if (!snap.exists()) await setDoc(ref, { slots: { [time]: [entry] } });
      else await updateDoc(ref, { [`slots.${time}`]: arrayUnion(entry) });
      showMsg(`Check-in confirmado para as ${time}!`);
    } catch(e) { showMsg(`Erro: ${e.code}`, 'error'); }
    finally { setActionLoading(false); }
  };

  const handleManageCheckin = async (targetUser, add) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const ref = doc(db, 'checkins', todayKey);
      const snap = await getDoc(ref);
      const entry = { uid: targetUser.uid, name: targetUser.name || targetUser.email, email: targetUser.email };
      if (add) {
        const spots = slots[manageSlot] || [];
        if (spots.length >= MAX_SPOTS) { showMsg('Aula lotada!', 'error'); return; }
        let updates = { [`slots.${manageSlot}`]: arrayUnion(entry) };
        for (const t of CLASS_TIMES) {
          if (t !== manageSlot && (slots[t] || []).some(u => u.uid === targetUser.uid)) {
            const oldEntry = slots[t].find(u => u.uid === targetUser.uid);
            updates[`slots.${t}`] = arrayRemove(oldEntry);
          }
        }
        if (!snap.exists()) await setDoc(ref, { slots: { [manageSlot]: [entry] } });
        else await updateDoc(ref, updates);
        showMsg(`${entry.name} adicionado(a) as ${manageSlot}`);
      } else {
        const oldEntry = (slots[manageSlot] || []).find(u => u.uid === targetUser.uid);
        await updateDoc(ref, { [`slots.${manageSlot}`]: arrayRemove(oldEntry) });
        showMsg(`${entry.name} removido(a) das ${manageSlot}`, 'info');
      }
    } catch(e) { showMsg(`Erro: ${e.code}`, 'error'); }
    finally { setActionLoading(false); }
  };

  const handleClearSlot = (time) => {
    const count = (slots[time] || []).length;
    if (count === 0) { showMsg('Este slot ja esta vazio.', 'info'); return; }
    setPendingClearSlot(time);
  };

  const confirmClearSlot = async () => {
    if (!pendingClearSlot) return;
    const time = pendingClearSlot;
    setPendingClearSlot(null);
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'checkins', todayKey), { [`slots.${time}`]: [] });
      showMsg(`Slot das ${time} foi limpo.`);
    } catch(e) { showMsg(`Erro: ${e.code}`, 'error'); }
    finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#CC0000" />
          <Text style={styles.loadingText}>Carregando aulas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.centered}>
          <Text style={styles.errorTitle}>Erro de Permissao</Text>
          <Text style={styles.errorSub}>Codigo: {error}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const usersInManageSlot = slots[manageSlot] || [];
  const usersNotInSlot = allUsers.filter(u => !usersInManageSlot.some(s => s.uid === u.uid));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Agendar Aula</Text>
          <Text style={styles.headerSubtitle}>{formatDateShortBR(todayKey)}</Text>
        </View>

        {/* Tabs (professor/admin) */}
        {canManageCheckins && (
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode==='personal' && styles.modeTabActive]}
              onPress={() => setMode('personal')}
            >
              <Text style={[styles.modeTabText, mode==='personal' && styles.modeTabTextActive]}>
                Meu Check-in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode==='manage' && styles.modeTabActive]}
              onPress={() => setMode('manage')}
            >
              <Text style={[styles.modeTabText, mode==='manage' && styles.modeTabTextActive]}>
                Gerenciar Alunos
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mensagem */}
        {message.text ? (
          <View style={[
            styles.msgBanner,
            message.type==='error' && styles.msgError,
            message.type==='info' && styles.msgInfo,
          ]}>
            <Text style={[styles.msgText, message.type==='error' && { color:'#CC0000' }]}>
              {message.text}
            </Text>
          </View>
        ) : null}

        {/* MODO PESSOAL */}
        {mode === 'personal' && (
          <>
            {userCheckin ? (
              <View style={styles.myCheckinBanner}>
                <View style={styles.checkinIconBox}>
                  <Text style={styles.checkinIconText}>OK</Text>
                </View>
                <View style={styles.checkinInfo}>
                  <Text style={styles.myCheckinTitle}>Voce esta inscrito</Text>
                  <Text style={styles.myCheckinSub}>Aula das {userCheckin} · Toque para cancelar</Text>
                </View>
              </View>
            ) : (
              <View style={styles.noCheckinBanner}>
                <Text style={styles.noCheckinText}>Selecione uma aula para fazer o check-in</Text>
              </View>
            )}

            <View style={styles.slotsContainer}>
              {CLASS_TIMES.map((time) => {
                const usersInSlot = slots[time] || [];
                const count = usersInSlot.length;
                const isFull = count >= MAX_SPOTS;
                const isMySlot = userCheckin === time;
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.slotCard,
                      isMySlot && styles.slotMine,
                      isFull && !isMySlot && styles.slotFull,
                    ]}
                    onPress={() => handleSelfCheckin(time)}
                    disabled={actionLoading}
                  >
                    <View>
                      <Text style={[styles.slotTime, isFull && !isMySlot && { color: '#BBBBBB' }]}>
                        {time}
                      </Text>
                      <Text style={styles.slotLabel}>CrossFit</Text>
                    </View>
                    <View style={styles.slotRight}>
                      <View style={styles.progressRow}>
                        <View style={styles.progressBar}>
                          <View style={[
                            styles.progressFill,
                            { width: `${(count/MAX_SPOTS)*100}%` },
                            isFull && { backgroundColor: '#DDDDDD' },
                            isMySlot && { backgroundColor: '#22C55E' },
                          ]} />
                        </View>
                        <Text style={styles.progressText}>{count}/{MAX_SPOTS}</Text>
                      </View>
                      {isMySlot
                        ? <View style={styles.badgeGreen}><Text style={styles.badgeGreenTxt}>Cancelar</Text></View>
                        : isFull
                          ? <View style={styles.badgeRed}><Text style={styles.badgeRedTxt}>Lotado</Text></View>
                          : <View style={styles.badgeGray}><Text style={styles.badgeGrayTxt}>{MAX_SPOTS-count} vagas</Text></View>
                      }
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* MODO GERENCIAMENTO */}
        {mode === 'manage' && (
          <>
            <Text style={styles.manageLabel}>Selecione o horario:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotChipsScroll}>
              {CLASS_TIMES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.slotChip, manageSlot===t && styles.slotChipActive]}
                  onPress={() => setManageSlot(t)}
                >
                  <Text style={[styles.slotChipText, manageSlot===t && styles.slotChipTextActive]}>{t}</Text>
                  <Text style={styles.slotChipCount}>{(slots[t]||[]).length}/{MAX_SPOTS}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loadingUsers ? (
              <View style={styles.centered}><ActivityIndicator color="#CC0000" /></View>
            ) : (
              <>
                <View style={styles.manageSection}>
                  <View style={styles.manageSectionHeader}>
                    <Text style={styles.manageSectionTitle}>
                      Inscritos em {manageSlot} ({usersInManageSlot.length}/{MAX_SPOTS})
                    </Text>
                    {usersInManageSlot.length > 0 && (
                      <TouchableOpacity
                        style={styles.clearSlotBtn}
                        onPress={() => handleClearSlot(manageSlot)}
                        disabled={actionLoading}
                      >
                        <Text style={styles.clearSlotBtnText}>Limpar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {usersInManageSlot.length === 0 ? (
                    <Text style={styles.emptyStateText}>Nenhum aluno inscrito nesta aula.</Text>
                  ) : usersInManageSlot.map((u) => (
                    <View key={u.uid} style={styles.userRow}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>{(u.name||u.email||'?')[0].toUpperCase()}</Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{u.name || '(sem nome)'}</Text>
                        <Text style={styles.userEmail}>{u.email}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleManageCheckin(u, false)}
                        disabled={actionLoading}
                      >
                        <Text style={styles.removeBtnText}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <View style={styles.manageSection}>
                  <Text style={styles.manageSectionTitle}>Adicionar Aluno</Text>
                  {usersNotInSlot.length === 0 ? (
                    <Text style={styles.emptyStateText}>Todos os alunos ja estao inscritos.</Text>
                  ) : usersNotInSlot.map((u) => {
                    const otherSlot = CLASS_TIMES.find(t => t !== manageSlot && (slots[t]||[]).some(s => s.uid === u.uid));
                    return (
                      <View key={u.uid} style={styles.userRow}>
                        <View style={[styles.userAvatar, { backgroundColor: '#F5F5F5' }]}>
                          <Text style={[styles.userAvatarText, { color: '#999' }]}>
                            {(u.name||u.email||'?')[0].toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>{u.name || '(sem nome)'}</Text>
                          {otherSlot
                            ? <Text style={styles.otherSlotText}>Inscrito nas {otherSlot}</Text>
                            : <Text style={styles.userEmail}>{u.email}</Text>
                          }
                        </View>
                        <TouchableOpacity
                          style={styles.addBtn}
                          onPress={() => handleManageCheckin(u, true)}
                          disabled={actionLoading}
                        >
                          <Text style={styles.addBtnText}>{otherSlot ? 'Mover' : 'Adicionar'}</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal limpar slot */}
      <Modal transparent animationType="fade" visible={!!pendingClearSlot} onRequestClose={() => setPendingClearSlot(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Limpar Slot</Text>
            <Text style={styles.modalBody}>
              Tem certeza que deseja remover todos os {(slots[pendingClearSlot] || []).length} aluno(s) da aula das {pendingClearSlot}?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setPendingClearSlot(null)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmClearSlot}>
                <Text style={styles.modalConfirmText}>Limpar</Text>
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
  centered: { flex:1, justifyContent:'center', alignItems:'center', padding:24 },
  loadingText: { color:'#888', marginTop:16, fontSize:15, fontWeight:'600' },
  errorTitle: { color:'#CC0000', fontSize:20, fontWeight:'800', marginBottom:4 },
  errorSub: { color:'#888', fontSize:13 },

  header: { paddingTop: 20, paddingBottom: 16 },
  headerTitle: { color:'#1A1A1A', fontSize: 26, fontWeight:'900' },
  headerSubtitle: { color:'#888', fontSize: 13, marginTop: 4 },

  modeTabs: {
    flexDirection:'row', backgroundColor:'#EBEBEB', borderRadius:12,
    padding:4, marginBottom:16,
  },
  modeTab: { flex:1, paddingVertical:10, alignItems:'center', borderRadius:10 },
  modeTabActive: { backgroundColor:'#CC0000' },
  modeTabText: { color:'#888', fontWeight:'700', fontSize:13 },
  modeTabTextActive: { color:'#fff' },

  msgBanner: {
    backgroundColor:'#F0FFF4', borderRadius:10, padding:12,
    marginBottom:12, borderWidth:1, borderColor:'#C6F6D5',
  },
  msgError: { backgroundColor:'#FFF0F0', borderColor:'#FFCCCC' },
  msgInfo: { backgroundColor:'#EFF6FF', borderColor:'#BFDBFE' },
  msgText: { color:'#16A34A', fontSize:13, fontWeight:'600', textAlign:'center' },

  myCheckinBanner: {
    flexDirection:'row', alignItems:'center', gap:12,
    backgroundColor:'#F0FFF4', borderRadius:14, padding:14,
    marginBottom:12, borderWidth:1, borderColor:'#C6F6D5',
  },
  checkinIconBox: {
    width:40, height:40, borderRadius:12,
    backgroundColor:'#22C55E', justifyContent:'center', alignItems:'center',
  },
  checkinIconText: { color:'#fff', fontWeight:'900', fontSize:12 },
  checkinInfo: { flex:1 },
  myCheckinTitle: { color:'#16A34A', fontWeight:'700', fontSize:15 },
  myCheckinSub: { color:'#888', fontSize:12, marginTop:2 },
  noCheckinBanner: {
    backgroundColor:'#fff', borderRadius:12, padding:14,
    marginBottom:12, borderWidth:1, borderColor:'#EBEBEB', alignItems:'center',
  },
  noCheckinText: { color:'#999', fontSize:13 },

  slotsContainer: { gap:10, marginBottom:24 },
  slotCard: {
    backgroundColor:'#fff', borderRadius:16, padding:16,
    flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    borderWidth:1, borderColor:'#EBEBEB',
    shadowColor:'#000', shadowOffset:{ width:0, height:2 },
    shadowOpacity:0.05, shadowRadius:6, elevation:2,
  },
  slotMine: { borderColor:'#22C55E', backgroundColor:'#F0FFF4' },
  slotFull: { opacity:0.5 },
  slotTime: { color:'#1A1A1A', fontSize:22, fontWeight:'800' },
  slotLabel: { color:'#999', fontSize:11, marginTop:2 },
  slotRight: { alignItems:'flex-end', gap:8 },
  progressRow: { flexDirection:'row', alignItems:'center', gap:8 },
  progressBar: { width:80, height:5, backgroundColor:'#EBEBEB', borderRadius:3, overflow:'hidden' },
  progressFill: { height:'100%', backgroundColor:'#CC0000', borderRadius:3 },
  progressText: { color:'#999', fontSize:11 },
  badgeGreen: {
    backgroundColor:'#F0FFF4', borderRadius:20, paddingHorizontal:12,
    paddingVertical:4, borderWidth:1, borderColor:'#C6F6D5',
  },
  badgeGreenTxt: { color:'#22C55E', fontSize:12, fontWeight:'700' },
  badgeRed: {
    backgroundColor:'#FFF0F0', borderRadius:20, paddingHorizontal:12,
    paddingVertical:4, borderWidth:1, borderColor:'#FFCCCC',
  },
  badgeRedTxt: { color:'#CC0000', fontSize:12, fontWeight:'700' },
  badgeGray: {
    backgroundColor:'#FFF0F0', borderRadius:20, paddingHorizontal:12,
    paddingVertical:4, borderWidth:1, borderColor:'#FFCCCC',
  },
  badgeGrayTxt: { color:'#CC0000', fontSize:12, fontWeight:'700' },

  manageLabel: { color:'#888', fontSize:13, fontWeight:'600', marginBottom:10 },
  slotChipsScroll: { marginBottom:20 },
  slotChip: {
    backgroundColor:'#fff', borderRadius:12, paddingHorizontal:14,
    paddingVertical:10, marginRight:10, borderWidth:1, borderColor:'#EBEBEB', alignItems:'center',
  },
  slotChipActive: { backgroundColor:'#CC0000', borderColor:'#CC0000' },
  slotChipText: { color:'#888', fontWeight:'800', fontSize:14 },
  slotChipTextActive: { color:'#fff' },
  slotChipCount: { color:'#999', fontSize:10, marginTop:2 },

  manageSection: { marginBottom:20 },
  manageSectionHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  manageSectionTitle: { color:'#1A1A1A', fontSize:14, fontWeight:'800' },
  clearSlotBtn: {
    backgroundColor:'#FFF0F0', borderRadius:10, paddingHorizontal:12,
    paddingVertical:6, borderWidth:1, borderColor:'#FFCCCC',
  },
  clearSlotBtnText: { color:'#CC0000', fontWeight:'700', fontSize:12 },
  emptyStateText: { color:'#BBBBBB', fontSize:13, fontStyle:'italic' },

  userRow: {
    flexDirection:'row', alignItems:'center',
    backgroundColor:'#fff', borderRadius:14, padding:12,
    marginBottom:8, borderWidth:1, borderColor:'#EBEBEB',
  },
  userAvatar: {
    width:40, height:40, borderRadius:20,
    backgroundColor:'#FFF0F0', justifyContent:'center', alignItems:'center', marginRight:12,
  },
  userAvatarText: { color:'#CC0000', fontWeight:'800', fontSize:16 },
  userInfo: { flex:1 },
  userName: { color:'#1A1A1A', fontWeight:'700', fontSize:14 },
  userEmail: { color:'#999', fontSize:12, marginTop:1 },
  otherSlotText: { color:'#F59E0B', fontSize:12, marginTop:1 },
  removeBtn: {
    backgroundColor:'#FFF0F0', borderRadius:10, paddingHorizontal:12,
    paddingVertical:7, borderWidth:1, borderColor:'#FFCCCC',
  },
  removeBtnText: { color:'#CC0000', fontWeight:'700', fontSize:12 },
  addBtn: {
    backgroundColor:'#F0FFF4', borderRadius:10, paddingHorizontal:12,
    paddingVertical:7, borderWidth:1, borderColor:'#C6F6D5',
  },
  addBtnText: { color:'#22C55E', fontWeight:'700', fontSize:12 },

  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.45)', justifyContent:'center', alignItems:'center', padding:32 },
  modalCard: { backgroundColor:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:380, alignItems:'center' },
  modalTitle: { color:'#1A1A1A', fontSize:18, fontWeight:'900', marginBottom:10 },
  modalBody: { color:'#888', fontSize:14, lineHeight:20, textAlign:'center', marginBottom:24 },
  modalActions: { flexDirection:'row', gap:12, width:'100%' },
  modalCancelBtn: {
    flex:1, paddingVertical:13, borderRadius:12, alignItems:'center',
    backgroundColor:'#F5F5F5', borderWidth:1, borderColor:'#E0E0E0',
  },
  modalCancelText: { color:'#888', fontWeight:'700', fontSize:15 },
  modalConfirmBtn: { flex:1, paddingVertical:13, borderRadius:12, alignItems:'center', backgroundColor:'#CC0000' },
  modalConfirmText: { color:'#fff', fontWeight:'800', fontSize:15 },
});
