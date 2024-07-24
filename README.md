# SPEC

## QR Code Generation Sequences

### 1. Standard Gateway Usage
- Utilize our gateway by employing the standard functions provided.

### 2. Mobile App to Mobile App (M2M) DApps
- For mobile-to-mobile DApps, use functions prefixed with `DApp`. Note that this approach currently results in large QR codes due to linking and other factors.

### 3. Custom Gateway Development (OPTIONAL)
- For website DApps, create and manage your own gateway by building on top of our SDK. An example of this process will be provided soon.

### 4. Standalone QR Code for Account-to-Account Token Transfers
- Utilize the standalone QR code function to enable direct token transfers from one account to another.

## TODO

- **Reduce QR Code Link Size:** Optimize the link to be smaller (current size: approximately 1100+ characters).
<!-- - **Add Optional Message Field** -->
<!-- - **Test Gateway Validation Functions** -->
