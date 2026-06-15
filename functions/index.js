const functions = require('firebase-functions/v1');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();

/**
 * deleteUserAccount (v1 — Cloud Functions 1ª geração)
 *
 * Usa v1 porque Cloud Functions v2 roda no Cloud Run, que exige
 * autenticação IAM adicional e bloqueia chamadas de httpsCallable.
 * Com v1, o Firebase Auth token enviado pelo app é suficiente.
 *
 * Função que:
 * 1. Verifica que o chamador está autenticado e é admin
 * 2. Deleta a conta do Firebase Auth (libera o e-mail para reutilização)
 * 3. Deleta o documento do Firestore /users/{uid}
 *
 * Importante: excluir APENAS pelo Firestore (console/banco) NÃO libera
 * o e-mail, pois o Firebase Auth é um sistema separado. Sempre use
 * esta função para exclusão completa.
 */
exports.deleteUserAccount = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    // ── 1. Verificar autenticação ──
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Você precisa estar autenticado para realizar esta ação.'
      );
    }

    const callerUid = context.auth.uid;
    console.log(`[deleteUserAccount] Chamado por: ${callerUid}`);

    // ── 2. Extrair e validar UID do alvo ──
    const targetUid = data?.uid;
    if (!targetUid || typeof targetUid !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'UID do usuário alvo é obrigatório e deve ser uma string.'
      );
    }

    // Validação de formato do UID
    if (targetUid.length > 128 || !/^[a-zA-Z0-9]+$/.test(targetUid)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'UID do usuário alvo possui formato inválido.'
      );
    }

    if (targetUid === callerUid) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Você não pode excluir sua própria conta.'
      );
    }

    console.log(JSON.stringify({
      action: 'deleteUserAccount',
      caller: callerUid,
      target: targetUid,
      timestamp: new Date().toISOString(),
    }));

    const db = getFirestore();

    // ── 3. Verificar que o chamador é admin ──
    let callerDoc;
    try {
      callerDoc = await db.collection('users').doc(callerUid).get();
    } catch (err) {
      console.error('[deleteUserAccount] Erro ao buscar documento do chamador:', err);
      throw new functions.https.HttpsError(
        'internal',
        'Erro ao verificar permissões do administrador.'
      );
    }

    if (!callerDoc.exists) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Seu documento de usuário não foi encontrado. Contate o suporte.'
      );
    }

    const callerRole = callerDoc.data()?.role;
    if (callerRole !== 'admin') {
      console.warn(`[deleteUserAccount] Usuário ${callerUid} tentou excluir sem ser admin (role: ${callerRole})`);
      throw new functions.https.HttpsError(
        'permission-denied',
        'Apenas administradores podem excluir usuários.'
      );
    }

    // ── 4. Deletar do Firebase Auth (libera o e-mail) ──
    let authDeleted = false;
    try {
      await getAuth().deleteUser(targetUid);
      authDeleted = true;
      console.log(`[deleteUserAccount] Auth deletado para: ${targetUid}`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        console.warn(`[deleteUserAccount] Usuário ${targetUid} não encontrado no Auth (já removido). Continuando...`);
        authDeleted = true;
      } else {
        console.error('[deleteUserAccount] Erro ao excluir do Auth:', err.code, err.message);
        throw new functions.https.HttpsError(
          'internal',
          `Erro ao excluir conta de autenticação: ${err.message}`
        );
      }
    }

    // ── 5. Deletar documento do Firestore ──
    try {
      await db.collection('users').doc(targetUid).delete();
      console.log(`[deleteUserAccount] Documento Firestore deletado para: ${targetUid}`);
    } catch (err) {
      console.error('[deleteUserAccount] Erro ao excluir documento do Firestore:', err);
      throw new functions.https.HttpsError(
        'internal',
        'A conta de autenticação foi removida, mas houve erro ao excluir os dados do Firestore. Tente novamente.'
      );
    }

    console.log(`[deleteUserAccount] Exclusão completa de ${targetUid} realizada com sucesso.`);

    return {
      success: true,
      authDeleted,
      message: 'Usuário excluído com sucesso. E-mail liberado para reutilização.',
    };
  });
