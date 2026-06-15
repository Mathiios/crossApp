/**
 * Testes de Sistema — Verificações de Segurança
 *
 * Testa end-to-end:
 * - XSS é sanitizado em inputs
 * - Senha fraca é rejeitada no registro
 * - E-mail inválido é rejeitado
 * - Role inválido é rejeitado no Admin
 * - Rate limiting funciona no login
 * - Cloud Function valida inputs
 */

// Setup mocks
require('../setup');

import {
  validateEmail,
  validatePassword,
  validateName,
  validateUID,
  validateRole,
  sanitizeText,
  CONSTANTS,
} from '../../src/utils/inputValidation';

// ════════════════════════════════════════════
//  Proteção contra XSS
// ════════════════════════════════════════════

describe('Sistema Segurança — Proteção XSS', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    'javascript:alert(document.cookie)',
    '<div onmouseover=alert(1)>hover</div>',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
    '<iframe src="javascript:alert(1)">',
    '<body onload=alert(1)>',
    '<input onfocus=alert(1) autofocus>',
    '<a href="javascript:alert(1)">click</a>',
  ];

  test.each(xssPayloads)('sanitizeText neutraliza payload: %s', (payload) => {
    const result = sanitizeText(payload);
    expect(result).not.toContain('<script');
    expect(result).not.toContain('</script>');
    expect(result).not.toContain('onerror=');
    expect(result).not.toContain('onload=');
    expect(result).not.toContain('onmouseover=');
    expect(result).not.toContain('onfocus=');
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('<svg');
  });

  test('nome com XSS é rejeitado na validação', () => {
    const result = validateName('<script>alert("xss")</script>');
    expect(result.valid).toBe(false);
  });

  test('texto normal passa pela sanitização sem alteração', () => {
    const normal = '10 Burpees\n400m Corrida\nThrusters 43kg';
    expect(sanitizeText(normal)).toBe(normal);
  });

  test('texto com acentos PT-BR passa normalmente', () => {
    const text = 'João fez três séries de agachamento com barra olímpica';
    expect(sanitizeText(text)).toBe(text);
  });
});

// ════════════════════════════════════════════
//  Política de Senha
// ════════════════════════════════════════════

describe('Sistema Segurança — Política de Senha', () => {
  test('rejeita senhas comuns/fracas', () => {
    const weakPasswords = [
      '123456',
      'password',
      'abc123',
      'qwerty',
      '12345678',
      'senha123',
    ];

    weakPasswords.forEach((pwd) => {
      const result = validatePassword(pwd);
      expect(result.valid).toBe(false);
    });
  });

  test('aceita senhas fortes', () => {
    const strongPasswords = [
      'MyStr0ngP@ss',
      'C0mpl3xPassword',
      'CrossFit2024A',
      'Tr3ino#Hoje',
    ];

    strongPasswords.forEach((pwd) => {
      const result = validatePassword(pwd);
      expect(result.valid).toBe(true);
    });
  });

  test('exige mínimo de 8 caracteres', () => {
    expect(validatePassword('Ab1').valid).toBe(false);
    expect(validatePassword('Abcdef1').valid).toBe(false);
    expect(validatePassword('Abcdefg1').valid).toBe(true);
  });

  test('exige ao menos 1 maiúscula, 1 minúscula e 1 número', () => {
    expect(validatePassword('abcdefg1').valid).toBe(false); // sem maiúscula
    expect(validatePassword('ABCDEFG1').valid).toBe(false); // sem minúscula
    expect(validatePassword('Abcdefgh').valid).toBe(false); // sem número
    expect(validatePassword('Abcdefg1').valid).toBe(true);  // OK
  });
});

// ════════════════════════════════════════════
//  Validação de E-mail
// ════════════════════════════════════════════

describe('Sistema Segurança — Validação de E-mail', () => {
  test('rejeita payloads de SQL injection em e-mail', () => {
    const sqlPayloads = [
      "admin'--@test.com",
      'user@test.com; DROP TABLE users;',
      "' OR 1=1 --@test.com",
    ];

    sqlPayloads.forEach((payload) => {
      const result = validateEmail(payload);
      expect(result.valid).toBe(false);
    });
  });

  test('rejeita e-mails com espaços', () => {
    expect(validateEmail('user @test.com').valid).toBe(false);
    expect(validateEmail('user@ test.com').valid).toBe(false);
  });

  test('aceita e-mails válidos de diferentes domínios', () => {
    expect(validateEmail('user@gmail.com').valid).toBe(true);
    expect(validateEmail('user@hotmail.com').valid).toBe(true);
    expect(validateEmail('user@university.edu.br').valid).toBe(true);
    expect(validateEmail('user.name@company.co').valid).toBe(true);
  });
});

// ════════════════════════════════════════════
//  Validação de Role
// ════════════════════════════════════════════

