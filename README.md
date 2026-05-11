# crossApp 🏋️

**Seu Box de CrossFit no Bolso** — App multiplataforma (iOS, Android e Web) construído com React Native + Expo + Firebase.

---

## 🚀 Como rodar o projeto

### 1. Pré-requisitos

- **Node.js** (LTS): https://nodejs.org
- **Expo Go** no celular: https://expo.dev/client (para testar no celular)
- **Conta Firebase**: https://console.firebase.google.com

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar Firebase

Edite o arquivo `src/config/firebase.js` com suas credenciais:

```js
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID",
};
```

> **Como obter:** Firebase Console → Seu Projeto → ⚙️ Configurações → Geral → Seus aplicativos → SDK

### 4. Ativar autenticação no Firebase

Firebase Console → **Authentication** → **Sign-in method** → Ativar **E-mail/senha**

### 5. Rodar o app

```bash
# Iniciar o servidor de desenvolvimento
npx expo start

# Ou diretamente por plataforma:
npx expo start --android
npx expo start --ios
npx expo start --web
```

---

## 📁 Estrutura do projeto

```
crossApp/
├── App.js                          # Ponto de entrada
├── app.json                        # Config Expo
├── package.json                    # Dependências
├── babel.config.js                 # Config Babel
└── src/
    ├── config/
    │   └── firebase.js             # 🔥 Config Firebase
    ├── context/
    │   └── AuthContext.js          # Auth state global
    ├── navigation/
    │   ├── RootNavigator.js        # Roteamento auth/main
    │   ├── AuthNavigator.js        # Stack: Login/Cadastro
    │   └── MainNavigator.js        # Bottom Tabs principal
    └── screens/
        ├── auth/
        │   ├── LoginScreen.js      # Tela de login
        │   ├── RegisterScreen.js   # Tela de cadastro
        │   └── ForgotPasswordScreen.js
        └── main/
            ├── HomeScreen.js       # Tela principal (WOD + próxima aula)
            ├── WODScreen.js        # WOD detalhado
            ├── CheckinScreen.js    # Agendamento de aulas
            ├── RankingScreen.js    # Ranking em tempo real
            └── ProfileScreen.js    # Perfil do atleta
```

---

## 📱 Funcionalidades

| Tela | Descrição |
|------|-----------|
| **Splash / Loading** | Tela animada enquanto verifica auth |
| **Login** | E-mail + senha com Firebase Auth |
| **Cadastro** | Criar conta com validação |
| **Esqueci a senha** | Reset via e-mail Firebase |
| **Home** | WOD do dia + próxima aula + acesso rápido |
| **WOD** | Detalhes do treino (Warm-up, Metcon, RX) |
| **Agendar Aula** | Check-in em horários disponíveis |
| **Ranking** | Pódio + lista de atletas em tempo real |
| **Perfil** | Dados do usuário + estatísticas |

---

## 🛠️ Stack Tecnológica

- **React Native** com **Expo** (SDK 51) — multiplataforma
- **Firebase Auth** — autenticação email/senha
- **React Navigation v6** — navegação (Stack + Bottom Tabs)
- **Expo Linear Gradient** — gradientes premium
- **AsyncStorage** — persistência da sessão

---

## ⚡ Próximos passos sugeridos

- [ ] Integrar **Firestore** para dados reais de WOD e ranking
- [ ] Adicionar **push notifications** com Expo Notifications
- [ ] Implementar **social login** (Google, Facebook)
- [ ] Criar painel **admin** para gerenciar WODs
- [ ] Adicionar **histórico de treinos** do atleta
