const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp }       = require('firebase-admin/app');
const { getAuth }             = require('firebase-admin/auth');
const { getFirestore }        = require('firebase-admin/firestore');

initializeApp();

/**
 * deleteUserAccount
 *
 * Callable function que:
 * 1. Verifica que o chamador está autenticado e é admin
 * 2. Deleta a conta do Firebase Auth (libera o e-mail para reutilização)
 * 3. Deleta o documento do Firestore /users/{uid}
 */
exports.deleteUserAccount = onCall(async (request) => {
  // ── 1. Verificar autenticação ──
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Voce precisa estar autenticado.');
  }

  const callerUid = request.auth.uid;
  const db        = getFirestore();

  // ── 2. Verificar que o chamador é admin ──
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
    throw new HttpsError(
      'permission-denied',
      'Apenas administradores podem excluir usuarios.'
    );
  }

  const { uid } = request.data;

  if (!uid) {
    throw new HttpsError('invalid-argument', 'UID do usuario e obrigatorio.');
  }
  if (uid === callerUid) {
    throw new HttpsError('invalid-argument', 'Voce nao pode excluir sua propria conta.');
  }

  // ── 3. Deletar do Firebase Auth (libera o e-mail) ──
  try {
    await getAuth().deleteUser(uid);
  } catch (err) {
    // Se o usuário já não existia no Auth, continua mesmo assim
    if (err.code !== 'auth/user-not-found') {
      throw new HttpsError('internal', `Erro ao excluir autenticacao: ${err.message}`);
    }
  }

  // ── 4. Deletar do Firestore ──
  await db.collection('users').doc(uid).delete();

  return { success: true, message: 'Usuario excluido com sucesso.' };
});