describe('Sistema Segurança — Validação de Role (AdminScreen)', () => {
  test('rejeita tentativa de escalação de privilégio', () => {
    const escalationAttempts = [
      'superadmin',
      'root',
      'administrator',
      'sudo',
      'Admin',       // case-sensitive
      'ADMIN',
      'admin; DROP TABLE users;',
    ];

    escalationAttempts.forEach((role) => {
      const result = validateRole(role);
      expect(result.valid).toBe(false);
    });
  });

  test('aceita apenas os 3 roles definidos', () => {
    expect(CONSTANTS.VALID_ROLES).toEqual(['aluno', 'professor', 'admin']);
    expect(CONSTANTS.VALID_ROLES.length).toBe(3);
  });
});

// ════════════════════════════════════════════
//  Validação de UID (Cloud Function)
// ════════════════════════════════════════════

describe('Sistema Segurança — Validação de UID', () => {
  test('rejeita path traversal no UID', () => {
    const traversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32',
      './users/admin',
    ];

    traversalPayloads.forEach((uid) => {
      expect(validateUID(uid).valid).toBe(false);
    });
  });

  test('rejeita injection no UID', () => {
    const injectionPayloads = [
      'uid; rm -rf /',
      'uid && cat /etc/shadow',
      '$(whoami)',
      '`id`',
      'uid | cat /etc/passwd',
    ];

    injectionPayloads.forEach((uid) => {
      expect(validateUID(uid).valid).toBe(false);
    });
  });

  test('aceita UID alfanumérico válido do Firebase', () => {
    expect(validateUID('abc123XYZ').valid).toBe(true);
    expect(validateUID('aBcDeFgHiJkLmNoPqRsTuVwXyZ123').valid).toBe(true);
  });

  test('rejeita UID vazio ou nulo', () => {
    expect(validateUID('').valid).toBe(false);
    expect(validateUID(null).valid).toBe(false);
    expect(validateUID(undefined).valid).toBe(false);
  });
});

// ════════════════════════════════════════════
//  Limitação de tamanho de texto
// ════════════════════════════════════════════

describe('Sistema Segurança — Limites de Input', () => {
  test('sanitizeText limita texto a 5000 caracteres', () => {
    const hugeText = 'A'.repeat(10000);
    const result = sanitizeText(hugeText);
    expect(result.length).toBeLessThanOrEqual(CONSTANTS.TEXT_MAX_LENGTH);
  });

  test('nome limitado a 100 caracteres', () => {
    const longName = 'A'.repeat(101);
    expect(validateName(longName).valid).toBe(false);

    const okName = 'A'.repeat(100);
    expect(validateName(okName).valid).toBe(true);
  });

  test('e-mail limitado a 254 caracteres', () => {
    const longEmail = 'a'.repeat(250) + '@b.com';
    expect(validateEmail(longEmail).valid).toBe(false);
  });

  test('senha limitada a 128 caracteres', () => {
    const longPwd = 'Aa1' + 'x'.repeat(130);
    expect(validatePassword(longPwd).valid).toBe(false);
  });
});

// ════════════════════════════════════════════
//  Firestore Rules existem
// ════════════════════════════════════════════

describe('Sistema Segurança — Infraestrutura', () => {
  test('firestore.rules existe no projeto', () => {
    const fs = require('fs');
    const path = require('path');
    const rulesPath = path.join(__dirname, '../../firestore.rules');
    expect(fs.existsSync(rulesPath)).toBe(true);
  });

  test('firestore.rules contém regras para users, wods e checkins', () => {
    const fs = require('fs');
    const path = require('path');
    const rulesPath = path.join(__dirname, '../../firestore.rules');
    const content = fs.readFileSync(rulesPath, 'utf-8');

    expect(content).toContain('match /users/{userId}');
    expect(content).toContain('match /wods/{wodId}');
    expect(content).toContain('match /checkins/{checkinId}');
    expect(content).toContain('request.auth != null');
  });

  test('firestore.rules bloqueia exclusão direta de usuários', () => {
    const fs = require('fs');
    const path = require('path');
    const rulesPath = path.join(__dirname, '../../firestore.rules');
    const content = fs.readFileSync(rulesPath, 'utf-8');

    expect(content).toContain('allow delete: if false');
  });

  test('.gitignore existe e exclui arquivos sensíveis', () => {
    const fs = require('fs');
    const path = require('path');
    const gitignorePath = path.join(__dirname, '../../.gitignore');
    const content = fs.readFileSync(gitignorePath, 'utf-8');

    expect(content).toContain('node_modules/');
    expect(content).toContain('.env');
    expect(content).toContain('google-services.json');
    expect(content).toContain('GoogleService-Info.plist');
  });

  test('firebase.json referencia firestore.rules', () => {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(__dirname, '../../firebase.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    expect(config.firestore).toBeDefined();
    expect(config.firestore.rules).toBe('firestore.rules');
  });
});
