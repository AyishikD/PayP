# PayP: Payment Platform API

This project is a payment architecture based on UPI architecture, designed to accept payments and send them. It includes core features such as secure user accounts, balance management, transaction logs, and a lockout mechanism for failed login attempts. It provides a great alternative to Razorpay or Stripe for development since it completely works like UPI.
Here is the complete API Endpoint testing: [Postman Results](https://www.postman.com/mission-geologist-4118891/payp/collection/za1hjme/routes-payp). Complete tutorial on how to use it is on: [Article](https://medium.com/@ayishikad/payp-revolutionizing-payment-integration-with-custom-api-b63a6a329b97). Swagger docs is here: [Swagger Link](https://payp.onrender.com/api-docs/)

## **Features**
1. **User Management**: 
   - User registration, login, and secure payment PIN setup.
   - Password reset with account lockout after 5 failed attempts.
   - Pin reset and account lockout after 5 failed attempts.

2. **Payment Transactions**:
   - Dynamic balance management.
   - Viewable transaction history.
   - Transfer and receive payment.

3. **Security**:
   - JWT-based user authentication.
   - Password hashing with bcrypt.
   - 30 mins lockout mechanism for security.

4. **Database**:
   - PostgreSQL used with Supabase configured using Sequelize ORM.

---

## **Installation**
### **1. Clone the repository**
```bash
git clone https://github.com/AyishikD/PayP
cd PayP
```

### **2. Install dependencies**
```bash
npm install
```

### **3. Set up environment variables**
Copy `.env.example` to `.env` and configure at least:
```env
DB_URL=your_postgresql_database_url
JWT_SECRET=your_jwt_secret
```
Optional settings (see `.env.example`): `PORT`, `JWT_EXPIRES_IN` (default `1h`), `TRUST_PROXY` (set to `1` on Render), `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`, `DB_SSL`, `DB_SSL_REJECT_UNAUTHORIZED`.

### **4. Run the project**
```bash
npm start        # runs database migrations, then starts the server
npm run dev      # starts the server with nodemon (run `npm run migrate` first)
```

### **5. Lint and test**
```bash
npm run lint
npm test
```

---

## **Changelog**
### **v6.0.0 (October 2026)**
- **Security fixes**:
  - Payment, product and mandate amounts are validated: negative, zero, non-numeric and over-precise amounts are rejected.
  - Money is stored as `DECIMAL(14,2)` and every balance change runs in a database transaction with row locks.
  - Payment PINs are stored as bcrypt hashes (existing PINs are hashed by the migration).
  - Users can only view their own transaction logs and only manage their own mandates.
  - JWTs expire (default 1 hour); tokens issued by earlier versions are no longer accepted.
  - Login no longer reveals whether an email is registered, and login/register have a stricter rate limit.
- **AutoPay**: the scheduler now runs, debits mandates on their start date and then at each interval, records failed payments, skips missed cycles instead of charging for each, and expires mandates after their end date. Mandates can be paused, resumed and cancelled.
- **Breaking changes**:
  - `POST /auth/forget-password` now changes the logged-in user's password and requires `currentPassword` and `newPassword`.
  - `POST /auth/forget-pin` requires `password` and `newPin` (as documented in Swagger).
  - `POST /payment/pay/{uuid}` requires a bearer token and `paymentPin`; the payer is the logged-in user.
  - Error responses use a `message` field. Locked accounts return `403`; invalid tokens return `401`.
  - Mandate `amount` is required to be a positive number; `startDate` cannot be in the past; `expired` can no longer be set by users.

### **v5.0.0 (January 2025)**
- **New Features**:
  - **Transaction Logs**: Added route to retrieve transaction logs for users (`/payment/logs/{userId}`).
  - **Project Payment**: Added a route for project payment processing (`/payment/projectpay`).
  - **Product Management**: Added routes for adding a product and processing payments for products (`/payment/add`, `/payment/pay/{uuid}`).
  - **Swagger Docs**: Enhanced Swagger documentation for better understanding and testing of new routes.
  
- **Bug Fixes**:
  - Fixed issues with account lockout after multiple failed attempts.
  - Optimized the transaction history retrieval functionality for better performance.

### **v1.0.0 (December 2024)**
- **Initial Release**:
  - User registration, login, and payment PIN setup.
  - Payment transactions and balance management.
  - JWT authentication, bcrypt password hashing.
  - PostgreSQL database setup with Sequelize ORM.

---

## **Development Notes**
### **Dependencies**
- **Express**: Web framework for Node.js.
- **Sequelize**: ORM for PostgreSQL.
- **bcrypt**: Password hashing.
- **JWT**: Secure user authentication.

### **Scripts**
- `npm start`: Runs migrations and starts the server.
- `npm run migrate`: Runs database migrations.
- `npm run lint` / `npm test`: Lint and unit tests.

---

## **Deployment**
Deployed on render.

---

## **License**
This project is licensed under the Apache 2.0 License. 

---

Contributions are most welcome.
