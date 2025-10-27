# Sistema de Gestão de Clientes

Sistema web para gestão de clientes usando Firebase como backend.

## Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3 (Tailwind CSS), JavaScript ES6+
- **Backend**: Firebase (Firestore, Authentication)
- **Ferramentas**: Node.js, Neon, Python

## Estrutura do Projeto

```
Gestão_Clientes/
├── index.html          # Página principal da aplicação
├── package.json        # Configurações do Node.js
├── README.md          # Este arquivo
└── assets/            # Recursos estáticos (futuro)
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
- **Versão de Teste**: http://localhost:8080/test.html

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

## Desenvolvido por

Sistema criado para o curso SENAI - Bar & Restaurante