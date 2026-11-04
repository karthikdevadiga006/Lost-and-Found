# Lost & Found Portal: Project Specification

> This file is the single source of truth for the project. Read it fully before writing any code. Do not change the decisions in section 2 without asking first.

---

## 1. Overview

**Project:** A campus Lost & Found web portal, built as a cloud computing course project.

**Problem:** Lost items on campus are reported in WhatsApp groups or on notice boards. Posts get buried, there is no search, and nobody knows whether an item was returned.

**Solution:** One searchable portal where people who **found** something and people who **lost** something can find each other. Both sides search first, and only post if nothing matches. Owners prove ownership, and the finder decides who gets the item.

**Course report must cover:** problem definition, methodology, cloud services used, testing, results, conclusion. The design, tests, and metrics below are chosen so each of these can be written from real data.

---

## 2. Fixed decisions (do not change)

| Area | Decision |
|---|---|
| Cloud services | **Only two AWS services: Amazon S3 and AWS Lambda.** No DynamoDB, API Gateway, Cognito, SES, CloudFront, or any other AWS service. |
| Database | **None.** Data is stored as JSON files in a private S3 bucket and accessed only through Lambda. |
| Backend | **Node.js** on Lambda, ES modules (`.mjs`), one function with route handling, exposed through a **Lambda Function URL** (auth type NONE; the app does its own token check). |
| Frontend | **React + Vite + Tailwind CSS**, routing with **React Router `HashRouter`**, built to static files. |
| Buckets | **Two buckets:** a public **site bucket** (website files only) and a private **data bucket** (everything else). |
| Auth | Custom, inside Lambda: PBKDF2 password hashing and HMAC-signed tokens using Node's built-in `crypto`. No auth library or service. |
| Concurrency | Lambda **reserved concurrency = 1** so writes never collide. |
| Hosting | Site served from S3 static website hosting over **HTTP** for now (HTTPS is documented as a limitation and future work). |
| Entry flow | Public home page; clicking Lost or Found sends logged-out users to login/sign up first. |
