# 🏨 Pousada Sesmarias - Sistema de Gestão Hoteleira

Uma solução moderna e robusta para automatizar a gestão de reservas, hospedagens e controle administrativo de pousadas e hotéis.

---

## 🎯 Sobre o Projeto

O **Pousada Sesmarias** foi desenvolvido para simplificar a operação diária de meios de hospedagem. O sistema centraliza o controle de quartos, fluxo de hóspedes e rotinas administrativas em uma plataforma rápida, segura e fácil de usar.

---

## 🚀 Principais Funcionalidades

- **Gestão de Reservas & Acomodações:** Controle sobre disponibilidade de quartos, check-in e check-out.
- **Autenticação Segura:** Acesso restrito com controle de permissões usando criptografia avançada.
- **Painel Administrativo:** Interface preparada para relatórios e gestão operacional diária.
- **Infraestrutura Escalável:** Arquitetura containerizada com Docker, garantindo alta disponibilidade e facilidade na implantação.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js, TypeScript, Express
- **Banco de Dados & ORM:** PostgreSQL, Prisma ORM
- **Segurança & Autenticação:** JWT (JSON Web Tokens), Argon2
- **Validação de Dados:** Zod
- **Containerização:** Docker, Docker Compose

---

## ⚙️ Como Executar o Projeto

### Pré-requisitos
- Node.js (v18+)
- Docker & Docker Compose

### Instalação

1. Clonar o repositório:
   git clone https://github.com/seu-usuario/pousada-sesmarias.git
   cd pousada-sesmarias

2. Configurar as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:
   DATABASE_URL="postgresql://user:password@localhost:5432/pousada_db"
   JWT_SECRET="sua_chave_secreta"
   PORT=3000

3. Iniciar o banco de dados via Docker:
   docker-compose up -d

4. Executar as migrações do banco:
   npx prisma migrate dev

5. Iniciar o servidor de desenvolvimento:
   npm run dev

---

## 📩 Contato e Suporte

Desenvolvido para solução sob medida e gestão de hospedagem.

- **Desenvolvedor:** Ravi Palini
- **E-mail:** ravippmagalhaes@gmail.com
