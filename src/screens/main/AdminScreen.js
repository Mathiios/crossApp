import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, SafeAreaView,
} from 'react-native';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
  { key: 'aluno',     label: 'Aluno',        color: '#3B82F6' },
  { key: 'professor', label: 'Professor',     color: '#F59E0B' },
  { key: 'admin',     label: 'Admin',         color: '#CC0000' },
];

export default function AdminScreen() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState(null);
  const [message, setMessage]       = useState({ text: '', type: '' });
  const [pendingDelete, setPendingDelete] = useState(null); // { uid, name }

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        // Filtra usuários ativos (exclui deletados da lista)
        const list = snap.docs
          .map(d => ({ uid: d.id, ...d.data() }))
          .filter(u => u.status !== 'deleted');
        setUsers(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const changeRole = async (uid, newRole, userName) => {
    if (uid === currentUser.uid) {
      showMsg('Voce nao pode alterar seu proprio role.', 'error');
      return;
    }
    setUpdating(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      const roleLabel = ROLES.find(r => r.key === newRole)?.label;
      showMsg(`${userName} agora e ${roleLabel}`);
    } catch(e) {
      showMsg(`Erro: ${e.code}`, 'error');
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = (uid, userName) => {
    if (uid === currentUser.uid) {
      showMsg('Voce nao pode excluir sua propria conta.', 'error');
      return;
    }
    setPendingDelete({ uid, name: userName });
  };

  // Chama a Cloud Function que deleta do Firebase Auth (libera o e-mail)
  // E também deleta o documento do Firestore
  const confirmDeleteUser = async () => {
    if (!pendingDelete) return;
    const { uid, name } = pendingDelete;
    setPendingDelete(null);
    setUpdating(uid);
    try {
      const deleteFn = httpsCallable(functions, 'deleteUserAccount');
      await deleteFn({ uid });
      showMsg(`${name} foi excluido. E-mail liberado para reutilizacao.`);
    } catch(e) {
      const msg = e?.message || e?.code || 'Erro desconhecido';
      showMsg(`Erro: ${msg}`, 'error');
    } finally {
      setUpdating(null);
    }
  };

  const getRoleInfo = (role) => ROLES.find(r => r.key === role) || ROLES[0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Usuarios</Text>
          <Text style={styles.headerSubtitle}>
            {users.length} cadastrado{users.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Legenda de roles */}
        <View style={styles.legendRow}>
          {ROLES.map(r => (
            <View key={r.key} style={[styles.legendItem, { borderColor: r.color }]}>
              <View style={[styles.legendDot, { backgroundColor: r.color }]} />
              <Text style={[styles.legendText, { color: r.color }]}>{r.label}</Text>
            </View>
          ))}
        </View>

        {/* Aviso sobre exclusão */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Como funciona a exclusao</Text>
          <Text style={styles.infoText}>
            Ao excluir um usuario, ele sera removido do banco de dados e desconectado automaticamente do app. Se tentar logar novamente, sera desconectado na hora.
          </Text>
        </View>

        {/* Mensagem */}
        {message.text ? (
          <View style={[styles.msgBanner, message.type === 'error' && styles.msgError]}>
            <Text style={[styles.msgText, message.type === 'error' && { color: '#CC0000' }]}>
              {message.text}
            </Text>
          </View>
        ) : null}

        {/* Lista */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#CC0000" />
          </View>
        ) : users.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum usuario cadastrado.</Text>
        ) : (
          <View style={styles.userList}>
            {users.map((u) => {
              const roleInfo = getRoleInfo(u.role);
              const isSelf    = u.uid === currentUser.uid;
              const isUpdating = updating === u.uid;

              return (
                <View key={u.uid} style={styles.userCard}>
                  {/* Avatar + Info */}
                  <View style={styles.userTop}>
                    <View style={[styles.avatar, { backgroundColor: `${roleInfo.color}20`, borderColor: `${roleInfo.color}60` }]}>
                      <Text style={[styles.avatarText, { color: roleInfo.color }]}>
                        {(u.name || u.email || '?')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <View style={styles.userNameRow}>
                        <Text style={styles.userName}>{u.name || '(sem nome)'}</Text>
                        {isSelf && (
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeText}>Voce</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.userEmail}>{u.email}</Text>
                      <View style={[styles.roleBadge, { backgroundColor: `${roleInfo.color}15`, borderColor: `${roleInfo.color}50` }]}>
                        <Text style={[styles.roleBadgeText, { color: roleInfo.color }]}>
                          {roleInfo.label}
                        </Text>
                      </View>
                    </View>
                    {isUpdating && <ActivityIndicator size="small" color="#CC0000" />}
                  </View>

                  {/* Ações (desabilitado para si mesmo) */}
                  {!isSelf && (
                    <View style={styles.actions}>
                      <Text style={styles.actionsLabel}>Alterar para:</Text>
                      <View style={styles.roleButtonsRow}>
                        {ROLES.filter(r => r.key !== u.role).map(r => (
                          <TouchableOpacity
                            key={r.key}
                            style={[
                              styles.roleBtn,
                              { borderColor: r.color },
                              isUpdating && styles.btnDisabled,
                            ]}
                            onPress={() => changeRole(u.uid, r.key, u.name || u.email)}
                            disabled={isUpdating}
                          >
                            <Text style={[styles.roleBtnText, { color: r.color }]}>
                              {r.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <TouchableOpacity
                        style={[styles.deleteBtn, isUpdating && styles.btnDisabled]}
                        onPress={() => handleDeleteUser(u.uid, u.name || u.email)}
                        disabled={isUpdating}
                      >
                        <Text style={styles.deleteBtnText}>Excluir Usuario</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de confirmação */}
      <Modal
        transparent
        animationType="fade"
        visible={!!pendingDelete}
        onRequestClose={() => setPendingDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Text style={styles.modalIconText}>!</Text>
            </View>
            <Text style={styles.modalTitle}>Excluir Usuario</Text>
            <Text style={styles.modalBody}>
              Tem certeza que deseja excluir "{pendingDelete?.name}"?{'\n\n'}
              O usuario sera removido do banco de dados e desconectado automaticamente. Esta acao nao pode ser desfeita.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPendingDelete(null)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmDeleteUser}
              >
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
  centered: { paddingVertical: 40, alignItems: 'center' },

  header: { paddingTop: 20, paddingBottom: 16 },
  headerTitle: { color: '#1A1A1A', fontSize: 26, fontWeight: '900' },
  headerSubtitle: { color: '#888', fontSize: 13, marginTop: 4 },

  legendRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  legendItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 10, padding: 8, borderWidth: 1,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: '700' },

  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoTitle: { color: '#2563EB', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  infoText: { color: '#3B82F6', fontSize: 12, lineHeight: 18 },

  msgBanner: {
    backgroundColor: '#F0FFF4', borderRadius: 10, padding: 12,
    marginBottom: 12, borderWidth: 1, borderColor: '#C6F6D5',
  },
  msgError: { backgroundColor: '#FFF0F0', borderColor: '#FFCCCC' },
  msgText: { color: '#16A34A', fontSize: 13, fontWeight: '600', textAlign: 'center' },

  emptyText: { color: '#999', textAlign: 'center', marginTop: 40, fontSize: 14 },

  userList: { gap: 12, marginBottom: 20 },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  userTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5,
  },
  avatarText: { fontSize: 20, fontWeight: '800' },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  userName: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  youBadge: {
    backgroundColor: '#EFF6FF', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  youBadgeText: { color: '#3B82F6', fontSize: 10, fontWeight: '700' },
  userEmail: { color: '#888', fontSize: 12, marginBottom: 8 },
  roleBadge: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, alignSelf: 'flex-start',
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700' },

  actions: { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
  actionsLabel: { color: '#999', fontSize: 11, marginBottom: 8 },
  roleButtonsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  roleBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 8,
    alignItems: 'center', borderWidth: 1.5,
    backgroundColor: '#FAFAFA',
  },
  roleBtnText: { fontSize: 12, fontWeight: '700' },
  btnDisabled: { opacity: 0.4 },
  deleteBtn: {
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  deleteBtnText: { color: '#CC0000', fontWeight: '700', fontSize: 13 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    width: '100%', maxWidth: 380, alignItems: 'center',
  },
  modalIconBox: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#FFF0F0', justifyContent: 'center',
    alignItems: 'center', marginBottom: 16,
    borderWidth: 2, borderColor: '#FFCCCC',
  },
  modalIconText: { color: '#CC0000', fontSize: 28, fontWeight: '900' },
  modalTitle: { color: '#1A1A1A', fontSize: 18, fontWeight: '900', marginBottom: 10 },
  modalBody: {
    color: '#888', fontSize: 14, lineHeight: 20,
    textAlign: 'center', marginBottom: 24,
  },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0',
  },
  modalCancelText: { color: '#888', fontWeight: '700', fontSize: 15 },
  modalConfirmBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    alignItems: 'center', backgroundColor: '#CC0000',
  },
  modalConfirmText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
