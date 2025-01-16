# PayP: Payment Platform API

This project is a payment architecture based on UPI architecture, designed to accept payments and send them. It includes core features such as secure user accounts, balance management, transaction logs, and a lockout mechanism for failed login attempts.It provides a great alternative to Razorpay or Stripe for development since it completely works like UPI.
Here is the complete API Endpoint testing: [Postman Results](https://www.postman.com/mission-geologist-4118891/payp/collection/za1hjme/routes-payp). Complete tutorial on how to use it is on :[Article](https://medium.com/@ayishikad/payp-revolutionizing-payment-integration-with-custom-api-b63a6a329b97).

## **Features**
1. **User Management**: 
   - User registration, login, and secure payment PIN setup.
   - Password reset with account lockout after 5 failed attempts.
   - Pin reset and account lockout after 5 failed attempts.

2. **Payment Transactions**:
   - Dynamic balance management.
   - Viewable transaction history.
   - Tranfer and receive payment.

3. **Security**:
   - JWT-based user authentication.
   - Password hashing with bcrypt.
   - 30 mins lockout mechanism for security.

4. **Database**:
   - PostgreSQL used using Supabase configured using Sequelize ORM.

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
Create a `.env` file in the project root and configure the following:
```env
DB_URL=your_postgresql_database_url
JWT_SECRET=your_jwt_secret
```

### **4. Run the project**
#### **Development**
```bash
npm start
```
#### **Production**
```bash
node server.js
```

---

## **Development Notes**
### **Dependencies**
- **Express**: Web framework for Node.js.
- **Sequelize**: ORM for PostgreSQL.
- **bcrypt**: Password hashing.
- **JWT**: Secure user authentication.

### **Scripts**
- `node server.js`: Starts the server.

---

## **Deployment**
Deployed on render

---

## **License**
This project is licensed under the Apache 2.0 License. 

---
Contributions are most welcome
