# Firestore Security Specification

This document outlines the data invariants and defines the "Dirty Dozen" malicious payloads that the Firestore Security Rules must block to ensure a zero-trust model.

## 1. Data Invariants
1. **User Ownership**: A user can only read and write their own User document (`/users/{userId}`), and their own subcollections of categories (`/users/{userId}/categories/{catId}`) and transactions (`/users/{userId}/transactions/{txId}`).
2. **Category Isolation**: Every category MUST belong to the authenticated user (`userId == auth.uid`).
3. **Transaction Isolation**: Every transaction MUST belong to the authenticated user (`userId == auth.uid`).
4. **ID Poisoning Prevention**: Document and subcollection IDs must match standard patterns (`^[a-zA-Z0-9_\-]+$`) and be limited in length.

## 2. The "Dirty Dozen" Malicious Payloads
The following payloads describe malicious scenarios designed to exploit identity, integrity, and scope:

1. **Self-Elevated Admin Profile**: User trying to insert admin flags in their setting.
2. **Overwriting Other User's Salaries**: Authenticated user trying to write to another user's document `/users/user_B`.
3. **Reading Other User's Config**: User A trying to get `/users/user_B`.
4. **Creating Category for a Different User**: Creating a category under `/users/user_A/categories/c1` with `userId = "user_B"`.
5. **Updating Someone Else's Category**: Modifying a category document owned by User B under `/users/user_B/categories/c2`.
6. **Deleting Someone Else's Category**: Modifying/deleting a category document owned by User B.
7. **Creating Transaction with Someone Else's userId**: Forging `userId = "user_B"` inside `/users/user_A/transactions/t1`.
8. **Setting Invalid Transaction Type**: Creating a transaction with standard status keys bypassed, e.g. `type = "unsupported-status"`.
9. **Injecting Resource Poisoning Payloads**: Transaction with an enormous comments block (greater than 10KB) to perform Denial of Wallet attacks.
10. **Altering Transaction userId during Update**: Forcing update of transaction with a modified `userId` field to swap ownership.
11. **Negative Transaction Amount**: Creating a transaction to mess up math operations with `amount = -1000`.
12. **Bypassing Category Verification**: Creating a transaction referencing a category that doesn't exist, though we normally handle exists() check during write.

## 3. Test Runner Checklist
All these must fail with `PERMISSION_DENIED` errors on rule enforcement.
