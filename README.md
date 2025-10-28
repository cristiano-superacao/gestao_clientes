# Sistema de Gestão de Clientes

Sistema web para gestão de clientes usando Firebase como backend.

## Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3 (Tailwind CSS), JavaScript ES6+
- **Backend**: Firebase (Firestore, Authentication)
- **Ferramentas**: Node.js, Neon, Python

## Estrutura do Projeto

```
Gestão_Clientes/
├── index.html              # Página principal (original)
├── index-optimized.html    # Página principal otimizada
├── test.html              # Página de teste (original)
├── test-optimized.html    # Página de teste otimizada
├── package.json           # Configurações do Node.js
├── README.md             # Este arquivo
└── assets/               # Recursos estáticos
    ├── css/
    │   └── styles.css    # Estilos personalizados
    ├── js/
    │   └── client-manager.js  # Lógica modularizada
    └── README.md
```

## Funcionalidades

✅ **Autenticação Firebase**
- Login anônimo ou com token personalizado
- Gerenciamento de estado de usuário

✅ **Perfil do Usuário**  
- Carregamento e salvamento de dados do perfil
- Informações de nome e empresa

✅ **Gestão de Clientes**
- Listagem em tempo real de clientes
- Interface responsiva e moderna

## Como Executar

### 📱 **Teste Local (Recomendado)**
```bash
npm run test
# Depois abra: http://localhost:8080/test.html
```

### 🚀 **Servidor de Desenvolvimento**
```bash
npm start              # Servidor Python simples
npm run dev           # Live-server com hot reload
```

### 🌐 **Acesso Direto**
- **Página Principal**: http://localhost:8080/index.html
- **Versão Otimizada**: http://localhost:8080/index-optimized.html
- **Página de Teste**: http://localhost:8080/test.html
- **Teste Otimizado**: http://localhost:8080/test-optimized.html

## Configuração do Firebase

A aplicação espera que as seguintes variáveis globais estejam disponíveis:
- `__app_id`: ID da aplicação
- `__firebase_config`: Configuração do Firebase (JSON string)  
- `__initial_auth_token`: Token de autenticação inicial (opcional)

## Estrutura de Dados no Firestore

```
artifacts/
  └── {appId}/
      ├── users/
      │   └── {userId}/
      │       └── profile/
      │           └── data  # Dados do perfil do usuário
      └── public/
          └── data/
              └── clients/  # Coleção de clientes
```

## 🔧 **Melhorias Implementadas**

### ✅ **Otimizações de Código**
- Eliminação de duplicações de JavaScript
- Código modularizado em `client-manager.js`
- CSS personalizado organizado em arquivo separado
- Correção de erros tipográficos

### ✅ **Melhorias de Performance**
- Scripts npm otimizados (remoção de duplicatas)
- Carregamento modular de JavaScript
- CSS customizado para reduzir dependência do Tailwind

### ✅ **Acessibilidade Aprimorada**
- Semântica HTML melhorada
- ARIA labels e roles adicionados
- Melhores contrastes de cores
- Suporte a screen readers

### ✅ **Estrutura Organizada**
- Separação de responsabilidades
- Arquitetura modular
- Documentação melhorada
- Versionamento de arquivos

## Desenvolvido por

Sistema criado para o curso SENAI - Bar & Restaurante