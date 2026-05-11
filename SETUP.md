# crossApp - Setup Instructions

## 1. Pré-requisitos
- Node.js (LTS): https://nodejs.org
- Expo Go app (para testar no celular): https://expo.dev/client

## 2. Criar o projeto
```bash
npx create-expo-app@latest crossApp --template blank
cd crossApp
```

## 3. Instalar dependências
```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install firebase
npm install expo-linear-gradient
npm install @expo/vector-icons
```

## 4. Rodar
```bash
npx expo start
```
