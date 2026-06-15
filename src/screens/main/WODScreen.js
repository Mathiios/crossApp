import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Modal, SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getTodayKey, formatDateBR } from '../../utils/dateUtils';
import { sanitizeText } from '../../utils/inputValidation';

// Funções de data agora vêm de dateUtils.js

const EMPTY_WOD = { warmup: '', metcon: '', rx: '', notas: '' };

export default function WODScreen() {
  const { canManageWOD } = useAuth();
  const [wod, setWod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(EMPTY_WOD);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const todayKey = getTodayKey();

  useEffect(() => {
    setLoading(true);
    const wodRef = doc(db, 'wods', todayKey);
    const timeout = setTimeout(() => setLoading(false), 10000);
    const unsub = onSnapshot(wodRef,
      (snap) => {
        clearTimeout(timeout);
        if (snap.exists()) {
          const data = snap.data();
          setWod(data);
          setForm(data);
        } else {
          setWod(null);
          setForm(EMPTY_WOD);
        }
        setLoading(false);
      },
      (err) => {
        clearTimeout(timeout);
        setLoading(false);
        setWod(null);
        setForm(EMPTY_WOD);
      }
    );
    return () => { clearTimeout(timeout); unsub(); };
  }, [todayKey]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleSave = async () => {
    if (!form.warmup && !form.metcon && !form.rx) {
      showMessage('Preencha pelo menos um campo do treino.', 'error');
      return;
    }
    setSaving(true);
    try {
      const wodRef = doc(db, 'wods', todayKey);
      await setDoc(wodRef, {
        warmup: sanitizeText(form.warmup),
        metcon: sanitizeText(form.metcon),
        rx: sanitizeText(form.rx),
        notas: sanitizeText(form.notas),
        updatedAt: new Date().toISOString(),
      });
      setEditMode(false);
      showMessage('Treino salvo com sucesso!');
    } catch (err) {
      showMessage('Erro ao salvar. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(wod || EMPTY_WOD);
    setEditMode(false);
  };

  const confirmDeleteWOD = async () => {
    setConfirmDelete(false);
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'wods', todayKey));
      showMessage('Treino excluído com sucesso.');
    } catch (err) {
      showMessage('Erro ao excluir. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#CC0000" />
          <Text style={styles.loadingText}>Carregando treino...</Text>
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
            <Text style={styles.headerTitle}>WOD</Text>
            <Text style={styles.headerDate}>{formatDateBR(todayKey)}</Text>
          </View>
          <View style={styles.headerActions}>
            {canManageWOD && wod && !editMode && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => setConfirmDelete(true)}
                disabled={saving}
              >
                <Text style={styles.deleteBtnText}>Excluir</Text>
              </TouchableOpacity>
            )}
            {canManageWOD && (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setEditMode(!editMode)}
              >
                <Text style={styles.editBtnText}>{editMode ? 'Fechar' : 'Editar'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Mensagem feedback */}
        {message.text ? (
          <View style={[styles.messageBanner, message.type === 'error' && styles.messageBannerError]}>
            <Text style={[styles.messageText, message.type === 'error' && styles.messageTextError]}>{message.text}</Text>
          </View>
        ) : null}

        {/* MODO EDIÇÃO */}
        {editMode ? (
          <View style={styles.editCard}>
            <Text style={styles.editCardTitle}>Editar Treino de Hoje</Text>
            <Text style={styles.editHint}>
              Use uma linha por exercício. Ex:{'\n'}10 Burpees{'\n'}400m Corrida
            </Text>

            <Text style={styles.fieldLabel}>Warm-up</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder={'Ex:\n400m corrida\n10 Squats\n10 Push-ups'}
              placeholderTextColor="#BBBBBB"
              value={form.warmup}
              onChangeText={(v) => setForm(f => ({ ...f, warmup: v }))}
            />

            <Text style={styles.fieldLabel}>METCON / WOD</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder={'Ex:\n21-15-9\nThrusters 43kg\nPull-ups'}
              placeholderTextColor="#BBBBBB"
              value={form.metcon}
              onChangeText={(v) => setForm(f => ({ ...f, metcon: v }))}
            />

            <Text style={styles.fieldLabel}>RX / Cargas</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={3}
              placeholder={'Ex:\n43kg Barbell\nRing Muscle-ups'}
              placeholderTextColor="#BBBBBB"
              value={form.rx}
              onChangeText={(v) => setForm(f => ({ ...f, rx: v }))}
            />

            <Text style={styles.fieldLabel}>Notas do Personal</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={3}
              placeholder="Dicas, observações e orientações para hoje..."
              placeholderTextColor="#BBBBBB"
              value={form.notas}
              onChangeText={(v) => setForm(f => ({ ...f, notas: v }))}
            />

            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>Salvar Treino</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {!wod ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Treino não cadastrado</Text>
                <Text style={styles.emptyText}>Nenhum WOD foi registrado para hoje ainda.</Text>
                {canManageWOD && (
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => setEditMode(true)}>
                    <Text style={styles.emptyBtnText}>+ Adicionar Treino</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                {/* WOD Header Card */}
                <View style={styles.wodHeaderCard}>
                  <Text style={styles.wodHeaderLabel}>WOD - Quarta, 25/10/2023</Text>
                </View>

                {/* Warm-up */}
                {!!wod.warmup && (
                  <View style={styles.block}>
                    <Text style={styles.blockTitle}>1. WARM-UP</Text>
                    {wod.warmup.split('\n').filter(Boolean).map((item, i) => (
                      <View key={i} style={styles.listItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.listItemText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* METCON */}
                {!!wod.metcon && (
                  <View style={styles.block}>
                    <Text style={styles.blockTitle}>2. METCON</Text>
                    {wod.metcon.split('\n').filter(Boolean).map((item, i) => (
                      <View key={i} style={styles.listItem}>
                        <View style={[styles.bullet, { backgroundColor: '#CC0000' }]} />
                        <Text style={styles.listItemText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* RX */}
                {!!wod.rx && (
                  <View style={styles.block}>
                    <Text style={styles.blockTitle}>RX / CARGAS</Text>
                    {wod.rx.split('\n').filter(Boolean).map((item, i) => (
                      <View key={i} style={styles.listItem}>
                        <View style={[styles.bullet, { backgroundColor: '#3B82F6' }]} />
                        <Text style={styles.listItemText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Notas */}
                {!!wod.notas && (
                  <View style={styles.notesBlock}>
                    <Text style={styles.notesTitle}>Notas do Personal</Text>
                    <Text style={styles.notesText}>{wod.notas}</Text>
                  </View>
                )}

                {/* Confirmar Participação */}
                <TouchableOpacity style={styles.confirmBtn}>
                  <Text style={styles.confirmBtnText}>Confirmar Participacao</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de confirmação de exclusão */}
      <Modal transparent animationType="fade" visible={confirmDelete} onRequestClose={() => setConfirmDelete(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Excluir Treino</Text>
            <Text style={styles.modalBody}>
              Tem certeza que deseja excluir o treino de hoje? Esta ação não pode ser desfeita.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setConfirmDelete(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmDeleteWOD}>
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', marginTop: 12, fontSize: 14 },

  // Header
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#1A1A1A', fontSize: 26, fontWeight: '900' },
  headerDate: { color: '#888', fontSize: 13, marginTop: 4 },
  deleteBtn: {
    backgroundColor: '#FFF0F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  deleteBtnText: { color: '#CC0000', fontWeight: '700', fontSize: 13 },
  editBtn: {
    backgroundColor: '#CC0000',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Message
  messageBanner: {
    backgroundColor: '#F0FFF4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  messageBannerError: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FFCCCC',
  },
  messageText: { color: '#16A34A', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  messageTextError: { color: '#CC0000' },

  // Edit mode
  editCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  editCardTitle: { color: '#1A1A1A', fontSize: 17, fontWeight: '800', marginBottom: 8 },
  editHint: { color: '#999', fontSize: 12, marginBottom: 20, lineHeight: 18 },
  fieldLabel: { color: '#555', fontWeight: '700', fontSize: 13, marginBottom: 8, marginTop: 4 },
  textArea: {
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    padding: 14,
    color: '#1A1A1A',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 16,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0',
  },
  cancelBtnText: { color: '#888', fontWeight: '700' },
  saveBtn: { flex: 2, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: '#CC0000' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // View mode
  wodHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  wodHeaderLabel: { color: '#888', fontSize: 13, fontWeight: '600' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  emptyTitle: { color: '#1A1A1A', fontSize: 17, fontWeight: '800', marginBottom: 8 },
  emptyText: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn: { backgroundColor: '#CC0000', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '800' },
  block: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  blockTitle: { color: '#1A1A1A', fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' },
  listItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bullet: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#888', marginRight: 12, flexShrink: 0,
  },
  listItemText: { color: '#444', fontSize: 14, flex: 1, lineHeight: 20 },
  notesBlock: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  notesTitle: { color: '#888', fontWeight: '700', fontSize: 13, marginBottom: 8 },
  notesText: { color: '#444', fontSize: 14, lineHeight: 22 },
  confirmBtn: {
    backgroundColor: '#CC0000',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#CC0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380, alignItems: 'center' },
  modalTitle: { color: '#1A1A1A', fontSize: 18, fontWeight: '900', marginBottom: 10 },
  modalBody: { color: '#888', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  modalCancelText: { color: '#888', fontWeight: '700', fontSize: 15 },
  modalConfirmBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: '#CC0000' },
  modalConfirmText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
