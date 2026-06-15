const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();

/**
 * deleteUserAccount
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
exports.deleteUserAccount = onCall(
  {
    region: 'us-central1',
    // Permite chamadas autenticadas de qualquer origem (necessário para apps mobile/web)
    cors: true,
    // Cloud Functions v2 roda no Cloud Run que bloqueia requests não-autenticados por padrão.
    // invoker: "public" libera o acesso HTTP, mas a segurança é garantida dentro da função
    // pela verificação de role admin (request.auth).
    invoker: 'public',
  },
  async (request) => {
    // ── 1. Verificar autenticação ──
    const authContext = request.auth;
    if (!authContext || !authContext.uid) {
      throw new HttpsError(
        'unauthenticated',
        'Você precisa estar autenticado para realizar esta ação.'
      );
    }

    const callerUid = authContext.uid;
    console.log(`[deleteUserAccount] Chamado por: ${callerUid}`);

    // ── 2. Extrair e validar UID do alvo ──
    const targetUid = request.data?.uid;
    if (!targetUid || typeof targetUid !== 'string') {
      throw new HttpsError(
        'invalid-argument',
        'UID do usuário alvo é obrigatório e deve ser uma string.'
      );
    }

    // Validação de formato do UID
    if (targetUid.length > 128 || !/^[a-zA-Z0-9]+$/.test(targetUid)) {
      throw new HttpsError(
        'invalid-argument',
        'UID do usuário alvo possui formato inválido.'
      );
    }

    if (targetUid === callerUid) {
      throw new HttpsError(
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
      throw new HttpsError(
        'internal',
        'Erro ao verificar permissões do administrador.'
      );
    }

    if (!callerDoc.exists) {
      throw new HttpsError(
        'permission-denied',
        'Seu documento de usuário não foi encontrado. Contate o suporte.'
      );
    }

    const callerRole = callerDoc.data()?.role;
    if (callerRole !== 'admin') {
      console.warn(`[deleteUserAccount] Usuário ${callerUid} tentou excluir sem ser admin (role: ${callerRole})`);
      throw new HttpsError(
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
        // Usuário já não existia no Auth — ok, continua para limpar Firestore
        console.warn(`[deleteUserAccount] Usuário ${targetUid} não encontrado no Auth (já removido). Continuando...`);
        authDeleted = true; // não é erro, e-mail já está livre
      } else {
        console.error('[deleteUserAccount] Erro ao excluir do Auth:', err.code, err.message);
        throw new HttpsError(
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
      // Auth já foi deletado, mas Firestore falhou — relatar parcialidade
      throw new HttpsError(
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
  }
);
