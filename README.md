# RubixCMS
A free CMS project created by two French people
official discord server: [here](https://discord.gg/JWZFuDtNtp)


Project completed at: ~7%

## How install RubixCMS
### Install dependency
```npm install```

### Run RubixCMS
```npm run start```

## Todo List - RubixCMS

### Basic features
- [x] Create an account system
- [ ] Create Frontend (Customer Dashboard, Admin Dashboard, + CSS)
  - [x] User home page
  - [ ] Service management interface
  - [ ] User management interface
  - [x] Connection interface
  - [x] Account creation interface
  - [ ] Admin interface
- [ ] Create Backend
  - [x] Databases service
  - [x] Databases user
    - [ ] User product purchase
  - [ ] RESTful API
  - [ ] Notification system integration
  - [ ] Config page
  - [x] Config file
- [ ] Add Pterodactyl API
  - [ ] Automatic server creation on payment
  - [ ] Automatic server suspension on service expiry
  - [ ] Server suppressions after 1 week of suspended service
- [ ] Integrate the PayPal payment system
  - [ ] PayPal subscription management
  - [ ] Payment history
  - [ ] PayPal Webhooks for automatic payment updates
- [ ] Stripe integrations
  - [ ] Payment configuration
  - [ ] Management of credit cards and payment methods
- [ ] Add user scale functionality
  - [ ] Deposits and withdrawals
  - [ ] Transaction tracking
  - [ ] Balance notifications
  - [x] Balance / Credit
- [ ] User profile modification
  - [ ] Add profile photo
  - [ ] Modify email address
  - [ ] Add personal information
- [ ] Anti-VPN system
  - [ ] IP address verification
  - [ ] Protection against anonymous users
  - [ ] Blacklist of known VPNs
- [ ] Anti-double-counting system
  - [ ] Registration monitoring with additional verification methods
  - [ ] Verification via unique phone number or email
  - [ ] Tools for auditing suspicious accounts
- [ ] Add a Webhook Discord
  - [ ] Configure Webhook to send messages (notifications) on specific events (e.g. registration, purchase, status change)
  - [ ] Send notifications of new payments or server changes to a specific channel
  - [ ] Send alerts in the event of system errors or critical updates
  - [ ] Integrate custom embeds to make notifications easier to read
  - [ ] Add dynamic information (e.g. username, amount paid, server status) to sent messages
  - [ ] Set permissions so that Webhook sends only the notifications you want
  - [ ] Test notifications and ensure correct format (json, color, etc.).
  - [ ] Create an admin interface to configure Webhook notifications (enable/disable)
  - [ ] Set up options to send messages to different Discord channels depending on the event (e.g. one channel for alerts, another for payments, etc.).

### Improvements and optimizations
- [ ] Add a real-time notification system
- [ ] Responsive interface (mobile-friendly)
- [ ] Multilingual (English, French, etc.)
- [ ] Dark / light mode
- [ ] Live support functionality (live chat)
- [ ] Customizable dashboard themes and colors
- [ ] Enhanced security (2-factor authentication, CAPTCHA validation)
- [ ] API for integration with other third-party tools
- [ ] Error and log management system
- [ ] Automated server resource utilization reports
- [ ] Improved loading speed with caching and query optimization

### Advanced functions
- [ ] Advanced admin dashboard with user, server and payment management
- [ ] Creation of an analytics module to track service usage
- [ ] Automatic server reset functionality
- [ ] Data export in CSV or PDF format
- [ ] Integration of a user feedback system
- [ ] Referral system to encourage new users to sign up
- [ ] Detailed permissions management for users
